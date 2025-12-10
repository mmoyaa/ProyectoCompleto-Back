-- =====================================================
-- SCRIPT COMPLETO PARA REPLICAR BASE DE DATOS
-- Sistema de Mantenedor CCMM
-- Fecha: 29 de noviembre de 2025
-- =====================================================
-- INSTRUCCIONES:
-- 1. Abrir SQL Server Management Studio (SSMS)
-- 2. Conectarse al servidor destino
-- 3. Ejecutar este script completo
-- 4. Verificar que todas las tablas se crearon correctamente
-- =====================================================

USE master;
GO

-- =====================================================
-- PASO 1: CREAR LA BASE DE DATOS
-- =====================================================

-- Eliminar la base de datos si existe (¡CUIDADO! Esto borra todos los datos)
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'NuevoCCMM')
BEGIN
    ALTER DATABASE NuevoCCMM SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE NuevoCCMM;
    PRINT '❌ Base de datos anterior eliminada';
END
GO

-- Crear la nueva base de datos
CREATE DATABASE NuevoCCMM;
GO

PRINT '✅ Base de datos NuevoCCMM creada';
GO

USE NuevoCCMM;
GO

-- =====================================================
-- PASO 2: CREAR TABLA DE TUTORES (PRIMERO - Sin dependencias)
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tutores]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[tutores] (
        [idTutor] INT IDENTITY(1,1) PRIMARY KEY,
        [nombre] NVARCHAR(100) NOT NULL,
        [apellido] NVARCHAR(100) NOT NULL,
        [rut] NVARCHAR(12) NOT NULL UNIQUE,
        [telefono] NVARCHAR(20),
        [correo] NVARCHAR(150),
        [direccion] NVARCHAR(255),
        [nacionalidad] NVARCHAR(50) DEFAULT 'Chilena',
        [fechaCreacion] DATETIME DEFAULT GETDATE(),
        [fechaModificacion] DATETIME DEFAULT GETDATE()
    );
    
    -- Índices para tutores
    CREATE INDEX IX_tutores_rut ON tutores(rut);
    CREATE INDEX IX_tutores_nombre ON tutores(nombre, apellido);
    
    PRINT '✅ Tabla tutores creada';
END
ELSE
BEGIN
    PRINT '⚠️  Tabla tutores ya existe';
END
GO

-- =====================================================
-- PASO 3: CREAR TABLA DE REPRESENTANTES (PRIMERO - Sin dependencias)
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[representantes]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[representantes] (
        [idRepresentante] INT IDENTITY(1,1) PRIMARY KEY,
        [nombre] NVARCHAR(100) NOT NULL,
        [apellido] NVARCHAR(100) NOT NULL,
        [rut] NVARCHAR(12) NOT NULL UNIQUE,
        [telefono] NVARCHAR(20),
        [correo] NVARCHAR(150),
        [direccion] NVARCHAR(255),
        [nacionalidad] NVARCHAR(50) DEFAULT 'Chilena',
        [fechaCreacion] DATETIME DEFAULT GETDATE(),
        [fechaModificacion] DATETIME DEFAULT GETDATE()
    );
    
    -- Índices para representantes
    CREATE INDEX IX_representantes_rut ON representantes(rut);
    CREATE INDEX IX_representantes_nombre ON representantes(nombre, apellido);
    
    PRINT '✅ Tabla representantes creada';
END
ELSE
BEGIN
    PRINT '⚠️  Tabla representantes ya existe';
END
GO

