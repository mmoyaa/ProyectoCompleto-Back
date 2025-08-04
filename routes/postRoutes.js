const express = require('express');
const { sql, poolPromise } = require('../db');
const router = express.Router();

// POST - Crear relación repartición-comuna
router.post('/reparticion-comuna', async (req, res) => {
  try {
    const { idReparticion, idComuna } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input('idReparticion', sql.Int, idReparticion)
      .input('idComuna', sql.Int, idComuna)
      .query(`
        INSERT INTO ReparticionComuna (idReparticion, idComuna)
        VALUES (@idReparticion, @idComuna)
      `);

    res.status(200).json({ message: 'Relación guardada correctamente.' });
  } catch (err) {
    console.error('Error al guardar relación:', err);
    res.status(500).json({ error: 'No se pudo guardar la relación.' });
  }
});

// POST - Crear nueva comuna
router.post('/comunas', (req, res) => {
  const nuevaComuna = req.body;

  // Validar datos (opcional)
  if (!nuevaComuna || !nuevaComuna.name || !nuevaComuna.population) {
    return res.status(400).json({ message: "Datos incompletos o inválidos" });
  }

  // Agregar a la base de datos simulada
  comunas.push(nuevaComuna);

  // Responder con éxito
  res.status(201).json({
    message: "Comuna creada exitosamente",
    comuna: nuevaComuna,
  });
});

// ==================== RUTAS PARA PACIENTES Y TUTORES ====================

// POST - Ruta de prueba para verificar conectividad
router.post('/pacientes/test', (req, res) => {
  console.log('Test endpoint alcanzado con datos:', req.body);
  res.status(200).json({ 
    message: 'Endpoint funcionando correctamente',
    datosRecibidos: req.body
  });
});

// POST - Crear paciente simple (solo nombre y apellido)
router.post('/pacientes/simple', async (req, res) => {
  try {
    console.log('✅ Datos recibidos:', req.body);
    
    const {
      nombre,
      apellido
    } = req.body;

    // Validaciones simples
    if (!nombre || nombre.trim() === '') {
      console.log('❌ Falta el nombre');
      return res.status(400).json({ 
        error: 'El nombre es obligatorio' 
      });
    }

    if (!apellido || apellido.trim() === '') {
      console.log('❌ Falta el apellido');
      return res.status(400).json({ 
        error: 'El apellido es obligatorio' 
      });
    }

    console.log('✅ Validaciones pasadas');

    // Generar RUT simple para testing
    const rut = `${Date.now()}-9`;
    console.log('✅ RUT generado:', rut);

    const pool = await poolPromise;
    console.log('✅ Conexión a BD obtenida');

    // Crear paciente con todos los campos de la tabla
    console.log('✅ Insertando paciente...');
    const result = await pool.request()
      .input('nombre', sql.NVarChar(100), nombre.trim())
      .input('apellidoPaterno', sql.NVarChar(100), apellido.trim())
      .input('apellidoMaterno', sql.NVarChar(100), null) // Null porque solo tenemos apellido
      .input('rut', sql.NVarChar(12), rut)
      .input('telefono', sql.NVarChar(20), null) // Null porque no se proporciona
      .input('correo', sql.NVarChar(150), null) // Null porque no se proporciona
      .input('direccion', sql.NVarChar(255), null) // Null porque no se proporciona
      .input('nacionalidad', sql.NVarChar(50), 'Chilena') // Valor por defecto
      .input('tutor', sql.Int, 0) // 0 = sin tutor
      .input('idTutor', sql.Int, null) // Null porque no tiene tutor
      .query(`
        INSERT INTO paciente (
          nombre, 
          apellidoPaterno, 
          apellidoMaterno, 
          rut, 
          telefono, 
          correo, 
          direccion, 
          nacionalidad, 
          tutor, 
          idTutor
        )
        OUTPUT INSERTED.idPaciente, INSERTED.fechaCreacion, INSERTED.fechaModificacion
        VALUES (
          @nombre, 
          @apellidoPaterno, 
          @apellidoMaterno, 
          @rut, 
          @telefono, 
          @correo, 
          @direccion, 
          @nacionalidad, 
          @tutor, 
          @idTutor
        )
      `);

    console.log('✅ Paciente insertado exitosamente');

    res.status(201).json({
      success: true,
      message: 'Paciente agregado correctamente',
      paciente: {
        idPaciente: result.recordset[0].idPaciente,
        nombre: nombre.trim(),
        apellidoPaterno: apellido.trim(),
        apellidoMaterno: null,
        rut: rut,
        telefono: null,
        correo: null,
        direccion: null,
        nacionalidad: 'Chilena',
        tutor: 0,
        idTutor: null,
        fechaCreacion: result.recordset[0].fechaCreacion,
        fechaModificacion: result.recordset[0].fechaModificacion
      }
    });

  } catch (error) {
    console.error('❌ ERROR COMPLETO:', {
      message: error.message,
      number: error.number,
      state: error.state,
      class: error.class,
      lineNumber: error.lineNumber,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Error al agregar el paciente',
      details: error.message,
      errorNumber: error.number
    });
  }
});

