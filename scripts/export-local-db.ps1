param(
    [string]$HostName = "127.0.0.1",
    [int]$Port = 3306,
    [string]$Database = "hansport_v2",
    [string]$User = "root",
    [string]$OutputRoot = "backups",
    [string]$PasswordEnv = "LOCAL_DB_PASSWORD"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\lib\HanSportDataTools.ps1"

Assert-CommandAvailable "mysqldump"

$password = [Environment]::GetEnvironmentVariable($PasswordEnv)
if ([string]::IsNullOrWhiteSpace($password)) {
    $password = [Environment]::GetEnvironmentVariable("DB_PASSWORD")
}
if ([string]::IsNullOrWhiteSpace($password)) {
    throw "Set $PasswordEnv or DB_PASSWORD in the current shell before running this script."
}

$repoRoot = Get-HanSportRepoRoot
$timestamp = New-HanSportTimestamp
$outputDir = Join-Path (Join-Path (Join-Path $repoRoot $OutputRoot) $timestamp) "database"
$outputFile = Join-Path $outputDir "hansport-local.sql"
Ensure-Directory $outputDir

$oldMysqlPwd = $env:MYSQL_PWD
try {
    $env:MYSQL_PWD = $password
    $args = @(
        "--host=$HostName",
        "--port=$Port",
        "--user=$User",
        "--default-character-set=utf8mb4",
        "--single-transaction",
        "--routines",
        "--events",
        "--add-drop-table",
        "--result-file=$outputFile",
        $Database
    )
    Invoke-NativeChecked "mysqldump" $args "Failed to export local MySQL database"
}
finally {
    $env:MYSQL_PWD = $oldMysqlPwd
}

Write-Host "Local database export written to $outputFile"