-- =====================================================
-- PASO 4: CREAR TABLA DE PACIENTES (Depende de tutores y representantes)
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[paciente]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[paciente] (
        [idPaciente] INT IDENTITY(1,1) PRIMARY KEY,
        [nombre] NVARCHAR(100) NOT NULL,
        [apellidoPaterno] NVARCHAR(100) NOT NULL,
        [apellidoMaterno] NVARCHAR(100),
        [rut] NVARCHAR(12) NOT NULL UNIQUE,
        [telefono] NVARCHAR(20),
        [correo] NVARCHAR(150),
        [direccion] NVARCHAR(255),
        [nacionalidad] NVARCHAR(50) DEFAULT 'Chilena',
        [tutor] INT DEFAULT 0, -- 0 = sin tutor, 1 = con tutor
        [idTutor] INT NULL,
        [idRepresentante] INT NULL,
        [fechaCreacion] DATETIME DEFAULT GETDATE(),
        [fechaModificacion] DATETIME DEFAULT GETDATE(),
        
        -- Foreign Keys
        CONSTRAINT FK_paciente_tutor 
            FOREIGN KEY (idTutor) REFERENCES tutores(idTutor),
        CONSTRAINT FK_paciente_representante 
            FOREIGN KEY (idRepresentante) REFERENCES representantes(idRepresentante)
    );
    
    -- Índices para pacientes
    CREATE INDEX IX_paciente_rut ON paciente(rut);
    CREATE INDEX IX_paciente_nombre ON paciente(nombre, apellidoPaterno);
    CREATE INDEX IX_paciente_idTutor ON paciente(idTutor);
    CREATE INDEX IX_paciente_idRepresentante ON paciente(idRepresentante);
    CREATE INDEX IX_paciente_fechaCreacion ON paciente(fechaCreacion);
    
    PRINT '✅ Tabla paciente creada';
END
ELSE
BEGIN
    PRINT '⚠️  Tabla paciente ya existe';
END
GO

-- Crear tabla alternativa con nombre Pacientes (mayúscula) si el sistema lo requiere
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Pacientes]') AND type in (N'U'))
BEGIN
    -- Crear vista o sinónimo para compatibilidad
    EXEC sp_addsynonym 
        @name = N'Pacientes', 
        @object = N'dbo.paciente';
    PRINT '✅ Sinónimo Pacientes creado para compatibilidad';
END
GO

-- =====================================================
-- PASO 5: CREAR TABLA DE RELACIÓN PACIENTE-REPRESENTANTE
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[paciente_representante]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[paciente_representante] (
        [idRelacion] INT IDENTITY(1,1) PRIMARY KEY,
        [idPaciente] INT NOT NULL,
        [idRepresentante] INT NOT NULL,
        [relacion] NVARCHAR(50) NOT NULL, -- Padre, Madre, Tutor Legal, etc.
        [fechaAsignacion] DATETIME DEFAULT GETDATE(),
        [fechaExpiracion] DATETIME NULL,
        [activo] BIT DEFAULT 1,
        
        -- Foreign Keys
        CONSTRAINT FK_paciente_representante_paciente 
            FOREIGN KEY (idPaciente) REFERENCES paciente(idPaciente) ON DELETE CASCADE,
        CONSTRAINT FK_paciente_representante_representante 
            FOREIGN KEY (idRepresentante) REFERENCES representantes(idRepresentante) ON DELETE CASCADE,
            
        -- Evitar duplicados activos
        CONSTRAINT UQ_paciente_representante_activo 
            UNIQUE(idPaciente, idRepresentante, activo)
    );
    
    -- Índices
    CREATE INDEX IX_paciente_representante_paciente ON paciente_representante(idPaciente);
    CREATE INDEX IX_paciente_representante_representante ON paciente_representante(idRepresentante);
    CREATE INDEX IX_paciente_representante_activo ON paciente_representante(activo);
    
    PRINT '✅ Tabla paciente_representante creada';
END
ELSE
BEGIN
    PRINT '⚠️  Tabla paciente_representante ya existe';
END
GO

