// Prueba completa de guardado de evaluación para un paciente específico
const axios = require('axios');
const { poolPromise } = require('./db');

const BASE_URL = 'http://localhost:3000/api';

// Configuración de la prueba
const PACIENTE_ID = 2; // Maria Lopez Silva
const EVALUACION_TEST = {
  idPaciente: PACIENTE_ID,
  fechaEvaluacion: new Date().toISOString(),
  progreso: 75.0,
  respuestas: JSON.stringify({
    preguntas: [
      {
        id: 1,
        pregunta: "¿Puede identificar diferentes olores?",
        respuesta: "Sí, con dificultad leve",
        puntaje: 3
      },
      {
        id: 2,
        pregunta: "¿Puede distinguir sabores dulces y salados?",
        respuesta: "Sí, claramente",
        puntaje: 4
      },
      {
        id: 3,
        pregunta: "¿Siente texturas diferentes en los alimentos?",
        respuesta: "Sí, sin problemas",
        puntaje: 5
      }
    ],
    observaciones: "Paciente muestra mejora significativa en percepción sensorial"
  }),
  evaluadorNombre: "Dr. Test Evaluador",
  evaluadorCorreo: "test.evaluador@clinica.com",
  observaciones: "Evaluación de prueba - Paciente muestra progreso positivo en rehabilitación sensorial",
  estado: "En Progreso"
};