// POST - Crear paciente sin tutor (adulto)
router.post('/pacientes', async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body); // Para depuración
    
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      rut,
      telefono,
      correo,
      direccion,
      nacionalidad = 'Chilena'
    } = req.body;

    // Validaciones básicas mejoradas
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ 
        error: 'El campo nombre es obligatorio y no puede estar vacío' 
      });
    }

    if (!apellidoPaterno || apellidoPaterno.trim() === '') {
      return res.status(400).json({ 
        error: 'El campo apellido paterno es obligatorio y no puede estar vacío' 
      });
    }

    if (!rut || rut.trim() === '') {
      return res.status(400).json({ 
        error: 'El campo RUT es obligatorio y no puede estar vacío' 
      });
    }

    // Validación básica de formato de RUT (opcional)
    const rutRegex = /^\d{7,8}-[\dkK]$/;
    if (!rutRegex.test(rut.trim())) {
      return res.status(400).json({ 
        error: 'El formato del RUT debe ser: 12345678-9 o 1234567-K' 
      });
    }

    const pool = await poolPromise;

    // Verificar si el RUT ya existe
    const existeRut = await pool.request()
      .input('rut', sql.NVarChar(12), rut.trim())
      .query('SELECT COUNT(*) as cantidad FROM paciente WHERE rut = @rut');

    if (existeRut.recordset[0].cantidad > 0) {
      return res.status(409).json({ error: 'Ya existe un paciente con este RUT' });
    }

    // Insertar paciente
    const result = await pool.request()
      .input('nombre', sql.NVarChar(100), nombre.trim())
      .input('apellidoPaterno', sql.NVarChar(100), apellidoPaterno.trim())
      .input('apellidoMaterno', sql.NVarChar(100), apellidoMaterno ? apellidoMaterno.trim() : null)
      .input('rut', sql.NVarChar(12), rut.trim())
      .input('telefono', sql.NVarChar(20), telefono ? telefono.trim() : null)
      .input('correo', sql.NVarChar(150), correo ? correo.trim() : null)
      .input('direccion', sql.NVarChar(255), direccion ? direccion.trim() : null)
      .input('nacionalidad', sql.NVarChar(50), nacionalidad.trim())
      .query(`
        INSERT INTO paciente (nombre, apellidoPaterno, apellidoMaterno, rut, telefono, correo, direccion, nacionalidad, tutor, idTutor)
        OUTPUT INSERTED.idPaciente
        VALUES (@nombre, @apellidoPaterno, @apellidoMaterno, @rut, @telefono, @correo, @direccion, @nacionalidad, 0, NULL)
      `);

    res.status(201).json({
      message: 'Paciente creado correctamente',
      idPaciente: result.recordset[0].idPaciente
    });

  } catch (error) {
    console.error('Error detallado al crear paciente:', error);
    
    // Si es un error de validación de SQL Server
    if (error.number) {
      switch (error.number) {
        case 2627: // Violación de restricción única
          return res.status(409).json({ error: 'Ya existe un paciente con este RUT' });
        case 515: // No puede insertar NULL
          return res.status(400).json({ error: 'Faltan campos obligatorios' });
        default:
          return res.status(500).json({ 
            error: 'Error de base de datos', 
            details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
          });
      }
    }
    
    res.status(500).json({ 
      error: 'Error al crear el paciente',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
});

// POST - Crear paciente con tutor (menor de edad)
router.post('/pacientes/con-tutor', async (req, res) => {
  try {
    const {
      // Datos del paciente
      nombrePaciente,
      apellidoPaterno,
      apellidoMaterno,
      rut,
      telefonoPaciente,
      correoPaciente,
      direccionPaciente,
      nacionalidad = 'Chilena',
      // Datos del tutor
      nombreTutor,
      apellidoTutor,
      direccionTutor,
      correoTutor,
      telefonoTutor
    } = req.body;

    // Validaciones básicas
    if (!nombrePaciente || !apellidoPaterno || !rut || !nombreTutor || !apellidoTutor) {
      return res.status(400).json({ 
        error: 'Los campos nombre del paciente, apellido paterno, RUT, nombre del tutor y apellido del tutor son obligatorios' 
      });
    }

    const pool = await poolPromise;

    // Verificar si el RUT ya existe
    const existeRut = await pool.request()
      .input('rut', sql.NVarChar(12), rut)
      .query('SELECT COUNT(*) as cantidad FROM paciente WHERE rut = @rut');

    if (existeRut.recordset[0].cantidad > 0) {
      return res.status(409).json({ error: 'Ya existe un paciente con este RUT' });
    }

    // Iniciar transacción
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Insertar tutor
      const tutorResult = await transaction.request()
        .input('nombreTutor', sql.NVarChar(100), nombreTutor)
        .input('apellidoTutor', sql.NVarChar(100), apellidoTutor)
        .input('direccionTutor', sql.NVarChar(255), direccionTutor || null)
        .input('correoTutor', sql.NVarChar(150), correoTutor || null)
        .input('telefonoTutor', sql.NVarChar(20), telefonoTutor || null)
        .query(`
          INSERT INTO tutores (nombre, apellido, direccion, correo, telefono)
          OUTPUT INSERTED.idTutor
          VALUES (@nombreTutor, @apellidoTutor, @direccionTutor, @correoTutor, @telefonoTutor)
        `);

      const idTutor = tutorResult.recordset[0].idTutor;

      // Insertar paciente con tutor
      const pacienteResult = await transaction.request()
        .input('nombre', sql.NVarChar(100), nombrePaciente)
        .input('apellidoPaterno', sql.NVarChar(100), apellidoPaterno)
        .input('apellidoMaterno', sql.NVarChar(100), apellidoMaterno || null)
        .input('rut', sql.NVarChar(12), rut)
        .input('telefono', sql.NVarChar(20), telefonoPaciente || null)
        .input('correo', sql.NVarChar(150), correoPaciente || null)
        .input('direccion', sql.NVarChar(255), direccionPaciente || null)
        .input('nacionalidad', sql.NVarChar(50), nacionalidad)
        .input('idTutor', sql.Int, idTutor)
        .query(`
          INSERT INTO paciente (nombre, apellidoPaterno, apellidoMaterno, rut, telefono, correo, direccion, nacionalidad, tutor, idTutor)
          OUTPUT INSERTED.idPaciente
          VALUES (@nombre, @apellidoPaterno, @apellidoMaterno, @rut, @telefono, @correo, @direccion, @nacionalidad, 1, @idTutor)
        `);

      await transaction.commit();

      res.status(201).json({
        message: 'Paciente y tutor creados correctamente',
        idPaciente: pacienteResult.recordset[0].idPaciente,
        idTutor: idTutor
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error al crear paciente con tutor:', error);
    res.status(500).json({ error: 'Error al crear el paciente con tutor' });
  }
});

// POST - Crear solo tutor
router.post('/tutores', async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      direccion,
      correo,
      telefono
    } = req.body;

    // Validaciones básicas
    if (!nombre || !apellido) {
      return res.status(400).json({ 
        error: 'Los campos nombre y apellido son obligatorios' 
      });
    }

    const pool = await poolPromise;

    const result = await pool.request()
      .input('nombre', sql.NVarChar(100), nombre)
      .input('apellido', sql.NVarChar(100), apellido)
      .input('direccion', sql.NVarChar(255), direccion || null)
      .input('correo', sql.NVarChar(150), correo || null)
      .input('telefono', sql.NVarChar(20), telefono || null)
      .query(`
        INSERT INTO tutores (nombre, apellido, direccion, correo, telefono)
        OUTPUT INSERTED.idTutor
        VALUES (@nombre, @apellido, @direccion, @correo, @telefono)
      `);

    res.status(201).json({
      message: 'Tutor creado correctamente',
      idTutor: result.recordset[0].idTutor
    });

  } catch (error) {
    console.error('Error al crear tutor:', error);
    res.status(500).json({ error: 'Error al crear el tutor' });
  }
});