-- =====================================================
-- PASO 6: CREAR TABLA DE EVALUACIONES SENSORIALES
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EvaluacionesSensoriales]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[EvaluacionesSensoriales] (
        [idEvaluacion] INT IDENTITY(1,1) NOT NULL,
        [idPaciente] INT NOT NULL,
        [fechaEvaluacion] DATETIME NOT NULL DEFAULT GETDATE(),
        [progreso] DECIMAL(5,2) NOT NULL DEFAULT 0,
        [respuestas] NVARCHAR(MAX) NOT NULL,
        [evaluadorNombre] NVARCHAR(100) NULL,
        [evaluadorCorreo] NVARCHAR(100) NULL,
        [observaciones] NVARCHAR(500) NULL,
        [fechaCreacion] DATETIME NOT NULL DEFAULT GETDATE(),
        [fechaActualizacion] DATETIME NULL,
        [estado] NVARCHAR(20) NOT NULL DEFAULT 'En Progreso',
        
        CONSTRAINT PK_EvaluacionesSensoriales PRIMARY KEY CLUSTERED ([idEvaluacion] ASC),
        CONSTRAINT FK_EvaluacionesSensoriales_Pacientes 
            FOREIGN KEY([idPaciente]) REFERENCES [dbo].[paciente] ([idPaciente]) ON DELETE CASCADE
    );
    
    -- Índices para evaluaciones
    CREATE NONCLUSTERED INDEX IX_EvaluacionesSensoriales_idPaciente 
        ON EvaluacionesSensoriales (idPaciente ASC);
    
    CREATE NONCLUSTERED INDEX IX_EvaluacionesSensoriales_fechaEvaluacion 
        ON EvaluacionesSensoriales (fechaEvaluacion DESC);
    
    CREATE NONCLUSTERED INDEX IX_EvaluacionesSensoriales_estado 
        ON EvaluacionesSensoriales (estado);
    
    PRINT '✅ Tabla EvaluacionesSensoriales creada';
END
ELSE
BEGIN
    PRINT '⚠️  Tabla EvaluacionesSensoriales ya existe';
END
GO

-- =====================================================
-- PASO 7: CREAR TABLAS DEL SISTEMA DE DOCUMENTOS
-- =====================================================

-- Tabla de tipos de datos
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TPTipoDatos]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TPTipoDatos] (
        [idTipo] INT IDENTITY(1,1) PRIMARY KEY,
        [nombre] VARCHAR(50) NOT NULL UNIQUE,
        [descripcion] VARCHAR(200),
        [activo] BIT DEFAULT 1,
        [fechaCreacion] DATETIME DEFAULT GETDATE(),
        [fechaActualizacion] DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_TPTipoDatos_nombre ON TPTipoDatos(nombre);
    CREATE INDEX IX_TPTipoDatos_activo ON TPTipoDatos(activo);
    
    PRINT '✅ Tabla TPTipoDatos creada';
END
ELSE
BEGIN
    PRINT '⚠️  Tabla TPTipoDatos ya existe';
END
GO

-- Tabla de formatos de archivo
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TPFormato]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TPFormato] (
        [idFormato] INT IDENTITY(1,1) PRIMARY KEY,
        [nombre] VARCHAR(20) NOT NULL,
        [extension] VARCHAR(10) NOT NULL UNIQUE,
        [mimeType] VARCHAR(100),
        [activo] BIT DEFAULT 1,
        [fechaCreacion] DATETIME DEFAULT GETDATE(),
        [fechaActualizacion] DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_TPFormato_extension ON TPFormato(extension);
    CREATE INDEX IX_TPFormato_activo ON TPFormato(activo);
    
    PRINT '✅ Tabla TPFormato creada';
END
ELSE
BEGIN
    PRINT '⚠️  Tabla TPFormato ya existe';
END
GO

-- Tabla principal de documentos
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DocumentosCCMM]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[DocumentosCCMM] (
        [idDocumento] INT IDENTITY(1,1) PRIMARY KEY,
        [nombreArchivo] VARCHAR(255) NOT NULL,
        [nombreOriginal] VARCHAR(255) NOT NULL,
        [rutaArchivo] VARCHAR(500),
        [archivo] NVARCHAR(MAX), -- Para Base64 del archivo o NULL si se guarda en filesystem
        [idTipo] INT NOT NULL,
        [idFormato] INT NOT NULL,
        [tamano] BIGINT, -- Tamaño en bytes
        [checksum] VARCHAR(64), -- Hash MD5 o SHA256 para verificar integridad
        [descripcion] NVARCHAR(MAX),
        [usuarioCreacion] VARCHAR(100),
        [fechaCreacion] DATETIME DEFAULT GETDATE(),
        [fechaActualizacion] DATETIME DEFAULT GETDATE(),
        [activo] BIT DEFAULT 1,
        
        CONSTRAINT FK_DocumentosCCMM_TPTipoDatos 
            FOREIGN KEY (idTipo) REFERENCES TPTipoDatos(idTipo),
        CONSTRAINT FK_DocumentosCCMM_TPFormato 
            FOREIGN KEY (idFormato) REFERENCES TPFormato(idFormato)
    );
    
    CREATE INDEX IX_DocumentosCCMM_idTipo ON DocumentosCCMM(idTipo);
    CREATE INDEX IX_DocumentosCCMM_idFormato ON DocumentosCCMM(idFormato);
    CREATE INDEX IX_DocumentosCCMM_fechaCreacion ON DocumentosCCMM(fechaCreacion);
    CREATE INDEX IX_DocumentosCCMM_activo ON DocumentosCCMM(activo);
    CREATE INDEX IX_DocumentosCCMM_nombreArchivo ON DocumentosCCMM(nombreArchivo);
    CREATE INDEX IX_DocumentosCCMM_usuarioCreacion ON DocumentosCCMM(usuarioCreacion);
    
    PRINT '✅ Tabla DocumentosCCMM creada';
