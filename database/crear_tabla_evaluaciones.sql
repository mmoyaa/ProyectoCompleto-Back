-- Script para crear la tabla de evaluaciones sensoriales
-- Fecha: 4 de agosto de 2025

USE NuevoCCMM;
GO

-- Crear tabla de evaluaciones sensoriales
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EvaluacionesSensoriales]') AND type in (N'U'))
BEGIN
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
        CONSTRAINT [PK_EvaluacionesSensoriales] PRIMARY KEY CLUSTERED ([idEvaluacion] ASC),
        CONSTRAINT [FK_EvaluacionesSensoriales_Pacientes] FOREIGN KEY([idPaciente]) 
            REFERENCES [dbo].[Pacientes] ([idPaciente]) ON DELETE CASCADE
    );
    
    PRINT 'Tabla EvaluacionesSensoriales creada correctamente.';
END
ELSE
BEGIN
    PRINT 'La tabla EvaluacionesSensoriales ya existe.';
END
GO

-- Crear índices para mejorar el rendimiento
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[EvaluacionesSensoriales]') AND name = N'IX_EvaluacionesSensoriales_idPaciente')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_EvaluacionesSensoriales_idPaciente] 
    ON [dbo].[EvaluacionesSensoriales] ([idPaciente] ASC);
    
    PRINT 'Índice IX_EvaluacionesSensoriales_idPaciente creado correctamente.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[EvaluacionesSensoriales]') AND name = N'IX_EvaluacionesSensoriales_fechaEvaluacion')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_EvaluacionesSensoriales_fechaEvaluacion] 
    ON [dbo].[EvaluacionesSensoriales] ([fechaEvaluacion] DESC);
    
    PRINT 'Índice IX_EvaluacionesSensoriales_fechaEvaluacion creado correctamente.';
END
GO

-- Mostrar la estructura de la tabla creada
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'EvaluacionesSensoriales'
ORDER BY ORDINAL_POSITION;

PRINT 'Script completado exitosamente.';
