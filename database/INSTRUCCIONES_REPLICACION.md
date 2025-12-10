# 📋 Instrucciones para Replicar la Base de Datos en Otro Equipo

## 🎯 Objetivo
Crear una réplica exacta de tu base de datos `NuevoCCMM` en otro equipo con:
- ✅ Mismos nombres de tablas
- ✅ Misma estructura
- ✅ Mismas relaciones (Foreign Keys)
- ✅ Mismo usuario y contraseña
- ✅ Datos iniciales configurados

---

## 📦 Archivos Necesarios

1. **`REPLICAR_BD_COMPLETA.sql`** - Script maestro con toda la estructura
2. Este archivo de instrucciones

---

## 🔧 Requisitos Previos

### En el Equipo Destino:
- ✅ SQL Server instalado (2016 o superior)
- ✅ SQL Server Management Studio (SSMS) instalado
- ✅ Permisos de administrador en SQL Server
- ✅ Puerto 1433 abierto (si necesitas conexión remota)

---

## 🚀 Pasos para Replicar

### **Opción 1: Solo Estructura (Base de datos vacía)**

#### Paso 1: Abrir SQL Server Management Studio
```
1. Ejecutar SSMS
2. Conectarse al servidor destino
   - Servidor: localhost (o nombre del servidor)
   - Autenticación: Windows o SQL Server
```

#### Paso 2: Ejecutar el Script
```
1. Archivo → Abrir → Archivo
2. Seleccionar: REPLICAR_BD_COMPLETA.sql
3. Verificar que esté conectado al servidor correcto
4. Clic en "Ejecutar" (F5)
```

#### Paso 3: Verificar Resultados
El script mostrará mensajes como:
```
✅ Base de datos NuevoCCMM creada
✅ Tabla tutores creada
✅ Tabla representantes creada
✅ Tabla paciente creada
✅ Tabla paciente_representante creada
✅ Tabla EvaluacionesSensoriales creada
✅ Tabla TPTipoDatos creada
✅ Tabla TPFormato creada
✅ Tabla DocumentosCCMM creada
✅ Login ccmm_user creado
✅ BASE DE DATOS REPLICADA EXITOSAMENTE
```

---

### **Opción 2: Con Datos Existentes (Respaldo completo)**

#### Paso 1: Exportar Datos desde el Equipo Original

**A. Usando SSMS (Recomendado):**
```sql
-- Ejecutar en el equipo ORIGINAL
USE NuevoCCMM;
GO

-- Backup completo
BACKUP DATABASE NuevoCCMM 
TO DISK = 'C:\Backup\NuevoCCMM_Backup.bak'
WITH FORMAT, 
     NAME = 'Backup Completo NuevoCCMM',
     DESCRIPTION = 'Backup para replicación',
     COMPRESSION;
```

**B. Usando bcp (Para tablas individuales):**
```powershell
# Desde PowerShell en el equipo ORIGINAL
# Exportar tutores
bcp "SELECT * FROM NuevoCCMM.dbo.tutores" queryout "C:\Backup\tutores.dat" -c -T -S localhost

# Exportar representantes
bcp "SELECT * FROM NuevoCCMM.dbo.representantes" queryout "C:\Backup\representantes.dat" -c -T -S localhost

# Exportar pacientes
bcp "SELECT * FROM NuevoCCMM.dbo.paciente" queryout "C:\Backup\paciente.dat" -c -T -S localhost

# Exportar evaluaciones
bcp "SELECT * FROM NuevoCCMM.dbo.EvaluacionesSensoriales" queryout "C:\Backup\evaluaciones.dat" -c -T -S localhost
```

#### Paso 2: Copiar Archivos al Equipo Destino
```
1. Copiar archivos .bak o .dat a USB o red
2. Transferir al equipo destino
3. Colocar en carpeta accesible (ej: C:\Backup\)
```

#### Paso 3: Restaurar en el Equipo Destino

**Opción A: Restaurar desde Backup .bak**
```sql
-- En SSMS del equipo DESTINO
USE master;
GO

-- Restaurar base de datos completa
RESTORE DATABASE NuevoCCMM 
FROM DISK = 'C:\Backup\NuevoCCMM_Backup.bak'
WITH REPLACE,
     MOVE 'NuevoCCMM' TO 'C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA\NuevoCCMM.mdf',
     MOVE 'NuevoCCMM_log' TO 'C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA\NuevoCCMM_log.ldf';
GO
```

