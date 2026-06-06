param(
    [string]$MysqlContainer = "hansport-mysql",
    [string]$BackendContainer = "hansport-backend",
    [string]$BackendBaseUrl = "http://localhost:8080",
    [string[]]$UploadFolders = @("product", "logo", "banner"),
    [switch]$SkipHttpChecks
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\lib\HanSportDataTools.ps1"

Assert-CommandAvailable "docker"

$repoRoot = Get-HanSportRepoRoot
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("hansport-integrity-" + (New-HanSportTimestamp))
Ensure-Directory $tempRoot

$report = [ordered]@{
    checkedAtUtc = (Get-Date).ToUniversalTime().ToString("o")
    missingFolders = @()
    missingFiles = @()
    orphanFiles = @()
    duplicateFilenames = @()
    httpFailures = @()
    folderMismatchWarnings = @()
    counts = [ordered]@{}
}

try {
    $productImageRows = Invoke-DockerMysqlLines -Container $MysqlContainer -Sql "SELECT image_url FROM product_images WHERE image_url IS NOT NULL AND image_url <> '';"
    $productImages = @($productImageRows | ForEach-Object { "$_".Trim() } | Where-Object { $_ })
    $productImageSet = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
    foreach ($image in $productImages) {
        [void]$productImageSet.Add($image)
    }

    $duplicateProductImages = $productImages |
        Group-Object |
        Where-Object { $_.Count -gt 1 } |
        ForEach-Object { $_.Name }
    $report.duplicateFilenames += @($duplicateProductImages | ForEach-Object {
        [ordered]@{ folder = "product"; fileName = $_; source = "product_images" }
    })

    $settingRows = Invoke-DockerMysqlLines -Container $MysqlContainer -Sql "SELECT setting_key, setting_value FROM settings WHERE setting_value IS NOT NULL;"
    $settingImagesByFolder = @{
        product = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
        logo = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
        banner = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
    }
    foreach ($row in $settingRows) {
        $parts = "$row" -split "`t", 2
        if ($parts.Count -ne 2) {
            continue
        }
        $key = $parts[0]
        $value = $parts[1]
        if ($key -eq "HERO_SLIDES") {
            try {
                $slides = $value | ConvertFrom-Json
                foreach ($slide in @($slides)) {
                    if ($slide.PSObject.Properties.Name -contains "image" -and -not [string]::IsNullOrWhiteSpace($slide.image)) {
                        $folder = "product"
                        if ($slide.PSObject.Properties.Name -contains "imageFolder" -and -not [string]::IsNullOrWhiteSpace($slide.imageFolder)) {
                            $folder = "$($slide.imageFolder)"
                        }
                        if (-not $settingImagesByFolder.ContainsKey($folder)) {
                            $settingImagesByFolder[$folder] = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
                        }
                        [void]$settingImagesByFolder[$folder].Add("$($slide.image)")
                    }
                }
            }
            catch {
                Write-Warning "Could not parse HERO_SLIDES JSON from settings."
            }
        }
    }

    $constantsFile = Join-Path $repoRoot "hansport_v2fe\src\utils\constants.js"
    $logoNames = @()
    if (Test-Path $constantsFile) {
        $constantsText = Get-Content -Raw -Path $constantsFile
        $matches = [regex]::Matches($constantsText, 'fileName=([^&"`]+)&folder=logo')
        foreach ($match in $matches) {
            $logoNames += [System.Uri]::UnescapeDataString($match.Groups[1].Value)
        }
    }

    foreach ($logoName in $logoNames) {
        [void]$settingImagesByFolder.logo.Add($logoName)
    }

    $expectedByFolder = @{
        product = @(($productImages + @($settingImagesByFolder.product)) | Where-Object { $_ } | Sort-Object -Unique)
        logo = @($settingImagesByFolder.logo | Where-Object { $_ } | Sort-Object -Unique)
        banner = @($settingImagesByFolder.banner | Where-Object { $_ } | Sort-Object -Unique)
    }

    foreach ($folder in $UploadFolders) {
        $localFolder = Join-Path $tempRoot $folder
        $containerPath = "/app/upload/$folder"
        $copied = Copy-ContainerFolderToHost -Container $BackendContainer -ContainerPath $containerPath -DestinationPath $localFolder
        if (-not $copied) {
            $report.missingFolders += $containerPath
            continue
        }

        $files = @(Get-ChildItem -Path $localFolder -File -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name)
        $report.counts[$folder] = [ordered]@{
            fileCount = $files.Count
            expectedCount = @($expectedByFolder[$folder]).Count
        }

        $fileSet = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
        foreach ($file in $files) {
            if (-not $fileSet.Add($file)) {
                $report.duplicateFilenames += [ordered]@{ folder = $folder; fileName = $file; source = "filesystem" }
            }
        }

        foreach ($expected in @($expectedByFolder[$folder])) {
            if (-not $fileSet.Contains($expected)) {
                $report.missingFiles += [ordered]@{ folder = $folder; fileName = $expected }
            }
        }

        if ($folder -eq "product") {
            foreach ($file in $files) {
                if (-not $productImageSet.Contains($file) -and -not $settingImagesByFolder.product.Contains($file)) {
                    $report.orphanFiles += [ordered]@{ folder = $folder; fileName = $file }
                }
            }
        }

        if (-not $SkipHttpChecks) {
            foreach ($expected in @($expectedByFolder[$folder] | Select-Object -First 25)) {
                $url = "$BackendBaseUrl/api/v1/files?folder=$([System.Uri]::EscapeDataString($folder))&fileName=$([System.Uri]::EscapeDataString($expected))"
                try {
                    $response = Invoke-WebRequest -UseBasicParsing -Uri $url -Method Get -TimeoutSec 10
                    if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
                        $report.httpFailures += [ordered]@{ folder = $folder; fileName = $expected; status = $response.StatusCode; url = $url }
                    }
                }
                catch {
                    $report.httpFailures += [ordered]@{ folder = $folder; fileName = $expected; error = $_.Exception.Message; url = $url }
                }
            }
        }
    }

    $json = $report | ConvertTo-Json -Depth 8
    Write-Output $json

    if ($report.missingFolders.Count -gt 0 -or
        $report.missingFiles.Count -gt 0 -or
        $report.duplicateFilenames.Count -gt 0 -or
        $report.httpFailures.Count -gt 0) {
        exit 2
    }
}
finally {
    if (Test-Path $tempRoot) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force
    }
}
