param(
    [string]$SourceUploadRoot = "hansport_v2fe\upload",
    [string]$BackendContainer = "hansport-backend",
    [string[]]$Folders = @("product", "logo", "banner"),
    [switch]$SkipPreBackup,
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\lib\HanSportDataTools.ps1"

Assert-CommandAvailable "docker"

$repoRoot = Get-HanSportRepoRoot
$sourceRoot = Join-Path $repoRoot $SourceUploadRoot
if (-not (Test-Path $sourceRoot)) {
    throw "Source upload root not found: $sourceRoot"
}

Require-ConfirmationPhrase `
    -ExpectedPhrase "SYNC HANS SPORT UPLOAD" `
    -Reason "This will copy local upload files into Docker backend upload storage and may overwrite files with the same names." `
    -Force:$Force

if (-not $SkipPreBackup) {
    Write-Host "Creating pre-sync backup package..."
    & "$PSScriptRoot\backup-demo-data.ps1" -BackendContainer $BackendContainer
    if ($LASTEXITCODE -ne 0) {
        throw "Pre-sync backup failed. Sync aborted."
    }
}

foreach ($folder in $Folders) {
    $source = Join-Path $sourceRoot $folder
    if (-not (Test-Path $source)) {
        Write-Warning "Source folder missing, skipped: $source"
        continue
    }

    $target = "/app/upload/$folder"
    Write-Host "Syncing $source to ${BackendContainer}:$target"
    Copy-HostFolderToContainer -SourcePath $source -Container $BackendContainer -ContainerPath $target
}

Write-Host "Upload sync completed."

