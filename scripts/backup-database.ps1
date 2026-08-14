param(
  [string]$DatabaseUrl = $env:DATABASE_URL,
  [string]$OutputDirectory = (Join-Path (Get-Location) "backups")
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) { throw "Defina DATABASE_URL ou informe -DatabaseUrl." }
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) { throw "pg_dump não encontrado. Instale as ferramentas cliente do PostgreSQL." }

$resolvedRoot = [System.IO.Path]::GetFullPath((Get-Location).Path)
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
if (-not $resolvedOutput.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) { throw "O diretório de backup deve ficar dentro do projeto." }
New-Item -ItemType Directory -Path $resolvedOutput -Force | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$target = Join-Path $resolvedOutput "sir-modas-$timestamp.dump"
& pg_dump --dbname=$DatabaseUrl --format=custom --no-owner --no-privileges --file=$target
if ($LASTEXITCODE -ne 0) { throw "O pg_dump falhou com código $LASTEXITCODE." }
Write-Output "Backup criado em $target"