END
ELSE
BEGIN
    PRINT '⚠️  Tabla DocumentosCCMM ya existe';
END
GO

-- =====================================================
-- PASO 8: CREAR TRIGGERS
-- =====================================================

-- Trigger para actualizar fechaModificacion en tutores
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_tutores_update')
BEGIN
    EXEC('
    CREATE TRIGGER TR_tutores_update
    ON tutores
    AFTER UPDATE
    AS
    BEGIN
        UPDATE tutores 
        SET fechaModificacion = GETDATE()
        FROM tutores t
        INNER JOIN inserted i ON t.idTutor = i.idTutor;
    END
    ');
    PRINT '✅ Trigger TR_tutores_update creado';
END
GO

-- Trigger para actualizar fechaModificacion en representantes
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_representantes_update')
BEGIN
    EXEC('
    CREATE TRIGGER TR_representantes_update
    ON representantes
    AFTER UPDATE
    AS
    BEGIN
        UPDATE representantes 
        SET fechaModificacion = GETDATE()
        FROM representantes r
        INNER JOIN inserted i ON r.idRepresentante = i.idRepresentante;
    END
    ');
    PRINT '✅ Trigger TR_representantes_update creado';
END
GO

-- Trigger para actualizar fechaModificacion en pacientes
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_paciente_update')
BEGIN
    EXEC('
    CREATE TRIGGER TR_paciente_update
    ON paciente
    AFTER UPDATE
    AS
    BEGIN
        UPDATE paciente 
        SET fechaModificacion = GETDATE()
        FROM paciente p
        INNER JOIN inserted i ON p.idPaciente = i.idPaciente;
    END
    ');
    PRINT '✅ Trigger TR_paciente_update creado';
END
GO

-- =====================================================
-- PASO 9: INSERTAR DATOS INICIALES
-- =====================================================

-- Datos iniciales para TPTipoDatos
IF NOT EXISTS (SELECT * FROM TPTipoDatos WHERE nombre = 'Fotos')
BEGIN
    INSERT INTO TPTipoDatos (nombre, descripcion) VALUES
        ('Fotos', 'Fotografías y material gráfico'),
        ('Documentos', 'Documentos oficiales y administrativos'),
        ('Decretos', 'Decretos gubernamentales y oficiales'),
        ('Resolución', 'Resoluciones y dictámenes');
    
    PRINT '✅ Datos iniciales insertados en TPTipoDatos';
END
GO

-- Datos iniciales para TPFormato
IF NOT EXISTS (SELECT * FROM TPFormato WHERE extension = 'jpg')
BEGIN
    INSERT INTO TPFormato (nombre, extension, mimeType) VALUES
        ('JPEG', 'jpg', 'image/jpeg'),
        ('JPEG', 'jpeg', 'image/jpeg'),
        ('PDF', 'pdf', 'application/pdf'),
        ('PNG', 'png', 'image/png'),
        ('Word', 'docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        ('Excel', 'xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    PRINT '✅ Datos iniciales insertados en TPFormato';
END
GO

-- =====================================================
-- PASO 10: CREAR USUARIO DE BASE DE DATOS
-- =====================================================

-- Crear login si no existe
IF NOT EXISTS (SELECT * FROM sys.sql_logins WHERE name = 'ccmm_user')
BEGIN
    CREATE LOGIN ccmm_user 
    WITH PASSWORD = 'CcmmSegura123!',
         DEFAULT_DATABASE = NuevoCCMM,
         CHECK_POLICY = OFF,
         CHECK_EXPIRATION = OFF;
    
    PRINT '✅ Login ccmm_user creado';
END
ELSE
BEGIN
    PRINT '⚠️  Login ccmm_user ya existe';
END
GO

USE NuevoCCMM;
GO

-- Crear usuario en la base de datos
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'ccmm_user')
BEGIN
    CREATE USER ccmm_user FOR LOGIN ccmm_user;
    PRINT '✅ Usuario ccmm_user creado en la base de datos';
END
ELSE
BEGIN
    PRINT '⚠️  Usuario ccmm_user ya existe en la base de datos';
END
GO

-- Asignar permisos
ALTER ROLE db_datareader ADD MEMBER ccmm_user;
ALTER ROLE db_datawriter ADD MEMBER ccmm_user;
GRANT EXECUTE TO ccmm_user;
GO

PRINT '✅ Permisos asignados a ccmm_user';
GO

-- =====================================================
-- PASO 11: VERIFICACIÓN FINAL
-- =====================================================

PRINT '';
PRINT '========================================';
PRINT '   VERIFICACIÓN DE TABLAS CREADAS';
PRINT '========================================';
PRINT '';

-- Listar todas las tablas creadas
SELECT 
    TABLE_NAME AS 'Tabla',
    (SELECT COUNT(*) 
     FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = t.TABLE_NAME) AS 'Columnas'
FROM INFORMATION_SCHEMA.TABLES t
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

PRINT '';
PRINT '========================================';
PRINT '   RESUMEN DE REGISTROS';
PRINT '========================================';
PRINT '';

-- Mostrar conteo de registros
DECLARE @SQL NVARCHAR(MAX) = '';
SELECT @SQL = @SQL + 
    'SELECT ''' + TABLE_NAME + ''' AS Tabla, COUNT(*) AS Registros FROM [' + TABLE_NAME + '] UNION ALL '
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE';

-- Remover el último UNION ALL
SET @SQL = LEFT(@SQL, LEN(@SQL) - 10);
EXEC sp_executesql @SQL;

PRINT '';
PRINT '========================================';
PRINT '✅ BASE DE DATOS REPLICADA EXITOSAMENTE';
PRINT '========================================';
PRINT '';
PRINT 'Configuración de conexión:';
PRINT '  Servidor: localhost (o tu servidor SQL)';
PRINT '  Base de datos: NuevoCCMM';
PRINT '  Usuario: ccmm_user';
PRINT '  Contraseña: CcmmSegura123!';
PRINT '  Puerto: 1433';
PRINT '';
PRINT 'Tablas creadas:';
PRINT '  ✓ tutores';
PRINT '  ✓ representantes';
PRINT '  ✓ paciente';
PRINT '  ✓ paciente_representante';
PRINT '  ✓ EvaluacionesSensoriales';
PRINT '  ✓ TPTipoDatos';
PRINT '  ✓ TPFormato';
PRINT '  ✓ DocumentosCCMM';
PRINT '';
PRINT '¡La base de datos está lista para usar!';
PRINT '';

GO
