// Script para ejecutar la creación de la tabla de evaluaciones
// Ejecutar: node ejecutar_tabla_evaluaciones.js

const sql = require('mssql');

const config = {
  user: 'ccmm_user',
  password: 'CcmmSegura123!',
  server: 'localhost',
  database: 'NuevoCCMM',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function crearTablaEvaluaciones() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sql.connect(config);
    console.log('✅ Conexión exitosa');

    const createTableScript = `
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
    `;

    console.log('🔄 Ejecutando script de creación de tabla...');
    await sql.query(createTableScript);

    // Crear índices
    const indexScript = `
      -- Crear índices para mejorar el rendimiento
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[EvaluacionesSensoriales]') AND name = N'IX_EvaluacionesSensoriales_idPaciente')
      BEGIN
          CREATE NONCLUSTERED INDEX [IX_EvaluacionesSensoriales_idPaciente] 
          ON [dbo].[EvaluacionesSensoriales] ([idPaciente] ASC);
          
          PRINT 'Índice IX_EvaluacionesSensoriales_idPaciente creado correctamente.';
      END

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[EvaluacionesSensoriales]') AND name = N'IX_EvaluacionesSensoriales_fechaEvaluacion')
      BEGIN
          CREATE NONCLUSTERED INDEX [IX_EvaluacionesSensoriales_fechaEvaluacion] 
          ON [dbo].[EvaluacionesSensoriales] ([fechaEvaluacion] DESC);
          
          PRINT 'Índice IX_EvaluacionesSensoriales_fechaEvaluacion creado correctamente.';
      END
    `;

    console.log('🔄 Creando índices...');
    await sql.query(indexScript);

    // Verificar estructura de la tabla
    console.log('🔄 Verificando estructura de la tabla...');
    const result = await sql.query(`
      SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT,
          CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'EvaluacionesSensoriales'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('📋 Estructura de la tabla EvaluacionesSensoriales:');
    console.table(result.recordset);

    console.log('✅ Script completado exitosamente');
    console.log('🎉 La tabla EvaluacionesSensoriales está lista para usar');

  } catch (error) {
    console.error('❌ Error al crear la tabla:', error);
  } finally {
    await sql.close();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar el script
crearTablaEvaluaciones();
