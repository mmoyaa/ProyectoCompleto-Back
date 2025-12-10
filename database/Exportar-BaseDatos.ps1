# =====================================================
# Script PowerShell para Exportar Base de Datos
# Sistema Mantenedor CCMM
# =====================================================

param(
    [string]$Servidor = "localhost",
    [string]$BaseDatos = "NuevoCCMM",
    [string]$RutaBackup = "C:\Backup\CCMM"
)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  EXPORTACIÓN DE BASE DE DATOS" -ForegroundColor Cyan
Write-Host "  Mantenedor CCMM" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Crear carpeta de backup si no existe
if (-not (Test-Path $RutaBackup)) {
    Write-Host "📁 Creando carpeta de backup..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $RutaBackup -Force | Out-Null
    Write-Host "✅ Carpeta creada: $RutaBackup" -ForegroundColor Green
}

# Generar nombre de archivo con fecha
$Fecha = Get-Date -Format "yyyyMMdd_HHmmss"
$ArchivoBackup = Join-Path $RutaBackup "NuevoCCMM_$Fecha.bak"

Write-Host ""
Write-Host "🔄 Configuración:" -ForegroundColor Yellow
Write-Host "   Servidor: $Servidor" -ForegroundColor Gray
Write-Host "   Base de Datos: $BaseDatos" -ForegroundColor Gray
Write-Host "   Archivo de Backup: $ArchivoBackup" -ForegroundColor Gray
Write-Host ""

# Verificar si SQL Server está corriendo
Write-Host "🔍 Verificando SQL Server..." -ForegroundColor Yellow
$servicioSQL = Get-Service | Where-Object {$_.Name -like "*SQL*" -and $_.Status -eq "Running"}

if ($servicioSQL) {
    Write-Host "✅ SQL Server está corriendo" -ForegroundColor Green
} else {
    Write-Host "❌ SQL Server no está corriendo" -ForegroundColor Red
    Write-Host "   Iniciando SQL Server..." -ForegroundColor Yellow
    Start-Service MSSQLSERVER
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "💾 Generando backup de la base de datos..." -ForegroundColor Yellow
Write-Host ""

# Query SQL para hacer backup
$queryBackup = @"
BACKUP DATABASE [$BaseDatos] 
TO DISK = '$ArchivoBackup'
WITH FORMAT, 
     NAME = 'Backup Completo $BaseDatos',
     DESCRIPTION = 'Backup generado el $Fecha',
     COMPRESSION,
     STATS = 10;
"@

try {
    # Ejecutar backup usando sqlcmd
    $resultado = sqlcmd -S $Servidor -E -Q $queryBackup -b
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Backup completado exitosamente!" -ForegroundColor Green
        
        # Obtener información del archivo
        $infoArchivo = Get-Item $ArchivoBackup
        $tamanoMB = [math]::Round($infoArchivo.Length / 1MB, 2)
        
        Write-Host ""
        Write-Host "📊 Información del Backup:" -ForegroundColor Cyan
        Write-Host "   Archivo: $($infoArchivo.Name)" -ForegroundColor Gray
        Write-Host "   Tamaño: $tamanoMB MB" -ForegroundColor Gray
        Write-Host "   Ubicación: $($infoArchivo.FullName)" -ForegroundColor Gray
        Write-Host "   Fecha: $($infoArchivo.CreationTime)" -ForegroundColor Gray
        
        # Generar estadísticas
        Write-Host ""
        Write-Host "📈 Estadísticas de la Base de Datos:" -ForegroundColor Cyan
        
        $queryStats = @"
USE [$BaseDatos];
SELECT 
    'tutores' AS Tabla, COUNT(*) AS Registros FROM tutores
UNION ALL
SELECT 'representantes', COUNT(*) FROM representantes
UNION ALL
SELECT 'paciente', COUNT(*) FROM paciente
UNION ALL
SELECT 'paciente_representante', COUNT(*) FROM paciente_representante
UNION ALL
SELECT 'EvaluacionesSensoriales', COUNT(*) FROM EvaluacionesSensoriales
UNION ALL
SELECT 'TPTipoDatos', COUNT(*) FROM TPTipoDatos
UNION ALL
SELECT 'TPFormato', COUNT(*) FROM TPFormato
UNION ALL
SELECT 'DocumentosCCMM', COUNT(*) FROM DocumentosCCMM;
"@
        
        $stats = sqlcmd -S $Servidor -E -Q $queryStats -h -1 -W
        Write-Host $stats -ForegroundColor Gray
        
        Write-Host ""
        Write-Host "======================================" -ForegroundColor Cyan
        Write-Host "✅ EXPORTACIÓN COMPLETADA" -ForegroundColor Green
        Write-Host "======================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
        Write-Host "   1. Copiar archivo: $ArchivoBackup" -ForegroundColor Gray
        Write-Host "   2. Transferir al equipo destino" -ForegroundColor Gray
        Write-Host "   3. Ejecutar script de importación" -ForegroundColor Gray
        Write-Host ""
        
        # Abrir carpeta de backup
        $respuesta = Read-Host "¿Desea abrir la carpeta de backup? (S/N)"
        if ($respuesta -eq "S" -or $respuesta -eq "s") {
            Start-Process explorer.exe $RutaBackup
        }
        
    } else {
        Write-Host ""
        Write-Host "❌ Error al generar backup" -ForegroundColor Red
        Write-Host $resultado -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Error inesperado:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Presione cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
