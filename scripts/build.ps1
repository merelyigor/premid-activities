param(
  [string[]] $Activities = @('AniTube', 'UAKino'),
  [string] $PreMiDRepo = 'https://github.com/PreMiD/Activities.git'
)

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$upstream = Join-Path $root 'PreMiD-Activities'
$dist = Join-Path $root 'dist'

New-Item -ItemType Directory -Path $dist -Force | Out-Null

function Get-PackageRunner {
  if (Get-Command npm -ErrorAction SilentlyContinue) {
    return @{
      InstallRoot = @('npm', @('install', '--ignore-scripts'))
      InstallCli = @('npm', @('install', '--prefix', (Join-Path $upstream 'cli')))
      Tsc = @('node', @((Join-Path $upstream 'node_modules\typescript\bin\tsc'), '-p', (Join-Path $upstream 'cli')))
    }
  }

  if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    return @{
      InstallRoot = @('pnpm', @('install', '--ignore-scripts', '--config.block-exotic-subdeps=false'))
      InstallCli = @('pnpm', @('install', '--ignore-scripts', '--config.block-exotic-subdeps=false'))
      Tsc = @('node', @((Join-Path $upstream 'cli\node_modules\typescript\bin\tsc'), '-p', (Join-Path $upstream 'cli')))
    }
  }

  throw 'Neither npm nor pnpm was found in PATH. Install Node.js/npm or pnpm and try again.'
}

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

$runner = Get-PackageRunner
Invoke-Logged $runner.InstallRoot[0] $runner.InstallRoot[1] $upstream
Invoke-Logged $runner.InstallCli[0] $runner.InstallCli[1] (Join-Path $upstream 'cli')
Invoke-Logged $runner.Tsc[0] $runner.Tsc[1] $upstream

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
