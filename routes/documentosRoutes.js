const express = require('express');
const { sql, poolPromise } = require('../db');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// ==================== CONFIGURACIÓN DE MULTER ====================
const storage = multer.memoryStorage(); // Almacenar en memoria para convertir a base64
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Validar tipos de archivo permitidos
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  }
});

// ==================== RUTAS PARA TIPOS DE DOCUMENTO ====================

// GET - Obtener todos los tipos de documento
router.get('/tipos-documento', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT idTipo, nombre, descripcion, activo
      FROM TPTipoDatos
      WHERE activo = 1
      ORDER BY nombre
    `);
    
    console.log('✅ Tipos de documento obtenidos:', result.recordset.length);
    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error al obtener tipos de documento:', error);
    res.status(500).json({ 
      error: 'Error al obtener tipos de documento',
      details: error.message 
    });
  }
});

// POST - Crear nuevo tipo de documento
router.post('/tipos-documento', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('nombre', sql.VarChar(50), nombre)
      .input('descripcion', sql.VarChar(200), descripcion)
      .query(`
        INSERT INTO TPTipoDatos (nombre, descripcion)
        OUTPUT INSERTED.idTipo, INSERTED.nombre, INSERTED.descripcion
        VALUES (@nombre, @descripcion)
      `);
    
    console.log('✅ Tipo de documento creado:', result.recordset[0]);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error('❌ Error al crear tipo de documento:', error);
    res.status(500).json({ 
      error: 'Error al crear tipo de documento',
      details: error.message 
    });
  }
});

// ==================== RUTAS PARA FORMATOS DE DOCUMENTO ====================

// GET - Obtener todos los formatos de documento
router.get('/formatos-documento', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT idFormato, nombre, extension, mimeType, activo
      FROM TPFormato
      WHERE activo = 1
      ORDER BY extension
    `);
    
    console.log('✅ Formatos obtenidos:', result.recordset.length);
    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error al obtener formatos:', error);
    res.status(500).json({ 
      error: 'Error al obtener formatos de documento',
      details: error.message 
    });
  }
});

// POST - Crear nuevo formato de documento
router.post('/formatos-documento', async (req, res) => {
  try {
    const { nombre, extension, mimeType } = req.body;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('nombre', sql.VarChar(20), nombre)
      .input('extension', sql.VarChar(10), extension)
      .input('mimeType', sql.VarChar(100), mimeType)
      .query(`
        INSERT INTO TPFormato (nombre, extension, mimeType)
        OUTPUT INSERTED.*
        VALUES (@nombre, @extension, @mimeType)
      `);
    
    console.log('✅ Formato creado:', result.recordset[0]);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error('❌ Error al crear formato:', error);
    res.status(500).json({ 
      error: 'Error al crear formato de documento',
      details: error.message 
    });
  }
});

// ==================== RUTAS PARA DOCUMENTOS ====================

