const express = require('express');
const { sql, poolPromise } = require('../db');
const router = express.Router();

// GET - Obtener relaciones repartición-comuna
router.get('/reparticion-comuna', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT rc.idReparticion, r.Nombre AS NombreReparticion,
             rc.idComuna, c.Nombre AS NombreComuna,
             rc.fechaExpiracion
      FROM ReparticionComuna rc
      INNER JOIN CMReparticion r ON rc.idReparticion = r.idReparticion
      INNER JOIN CMComuna c ON rc.idComuna = c.idComuna
      WHERE rc.fechaExpiracion IS NULL
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las relaciones' });
  }
});

// GET - Obtener todas las reparticiones
router.get('/reparticion', async (req, res) => {
  try {
    const pool = await poolPromise;

    if (!pool) {
      throw new Error("Conexión con la base de datos no disponible.");
    }

    const result = await pool.request().query("SELECT * FROM CMReparticion");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error completo de conexión:", err);
    res.status(500).json({ error: "Error al acceder a la base de datos." });
  }
});

// GET - Obtener todas las comunas
router.get('/comunas', async (req, res) => {
  try {
    const pool = await poolPromise;

    if (!pool) {
      throw new Error("Conexión con la base de datos no disponible.");
    }

    const result = await pool
      .request()
      .query("select * from NuevoCCMM.dbo.CMComuna");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error completo de conexión:", err);
    res.status(500).json({ error: "Error al acceder a la base de datos." });
  }
});

// GET - Obtener todos los sectores
router.get('/sector', async (req, res) => {
  try {
    const pool = await poolPromise;

    if (!pool) {
      throw new Error("Conexión con la base de datos no disponible.");
    }

    const result = await pool
      .request()
      .query("select * from NuevoCCMM.dbo.CMSector");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error completo de conexión:", err);
    res.status(500).json({ error: "Error al acceder a la base de datos." });
  }
});

// ==================== RUTAS PARA PACIENTES Y TUTORES ====================

// GET - Crear tablas automáticamente
router.get('/pacientes/setup', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    console.log('Creando tablas automáticamente...');
    
    // Crear tabla tutores
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tutores')
      BEGIN
        CREATE TABLE tutores (
          idTutor INT IDENTITY(1,1) PRIMARY KEY,
          nombre NVARCHAR(100) NOT NULL,
          apellido NVARCHAR(100) NOT NULL,
          direccion NVARCHAR(255),
          correo NVARCHAR(150),
          telefono NVARCHAR(20),
          fechaCreacion DATETIME DEFAULT GETDATE(),
          fechaModificacion DATETIME DEFAULT GETDATE()
        );
        PRINT 'Tabla tutores creada';
      END
      ELSE
      BEGIN
        PRINT 'Tabla tutores ya existe';
      END
    `);
    
    // Crear tabla paciente
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'paciente')
      BEGIN
        CREATE TABLE paciente (
          idPaciente INT IDENTITY(1,1) PRIMARY KEY,
          nombre NVARCHAR(100) NOT NULL,
          apellidoPaterno NVARCHAR(100) NOT NULL,
          apellidoMaterno NVARCHAR(100),
          rut NVARCHAR(12) UNIQUE NOT NULL,
          telefono NVARCHAR(20),
          correo NVARCHAR(150),
          direccion NVARCHAR(255),
          nacionalidad NVARCHAR(50) DEFAULT 'Chilena',
          tutor BIT DEFAULT 0,
          idTutor INT NULL,
          fechaCreacion DATETIME DEFAULT GETDATE(),
          fechaModificacion DATETIME DEFAULT GETDATE(),
          CONSTRAINT FK_Paciente_Tutor FOREIGN KEY (idTutor) REFERENCES tutores(idTutor)
        );
        PRINT 'Tabla paciente creada';
      END
      ELSE
      BEGIN
        PRINT 'Tabla paciente ya existe';
      END
    `);
    
    console.log('✅ Setup completado');
    res.status(200).json({ 
      message: 'Setup completado. Tablas creadas o verificadas correctamente.',
      status: 'success'
    });
    
  } catch (error) {
    console.error('❌ Error en setup:', error);
    res.status(500).json({ 
      error: 'Error al crear las tablas',
      details: error.message
    });
  }
});

// GET - Verificar si las tablas existen
router.get('/pacientes/verificar-tablas', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Verificar si existe la tabla paciente
    const verificarPaciente = await pool.request().query(`
      SELECT COUNT(*) as existe 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'paciente'
    `);
    
    // Verificar si existe la tabla tutores
    const verificarTutores = await pool.request().query(`
      SELECT COUNT(*) as existe 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'tutores'
    `);
    
    res.json({
      tablaPaciente: verificarPaciente.recordset[0].existe > 0,
      tablaTutores: verificarTutores.recordset[0].existe > 0,
      message: 'Verificación de tablas completada'
    });
  } catch (error) {
    console.error('Error al verificar tablas:', error);
    res.status(500).json({ error: 'Error al verificar las tablas' });
  }
});

// GET - Obtener todos los pacientes con todos los campos de la tabla
router.get('/pacientes', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT TOP (1000)
        p.idPaciente,
        p.nombre,
        p.apellidoPaterno,
        p.apellidoMaterno,
        p.rut,
        p.telefono,
        p.correo,
        p.direccion,
        p.nacionalidad,
        p.tutor,
        p.idTutor,
        p.fechaCreacion,
        p.fechaModificacion
      FROM paciente p
      ORDER BY p.fechaCreacion DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({ error: 'Error al obtener la lista de pacientes' });
  }
});

