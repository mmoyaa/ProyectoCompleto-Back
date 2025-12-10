# 🚀 Replicar Base de Datos en Otro Equipo

## ⚡ Guía Rápida (3 Pasos)

### **Método 1: Script Automático (RECOMENDADO)**

#### En el Equipo ORIGINAL:
```powershell
# Ejecutar en PowerShell como Administrador
cd "C:\Users\User\Documents\Mantenedorfull\Backend -Mantenedors\database"
.\Exportar-BaseDatos.ps1
```
✅ Esto crea un archivo `.bak` en `C:\Backup\CCMM\`

#### Transferir al Equipo DESTINO:
- Copiar el archivo `.bak` generado
- USB, red, o cualquier método

#### En el Equipo DESTINO:
```powershell
# Ejecutar en PowerShell como Administrador
cd "ruta\donde\copiaste\los\scripts"
.\Importar-BaseDatos.ps1 -ArchivoBackup "C:\ruta\al\archivo.bak"
```
✅ ¡Base de datos replicada!

---

### **Método 2: Script SQL Manual**

#### Paso 1: En SSMS del equipo DESTINO
```sql
-- Abrir archivo: REPLICAR_BD_COMPLETA.sql
-- Presionar F5 para ejecutar
```
✅ Esto crea la estructura vacía

#### Paso 2: (Opcional) Copiar datos
Si quieres los datos existentes, en el equipo ORIGINAL:
```sql
-- Generar backup
BACKUP DATABASE NuevoCCMM 
TO DISK = 'C:\Backup\NuevoCCMM.bak'
WITH COMPRESSION;
```

Luego en el equipo DESTINO:
```sql
-- Restaurar backup
RESTORE DATABASE NuevoCCMM 
FROM DISK = 'C:\Backup\NuevoCCMM.bak'
WITH REPLACE;
```

---

## 📋 Archivos Disponibles

| Archivo | Descripción | Uso |
|---------|-------------|-----|
| `REPLICAR_BD_COMPLETA.sql` | Script SQL maestro | Crear estructura completa |
| `Exportar-BaseDatos.ps1` | Script PowerShell | Exportar datos automáticamente |
| `Importar-BaseDatos.ps1` | Script PowerShell | Importar datos automáticamente |
| `INSTRUCCIONES_REPLICACION.md` | Guía detallada | Documentación completa |
| `README_RAPIDO.md` | Este archivo | Guía rápida |

---

## 🔧 Requisitos

### Equipo Destino debe tener:
- ✅ SQL Server 2016+ instalado
- ✅ SQL Server Management Studio (SSMS)
- ✅ PowerShell 5.1+ (para scripts automáticos)
- ✅ Permisos de administrador

---

## 🔐 Credenciales de Conexión

Después de la replicación:

```javascript
// Configuración en db.js
const config = {
  server: 'localhost',
  database: 'NuevoCCMM',
  user: 'ccmm_user',
  password: 'CcmmSegura123!',
  port: 1433
};
```

---

## ✅ Verificación Rápida

Ejecuta esto en SSMS para verificar:

```sql
USE NuevoCCMM;

-- Ver tablas
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE';

-- Ver cantidad de registros
SELECT 'paciente' AS Tabla, COUNT(*) AS Total FROM paciente
UNION ALL
SELECT 'EvaluacionesSensoriales', COUNT(*) FROM EvaluacionesSensoriales;

-- Probar usuario
SELECT name FROM sys.database_principals WHERE name = 'ccmm_user';
```

Deberías ver:
- ✅ 8 tablas creadas
- ✅ Usuario `ccmm_user` existe
- ✅ Datos si usaste método de backup/restore

---

## 📊 Tablas Incluidas

1. `tutores` - Información de tutores
2. `representantes` - Representantes legales
3. `paciente` - Datos de pacientes
4. `paciente_representante` - Relación paciente-representante
5. `EvaluacionesSensoriales` - Evaluaciones médicas
6. `TPTipoDatos` - Tipos de documentos
7. `TPFormato` - Formatos de archivo
8. `DocumentosCCMM` - Documentos del sistema

---

## 🆘 Problemas Comunes

### "No se puede conectar"
```powershell
# Verificar SQL Server
Get-Service MSSQLSERVER
Start-Service MSSQLSERVER
```

### "Login failed for user"
```sql
-- Crear usuario
USE master;
CREATE LOGIN ccmm_user WITH PASSWORD = 'CcmmSegura123!';
USE NuevoCCMM;
CREATE USER ccmm_user FOR LOGIN ccmm_user;
ALTER ROLE db_datawriter ADD MEMBER ccmm_user;
ALTER ROLE db_datareader ADD MEMBER ccmm_user;
```

### "Database already exists"
```sql
-- Eliminar BD anterior
USE master;
ALTER DATABASE NuevoCCMM SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE NuevoCCMM;
-- Luego ejecutar script de nuevo
```

---

## 🎯 ¿Qué Método Usar?

| Situación | Método Recomendado |
|-----------|-------------------|
| Solo necesito estructura vacía | **Script SQL Manual** |
| Necesito copiar datos también | **Scripts PowerShell** |
| Primera vez replicando | **Scripts PowerShell** |
| Tengo experiencia con SQL | **Método que prefieras** |

---

## 📞 Soporte

Para documentación completa: `INSTRUCCIONES_REPLICACION.md`

---

**¡Listo en 3 pasos!** 🎉

1. Exportar con `Exportar-BaseDatos.ps1`
2. Copiar archivo `.bak` 
3. Importar con `Importar-BaseDatos.ps1`
