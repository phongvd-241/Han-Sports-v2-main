param(
    [Parameter(Mandatory = $true)]
    [string]$PackageDir,

    [string]$MysqlContainer = "hansport-mysql",
    [string]$BackendContainer = "hansport-backend",
    [switch]$SkipPreBackup,
    [switch]$ReplaceUpload,
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\lib\HanSportDataTools.ps1"

Assert-CommandAvailable "docker"

$resolvedPackage = (Resolve-Path $PackageDir).Path
$sqlFile = Join-Path $resolvedPackage "database\hansport-demo.sql"
$uploadRoot = Join-Path $resolvedPackage "upload"

if (-not (Test-Path $sqlFile)) {
    throw "SQL dump not found: $sqlFile"
}
if (-not (Test-Path $uploadRoot)) {
    throw "Upload folder not found: $uploadRoot"
}

Require-ConfirmationPhrase `
    -ExpectedPhrase "RESTORE HANS SPORT DEMO" `
    -Reason "This will restore database and upload files into Docker containers. Existing data may be overwritten." `
    -Force:$Force

if (-not $SkipPreBackup) {
    Write-Host "Creating pre-restore backup package..."
    & "$PSScriptRoot\backup-demo-data.ps1" -MysqlContainer $MysqlContainer -BackendContainer $BackendContainer
    if ($LASTEXITCODE -ne 0) {
        throw "Pre-restore backup failed. Restore aborted."
    }
}

Import-DockerMysqlDatabase -Container $MysqlContainer -InputFile $sqlFile

$folders = @("product", "logo", "banner")
foreach ($folder in $folders) {
    $source = Join-Path $uploadRoot $folder
    if (-not (Test-Path $source)) {
        Write-Warning "Package upload folder missing, skipped: $folder"
        continue
    }

    $target = "/app/upload/$folder"
    if ($ReplaceUpload) {
        $clearScript = "mkdir -p $(ConvertTo-ShellSingleQuotedString $target) && find $(ConvertTo-ShellSingleQuotedString $target) -mindepth 1 -maxdepth 1 -exec rm -rf {} +"
        Invoke-NativeChecked "docker" @("exec", $BackendContainer, "sh", "-c", $clearScript) "Failed to clear $target before restore"
    }
    Copy-HostFolderToContainer -SourcePath $source -Container $BackendContainer -ContainerPath $target
}

Write-Host "Restore completed from package: $resolvedPackage"
Write-Host "Run scripts\verify-data-integrity.ps1 to validate DB/media consistency."

