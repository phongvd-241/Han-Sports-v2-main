Set-StrictMode -Version Latest

function Get-HanSportRepoRoot {
    return (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}

function New-HanSportTimestamp {
    return Get-Date -Format "yyyy-MM-dd_HHmmss"
}

function Ensure-Directory {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    New-Item -ItemType Directory -Force -Path $Path | Out-Null
}

function Assert-CommandAvailable {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command
    )

    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        throw "Required command '$Command' was not found in PATH."
    }
}

function Invoke-NativeChecked {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,

        [string[]]$ArgumentList = @(),

        [string]$ErrorMessage = "Command failed"
    )

    & $FilePath @ArgumentList
    if ($LASTEXITCODE -ne 0) {
        throw "$ErrorMessage. Exit code: $LASTEXITCODE"
    }
}

function Invoke-NativeCaptureChecked {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,

        [string[]]$ArgumentList = @(),

        [string]$ErrorMessage = "Command failed"
    )

    $output = & $FilePath @ArgumentList 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "$ErrorMessage. Exit code: $LASTEXITCODE. Output: $output"
    }
    return $output
}

function ConvertTo-ShellSingleQuotedString {
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Value
    )

    $singleQuote = [char]39
    $doubleQuote = [char]34
    $replacement = "$singleQuote$doubleQuote$singleQuote$doubleQuote$singleQuote"
    return "$singleQuote" + $Value.Replace("$singleQuote", $replacement) + "$singleQuote"
}

function Require-ConfirmationPhrase {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ExpectedPhrase,

        [Parameter(Mandatory = $true)]
        [string]$Reason,

        [switch]$Force
    )

    if ($Force) {
        return
    }

    Write-Warning $Reason
    Write-Host "Type the exact phrase to continue: $ExpectedPhrase"
    $actual = Read-Host "Confirmation"
    if ($actual -ne $ExpectedPhrase) {
        throw "Confirmation phrase did not match. Operation aborted."
    }
}

function Invoke-DockerMysqlScalar {
    param(
        [string]$Container = "hansport-mysql",

        [Parameter(Mandatory = $true)]
        [string]$Sql,

        [switch]$AllowFailure
    )

    Assert-CommandAvailable "docker"
    $quotedSql = ConvertTo-ShellSingleQuotedString $Sql
    $script = 'mysql --default-character-set=utf8mb4 -N -B -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e ' + $quotedSql
    $args = @("exec", $Container, "sh", "-c", $script)
    $output = & docker @args 2>&1
    if ($LASTEXITCODE -ne 0) {
        if ($AllowFailure) {
            return $null
        }
        throw "MySQL query failed. Exit code: $LASTEXITCODE. Output: $output"
    }
    if ($null -eq $output) {
        return $null
    }
    return ($output | Select-Object -First 1)
}

function Invoke-DockerMysqlLines {
    param(
        [string]$Container = "hansport-mysql",

        [Parameter(Mandatory = $true)]
        [string]$Sql,

        [switch]$AllowFailure
    )

    Assert-CommandAvailable "docker"
    $quotedSql = ConvertTo-ShellSingleQuotedString $Sql
    $script = 'mysql --default-character-set=utf8mb4 -N -B -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e ' + $quotedSql
    $args = @("exec", $Container, "sh", "-c", $script)
    $output = & docker @args 2>&1
    if ($LASTEXITCODE -ne 0) {
        if ($AllowFailure) {
            return @()
        }
        throw "MySQL query failed. Exit code: $LASTEXITCODE. Output: $output"
    }
    if ($null -eq $output) {
        return @()
    }
    return @($output)
}

