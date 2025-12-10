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

// GET - Obtener todos los pacientes con información completa de tutores y representantes
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
        p.idRepresentante,
        p.fechaCreacion,
        p.fechaModificacion,
        CASE 
          WHEN p.tutor = 1 THEN 
            CONCAT(t.nombre, ' ', t.apellido)
          ELSE 'Sin tutor'
        END AS nombreTutor,
        t.correo AS correoTutor,
        t.telefono AS telefonoTutor,
        t.direccion AS direccionTutor,
        CASE 
          WHEN p.idRepresentante IS NOT NULL THEN 
            CONCAT(r.nombre, ' ', r.apellido)
          ELSE 'Sin representante'
        END AS nombreRepresentante,
        r.rut AS rutRepresentante,
        r.correo AS correoRepresentante,
        r.telefono AS telefonoRepresentante,
        r.direccion AS direccionRepresentante,
        r.nacionalidad AS nacionalidadRepresentante,
        pr.relacion AS relacionRepresentante
      FROM paciente p
      LEFT JOIN tutores t ON p.idTutor = t.idTutor
      LEFT JOIN representantes r ON p.idRepresentante = r.idRepresentante
      LEFT JOIN paciente_representante pr ON p.idPaciente = pr.idPaciente AND pr.activo = 1
      ORDER BY p.fechaCreacion DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener pacientes con información completa:', error);
    res.status(500).json({ error: 'Error al obtener la lista de pacientes con información completa' });
  }
});

