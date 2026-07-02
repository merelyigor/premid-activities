param(
  [string[]] $Activities = @('AniTube', 'UAKino'),
  [string] $PreMiDRepo = 'https://github.com/PreMiD/Activities.git'
)

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$upstream = Join-Path $root 'PreMiD-Activities'
$dist = Join-Path $root 'dist'

New-Item -ItemType Directory -Path $dist -Force | Out-Null

function Invoke-Logged {
  param(
    [string] $Command,
    [string[]] $Arguments,
    [string] $WorkingDirectory = $root
  )

  Write-Host "-> $Command $($Arguments -join ' ')"
  Push-Location $WorkingDirectory
  try {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed with exit code $LASTEXITCODE"
    }
  }
  finally {
    Pop-Location
  }
}

if (-not (Test-Path $upstream)) {
  Invoke-Logged git @('clone', '--depth', '1', $PreMiDRepo, $upstream)
}

Invoke-Logged npm @('install', '--ignore-scripts') $upstream
Invoke-Logged npm @('install', '--prefix', (Join-Path $upstream 'cli')) $upstream
Invoke-Logged npx @('tsc', '-p', (Join-Path $upstream 'cli')) $upstream

$activityMap = @{
  AniTube = @{
    Source = Join-Path $root 'activities\anitube-premid'
    Target = Join-Path $upstream 'websites\A\AniTube'
    Zip = Join-Path $upstream 'websites\A\AniTube\dist\AniTube.zip'
    Out = Join-Path $dist 'AniTube.zip'
  }
  UAKino = @{
    Source = Join-Path $root 'activities\uakino-premid'
    Target = Join-Path $upstream 'websites\U\UAKino'
    Zip = Join-Path $upstream 'websites\U\UAKino\dist\UAKino.zip'
    Out = Join-Path $dist 'UAKino.zip'
  }
}

foreach ($activity in $Activities) {
  if (-not $activityMap.ContainsKey($activity)) {
    throw "Unknown activity: $activity"
  }

  $config = $activityMap[$activity]
  New-Item -ItemType Directory -Path $config.Target -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $config.Source 'metadata.json'), (Join-Path $config.Source 'presence.ts'), (Join-Path $config.Source 'iframe.ts') -Destination $config.Target -Force

  Invoke-Logged node @((Join-Path $upstream 'cli\dist\index.js'), 'build', $activity, '--zip') $upstream
  Copy-Item -LiteralPath $config.Zip -Destination $config.Out -Force

  Write-Host "Built: $($config.Out)"
}
