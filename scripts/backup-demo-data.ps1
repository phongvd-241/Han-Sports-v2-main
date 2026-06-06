param(
    [string]$MysqlContainer = "hansport-mysql",
    [string]$BackendContainer = "hansport-backend",
    [string]$OutputRoot = "backups",
    [string[]]$UploadFolders = @("product", "logo", "banner")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\lib\HanSportDataTools.ps1"

Assert-CommandAvailable "docker"

$repoRoot = Get-HanSportRepoRoot
$timestamp = New-HanSportTimestamp
$packageDir = Join-Path (Join-Path $repoRoot $OutputRoot) $timestamp
$databaseDir = Join-Path $packageDir "database"
$uploadDir = Join-Path $packageDir "upload"
$dumpFile = Join-Path $databaseDir "hansport-demo.sql"

Ensure-Directory $databaseDir
Ensure-Directory $uploadDir

Write-Host "Creating database dump..."
Export-DockerMysqlDatabase -Container $MysqlContainer -OutputFile $dumpFile

$missingFolders = @()
foreach ($folder in $UploadFolders) {
    $destination = Join-Path $uploadDir $folder
    $containerPath = "/app/upload/$folder"
    Write-Host "Copying upload folder $containerPath..."
    $copied = Copy-ContainerFolderToHost -Container $BackendContainer -ContainerPath $containerPath -DestinationPath $destination
    if (-not $copied) {
        $missingFolders += $folder
        Ensure-Directory $destination
    }
}

$tableCount = Invoke-DockerMysqlScalar -Container $MysqlContainer -Sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE();" -AllowFailure
$productCount = Invoke-DockerMysqlScalar -Container $MysqlContainer -Sql "SELECT COUNT(*) FROM products;" -AllowFailure
$productImageCount = Invoke-DockerMysqlScalar -Container $MysqlContainer -Sql "SELECT COUNT(*) FROM product_images;" -AllowFailure
$flywayVersion = Invoke-DockerMysqlScalar -Container $MysqlContainer -Sql "SELECT version FROM flyway_schema_history WHERE success = 1 ORDER BY installed_rank DESC LIMIT 1;" -AllowFailure

$uploadCounts = [ordered]@{}
foreach ($folder in $UploadFolders) {
    $uploadCounts[$folder] = Get-FileCountSafe (Join-Path $uploadDir $folder)
}

$manifest = [ordered]@{
    packageVersion = 1
    createdAtUtc = (Get-Date).ToUniversalTime().ToString("o")
    project = "Han Sports v2"
    source = [ordered]@{
        mysqlContainer = $MysqlContainer
        backendContainer = $BackendContainer
        mysqlHostPort = "3307 default via docker-compose"
        uploadContainerPath = "/app/upload"
    }
    database = [ordered]@{
        dump = "database/hansport-demo.sql"
        charset = "utf8mb4"
        tableCount = $tableCount
        productCount = $productCount
        productImageCount = $productImageCount
        flywayVersion = $flywayVersion
    }
    upload = [ordered]@{
        root = "upload"
        folders = $UploadFolders
        fileCounts = $uploadCounts
        missingFolders = $missingFolders
    }
    checksums = Get-RelativeFileChecksums -RootPath $packageDir
}

$manifestPath = Join-Path $packageDir "manifest.json"
$manifest | ConvertTo-Json -Depth 8 | Set-Content -Path $manifestPath -Encoding utf8

Write-Host "Backup package created: $packageDir"
if ($missingFolders.Count -gt 0) {
    Write-Warning "Missing upload folders in container: $($missingFolders -join ', ')"
}

