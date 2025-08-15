// Rutas para el manejo de evaluaciones sensoriales
// Fecha: 4 de agosto de 2025

const express = require('express');
const router = express.Router();
const sql = require('mssql');

// GET: Obtener todas las evaluaciones
router.get('/evaluaciones', async (req, res) => {
  try {
    console.log('Obteniendo todas las evaluaciones...');
    
    const pool = await sql.connect();
    const result = await pool.request().query(`
      SELECT 
        e.idEvaluacion,
        e.idPaciente,
        e.fechaEvaluacion,
        e.progreso,
        e.respuestas,
        e.evaluadorNombre,
        e.evaluadorCorreo,
        e.observaciones,
        e.fechaCreacion,
        e.fechaActualizacion,
        e.estado,
        p.nombre + ' ' + p.apellidoPaterno + ' ' + ISNULL(p.apellidoMaterno, '') AS nombreCompleto,
        p.rut,
        p.telefono,
        p.correo
      FROM EvaluacionesSensoriales e
      INNER JOIN paciente p ON e.idPaciente = p.idPaciente
      ORDER BY e.fechaCreacion DESC
    `);
    
    console.log(`Se encontraron ${result.recordset.length} evaluaciones`);
    res.json(result.recordset);
    
  } catch (error) {
    console.error('Error al obtener evaluaciones:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
});

// GET: Obtener evaluaciones por paciente
router.get('/evaluaciones/paciente/:idPaciente', async (req, res) => {
  try {
    const { idPaciente } = req.params;
    console.log(`Obteniendo evaluaciones del paciente ${idPaciente}...`);
    
    const pool = await sql.connect();
    const result = await pool.request()
      .input('idPaciente', sql.Int, idPaciente)
      .query(`
        SELECT 
          e.idEvaluacion,
          e.idPaciente,
          e.fechaEvaluacion,
          e.progreso,
          e.respuestas,
          e.evaluadorNombre,
          e.evaluadorCorreo,
          e.observaciones,
          e.fechaCreacion,
          e.fechaActualizacion,
          e.estado,
          p.nombre + ' ' + p.apellidoPaterno + ' ' + ISNULL(p.apellidoMaterno, '') AS nombreCompleto,
          p.rut
        FROM EvaluacionesSensoriales e
        INNER JOIN paciente p ON e.idPaciente = p.idPaciente
        WHERE e.idPaciente = @idPaciente
        ORDER BY e.fechaCreacion DESC
      `);
    
    console.log(`Se encontraron ${result.recordset.length} evaluaciones para el paciente ${idPaciente}`);
    res.json(result.recordset);
    
  } catch (error) {
    console.error('Error al obtener evaluaciones del paciente:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
});

// GET: Obtener una evaluación específica
router.get('/evaluaciones/:idEvaluacion', async (req, res) => {
  try {
    const { idEvaluacion } = req.params;
    console.log(`Obteniendo evaluación ${idEvaluacion}...`);
    
    const pool = await sql.connect();
    const result = await pool.request()
      .input('idEvaluacion', sql.Int, idEvaluacion)
      .query(`
        SELECT 
          e.idEvaluacion,
          e.idPaciente,
          e.fechaEvaluacion,
          e.progreso,
          e.respuestas,
          e.evaluadorNombre,
          e.evaluadorCorreo,
          e.observaciones,
          e.fechaCreacion,
          e.fechaActualizacion,
          e.estado,
          p.nombre + ' ' + p.apellidoPaterno + ' ' + ISNULL(p.apellidoMaterno, '') AS nombreCompleto,
          p.rut,
          p.telefono,
          p.correo
        FROM EvaluacionesSensoriales e
        INNER JOIN paciente p ON e.idPaciente = p.idPaciente
        WHERE e.idEvaluacion = @idEvaluacion
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Evaluación no encontrada' });
    }
    
    console.log(`Evaluación ${idEvaluacion} encontrada`);
    res.json(result.recordset[0]);
    
  } catch (error) {
    console.error('Error al obtener evaluación:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
});

// POST: Crear nueva evaluación
router.post('/evaluaciones', async (req, res) => {
  try {
    const { 
      idPaciente, 
      progreso, 
      respuestas, 
      evaluadorNombre, 
      evaluadorCorreo, 
      observaciones,
      estado = 'En Progreso'
    } = req.body;

    console.log('Creando nueva evaluación...', { idPaciente, progreso, estado });

    // Validar datos requeridos
    if (!idPaciente || !respuestas) {
      return res.status(400).json({ 
        error: 'Datos requeridos faltantes', 
        details: 'idPaciente y respuestas son obligatorios' 
      });
    }

    // Verificar que el paciente existe
    const pool = await sql.connect();
    const pacienteResult = await pool.request()
      .input('idPaciente', sql.Int, idPaciente)
      .query('SELECT idPaciente FROM paciente WHERE idPaciente = @idPaciente');

    if (pacienteResult.recordset.length === 0) {
      return res.status(404).json({ error: 'El paciente especificado no existe' });
    }

    // Insertar la nueva evaluación
    const result = await pool.request()
      .input('idPaciente', sql.Int, idPaciente)
      .input('progreso', sql.Decimal(5, 2), progreso || 0)
      .input('respuestas', sql.NVarChar(sql.MAX), JSON.stringify(respuestas))
      .input('evaluadorNombre', sql.NVarChar(100), evaluadorNombre)
      .input('evaluadorCorreo', sql.NVarChar(100), evaluadorCorreo)
      .input('observaciones', sql.NVarChar(500), observaciones)
      .input('estado', sql.NVarChar(20), estado)
      .query(`
        INSERT INTO EvaluacionesSensoriales 
        (idPaciente, progreso, respuestas, evaluadorNombre, evaluadorCorreo, observaciones, estado, fechaEvaluacion)
        VALUES (@idPaciente, @progreso, @respuestas, @evaluadorNombre, @evaluadorCorreo, @observaciones, @estado, GETDATE());
        
        SELECT SCOPE_IDENTITY() AS idEvaluacion;
      `);

    const idEvaluacion = result.recordset[0].idEvaluacion;
    console.log(`Evaluación creada con ID: ${idEvaluacion}`);

    // Obtener la evaluación completa para devolver
    const evaluacionCompleta = await pool.request()
      .input('idEvaluacion', sql.Int, idEvaluacion)
      .query(`
        SELECT 
          e.idEvaluacion,
          e.idPaciente,
          e.fechaEvaluacion,
          e.progreso,
          e.respuestas,
          e.evaluadorNombre,
          e.evaluadorCorreo,
          e.observaciones,
          e.fechaCreacion,
          e.estado,
          p.nombre + ' ' + p.apellidoPaterno + ' ' + ISNULL(p.apellidoMaterno, '') AS nombreCompleto,
          p.rut
        FROM EvaluacionesSensoriales e
        INNER JOIN Pacientes p ON e.idPaciente = p.idPaciente
        WHERE e.idEvaluacion = @idEvaluacion
      `);

    res.status(201).json({
      message: 'Evaluación creada exitosamente',
      evaluacion: evaluacionCompleta.recordset[0]
    });

  } catch (error) {
    console.error('Error al crear evaluación:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
});

// PUT: Actualizar evaluación existente
router.put('/evaluaciones/:idEvaluacion', async (req, res) => {
  try {
    const { idEvaluacion } = req.params;
    const { 
      progreso, 
      respuestas, 
      evaluadorNombre, 
      evaluadorCorreo, 
      observaciones,
      estado
    } = req.body;

    console.log(`Actualizando evaluación ${idEvaluacion}...`);

    const pool = await sql.connect();
    
    // Verificar que la evaluación existe
    const evaluacionResult = await pool.request()
      .input('idEvaluacion', sql.Int, idEvaluacion)
      .query('SELECT idEvaluacion FROM EvaluacionesSensoriales WHERE idEvaluacion = @idEvaluacion');

    if (evaluacionResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Evaluación no encontrada' });
    }

    // Actualizar la evaluación
    await pool.request()
      .input('idEvaluacion', sql.Int, idEvaluacion)
      .input('progreso', sql.Decimal(5, 2), progreso)
      .input('respuestas', sql.NVarChar(sql.MAX), JSON.stringify(respuestas))
      .input('evaluadorNombre', sql.NVarChar(100), evaluadorNombre)
      .input('evaluadorCorreo', sql.NVarChar(100), evaluadorCorreo)
      .input('observaciones', sql.NVarChar(500), observaciones)
      .input('estado', sql.NVarChar(20), estado)
      .query(`
        UPDATE EvaluacionesSensoriales 
        SET 
          progreso = @progreso,
          respuestas = @respuestas,
          evaluadorNombre = @evaluadorNombre,
          evaluadorCorreo = @evaluadorCorreo,
          observaciones = @observaciones,
          estado = @estado,
          fechaActualizacion = GETDATE()
        WHERE idEvaluacion = @idEvaluacion
      `);

    // Obtener la evaluación actualizada
    const evaluacionActualizada = await pool.request()
      .input('idEvaluacion', sql.Int, idEvaluacion)
      .query(`
        SELECT 
          e.idEvaluacion,
          e.idPaciente,
          e.fechaEvaluacion,
          e.progreso,
          e.respuestas,
          e.evaluadorNombre,
          e.evaluadorCorreo,
          e.observaciones,
          e.fechaCreacion,
          e.fechaActualizacion,
          e.estado,
          p.nombre + ' ' + p.apellidoPaterno + ' ' + ISNULL(p.apellidoMaterno, '') AS nombreCompleto,
          p.rut
        FROM EvaluacionesSensoriales e
        INNER JOIN Pacientes p ON e.idPaciente = p.idPaciente
        WHERE e.idEvaluacion = @idEvaluacion
      `);

    console.log(`Evaluación ${idEvaluacion} actualizada exitosamente`);
    res.json({
      message: 'Evaluación actualizada exitosamente',
      evaluacion: evaluacionActualizada.recordset[0]
    });

  } catch (error) {
    console.error('Error al actualizar evaluación:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
});

// DELETE: Eliminar evaluación
router.delete('/evaluaciones/:idEvaluacion', async (req, res) => {
  try {
    const { idEvaluacion } = req.params;
    console.log(`Eliminando evaluación ${idEvaluacion}...`);

    const pool = await sql.connect();
    
    // Verificar que la evaluación existe
    const evaluacionResult = await pool.request()
      .input('idEvaluacion', sql.Int, idEvaluacion)
      .query('SELECT idEvaluacion FROM EvaluacionesSensoriales WHERE idEvaluacion = @idEvaluacion');

    if (evaluacionResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Evaluación no encontrada' });
    }

    // Eliminar la evaluación
    await pool.request()
      .input('idEvaluacion', sql.Int, idEvaluacion)
      .query('DELETE FROM EvaluacionesSensoriales WHERE idEvaluacion = @idEvaluacion');

    console.log(`Evaluación ${idEvaluacion} eliminada exitosamente`);
    res.json({ message: 'Evaluación eliminada exitosamente' });

  } catch (error) {
    console.error('Error al eliminar evaluación:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
});

// GET: Obtener estadísticas de evaluaciones
router.get('/evaluaciones-stats', async (req, res) => {
  try {
    console.log('Obteniendo estadísticas de evaluaciones...');
    
    const pool = await sql.connect();
    const result = await pool.request().query(`
      SELECT 
        COUNT(*) as totalEvaluaciones,
        COUNT(DISTINCT idPaciente) as pacientesConEvaluaciones,
        AVG(progreso) as progresoPromedio,
        COUNT(CASE WHEN estado = 'Completada' THEN 1 END) as evaluacionesCompletadas,
        COUNT(CASE WHEN estado = 'En Progreso' THEN 1 END) as evaluacionesEnProgreso
      FROM EvaluacionesSensoriales
    `);
    
    console.log('Estadísticas obtenidas exitosamente');
    res.json(result.recordset[0]);
    
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
});

module.exports = router;
