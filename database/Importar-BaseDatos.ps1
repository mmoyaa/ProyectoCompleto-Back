# =====================================================
# Script PowerShell para Importar Base de Datos
# Sistema Mantenedor CCMM
# =====================================================

param(
    [string]$Servidor = "localhost",
    [string]$BaseDatos = "NuevoCCMM",
    [string]$ArchivoBackup = ""
)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  IMPORTACIÓN DE BASE DE DATOS" -ForegroundColor Cyan
Write-Host "  Mantenedor CCMM" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Si no se proporciona archivo, buscar el más reciente
if ([string]::IsNullOrEmpty($ArchivoBackup)) {
    Write-Host "🔍 Buscando archivo de backup más reciente..." -ForegroundColor Yellow
    
    $carpetasBackup = @("C:\Backup\CCMM", "C:\Backup", "$PSScriptRoot")
    $archivoEncontrado = $null
    
    foreach ($carpeta in $carpetasBackup) {
        if (Test-Path $carpeta) {
            $archivos = Get-ChildItem -Path $carpeta -Filter "*.bak" | Sort-Object LastWriteTime -Descending
            if ($archivos.Count -gt 0) {
                $archivoEncontrado = $archivos[0].FullName
                break
            }
        }
    }
    
    if ($archivoEncontrado) {
        Write-Host "✅ Archivo encontrado: $archivoEncontrado" -ForegroundColor Green
        $ArchivoBackup = $archivoEncontrado
    } else {
        Write-Host ""
        Write-Host "❌ No se encontró ningún archivo .bak" -ForegroundColor Red
        Write-Host "   Buscado en:" -ForegroundColor Gray
        foreach ($carpeta in $carpetasBackup) {
            Write-Host "   - $carpeta" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "Por favor, proporcione la ruta del archivo:" -ForegroundColor Yellow
        $ArchivoBackup = Read-Host "Ruta completa del archivo .bak"
    }
}

# Verificar que el archivo existe
if (-not (Test-Path $ArchivoBackup)) {
    Write-Host ""
    Write-Host "❌ El archivo no existe: $ArchivoBackup" -ForegroundColor Red
    exit 1
}

$infoArchivo = Get-Item $ArchivoBackup
$tamanoMB = [math]::Round($infoArchivo.Length / 1MB, 2)

Write-Host ""
Write-Host "📊 Información del Backup:" -ForegroundColor Cyan
Write-Host "   Archivo: $($infoArchivo.Name)" -ForegroundColor Gray
Write-Host "   Tamaño: $tamanoMB MB" -ForegroundColor Gray
Write-Host "   Fecha: $($infoArchivo.LastWriteTime)" -ForegroundColor Gray
Write-Host ""

# Advertencia
Write-Host "⚠️  ADVERTENCIA:" -ForegroundColor Yellow
Write-Host "   Esta operación sobrescribirá la base de datos '$BaseDatos'" -ForegroundColor Yellow
Write-Host "   si ya existe en el servidor '$Servidor'" -ForegroundColor Yellow
Write-Host ""

$confirmar = Read-Host "¿Desea continuar? (S/N)"
if ($confirmar -ne "S" -and $confirmar -ne "s") {
    Write-Host "❌ Operación cancelada por el usuario" -ForegroundColor Red
    exit 0
}

# Verificar si SQL Server está corriendo
Write-Host ""
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
Write-Host "🔄 Iniciando restauración..." -ForegroundColor Yellow
Write-Host ""

# Obtener información del backup
$queryInfo = @"
RESTORE FILELISTONLY 
FROM DISK = '$ArchivoBackup';
"@

try {
    Write-Host "📋 Obteniendo información del backup..." -ForegroundColor Yellow
    $fileList = sqlcmd -S $Servidor -E -Q $queryInfo -h -1 -W
    
    # Determinar rutas de archivos
    $rutaData = "C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA"
    
    # Buscar ruta real de SQL Server
    $queryRuta = "SELECT SERVERPROPERTY('InstanceDefaultDataPath') AS DefaultDataPath"
    $rutaReal = sqlcmd -S $Servidor -E -Q $queryRuta -h -1 -W
    if ($rutaReal -and $rutaReal.Trim() -ne "") {
        $rutaData = $rutaReal.Trim()
    }
    
    Write-Host "✅ Ruta de datos: $rutaData" -ForegroundColor Green
    
    # Cerrar conexiones activas
    Write-Host "🔒 Cerrando conexiones activas..." -ForegroundColor Yellow
    $queryCerrar = @"
USE master;
IF EXISTS (SELECT * FROM sys.databases WHERE name = '$BaseDatos')
BEGIN
    ALTER DATABASE [$BaseDatos] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
END
"@
    sqlcmd -S $Servidor -E -Q $queryCerrar | Out-Null
    
    # Restaurar base de datos
    Write-Host "💾 Restaurando base de datos..." -ForegroundColor Yellow
    $queryRestore = @"
USE master;
RESTORE DATABASE [$BaseDatos] 
FROM DISK = '$ArchivoBackup'
WITH REPLACE,
     MOVE 'NuevoCCMM' TO '${rutaData}\${BaseDatos}.mdf',
     MOVE 'NuevoCCMM_log' TO '${rutaData}\${BaseDatos}_log.ldf',
     STATS = 10;

ALTER DATABASE [$BaseDatos] SET MULTI_USER;
"@
    
    $resultado = sqlcmd -S $Servidor -E -Q $queryRestore -b
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Base de datos restaurada exitosamente!" -ForegroundColor Green
        
        # Verificar usuario y permisos
        Write-Host ""
        Write-Host "🔐 Configurando usuario y permisos..." -ForegroundColor Yellow
        
        $queryUsuario = @"
USE master;

-- Crear login si no existe
IF NOT EXISTS (SELECT * FROM sys.sql_logins WHERE name = 'ccmm_user')
BEGIN
    CREATE LOGIN ccmm_user 
    WITH PASSWORD = 'CcmmSegura123!',
         DEFAULT_DATABASE = $BaseDatos,
         CHECK_POLICY = OFF,
         CHECK_EXPIRATION = OFF;
    PRINT 'Login ccmm_user creado';
END
ELSE
BEGIN
    PRINT 'Login ccmm_user ya existe';
END

USE [$BaseDatos];

-- Crear usuario en la base de datos
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'ccmm_user')
BEGIN
    CREATE USER ccmm_user FOR LOGIN ccmm_user;
    PRINT 'Usuario ccmm_user creado en la base de datos';
END
ELSE
BEGIN
    PRINT 'Usuario ccmm_user ya existe en la base de datos';
END

-- Asignar permisos
ALTER ROLE db_datareader ADD MEMBER ccmm_user;
ALTER ROLE db_datawriter ADD MEMBER ccmm_user;
GRANT EXECUTE TO ccmm_user;

PRINT 'Permisos asignados correctamente';
"@
        
        sqlcmd -S $Servidor -E -Q $queryUsuario | Out-Null
        Write-Host "✅ Usuario y permisos configurados" -ForegroundColor Green
        
        # Estadísticas finales
        Write-Host ""
        Write-Host "📈 Estadísticas de la Base de Datos Importada:" -ForegroundColor Cyan
        
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
        
        # Verificar tablas
        Write-Host ""
        Write-Host "📋 Verificando estructura de tablas..." -ForegroundColor Yellow
        
        $queryTablas = @"
USE [$BaseDatos];
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
"@
        
        $tablas = sqlcmd -S $Servidor -E -Q $queryTablas -h -1 -W
        $listaTablas = $tablas -split "`n" | Where-Object { $_.Trim() -ne "" }
        
        Write-Host "✅ Tablas encontradas ($($listaTablas.Count)):" -ForegroundColor Green
        foreach ($tabla in $listaTablas) {
            Write-Host "   ✓ $tabla" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "======================================" -ForegroundColor Cyan
        Write-Host "✅ IMPORTACIÓN COMPLETADA" -ForegroundColor Green
        Write-Host "======================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📋 Información de Conexión:" -ForegroundColor Yellow
        Write-Host "   Servidor: $Servidor" -ForegroundColor Gray
        Write-Host "   Base de Datos: $BaseDatos" -ForegroundColor Gray
        Write-Host "   Usuario: ccmm_user" -ForegroundColor Gray
        Write-Host "   Contraseña: CcmmSegura123!" -ForegroundColor Gray
        Write-Host "   Puerto: 1433" -ForegroundColor Gray
        Write-Host ""
        Write-Host "✅ La base de datos está lista para usar!" -ForegroundColor Green
        Write-Host ""
        
    } else {
        Write-Host ""
        Write-Host "❌ Error al restaurar la base de datos" -ForegroundColor Red
        Write-Host $resultado -ForegroundColor Red
        
        # Intentar volver a multi-user
        $queryMultiUser = "ALTER DATABASE [$BaseDatos] SET MULTI_USER;"
        sqlcmd -S $Servidor -E -Q $queryMultiUser | Out-Null
        
        exit 1
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Error inesperado:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Intentar volver a multi-user
    try {
        $queryMultiUser = "ALTER DATABASE [$BaseDatos] SET MULTI_USER;"
        sqlcmd -S $Servidor -E -Q $queryMultiUser | Out-Null
    } catch {}
    
    exit 1
}

Write-Host ""
Write-Host "Presione cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