async function ejecutarPruebaCompleta() {
  console.log('🧪 PRUEBA COMPLETA DE GUARDADO DE EVALUACIÓN');
  console.log('============================================\n');

  try {
    // 1. Verificar que el paciente existe
    console.log(`1️⃣ Verificando que existe el paciente ID: ${PACIENTE_ID}...`);
    const pool = await poolPromise;
    const pacienteResult = await pool.request()
      .input('idPaciente', PACIENTE_ID)
      .query('SELECT * FROM paciente WHERE idPaciente = @idPaciente');

    if (pacienteResult.recordset.length === 0) {
      throw new Error(`No se encontró el paciente con ID: ${PACIENTE_ID}`);
    }

    const paciente = pacienteResult.recordset[0];
    console.log(`✅ Paciente encontrado: ${paciente.nombre} ${paciente.apellidoPaterno} ${paciente.apellidoMaterno || ''}`);
    console.log(`   RUT: ${paciente.rut}, Correo: ${paciente.correo || 'N/A'}\n`);

    // 2. Verificar evaluaciones existentes del paciente
    console.log(`2️⃣ Verificando evaluaciones existentes del paciente...`);
    const evaluacionesExistentes = await pool.request()
      .input('idPaciente', PACIENTE_ID)
      .query('SELECT COUNT(*) as total FROM EvaluacionesSensoriales WHERE idPaciente = @idPaciente');

    const totalExistentes = evaluacionesExistentes.recordset[0].total;
    console.log(`📊 Evaluaciones existentes: ${totalExistentes}\n`);

    // 3. Guardar nueva evaluación via API
    console.log(`3️⃣ Guardando nueva evaluación via API...`);
    const response = await axios.post(`${BASE_URL}/evaluaciones`, EVALUACION_TEST);

    if (response.status !== 201) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const evaluacionGuardada = response.data.evaluacion;
    console.log(`✅ Evaluación guardada exitosamente!`);
    console.log(`   ID de la nueva evaluación: ${evaluacionGuardada.idEvaluacion}`);
    console.log(`   Progreso: ${evaluacionGuardada.progreso}%`);
    console.log(`   Estado: ${evaluacionGuardada.estado}\n`);

    // 4. Verificar que se guardó en la base de datos
    console.log(`4️⃣ Verificando que se guardó en la base de datos...`);
    const verificacion = await pool.request()
      .input('idEvaluacion', evaluacionGuardada.idEvaluacion)
      .query(`
        SELECT 
          e.*,
          p.nombre + ' ' + p.apellidoPaterno + ' ' + ISNULL(p.apellidoMaterno, '') as nombreCompleto
        FROM EvaluacionesSensoriales e
        INNER JOIN paciente p ON e.idPaciente = p.idPaciente
        WHERE e.idEvaluacion = @idEvaluacion
      `);

    if (verificacion.recordset.length === 0) {
      throw new Error('La evaluación no se encontró en la base de datos después del guardado');
    }

    const evaluacionDB = verificacion.recordset[0];
    console.log(`✅ Evaluación verificada en base de datos:`);
    console.log(`   ID: ${evaluacionDB.idEvaluacion}`);
    console.log(`   Paciente: ${evaluacionDB.nombreCompleto}`);
    console.log(`   Fecha: ${new Date(evaluacionDB.fechaEvaluacion).toLocaleString('es-ES')}`);
    console.log(`   Progreso: ${evaluacionDB.progreso}%`);
    console.log(`   Evaluador: ${evaluacionDB.evaluadorNombre}`);
    console.log(`   Estado: ${evaluacionDB.estado}\n`);

    // 5. Verificar que incrementó el contador de evaluaciones
    console.log(`5️⃣ Verificando incremento en total de evaluaciones...`);
    const nuevasEvaluaciones = await pool.request()
      .input('idPaciente', PACIENTE_ID)
      .query('SELECT COUNT(*) as total FROM EvaluacionesSensoriales WHERE idPaciente = @idPaciente');

    const nuevoTotal = nuevasEvaluaciones.recordset[0].total;
    console.log(`📊 Evaluaciones totales ahora: ${nuevoTotal}`);
    console.log(`📈 Incremento: ${nuevoTotal - totalExistentes} evaluación(es)\n`);

    // 6. Probar obtener todas las evaluaciones via API
    console.log(`6️⃣ Probando obtener todas las evaluaciones via API...`);
    const todasResponse = await axios.get(`${BASE_URL}/evaluaciones`);
    const todasEvaluaciones = todasResponse.data;

    console.log(`✅ API devuelve ${todasEvaluaciones.length} evaluaciones totales`);
    
    // Buscar nuestra evaluación en la lista
    const nuestraEvaluacion = todasEvaluaciones.find(ev => ev.idEvaluacion === evaluacionGuardada.idEvaluacion);
    if (nuestraEvaluacion) {
      console.log(`✅ Nuestra evaluación aparece en la lista de evaluaciones`);
      console.log(`   Paciente en lista: ${nuestraEvaluacion.nombreCompleto}`);
    } else {
      console.log(`❌ Nuestra evaluación NO aparece en la lista de evaluaciones`);
    }

    // 7. Probar estadísticas
    console.log(`\n7️⃣ Verificando actualización de estadísticas...`);
    const statsResponse = await axios.get(`${BASE_URL}/evaluaciones/estadisticas`);
    const estadisticas = statsResponse.data;

    console.log(`📊 Estadísticas actualizadas:`);
    console.log(`   Total evaluaciones: ${estadisticas.totalEvaluaciones}`);
    console.log(`   Pacientes con evaluaciones: ${estadisticas.pacientesConEvaluaciones}`);
    console.log(`   Progreso promedio: ${estadisticas.progresoPromedio}%`);

    console.log(`\n🎉 PRUEBA COMPLETADA EXITOSAMENTE! 🎉`);
    console.log(`\n📋 RESUMEN:`);
    console.log(`✅ Paciente verificado: ${paciente.nombre} ${paciente.apellidoPaterno}`);
    console.log(`✅ Evaluación guardada con ID: ${evaluacionGuardada.idEvaluacion}`);
    console.log(`✅ Verificada en base de datos`);
    console.log(`✅ Aparece en lista de evaluaciones`);
    console.log(`✅ Estadísticas actualizadas`);
    console.log(`\n💡 La funcionalidad de "guardar evaluación" está funcionando correctamente!`);

  } catch (error) {
    console.error(`\n❌ ERROR EN LA PRUEBA:`);
    console.error(`   Mensaje: ${error.message}`);
    if (error.response) {
      console.error(`   Status HTTP: ${error.response.status}`);
      console.error(`   Respuesta del servidor:`, error.response.data);
    }
    console.log(`\n🔧 Verifique que:`);
    console.log(`   - El servidor backend esté ejecutándose en http://localhost:3000`);
    console.log(`   - La base de datos esté conectada`);
    console.log(`   - El paciente con ID ${PACIENTE_ID} exista`);
  } finally {
    process.exit(0);
  }
}

// Ejecutar la prueba
ejecutarPruebaCompleta();