// GET - Obtener todos los pacientes con información completa de tutores
router.get('/pacientes/con-info-tutor', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        p.idPaciente,
        p.nombre,
        p.apellidoPaterno,
        p.apellidoMaterno,
        p.rut,
        p.telefono,
        p.correo,
        p.direccion,
        p.nacionalidad,
        p.tutor,
        p.idTutor,
        p.fechaCreacion,
        p.fechaModificacion,
        CASE 
          WHEN p.tutor = 1 THEN 
            CONCAT(t.nombre, ' ', t.apellido)
          ELSE 'Sin tutor'
        END AS nombreTutor,
        t.correo AS correoTutor,
        t.telefono AS telefonoTutor,
        t.direccion AS direccionTutor
      FROM paciente p
      LEFT JOIN tutores t ON p.idTutor = t.idTutor
      ORDER BY p.fechaCreacion DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener pacientes con información de tutor:', error);
    res.status(500).json({ error: 'Error al obtener la lista de pacientes con información de tutor' });
  }
});

// GET - Obtener paciente por ID
router.get('/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          p.*,
          CASE 
            WHEN p.tutor = 1 THEN 
              CONCAT(t.nombre, ' ', t.apellido)
            ELSE NULL
          END AS nombreTutor,
          t.correo AS correoTutor,
          t.telefono AS telefonoTutor,
          t.direccion AS direccionTutor
        FROM paciente p
        LEFT JOIN tutores t ON p.idTutor = t.idTutor
        WHERE p.idPaciente = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    res.status(500).json({ error: 'Error al obtener el paciente' });
  }
});

// GET - Buscar paciente por RUT
router.get('/pacientes/rut/:rut', async (req, res) => {
  try {
    const { rut } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('rut', sql.NVarChar(12), rut)
      .query(`
        SELECT 
          p.*,
          CASE 
            WHEN p.tutor = 1 THEN 
              CONCAT(t.nombre, ' ', t.apellido)
            ELSE NULL
          END AS nombreTutor,
          t.correo AS correoTutor,
          t.telefono AS telefonoTutor
        FROM paciente p
        LEFT JOIN tutores t ON p.idTutor = t.idTutor
        WHERE p.rut = @rut
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error al buscar paciente por RUT:', error);
    res.status(500).json({ error: 'Error al buscar el paciente' });
  }
});

// GET - Obtener pacientes menores con tutor
router.get('/pacientes/con-tutor', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        p.idPaciente,
        CONCAT(p.nombre, ' ', p.apellidoPaterno, ' ', p.apellidoMaterno) AS nombreCompleto,
        p.rut,
        CONCAT(t.nombre, ' ', t.apellido) AS nombreTutor,
        t.correo AS correoTutor,
        t.telefono AS telefonoTutor
      FROM paciente p
      INNER JOIN tutores t ON p.idTutor = t.idTutor
      WHERE p.tutor = 1
      ORDER BY p.nombre
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener pacientes con tutor:', error);
    res.status(500).json({ error: 'Error al obtener pacientes con tutor' });
  }
});

// GET - Obtener pacientes adultos (sin tutor)
router.get('/pacientes/sin-tutor', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        idPaciente,
        CONCAT(nombre, ' ', apellidoPaterno, ' ', apellidoMaterno) AS nombreCompleto,
        rut,
        telefono,
        correo,
        direccion,
        nacionalidad,
        fechaCreacion
      FROM paciente
      WHERE tutor = 0
      ORDER BY nombre
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener pacientes sin tutor:', error);
    res.status(500).json({ error: 'Error al obtener pacientes sin tutor' });
  }
});

// GET - Obtener todos los tutores
router.get('/tutores', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        t.idTutor,
        CONCAT(t.nombre, ' ', t.apellido) AS nombreCompleto,
        t.correo,
        t.telefono,
        t.direccion,
        COUNT(p.idPaciente) AS cantidadPacientes
      FROM tutores t
      LEFT JOIN paciente p ON t.idTutor = p.idTutor
      GROUP BY t.idTutor, t.nombre, t.apellido, t.correo, t.telefono, t.direccion
      ORDER BY t.nombre
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener tutores:', error);
    res.status(500).json({ error: 'Error al obtener la lista de tutores' });
  }
});

// GET - Obtener tutor por ID con sus pacientes
router.get('/tutores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Obtener información del tutor
    const tutorResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT * FROM tutores WHERE idTutor = @id`);
    
    if (tutorResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Tutor no encontrado' });
    }
    
    // Obtener pacientes del tutor
    const pacientesResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          idPaciente,
          CONCAT(nombre, ' ', apellidoPaterno, ' ', apellidoMaterno) AS nombreCompleto,
          rut,
          telefono,
          correo
        FROM paciente 
        WHERE idTutor = @id
      `);
    
    const tutor = tutorResult.recordset[0];
    tutor.pacientes = pacientesResult.recordset;
    
    res.json(tutor);
  } catch (error) {
    console.error('Error al obtener tutor:', error);
    res.status(500).json({ error: 'Error al obtener el tutor' });
  }
});

// GET - Estadísticas de pacientes
router.get('/pacientes/estadisticas/resumen', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        COUNT(*) AS totalPacientes,
        COUNT(CASE WHEN tutor = 1 THEN 1 END) AS pacientesConTutor,
        COUNT(CASE WHEN tutor = 0 THEN 1 END) AS pacientesSinTutor,
        COUNT(DISTINCT idTutor) AS totalTutores
      FROM paciente
    `);
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;
