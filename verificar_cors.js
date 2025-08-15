// Archivo: verificar_cors.js
const axios = require('axios');

async function verificarCORS() {
  console.log('🌐 VERIFICANDO CORS Y CONECTIVIDAD FRONTEND → BACKEND');
  console.log('====================================================\n');

  try {
    // 1. Verificar que el backend responda
    console.log('1️⃣ Verificando que el backend responda...');
    const healthCheck = await axios.get('http://localhost:3000/api/evaluaciones');
    console.log(`✅ Backend responde: ${healthCheck.status} - ${healthCheck.data.length} evaluaciones\n`);

    // 2. Simular petición desde el frontend
    console.log('2️⃣ Simulando petición POST como el frontend...');
    const evaluacionTest = {
      idPaciente: 2,
      progreso: 50.5,
      respuestas: JSON.stringify({
        pregunta1: "test frontend",
        pregunta2: "test frontend 2"
      }),
      evaluadorNombre: "Test Frontend",
      evaluadorCorreo: "frontend@test.com",
      observaciones: "Prueba desde frontend simulado",
      estado: "En Progreso"
    };

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:4200', // Simula petición desde Angular
      }
    };

    const response = await axios.post('http://localhost:3000/api/evaluaciones', evaluacionTest, config);
    console.log(`✅ Petición POST exitosa: ${response.status}`);
    console.log(`📋 Respuesta:`, response.data);

  } catch (error) {
    console.error('❌ Error en verificación CORS:');
    console.error(`   Mensaje: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Datos: ${JSON.stringify(error.response.data)}`);
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('🚫 El servidor backend no está ejecutándose en puerto 3000');
    }
  }
}

verificarCORS();
