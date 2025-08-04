const express = require('express');
const { sql, poolPromise } = require('../db');
const router = express.Router();

// POST - Expirar relación repartición-comuna
router.post('/reparticion-comuna/expirar', async (req, res) => {
  try {
    const { idReparticion, idComuna } = req.body;
    const pool = await poolPromise;

    // Actualiza fechaExpiracion a fecha actual
    await pool.request()
      .input('idReparticion', sql.Int, idReparticion)
      .input('idComuna', sql.Int, idComuna)
      .input('fechaExpiracion', sql.DateTime, new Date())
      .query(`
        UPDATE ReparticionComuna
        SET fechaExpiracion = @fechaExpiracion
        WHERE idReparticion = @idReparticion AND idComuna = @idComuna
      `);

    res.status(200).json({ message: 'Relación expirada correctamente' });
  } catch (error) {
    console.error('Error al expirar relación:', error);
    res.status(500).json({ error: 'Error al expirar relación' });
  }
});

// Método alternativo comentado usando procedimiento almacenado
// router.post('/reparticion-comuna/expirar-pa', async (req, res) => {
//   try {
//     const { idReparticion, idComuna } = req.body;
//     const pool = await poolPromise;

//     // Llamada al procedimiento almacenado
//     await pool.request()
//       .input('idReparticion', sql.Int, idReparticion)
//       .input('idComuna', sql.Int, idComuna)
//       .execute('ExpirarRelacionReparticionComuna');

//     res.status(200).json({ message: 'Relación expirada correctamente usando PA' });
//   } catch (error) {
//     console.error('Error al expirar relación con PA:', error);
//     res.status(500).json({ error: 'Error al expirar relación' });
//   }
// });

// ==================== RUTAS PARA ACTUALIZAR PACIENTES Y TUTORES ====================

// PUT - Actualizar información de paciente
router.put('/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      telefono,
      correo,
      direccion,
      nacionalidad
    } = req.body;

    const pool = await poolPromise;

    // Verificar que el paciente existe
    const existePaciente = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT COUNT(*) as existe FROM paciente WHERE idPaciente = @id');

    if (existePaciente.recordset[0].existe === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Actualizar paciente
    await pool.request()
      .input('id', sql.Int, id)
      .input('nombre', sql.NVarChar(100), nombre)
      .input('apellidoPaterno', sql.NVarChar(100), apellidoPaterno)
      .input('apellidoMaterno', sql.NVarChar(100), apellidoMaterno || null)
      .input('telefono', sql.NVarChar(20), telefono || null)
      .input('correo', sql.NVarChar(150), correo || null)
      .input('direccion', sql.NVarChar(255), direccion || null)
      .input('nacionalidad', sql.NVarChar(50), nacionalidad || 'Chilena')
      .query(`
        UPDATE paciente 
        SET nombre = @nombre,
            apellidoPaterno = @apellidoPaterno,
            apellidoMaterno = @apellidoMaterno,
            telefono = @telefono,
            correo = @correo,
            direccion = @direccion,
            nacionalidad = @nacionalidad,
            fechaModificacion = GETDATE()
        WHERE idPaciente = @id
      `);

    res.status(200).json({ message: 'Información del paciente actualizada correctamente' });

  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    res.status(500).json({ error: 'Error al actualizar la información del paciente' });
  }
});

// PUT - Actualizar información de tutor
router.put('/tutores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      apellido,
      direccion,
      correo,
      telefono
    } = req.body;

    const pool = await poolPromise;

    // Verificar que el tutor existe
    const existeTutor = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT COUNT(*) as existe FROM tutores WHERE idTutor = @id');

    if (existeTutor.recordset[0].existe === 0) {
      return res.status(404).json({ error: 'Tutor no encontrado' });
    }

    // Actualizar tutor
    await pool.request()
      .input('id', sql.Int, id)
      .input('nombre', sql.NVarChar(100), nombre)
      .input('apellido', sql.NVarChar(100), apellido)
      .input('direccion', sql.NVarChar(255), direccion || null)
      .input('correo', sql.NVarChar(150), correo || null)
      .input('telefono', sql.NVarChar(20), telefono || null)
      .query(`
        UPDATE tutores 
        SET nombre = @nombre,
            apellido = @apellido,
            direccion = @direccion,
            correo = @correo,
            telefono = @telefono,
            fechaModificacion = GETDATE()
        WHERE idTutor = @id
      `);

    res.status(200).json({ message: 'Información del tutor actualizada correctamente' });

  } catch (error) {
    console.error('Error al actualizar tutor:', error);
    res.status(500).json({ error: 'Error al actualizar la información del tutor' });
  }
});

// POST - Remover tutor de paciente (convertir a paciente adulto)
router.post('/pacientes/:id/remover-tutor', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    // Verificar que el paciente existe y tiene tutor
    const pacienteCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT tutor FROM paciente WHERE idPaciente = @id');

    if (pacienteCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    if (pacienteCheck.recordset[0].tutor === 0) {
      return res.status(409).json({ error: 'El paciente no tiene tutor asignado' });
    }

    // Remover tutor del paciente
    await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE paciente 
        SET tutor = 0, idTutor = NULL, fechaModificacion = GETDATE()
        WHERE idPaciente = @id
      `);

    res.status(200).json({ message: 'Tutor removido correctamente. El paciente ahora es considerado adulto.' });

  } catch (error) {
    console.error('Error al remover tutor:', error);
    res.status(500).json({ error: 'Error al remover el tutor' });
  }
});

// DELETE - Eliminar paciente (solo si no tiene relaciones críticas)
router.delete('/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    // Verificar que el paciente existe
    const existePaciente = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT COUNT(*) as existe FROM paciente WHERE idPaciente = @id');

    if (existePaciente.recordset[0].existe === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Eliminar paciente
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM paciente WHERE idPaciente = @id');

    res.status(200).json({ message: 'Paciente eliminado correctamente' });

  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    res.status(500).json({ error: 'Error al eliminar el paciente' });
  }
});

// DELETE - Eliminar tutor (solo si no tiene pacientes asociados)
router.delete('/tutores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    // Verificar que el tutor existe
    const existeTutor = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT COUNT(*) as existe FROM tutores WHERE idTutor = @id');

    if (existeTutor.recordset[0].existe === 0) {
      return res.status(404).json({ error: 'Tutor no encontrado' });
    }

    // Verificar que no tiene pacientes asociados
    const tienePacientes = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT COUNT(*) as cantidad FROM paciente WHERE idTutor = @id');

    if (tienePacientes.recordset[0].cantidad > 0) {
      return res.status(409).json({ 
        error: 'No se puede eliminar el tutor porque tiene pacientes asociados. Primero debe reasignar o remover la relación con los pacientes.' 
      });
    }

    // Eliminar tutor
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM tutores WHERE idTutor = @id');

    res.status(200).json({ message: 'Tutor eliminado correctamente' });

  } catch (error) {
    console.error('Error al eliminar tutor:', error);
    res.status(500).json({ error: 'Error al eliminar el tutor' });
  }
});

module.exports = router;