// POST - Asignar tutor existente a paciente
router.post('/pacientes/:idPaciente/asignar-tutor', async (req, res) => {
  try {
    const { idPaciente } = req.params;
    const { idTutor } = req.body;

    if (!idTutor) {
      return res.status(400).json({ error: 'El ID del tutor es obligatorio' });
    }

    const pool = await poolPromise;

    // Verificar que el paciente existe y no tiene tutor
    const pacienteCheck = await pool.request()
      .input('idPaciente', sql.Int, idPaciente)
      .query('SELECT tutor FROM paciente WHERE idPaciente = @idPaciente');

    if (pacienteCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    if (pacienteCheck.recordset[0].tutor === 1) {
      return res.status(409).json({ error: 'El paciente ya tiene un tutor asignado' });
    }

    // Verificar que el tutor existe
    const tutorCheck = await pool.request()
      .input('idTutor', sql.Int, idTutor)
      .query('SELECT COUNT(*) as existe FROM tutores WHERE idTutor = @idTutor');

    if (tutorCheck.recordset[0].existe === 0) {
      return res.status(404).json({ error: 'Tutor no encontrado' });
    }

    // Asignar tutor al paciente
    await pool.request()
      .input('idPaciente', sql.Int, idPaciente)
      .input('idTutor', sql.Int, idTutor)
      .query(`
        UPDATE paciente 
        SET tutor = 1, idTutor = @idTutor, fechaModificacion = GETDATE()
        WHERE idPaciente = @idPaciente
      `);

    res.status(200).json({ message: 'Tutor asignado correctamente al paciente' });

  } catch (error) {
    console.error('Error al asignar tutor:', error);
    res.status(500).json({ error: 'Error al asignar el tutor' });
  }
});

// POST - Crear paciente con representante
router.post('/pacientes/con-representante', async (req, res) => {
  try {
    console.log('Datos recibidos para paciente con representante:', req.body);
    
    const {
      // Datos del paciente
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      rut,
      telefono,
      correo,
      direccion,
      nacionalidad = 'Chilena',
      // Datos del representante
      nombreRepresentante,
      apellidoRepresentante,
      rutRepresentante,
      telefonoRepresentante,
      correoRepresentante,
      direccionRepresentante,
      relacionRepresentante,
      nacionalidadRepresentante = 'Chilena'
    } = req.body;

    // Validaciones básicas del paciente
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ 
        error: 'El campo nombre del paciente es obligatorio' 
      });
    }

    if (!apellidoPaterno || apellidoPaterno.trim() === '') {
      return res.status(400).json({ 
        error: 'El campo apellido paterno del paciente es obligatorio' 
      });
    }

    if (!rut || rut.trim() === '') {
      return res.status(400).json({ 
        error: 'El campo RUT del paciente es obligatorio' 
      });
    }

    // Validaciones básicas del representante
    if (!nombreRepresentante || nombreRepresentante.trim() === '') {
      return res.status(400).json({ 
        error: 'El campo nombre del representante es obligatorio' 
      });
    }

    if (!apellidoRepresentante || apellidoRepresentante.trim() === '') {
      return res.status(400).json({ 
        error: 'El campo apellido del representante es obligatorio' 
      });
    }

    if (!rutRepresentante || rutRepresentante.trim() === '') {
      return res.status(400).json({ 
        error: 'El campo RUT del representante es obligatorio' 
      });
    }

    if (!relacionRepresentante || relacionRepresentante.trim() === '') {
      return res.status(400).json({ 
        error: 'El campo relación del representante es obligatorio' 
      });
    }

    // Validación de formato de RUT para paciente y representante
    const rutRegex = /^\d{7,8}-[\dkK]$/;
    if (!rutRegex.test(rut.trim())) {
      return res.status(400).json({ 
        error: 'El formato del RUT del paciente debe ser: 12345678-9 o 1234567-K' 
      });
    }

    if (!rutRegex.test(rutRepresentante.trim())) {
      return res.status(400).json({ 
        error: 'El formato del RUT del representante debe ser: 12345678-9 o 1234567-K' 
      });
    }

    const pool = await poolPromise;

    // Verificar si el RUT del paciente ya existe
    const existeRutPaciente = await pool.request()
      .input('rut', sql.NVarChar(12), rut.trim())
      .query('SELECT COUNT(*) as cantidad FROM paciente WHERE rut = @rut');

    if (existeRutPaciente.recordset[0].cantidad > 0) {
      return res.status(409).json({ error: 'Ya existe un paciente con este RUT' });
    }

    // Verificar si el RUT del representante ya existe en la tabla de representantes
    const existeRutRepresentante = await pool.request()
      .input('rutRepresentante', sql.NVarChar(12), rutRepresentante.trim())
      .query('SELECT idRepresentante FROM representantes WHERE rut = @rutRepresentante');

    let idRepresentante;

    // Iniciar transacción
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Si el representante ya existe, usar su ID, sino crear uno nuevo
      if (existeRutRepresentante.recordset.length > 0) {
        idRepresentante = existeRutRepresentante.recordset[0].idRepresentante;
        console.log('Representante existente encontrado con ID:', idRepresentante);
      } else {
        // Crear nuevo representante
        const representanteResult = await transaction.request()
          .input('nombreRepresentante', sql.NVarChar(100), nombreRepresentante.trim())
          .input('apellidoRepresentante', sql.NVarChar(100), apellidoRepresentante.trim())
          .input('rutRepresentante', sql.NVarChar(12), rutRepresentante.trim())
          .input('telefonoRepresentante', sql.NVarChar(20), telefonoRepresentante ? telefonoRepresentante.trim() : null)
          .input('correoRepresentante', sql.NVarChar(150), correoRepresentante ? correoRepresentante.trim() : null)
          .input('direccionRepresentante', sql.NVarChar(255), direccionRepresentante ? direccionRepresentante.trim() : null)
          .input('nacionalidadRepresentante', sql.NVarChar(50), nacionalidadRepresentante.trim())
          .query(`
            INSERT INTO representantes (nombre, apellido, rut, telefono, correo, direccion, nacionalidad)
            OUTPUT INSERTED.idRepresentante
            VALUES (@nombreRepresentante, @apellidoRepresentante, @rutRepresentante, @telefonoRepresentante, @correoRepresentante, @direccionRepresentante, @nacionalidadRepresentante)
          `);

        idRepresentante = representanteResult.recordset[0].idRepresentante;
        console.log('Nuevo representante creado con ID:', idRepresentante);
      }

      // Crear paciente con representante
      const pacienteResult = await transaction.request()
        .input('nombre', sql.NVarChar(100), nombre.trim())
        .input('apellidoPaterno', sql.NVarChar(100), apellidoPaterno.trim())
        .input('apellidoMaterno', sql.NVarChar(100), apellidoMaterno ? apellidoMaterno.trim() : null)
        .input('rut', sql.NVarChar(12), rut.trim())
        .input('telefono', sql.NVarChar(20), telefono ? telefono.trim() : null)
        .input('correo', sql.NVarChar(150), correo ? correo.trim() : null)
        .input('direccion', sql.NVarChar(255), direccion ? direccion.trim() : null)
        .input('nacionalidad', sql.NVarChar(50), nacionalidad.trim())
        .input('idRepresentante', sql.Int, idRepresentante)
        .query(`
          INSERT INTO paciente (nombre, apellidoPaterno, apellidoMaterno, rut, telefono, correo, direccion, nacionalidad, tutor, idTutor, idRepresentante)
          OUTPUT INSERTED.idPaciente
          VALUES (@nombre, @apellidoPaterno, @apellidoMaterno, @rut, @telefono, @correo, @direccion, @nacionalidad, 0, NULL, @idRepresentante)
        `);

      const idPaciente = pacienteResult.recordset[0].idPaciente;

      // Crear relación paciente-representante
      await transaction.request()
        .input('idPaciente', sql.Int, idPaciente)
        .input('idRepresentante', sql.Int, idRepresentante)
        .input('relacion', sql.NVarChar(50), relacionRepresentante.trim())
        .query(`
          INSERT INTO paciente_representante (idPaciente, idRepresentante, relacion, fechaAsignacion)
          VALUES (@idPaciente, @idRepresentante, @relacion, GETDATE())
        `);

      await transaction.commit();

      res.status(201).json({
        message: 'Paciente y representante creados correctamente',
        idPaciente: idPaciente,
        idRepresentante: idRepresentante,
        relacion: relacionRepresentante.trim()
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error detallado al crear paciente con representante:', error);
    
    // Manejo de errores específicos de SQL Server
    if (error.number) {
      switch (error.number) {
        case 2627: // Violación de restricción única
          return res.status(409).json({ error: 'Ya existe un paciente o representante con estos datos' });
        case 515: // No puede insertar NULL
          return res.status(400).json({ error: 'Faltan campos obligatorios' });
        case 547: // Violación de restricción de clave foránea
          return res.status(400).json({ error: 'Error en las relaciones de datos' });
        default:
          return res.status(500).json({ 
            error: 'Error de base de datos', 
            details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
          });
      }
    }
    
    res.status(500).json({ 
      error: 'Error al crear el paciente con representante',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
});

// POST - Crear solo representante
router.post('/representantes', async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      rut,
      telefono,
      correo,
      direccion,
      nacionalidad = 'Chilena'
    } = req.body;

    // Validaciones básicas
    if (!nombre || !apellido || !rut) {
      return res.status(400).json({ 
        error: 'Los campos nombre, apellido y RUT son obligatorios' 
      });
    }

    // Validación de formato de RUT
    const rutRegex = /^\d{7,8}-[\dkK]$/;
    if (!rutRegex.test(rut.trim())) {
      return res.status(400).json({ 
        error: 'El formato del RUT debe ser: 12345678-9 o 1234567-K' 
      });
    }

    const pool = await poolPromise;

    // Verificar si el RUT ya existe
    const existeRut = await pool.request()
      .input('rut', sql.NVarChar(12), rut.trim())
      .query('SELECT COUNT(*) as cantidad FROM representantes WHERE rut = @rut');

    if (existeRut.recordset[0].cantidad > 0) {
      return res.status(409).json({ error: 'Ya existe un representante con este RUT' });
    }

    const result = await pool.request()
      .input('nombre', sql.NVarChar(100), nombre.trim())
      .input('apellido', sql.NVarChar(100), apellido.trim())
      .input('rut', sql.NVarChar(12), rut.trim())
      .input('telefono', sql.NVarChar(20), telefono ? telefono.trim() : null)
      .input('correo', sql.NVarChar(150), correo ? correo.trim() : null)
      .input('direccion', sql.NVarChar(255), direccion ? direccion.trim() : null)
      .input('nacionalidad', sql.NVarChar(50), nacionalidad.trim())
      .query(`
        INSERT INTO representantes (nombre, apellido, rut, telefono, correo, direccion, nacionalidad)
        OUTPUT INSERTED.idRepresentante
        VALUES (@nombre, @apellido, @rut, @telefono, @correo, @direccion, @nacionalidad)
      `);

    res.status(201).json({
      message: 'Representante creado correctamente',
      idRepresentante: result.recordset[0].idRepresentante
    });

  } catch (error) {
    console.error('Error al crear representante:', error);
    
    if (error.number === 2627) {
      return res.status(409).json({ error: 'Ya existe un representante con este RUT' });
    }
    
    res.status(500).json({ 
      error: 'Error al crear el representante',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
});

module.exports = router;
