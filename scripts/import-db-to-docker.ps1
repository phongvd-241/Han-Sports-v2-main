param(
    [Parameter(Mandatory = $true)]
    [string]$SqlFile,

    [string]$MysqlContainer = "hansport-mysql",
    [switch]$SkipPreBackup,
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\lib\HanSportDataTools.ps1"

Assert-CommandAvailable "docker"

$resolvedSql = (Resolve-Path $SqlFile).Path
Require-ConfirmationPhrase `
    -ExpectedPhrase "IMPORT HANS SPORT DB" `
    -Reason "This will import SQL into Docker MySQL and can overwrite existing data in hansport_v2." `
    -Force:$Force

if (-not $SkipPreBackup) {
    Write-Host "Creating pre-import backup package..."
    & "$PSScriptRoot\backup-demo-data.ps1" -MysqlContainer $MysqlContainer
    if ($LASTEXITCODE -ne 0) {
        throw "Pre-import backup failed. Import aborted."
    }
}

Import-DockerMysqlDatabase -Container $MysqlContainer -InputFile $resolvedSql
Write-Host "Imported SQL into Docker MySQL from $resolvedSql"