// GET - Obtener todos los documentos
router.get('/documentos', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        d.idDocumento,
        d.nombreArchivo,
        d.nombreOriginal,
        d.rutaArchivo,
        d.idTipo,
        d.idFormato,
        d.tamano,
        d.descripcion,
        d.usuarioCreacion,
        d.fechaCreacion,
        d.fechaActualizacion,
        d.activo,
        t.nombre as tipoDocumento,
        f.extension as formatoExtension,
        f.nombre as formatoNombre
      FROM DocumentosCCMM d
      INNER JOIN TPTipoDatos t ON d.idTipo = t.idTipo
      INNER JOIN TPFormato f ON d.idFormato = f.idFormato
      WHERE d.activo = 1
      ORDER BY d.fechaCreacion DESC
    `);
    
    console.log('✅ Documentos obtenidos:', result.recordset.length);
    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error al obtener documentos:', error);
    res.status(500).json({ 
      error: 'Error al obtener documentos',
      details: error.message 
    });
  }
});

// GET - Obtener documento por ID
router.get('/documentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          d.*,
          t.nombre as tipoDocumento,
          f.extension as formatoExtension,
          f.mimeType
        FROM DocumentosCCMM d
        INNER JOIN TPTipoDatos t ON d.idTipo = t.idTipo
        INNER JOIN TPFormato f ON d.idFormato = f.idFormato
        WHERE d.idDocumento = @id AND d.activo = 1
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('❌ Error al obtener documento:', error);
    res.status(500).json({ 
      error: 'Error al obtener el documento',
      details: error.message 
    });
  }
});

// POST - Subir nuevo documento
router.post('/documentos', upload.single('archivo'), async (req, res) => {
  try {
    const { nombreArchivo, idTipo, idFormato, descripcion } = req.body;
    const archivo = req.file;
    
    if (!archivo) {
      return res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
    }
    
    // Convertir archivo a base64
    const archivoBase64 = archivo.buffer.toString('base64');
    
    const pool = await poolPromise;
    const result = await pool.request()
      .input('nombreArchivo', sql.VarChar(255), nombreArchivo)
      .input('nombreOriginal', sql.VarChar(255), archivo.originalname)
      .input('archivo', sql.NVarChar(sql.MAX), archivoBase64)
      .input('idTipo', sql.Int, parseInt(idTipo))
      .input('idFormato', sql.Int, parseInt(idFormato))
      .input('tamano', sql.BigInt, archivo.size)
      .input('descripcion', sql.NVarChar(sql.MAX), descripcion || null)
      .input('usuarioCreacion', sql.VarChar(100), 'sistema') // TODO: obtener de sesión
      .query(`
        INSERT INTO DocumentosCCMM 
        (nombreArchivo, nombreOriginal, archivo, idTipo, idFormato, tamano, descripcion, usuarioCreacion)
        OUTPUT INSERTED.idDocumento, INSERTED.nombreArchivo, INSERTED.fechaCreacion
        VALUES (@nombreArchivo, @nombreOriginal, @archivo, @idTipo, @idFormato, @tamano, @descripcion, @usuarioCreacion)
      `);
    
    const documento = result.recordset[0];
    console.log('✅ Documento subido:', documento);
    
    res.status(201).json({
      message: 'Documento subido correctamente',
      idDocumento: documento.idDocumento,
      nombreArchivo: documento.nombreArchivo,
      fechaCreacion: documento.fechaCreacion
    });
    
  } catch (error) {
    console.error('❌ Error al subir documento:', error);
    res.status(500).json({ 
      error: 'Error al subir el documento',
      details: error.message 
    });
  }
});

// GET - Descargar documento
router.get('/documentos/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          d.nombreOriginal,
          d.archivo,
          f.mimeType,
          f.extension
        FROM DocumentosCCMM d
        INNER JOIN TPFormato f ON d.idFormato = f.idFormato
        WHERE d.idDocumento = @id AND d.activo = 1
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    
    const documento = result.recordset[0];
    
    if (!documento.archivo) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    // Convertir base64 a buffer
    const buffer = Buffer.from(documento.archivo, 'base64');
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', documento.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${documento.nombreOriginal}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
    
  } catch (error) {
    console.error('❌ Error al descargar documento:', error);
    res.status(500).json({ 
      error: 'Error al descargar el documento',
      details: error.message 
    });
  }
});

// DELETE - Eliminar documento (eliminación lógica)
router.delete('/documentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE DocumentosCCMM 
        SET activo = 0, fechaActualizacion = GETDATE()
        WHERE idDocumento = @id AND activo = 1
      `);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    
    console.log('✅ Documento eliminado (lógicamente):', id);
    res.json({ message: 'Documento eliminado correctamente' });
    
  } catch (error) {
    console.error('❌ Error al eliminar documento:', error);
    res.status(500).json({ 
      error: 'Error al eliminar el documento',
      details: error.message 
    });
  }
});

// PUT - Actualizar documento
router.put('/documentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreArchivo, descripcion, idTipo, idFormato } = req.body;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('nombreArchivo', sql.VarChar(255), nombreArchivo)
      .input('descripcion', sql.NVarChar(sql.MAX), descripcion)
      .input('idTipo', sql.Int, idTipo)
      .input('idFormato', sql.Int, idFormato)
      .query(`
        UPDATE DocumentosCCMM 
        SET 
          nombreArchivo = @nombreArchivo,
          descripcion = @descripcion,
          idTipo = @idTipo,
          idFormato = @idFormato,
          fechaActualizacion = GETDATE()
        WHERE idDocumento = @id AND activo = 1
      `);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    
    res.json({ message: 'Documento actualizado correctamente' });
    
  } catch (error) {
    console.error('❌ Error al actualizar documento:', error);
    res.status(500).json({ 
      error: 'Error al actualizar el documento',
      details: error.message 
    });
  }
});

// ==================== RUTAS DE ESTADÍSTICAS ====================

// GET - Estadísticas de documentos
router.get('/documentos/estadisticas/resumen', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        COUNT(*) as totalDocumentos,
        COUNT(CASE WHEN d.activo = 1 THEN 1 END) as documentosActivos,
        COUNT(CASE WHEN d.activo = 0 THEN 1 END) as documentosEliminados,
        SUM(CASE WHEN d.activo = 1 THEN ISNULL(d.tamano, 0) ELSE 0 END) as tamanoTotal,
        AVG(CASE WHEN d.activo = 1 THEN CAST(ISNULL(d.tamano, 0) AS FLOAT) ELSE NULL END) as tamanoPromedio
      FROM DocumentosCCMM d
    `);
    
    const estadisticas = result.recordset[0];
    
    // Formatear tamaños
    estadisticas.tamanoTotalMB = Math.round((estadisticas.tamanoTotal || 0) / (1024 * 1024) * 100) / 100;
    estadisticas.tamanoPromedioKB = Math.round((estadisticas.tamanoPromedio || 0) / 1024 * 100) / 100;
    
    res.json(estadisticas);
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas de documentos',
      details: error.message 
    });
  }
});

module.exports = router;