**Opción B: Importar desde archivos .dat**
```powershell
# En PowerShell del equipo DESTINO
# Primero ejecutar REPLICAR_BD_COMPLETA.sql para crear estructura

# Importar tutores
bcp NuevoCCMM.dbo.tutores in "C:\Backup\tutores.dat" -c -T -S localhost

# Importar representantes
bcp NuevoCCMM.dbo.representantes in "C:\Backup\representantes.dat" -c -T -S localhost

# Importar pacientes
bcp NuevoCCMM.dbo.paciente in "C:\Backup\paciente.dat" -c -T -S localhost

# Importar evaluaciones
bcp NuevoCCMM.dbo.EvaluacionesSensoriales in "C:\Backup\evaluaciones.dat" -c -T -S localhost
```

---

## 🔐 Configuración de Conexión

Después de la replicación, tu aplicación debe conectarse con:

```javascript
// db.js
const config = {
  server: 'localhost',        // O IP del servidor destino
  database: 'NuevoCCMM',
  user: 'ccmm_user',
  password: 'CcmmSegura123!',
  port: 1433,
  authentication: {
    type: 'default'
  },
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};
```

---

## ✅ Verificación Post-Instalación

### Ejecutar estas queries en SSMS:

```sql
USE NuevoCCMM;
GO

-- 1. Verificar todas las tablas
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- 2. Verificar conteo de registros
SELECT 'tutores' AS Tabla, COUNT(*) AS Registros FROM tutores
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

-- 3. Verificar Foreign Keys
SELECT 
    fk.name AS ForeignKey_Name,
    OBJECT_NAME(fk.parent_object_id) AS Table_Name,
    COL_NAME(fc.parent_object_id, fc.parent_column_id) AS Column_Name,
    OBJECT_NAME(fk.referenced_object_id) AS Referenced_Table
FROM sys.foreign_keys AS fk
INNER JOIN sys.foreign_key_columns AS fc 
    ON fk.object_id = fc.constraint_object_id
ORDER BY Table_Name;

-- 4. Verificar índices
SELECT 
    OBJECT_NAME(i.object_id) AS Table_Name,
    i.name AS Index_Name,
    i.type_desc AS Index_Type
FROM sys.indexes i
WHERE i.object_id IN (
    SELECT object_id 
    FROM sys.tables
)
AND i.name IS NOT NULL
ORDER BY Table_Name, Index_Name;

-- 5. Verificar usuario
SELECT 
    name, 
    type_desc, 
    create_date
FROM sys.database_principals
WHERE name = 'ccmm_user';

-- 6. Verificar permisos del usuario
SELECT 
    dp.name AS UserName,
    dp.type_desc AS UserType,
    p.permission_name,
    p.state_desc
FROM sys.database_permissions p
INNER JOIN sys.database_principals dp 
    ON p.grantee_principal_id = dp.principal_id
WHERE dp.name = 'ccmm_user';
```

---

## 🧪 Probar Conexión desde Node.js

Crea un archivo `test-conexion.js`:

```javascript
const sql = require('mssql');

const config = {
  server: 'localhost',
  database: 'NuevoCCMM',
  user: 'ccmm_user',
  password: 'CcmmSegura123!',
  port: 1433,
  authentication: {
    type: 'default'
  },
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function testConnection() {
  try {
    console.log('🔄 Intentando conectar...');
    const pool = await sql.connect(config);
    console.log('✅ Conexión exitosa!');
    
    // Probar consulta
    const result = await pool.request().query('SELECT COUNT(*) as total FROM paciente');
    console.log('📊 Total de pacientes:', result.recordset[0].total);
    
    await pool.close();
    console.log('✅ Prueba completada');
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
  }
}

testConnection();
```

Ejecutar:
```powershell
node test-conexion.js
```

---

## 🔥 Solución de Problemas

