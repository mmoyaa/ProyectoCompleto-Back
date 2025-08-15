const axios = require('axios');

async function testFrontendToBackend() {
    try {
        console.log('🧪 Probando comunicación Frontend -> Backend...');
        
        // Datos exactos como los envía el frontend
        const evaluacionData = {
            idPaciente: 1,
            progreso: 37.5,
            respuestas: [
                { id: 1, name: 'pregunta47', pregunta: '47. Pone demasiada comida en su boca', respuesta: 'frecuentemente', puntaje: 4 },
                { id: 2, name: 'pregunta48', pregunta: '48. Se golpea la cabeza a propósito con algún objeto contra la pared', respuesta: 'ocasionalmente', puntaje: 2 },
                { id: 3, name: 'pregunta49', pregunta: '49. Derrama o voltea las cosas', respuesta: 'nunca', puntaje: 1 }
            ],
            evaluadorNombre: 'Dr. Evaluador Test Frontend',
            evaluadorCorreo: 'evaluador@test.com',
            observaciones: 'Evaluación guardada desde frontend mejorado',
            estado: 'En Progreso'
        };

        console.log('📝 Datos a enviar:', JSON.stringify(evaluacionData, null, 2));

        // Hacer la petición POST
        console.log('🚀 Enviando petición a http://localhost:3000/api/evaluaciones...');
        
        const response = await axios.post('http://localhost:3000/api/evaluaciones', evaluacionData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        console.log('✅ Respuesta del servidor:');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));

        // Verificar que se guardó consultando todas las evaluaciones
        console.log('\n🔍 Verificando registros en la base de datos...');
        const verificacion = await axios.get('http://localhost:3000/api/evaluaciones');
        
        console.log(`📊 Total de evaluaciones: ${verificacion.data.length}`);
        console.log('📋 Últimas 3 evaluaciones:');
        
        verificacion.data.slice(0, 3).forEach((eval, index) => {
            console.log(`${index + 1}. ID: ${eval.idEvaluacion}, Paciente: ${eval.idPaciente}, Evaluador: ${eval.evaluadorNombre}, Estado: ${eval.estado}`);
        });

    } catch (error) {
        console.error('❌ Error en la prueba:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Data:', error.response?.data);
        console.error('Message:', error.message);
    }
}

// Ejecutar la prueba
testFrontendToBackend();