function Export-DockerMysqlDatabase {
    param(
        [string]$Container = "hansport-mysql",

        [Parameter(Mandatory = $true)]
        [string]$OutputFile
    )

    Assert-CommandAvailable "docker"
    Ensure-Directory (Split-Path -Parent $OutputFile)

    $timestamp = New-HanSportTimestamp
    $containerDumpPath = "/tmp/hansport-$timestamp.sql"
    $quotedDumpPath = ConvertTo-ShellSingleQuotedString $containerDumpPath
    $dumpScript = 'mysqldump --default-character-set=utf8mb4 --single-transaction --routines --events --add-drop-table -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" --result-file=' + $quotedDumpPath

    Invoke-NativeChecked "docker" @("exec", $Container, "sh", "-c", $dumpScript) "Failed to create database dump inside container"
    try {
        Invoke-NativeChecked "docker" @("cp", "${Container}:$containerDumpPath", $OutputFile) "Failed to copy database dump from container"
    }
    finally {
        & docker exec $Container sh -c "rm -f $(ConvertTo-ShellSingleQuotedString $containerDumpPath)" | Out-Null
    }
}

function Import-DockerMysqlDatabase {
    param(
        [string]$Container = "hansport-mysql",

        [Parameter(Mandatory = $true)]
        [string]$InputFile
    )

    Assert-CommandAvailable "docker"
    $resolvedInput = (Resolve-Path $InputFile).Path
    $containerImportPath = "/tmp/hansport-import.sql"

    Invoke-NativeChecked "docker" @("cp", $resolvedInput, "${Container}:$containerImportPath") "Failed to copy SQL file into container"
    try {
        $quotedImportPath = ConvertTo-ShellSingleQuotedString $containerImportPath
        $importScript = 'mysql --default-character-set=utf8mb4 -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < ' + $quotedImportPath
        Invoke-NativeChecked "docker" @("exec", $Container, "sh", "-c", $importScript) "Failed to import SQL file into Docker MySQL"
    }
    finally {
        & docker exec $Container sh -c "rm -f $(ConvertTo-ShellSingleQuotedString $containerImportPath)" | Out-Null
    }
}

function Copy-ContainerFolderToHost {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Container,

        [Parameter(Mandatory = $true)]
        [string]$ContainerPath,

        [Parameter(Mandatory = $true)]
        [string]$DestinationPath
    )

    Ensure-Directory $DestinationPath
    & docker exec $Container sh -c "test -d $(ConvertTo-ShellSingleQuotedString $ContainerPath)" | Out-Null
    if ($LASTEXITCODE -ne 0) {
        return $false
    }

    Invoke-NativeChecked "docker" @("cp", "${Container}:${ContainerPath}/.", $DestinationPath) "Failed to copy $ContainerPath from $Container"
    return $true
}

function Copy-HostFolderToContainer {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SourcePath,

        [Parameter(Mandatory = $true)]
        [string]$Container,

        [Parameter(Mandatory = $true)]
        [string]$ContainerPath
    )

    $resolvedSource = (Resolve-Path $SourcePath).Path
    Invoke-NativeChecked "docker" @("exec", $Container, "sh", "-c", "mkdir -p $(ConvertTo-ShellSingleQuotedString $ContainerPath)") "Failed to create $ContainerPath in $Container"
    Invoke-NativeChecked "docker" @("cp", "$resolvedSource\.", "${Container}:$ContainerPath") "Failed to copy $resolvedSource to ${Container}:$ContainerPath"
}

function Get-FileCountSafe {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        return 0
    }
    return @(Get-ChildItem -Path $Path -File -Recurse -ErrorAction SilentlyContinue).Count
}

function Get-RelativeFileChecksums {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RootPath
    )

    if (-not (Test-Path $RootPath)) {
        return @()
    }

    $root = (Resolve-Path $RootPath).Path
    return @(Get-ChildItem -Path $root -File -Recurse | ForEach-Object {
        $relative = $_.FullName.Substring($root.Length).TrimStart('\', '/').Replace('\', '/')
        $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName
        [ordered]@{
            path = $relative
            sha256 = $hash.Hash.ToLowerInvariant()
            sizeBytes = $_.Length
        }
    })
}
