param(
    [string]$Container = "hansport-mysql",
    [string]$Database = "hansport_v2",
    [string]$User = "hansport",
    [string]$OutputDir = "backups"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$outputFile = Join-Path $OutputDir "$Database-$timestamp.sql"
$containerDumpPath = "/tmp/$Database-$timestamp.sql"

docker exec $Container sh -c "mysqldump --default-character-set=utf8mb4 --single-transaction --routines --events --add-drop-table -u$User -p`"`$MYSQL_PASSWORD`" $Database --result-file='$containerDumpPath'"
if ($LASTEXITCODE -ne 0) {
    throw "Failed to create database dump inside container."
}

try {
    docker cp "${Container}:$containerDumpPath" $outputFile
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to copy database dump from container."
    }
}
finally {
    docker exec $Container sh -c "rm -f '$containerDumpPath'" | Out-Null
}

Write-Host "Database backup written to $outputFile"