### Error: "Login failed for user 'ccmm_user'"
```sql
-- Verificar que el login existe
USE master;
SELECT * FROM sys.sql_logins WHERE name = 'ccmm_user';

-- Si no existe, crearlo:
CREATE LOGIN ccmm_user WITH PASSWORD = 'CcmmSegura123!';

-- Asignar permisos
USE NuevoCCMM;
CREATE USER ccmm_user FOR LOGIN ccmm_user;
ALTER ROLE db_datareader ADD MEMBER ccmm_user;
ALTER ROLE db_datawriter ADD MEMBER ccmm_user;
GRANT EXECUTE TO ccmm_user;
```

### Error: "Cannot open database requested by the login"
```sql
-- Verificar que la BD existe
SELECT name FROM sys.databases WHERE name = 'NuevoCCMM';

-- Si no existe, ejecutar REPLICAR_BD_COMPLETA.sql
```

### Error: "Network-related or instance-specific error"
```powershell
# Verificar que SQL Server está corriendo
Get-Service | Where-Object {$_.Name -like "*SQL*"}

# Iniciar SQL Server si está detenido
Start-Service MSSQLSERVER

# Verificar puerto 1433
netstat -ano | findstr :1433
```

### Error: "The backup set holds a backup of a database other than the existing"
```sql
-- Usar WITH REPLACE al restaurar
RESTORE DATABASE NuevoCCMM 
FROM DISK = 'C:\Backup\NuevoCCMM_Backup.bak'
WITH REPLACE;
```

---

## 📊 Estructura de Tablas

### Tabla: tutores
```
idTutor (PK, IDENTITY)
nombre
apellido
rut (UNIQUE)
telefono
correo
direccion
nacionalidad
fechaCreacion
fechaModificacion
```

### Tabla: representantes
```
idRepresentante (PK, IDENTITY)
nombre
apellido
rut (UNIQUE)
telefono
correo
direccion
nacionalidad
fechaCreacion
fechaModificacion
```

### Tabla: paciente
```
idPaciente (PK, IDENTITY)
nombre
apellidoPaterno
apellidoMaterno
rut (UNIQUE)
telefono
correo
direccion
nacionalidad
tutor
idTutor (FK → tutores)
idRepresentante (FK → representantes)
fechaCreacion
fechaModificacion
```

### Tabla: paciente_representante
```
idRelacion (PK, IDENTITY)
idPaciente (FK → paciente)
idRepresentante (FK → representantes)
relacion
fechaAsignacion
fechaExpiracion
activo
```

### Tabla: EvaluacionesSensoriales
```
idEvaluacion (PK, IDENTITY)
idPaciente (FK → paciente)
fechaEvaluacion
progreso
respuestas (JSON)
evaluadorNombre
evaluadorCorreo
observaciones
fechaCreacion
fechaActualizacion
estado
```

### Tablas del Sistema de Documentos
```
TPTipoDatos (Tipos de documentos)
TPFormato (Formatos de archivo)
DocumentosCCMM (Documentos principales)
```

---

## 📝 Notas Importantes

1. **Seguridad**: La contraseña `CcmmSegura123!` es para desarrollo. En producción, usa una contraseña más fuerte.

2. **Backups**: Siempre haz un backup antes de cualquier operación importante:
   ```sql
   BACKUP DATABASE NuevoCCMM TO DISK = 'C:\Backup\NuevoCCMM_$(date).bak';
   ```

3. **Permisos**: El usuario `ccmm_user` tiene permisos de lectura, escritura y ejecución.

4. **Puerto**: Si SQL Server usa un puerto diferente a 1433, actualízalo en la configuración.

5. **Firewall**: Asegúrate de que el firewall permita conexiones al puerto 1433.

---

## ✅ Checklist de Verificación

- [ ] SQL Server instalado y corriendo
- [ ] SSMS instalado
- [ ] Script REPLICAR_BD_COMPLETA.sql ejecutado sin errores
- [ ] Base de datos NuevoCCMM creada
- [ ] 8 tablas creadas correctamente
- [ ] Usuario ccmm_user creado
- [ ] Permisos asignados
- [ ] Datos iniciales insertados (TPTipoDatos, TPFormato)
- [ ] Foreign Keys configuradas
- [ ] Índices creados
- [ ] Triggers creados
- [ ] Conexión probada desde Node.js

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los mensajes de error en SSMS
2. Verifica la sección "Solución de Problemas"
3. Asegúrate de tener permisos de administrador
4. Revisa los logs de SQL Server

---

**¡Listo! Tu base de datos está replicada y lista para usar.** 🎉
