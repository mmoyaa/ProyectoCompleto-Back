const express = require('express');
const { sql, poolPromise } = require('../db');
const router = express.Router();

// Endpoint temporal para crear las tablas de representantes
router.post('/crear-tablas-representantes', async (req, res) => {
  try {
    console.log('🔄 Iniciando creación de tablas de representantes...');
    const pool = await poolPromise;

    // Crear tabla representantes
    console.log('📋 Creando tabla representantes...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='representantes' AND xtype='U')
      BEGIN
        CREATE TABLE representantes (
          idRepresentante INT IDENTITY(1,1) PRIMARY KEY,
          nombre NVARCHAR(100) NOT NULL,
          apellido NVARCHAR(100) NOT NULL,
          rut NVARCHAR(12) NOT NULL UNIQUE,
          telefono NVARCHAR(20),
          correo NVARCHAR(150),
          direccion NVARCHAR(255),
          nacionalidad NVARCHAR(50) DEFAULT 'Chilena',
          fechaCreacion DATETIME DEFAULT GETDATE(),
          fechaModificacion DATETIME DEFAULT GETDATE()
        )
      END
    `);

    console.log('✅ Tabla representantes creada/verificada');

    // Crear tabla paciente_representante
    console.log('📋 Creando tabla paciente_representante...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='paciente_representante' AND xtype='U')
      BEGIN
        CREATE TABLE paciente_representante (
          idRelacion INT IDENTITY(1,1) PRIMARY KEY,
          idPaciente INT NOT NULL,
          idRepresentante INT NOT NULL,
          relacion NVARCHAR(50) NOT NULL,
          fechaAsignacion DATETIME DEFAULT GETDATE(),
          fechaExpiracion DATETIME NULL,
          activo BIT DEFAULT 1,
          FOREIGN KEY (idPaciente) REFERENCES paciente(idPaciente),
          FOREIGN KEY (idRepresentante) REFERENCES representantes(idRepresentante)
        )
      END
    `);

    console.log('✅ Tabla paciente_representante creada/verificada');

    // Agregar columna idRepresentante a tabla paciente si no existe
    console.log('📋 Verificando columna idRepresentante en tabla paciente...');
    const columnaExiste = await pool.request().query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'paciente' AND COLUMN_NAME = 'idRepresentante'
    `);

    if (columnaExiste.recordset[0].count === 0) {
      console.log('📋 Agregando columna idRepresentante a tabla paciente...');
      await pool.request().query(`
        ALTER TABLE paciente 
        ADD idRepresentante INT NULL
      `);
      console.log('✅ Columna idRepresentante agregada');
    } else {
      console.log('✅ Columna idRepresentante ya existe');
    }

    // Verificar las tablas creadas
    const verificacion = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME IN ('representantes', 'paciente_representante')
      ORDER BY TABLE_NAME
    `);

    console.log('📋 Tablas verificadas:');
    verificacion.recordset.forEach(tabla => {
      console.log(`✅ ${tabla.TABLE_NAME}`);
    });

    res.status(200).json({
      success: true,
      message: 'Tablas de representantes creadas exitosamente',
      tablas: verificacion.recordset.map(t => t.TABLE_NAME)
    });

  } catch (error) {
    console.error('❌ Error al crear tablas:', error);
    res.status(500).json({
      error: 'Error al crear las tablas de representantes',
      details: error.message
    });
  }
});

// Endpoint para verificar estructura de la base de datos
router.get('/verificar-estructura', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Verificar todas las tablas
    const tablas = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    // Verificar columnas de la tabla paciente
    const columnasPaciente = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'paciente'
      ORDER BY ORDINAL_POSITION
    `);

    res.status(200).json({
      success: true,
      tablas: tablas.recordset.map(t => t.TABLE_NAME),
      columnasPaciente: columnasPaciente.recordset,
      tieneRepresentantes: tablas.recordset.some(t => t.TABLE_NAME === 'representantes'),
      tienePacienteRepresentante: tablas.recordset.some(t => t.TABLE_NAME === 'paciente_representante'),
      tieneIdRepresentante: columnasPaciente.recordset.some(c => c.COLUMN_NAME === 'idRepresentante')
    });

  } catch (error) {
    console.error('❌ Error al verificar estructura:', error);
    res.status(500).json({
      error: 'Error al verificar la estructura de la base de datos',
      details: error.message
    });
  }
});

module.exports = router;
