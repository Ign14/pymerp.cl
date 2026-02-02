# =============================================================================
# Script: firebase-download-all.ps1
# Descarga todo lo necesario de Firebase para sincronizar con producción
# Proyecto: agendaemprende-8ac77
# =============================================================================

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackupDir = Join-Path $ProjectRoot "firebase-backup"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupTimestamped = Join-Path $BackupDir $Timestamp

Write-Host "=== Descarga de Firebase - AGENDAWEB ===" -ForegroundColor Cyan
Write-Host "Proyecto: agendaemprende-8ac77" -ForegroundColor Gray
Write-Host "Directorio backup: $BackupTimestamped" -ForegroundColor Gray
Write-Host ""

# Crear directorios
New-Item -ItemType Directory -Force -Path $BackupTimestamped | Out-Null
$RulesDir = Join-Path $BackupTimestamped "firestore"
$HostingDir = Join-Path $BackupTimestamped "hosting"
New-Item -ItemType Directory -Force -Path $RulesDir | Out-Null
New-Item -ItemType Directory -Force -Path $HostingDir | Out-Null

# 1. Firestore Rules e Indexes (ya tenemos localmente, copiamos al backup)
Write-Host "[1/4] Firestore Rules e Indexes..." -ForegroundColor Yellow
Copy-Item (Join-Path $ProjectRoot "firestore.rules") -Destination (Join-Path $RulesDir "firestore.rules") -Force -ErrorAction SilentlyContinue
if (Test-Path (Join-Path $ProjectRoot "firestore.indexes.json")) {
    Copy-Item (Join-Path $ProjectRoot "firestore.indexes.json") -Destination (Join-Path $RulesDir "firestore.indexes.json") -Force -ErrorAction SilentlyContinue
}
Write-Host "      OK - firestore.rules, firestore.indexes.json" -ForegroundColor Green

# 2. Descargar sitio de producción (pymerp.cl) para comparar
Write-Host "[2/4] Descargando assets de pymerp.cl..." -ForegroundColor Yellow
try {
    $indexUrl = "https://pymerp.cl/"
    $indexPath = Join-Path $HostingDir "index.html"
    
    # Descargar index.html
    Invoke-WebRequest -Uri $indexUrl -OutFile $indexPath -UseBasicParsing -TimeoutSec 15
    Write-Host "      OK - index.html descargado" -ForegroundColor Green
    
    # Extraer referencias a JS y CSS
    $indexContent = Get-Content $indexPath -Raw
    $assetMatches = [regex]::Matches($indexContent, '(?:src|href)="(/assets/[^"]+\.(?:js|css))"')
    foreach ($match in $assetMatches) {
        $assetPath = $match.Groups[1].Value
        $assetUrl = "https://pymerp.cl" + $assetPath
        $localPath = Join-Path $HostingDir $assetPath.TrimStart('/')
        $localDir = Split-Path $localPath -Parent
        if (-not (Test-Path $localDir)) { New-Item -ItemType Directory -Force -Path $localDir | Out-Null }
        try {
            Invoke-WebRequest -Uri $assetUrl -OutFile $localPath -UseBasicParsing -TimeoutSec 30
            Write-Host "      OK - $assetPath" -ForegroundColor Gray
        } catch {
            Write-Host "      Skip - $assetPath (no disponible)" -ForegroundColor DarkGray
        }
    }
} catch {
    Write-Host "      AVISO: No se pudo descargar pymerp.cl - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "      (El sitio puede requerir autenticación o estar caído)" -ForegroundColor Gray
}

# 3. Instrucciones para Firestore Export (requiere gcloud + Blaze)
Write-Host "[3/4] Firestore Data Export..." -ForegroundColor Yellow
$exportScript = @"
# Exportar datos de Firestore (requiere gcloud CLI y plan Blaze)
# 1. Crear bucket: gsutil mb -l southamerica-east1 gs://agendaemprende-8ac77-firestore-export
# 2. Exportar: gcloud firestore export gs://agendaemprende-8ac77-firestore-export/backup-$Timestamp
# 3. Descargar: gcloud storage cp -r gs://agendaemprende-8ac77-firestore-export/backup-$Timestamp ./firestore-export
"@
$exportPath = Join-Path $BackupTimestamped "INSTRUCCIONES_FIRESTORE_EXPORT.txt"
$exportScript | Out-File -FilePath $exportPath -Encoding UTF8
Write-Host "      OK - Instrucciones guardadas en INSTRUCCIONES_FIRESTORE_EXPORT.txt" -ForegroundColor Green

# 4. Instrucciones para Storage Download (requiere gsutil)
Write-Host "[4/4] Firebase Storage..." -ForegroundColor Yellow
$storageScript = @"
# Descargar archivos de Firebase Storage (requiere gcloud/gsutil)
# Bucket: agendaemprende-8ac77.firebasestorage.app

# Opción A - gsutil (si está instalado):
# gsutil -m cp -r gs://agendaemprende-8ac77.firebasestorage.app/ ./firebase-storage-backup/

# Opción B - gcloud storage:
# gcloud storage cp -r gs://agendaemprende-8ac77.firebasestorage.app/* ./firebase-storage-backup/

# Nota: Los archivos (logos, fondos, productos) se cargan por URL desde Storage.
# Si la app ya conecta a Firebase, deberían cargarse automáticamente.
"@
$storagePath = Join-Path $BackupTimestamped "INSTRUCCIONES_STORAGE.txt"
$storageScript | Out-File -FilePath $storagePath -Encoding UTF8
Write-Host "      OK - Instrucciones guardadas en INSTRUCCIONES_STORAGE.txt" -ForegroundColor Green

Write-Host ""
Write-Host "=== Resumen ===" -ForegroundColor Cyan
Write-Host "Backup guardado en: $BackupTimestamped" -ForegroundColor White
Get-ChildItem $BackupTimestamped -Recurse -File | ForEach-Object { Write-Host "  - $($_.FullName.Replace($BackupTimestamped, '.'))" -ForegroundColor Gray }
Write-Host ""
Write-Host "Para Firestore data y Storage, sigue las instrucciones en los archivos TXT." -ForegroundColor Yellow
Write-Host "Requisitos: gcloud CLI (https://cloud.google.com/sdk/docs/install)" -ForegroundColor Gray
