# Solución para Error de Permisos CREATE TABLE

## Error Encontrado:
```
CREATE TABLE permission denied in database 'NuevoCCMM'
```

## Posibles Soluciones:

### Opción 1: Usar cuenta de Administrador
1. Conectarse a SQL Server Management Studio como administrador
2. Usar la cuenta `sa` (System Administrator) si está habilitada
3. O usar una cuenta con privilegios de `db_owner` en la base de datos

### Opción 2: Otorgar Permisos al Usuario Actual
Ejecutar estos comandos como administrador en SSMS:

```sql
USE NuevoCCMM;
GO

-- Otorgar permisos de creación al usuario actual
GRANT CREATE TABLE TO [TU_USUARIO];
GO

-- O agregar el usuario al rol db_ddladmin
ALTER ROLE db_ddladmin ADD MEMBER [TU_USUARIO];
GO

-- Verificar permisos actuales
SELECT 
    p.permission_name,
    p.state_desc,
    pr.name AS principal_name
FROM sys.database_permissions p
JOIN sys.database_principals pr ON p.grantee_principal_id = pr.principal_id
WHERE pr.name = USER_NAME();
```

### Opción 3: Usar Script Simplificado (RECOMENDADO PARA TESTING)
Usar el archivo `CREAR_TABLA_SIMPLE.sql` que:
- No tiene Foreign Key constraints
- Es más simple de crear
- Permite testing básico del sistema

### Opción 4: Crear desde la Aplicación Node.js
Si tienes permisos en la aplicación pero no en SSMS, puedes usar:

```javascript
// En el archivo ejecutar_tabla_evaluaciones.js
const sql = require('mssql');

async function crearTablaEvaluaciones() {
    try {
        const pool = await sql.connect();
        const query = `
            CREATE TABLE [dbo].[EvaluacionesSensoriales] (
                [idEvaluacion] [int] IDENTITY(1,1) NOT NULL,
                [idPaciente] [int] NOT NULL,
                [fechaEvaluacion] [datetime] NOT NULL DEFAULT GETDATE(),
                [progreso] [decimal](5,2) NOT NULL DEFAULT 0,
                [respuestas] [nvarchar](MAX) NOT NULL,
                [evaluadorNombre] [nvarchar](100) NULL,
                [evaluadorCorreo] [nvarchar](100) NULL,
                [observaciones] [nvarchar](500) NULL,
                [fechaCreacion] [datetime] NOT NULL DEFAULT GETDATE(),
                [fechaActualizacion] [datetime] NULL,
                [estado] [nvarchar](20) NOT NULL DEFAULT 'En Progreso',
                CONSTRAINT [PK_EvaluacionesSensoriales] PRIMARY KEY CLUSTERED ([idEvaluacion] ASC)
            );
        `;
        
        await pool.request().query(query);
        console.log('Tabla creada exitosamente desde Node.js');
    } catch (error) {
        console.error('Error:', error);
    }
}
```

## Orden Recomendado de Pruebas:

1. **Primero**: Intentar `CREAR_TABLA_SIMPLE.sql` en SSMS
2. **Si falla**: Usar Opción 2 (otorgar permisos)
3. **Si aún falla**: Usar Opción 4 (desde Node.js)
4. **Como último recurso**: Contactar al administrador de la base de datos

## Verificar que la Tabla Existe:
```sql
SELECT name FROM sys.tables WHERE name = 'EvaluacionesSensoriales';
```

## Siguiente Paso:
Una vez creada la tabla, probar las rutas API con:
```
GET http://localhost:3000/api/evaluaciones
```