// GET - Obtener paciente por ID con información completa del representante
router.get('/pacientes/:id/con-representante', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    console.log(`Obteniendo información completa del paciente ${id} con representante...`);
    
    // Obtener información del paciente
    const pacienteResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
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
          p.idRepresentante,
          p.fechaCreacion,
          p.fechaModificacion
        FROM paciente p
        WHERE p.idPaciente = @id
      `);
    
    if (pacienteResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    const paciente = pacienteResult.recordset[0];
    let representante = null;
    
    // Si el paciente tiene representante, obtener su información
    if (paciente.idRepresentante) {
      console.log(`Paciente tiene representante con ID: ${paciente.idRepresentante}`);
      
      const representanteResult = await pool.request()
        .input('idRepresentante', sql.Int, paciente.idRepresentante)
        .input('id', sql.Int, id) // Agregar el parámetro id que faltaba
        .query(`
          SELECT 
            r.idRepresentante,
            r.nombre,
            r.apellido,
            r.rut,
            r.telefono,
            r.correo,
            r.direccion,
            r.nacionalidad,
            pr.relacion
          FROM representantes r
          LEFT JOIN paciente_representante pr ON r.idRepresentante = pr.idRepresentante 
            AND pr.idPaciente = @id AND pr.activo = 1
          WHERE r.idRepresentante = @idRepresentante
        `);
      
      if (representanteResult.recordset.length > 0) {
        representante = representanteResult.recordset[0];
        console.log('✅ Información del representante obtenida correctamente');
      } else {
        console.log('⚠️ No se encontró información del representante en la tabla representantes');
      }
    } else {
      console.log('ℹ️ El paciente no tiene representante asignado');
    }
    
    const resultado = {
      paciente: paciente,
      representante: representante
    };
    
    console.log('✅ Información completa del paciente obtenida:', {
      pacienteId: paciente.idPaciente,
      tieneRepresentante: !!representante,
      representanteId: representante?.idRepresentante
    });
    
    res.json(resultado);
    
  } catch (error) {
    console.error('❌ Error al obtener paciente con representante:', error);
    res.status(500).json({ 
      error: 'Error al obtener la información del paciente con representante',
      details: error.message
    });
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

// DELETE - Eliminar paciente por ID
router.delete('/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    console.log(`🗑️ Iniciando eliminación del paciente con ID: ${id}`);
    
    // Verificar que el paciente existe
    const pacienteCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT idPaciente, nombre, apellidoPaterno, idRepresentante, idTutor FROM paciente WHERE idPaciente = @id');
    
    if (pacienteCheck.recordset.length === 0) {
      console.log(`❌ Paciente con ID ${id} no encontrado`);
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    const paciente = pacienteCheck.recordset[0];
    console.log(`✅ Paciente encontrado: ${paciente.nombre} ${paciente.apellidoPaterno}`);
    
    // Iniciar transacción para eliminación segura
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // 1. Eliminar relaciones en paciente_representante (si las hay)
      if (paciente.idRepresentante) {
        console.log(`🔗 Eliminando relaciones paciente-representante...`);
        await transaction.request()
          .input('idPaciente', sql.Int, id)
          .query('DELETE FROM paciente_representante WHERE idPaciente = @idPaciente');
      }
      
      // 2. Eliminar el paciente (las evaluaciones se eliminarán por CASCADE si existe la FK)
      console.log(`👤 Eliminando el paciente...`);
      const deleteResult = await transaction.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM paciente WHERE idPaciente = @id');
      
      if (deleteResult.rowsAffected[0] === 0) {
        throw new Error('No se pudo eliminar el paciente');
      }
      
      await transaction.commit();
      
      console.log(`✅ Paciente eliminado exitosamente: ${paciente.nombre} ${paciente.apellidoPaterno}`);
      
      res.status(200).json({
        message: 'Paciente eliminado exitosamente',
        pacienteEliminado: {
          id: paciente.idPaciente,
          nombre: `${paciente.nombre} ${paciente.apellidoPaterno}`
        }
      });
      
    } catch (deleteError) {
      await transaction.rollback();
      throw deleteError;
    }
    
  } catch (error) {
    console.error('❌ Error al eliminar paciente:', error);
    
    // Manejo de errores específicos de SQL Server
    if (error.number) {
      switch (error.number) {
        case 547: // Violación de restricción FOREIGN KEY
          return res.status(409).json({ 
            error: 'No se puede eliminar el paciente',
            details: 'El paciente tiene registros relacionados que impiden su eliminación'
          });
        case 208: // Nombre de objeto no válido (tabla no existe)
          return res.status(500).json({ 
            error: 'Error de estructura de base de datos',
            details: 'Una o más tablas requeridas no existen en la base de datos'
          });
        case 2: // Tabla o columna no existe
          return res.status(500).json({ 
            error: 'Error de estructura de base de datos',
            details: 'Problema con la estructura de la base de datos'
          });
        default:
          return res.status(500).json({ 
            error: 'Error de base de datos', 
            details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
            errorNumber: error.number
          });
      }
    }
    
    res.status(500).json({ 
      error: 'Error al eliminar el paciente',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
});

// PUT - Actualizar datos de un paciente
router.put('/pacientes/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, apellidoPaterno, apellidoMaterno, rut, telefono, correo, nacionalidad, direccion } = req.body;
  
  console.log('Actualizando paciente:', { id, datos: req.body });
  
  let transaction;
  
  try {
    const pool = await poolPromise;
    transaction = pool.transaction();
    
    await transaction.begin();
    
    // Actualizar datos del paciente
    const updateQuery = `
      UPDATE paciente 
      SET 
        nombre = @nombre,
        apellidoPaterno = @apellidoPaterno,
        apellidoMaterno = @apellidoMaterno,
        rut = @rut,
        telefono = @telefono,
        correo = @correo,
        nacionalidad = @nacionalidad,
        direccion = @direccion,
        fechaModificacion = GETDATE()
      WHERE id = @id
    `;
    
    const request = transaction.request();
    request.input('id', sql.Int, parseInt(id));
    request.input('nombre', sql.NVarChar(100), nombre);
    request.input('apellidoPaterno', sql.NVarChar(100), apellidoPaterno);
    request.input('apellidoMaterno', sql.NVarChar(100), apellidoMaterno || null);
    request.input('rut', sql.NVarChar(20), rut);
    request.input('telefono', sql.NVarChar(20), telefono || null);
    request.input('correo', sql.NVarChar(100), correo || null);
    request.input('nacionalidad', sql.NVarChar(50), nacionalidad || null);
    request.input('direccion', sql.NVarChar(200), direccion || null);
    
    const result = await request.query(updateQuery);
    
    if (result.rowsAffected[0] === 0) {
      await transaction.rollback();
      return res.status(404).json({ 
        error: 'Paciente no encontrado',
        details: 'No se encontró un paciente con el ID proporcionado'
      });
    }
    
    // Obtener los datos actualizados
    const selectQuery = `
      SELECT 
        id, nombre, apellidoPaterno, apellidoMaterno, rut, 
        telefono, correo, nacionalidad, direccion,
        fechaCreacion, fechaModificacion
      FROM paciente 
      WHERE id = @id
    `;
    
    const selectRequest = transaction.request();
    selectRequest.input('id', sql.Int, parseInt(id));
    
    const selectResult = await selectRequest.query(selectQuery);
    
    await transaction.commit();
    
    console.log('Paciente actualizado exitosamente');
    
    res.json({
      message: 'Paciente actualizado exitosamente',
      paciente: selectResult.recordset[0]
    });
    
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error en rollback:', rollbackError);
      }
    }
    
    // Manejo específico de errores SQL Server
    if (error.number) {
      switch (error.number) {
        case 2627: // Violación de restricción única
          return res.status(400).json({ 
            error: 'RUT duplicado',
            details: 'Ya existe un paciente con este RUT'
          });
        case 515: // Cannot insert null
          return res.status(400).json({ 
            error: 'Datos requeridos faltantes',
            details: 'Faltan campos obligatorios'
          });
        case 8152: // String o binary data would be truncated
          return res.status(400).json({ 
            error: 'Datos demasiado largos',
            details: 'Algún campo excede la longitud máxima permitida'
          });
        case 207: // Invalid column name
        case 208: // Invalid object name
          return res.status(500).json({ 
            error: 'Error de estructura de base de datos',
            details: 'Problema con la estructura de la base de datos'
          });
        default:
          return res.status(500).json({ 
            error: 'Error de base de datos', 
            details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
            errorNumber: error.number
          });
      }
    }
    
    res.status(500).json({ 
      error: 'Error al actualizar el paciente',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
});

module.exports = router;
