// Script para probar la API REST de evaluaciones
// Ejecutar con: node test_api_evaluaciones.js
// IMPORTANTE: El servidor debe estar corriendo en localhost:3000

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAPIEvaluaciones() {
    try {
        console.log('🌐 Probando API REST de Evaluaciones...');
        console.log('========================================');

        // 1. Probar conexión al servidor
        console.log('\n🔗 1. Verificando conexión al servidor...');
        try {
            const response = await axios.get(`${BASE_URL}/evaluaciones-stats`);
            console.log('✅ Servidor está corriendo y responde');
            console.log('📊 Estadísticas actuales:', response.data);
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log('❌ ERROR: El servidor no está corriendo');
                console.log('💡 Inicia el servidor con: npm start o node index.js');
                return;
            }
            throw error;
        }

        // 2. Obtener lista de evaluaciones
        console.log('\n📋 2. Obteniendo lista de evaluaciones...');
        const evaluacionesResponse = await axios.get(`${BASE_URL}/evaluaciones`);
        console.log(`✅ Se obtuvieron ${evaluacionesResponse.data.length} evaluaciones`);
        
        if (evaluacionesResponse.data.length > 0) {
            console.log('🔍 Primera evaluación encontrada:');
            const primera = evaluacionesResponse.data[0];
            console.log(`   ID: ${primera.idEvaluacion}`);
            console.log(`   Paciente: ${primera.nombreCompleto}`);
            console.log(`   Progreso: ${primera.progreso}%`);
            console.log(`   Estado: ${primera.estado}`);
        }

        // 3. Crear nueva evaluación de prueba
        console.log('\n💾 3. Creando nueva evaluación de prueba...');
        
        // Primero obtenemos un paciente para usar en la prueba
        const pacientesResponse = await axios.get(`${BASE_URL}/pacientes`);
        
        if (pacientesResponse.data.length === 0) {
            console.log('❌ No hay pacientes disponibles para crear evaluación');
            console.log('💡 Necesitas tener al menos un paciente en la base de datos');
            return;
        }

        const pacientePrueba = pacientesResponse.data[0];
        console.log(`✅ Usando paciente: ${pacientePrueba.nombre} ${pacientePrueba.apellidoPaterno}`);

        const nuevaEvaluacion = {
            idPaciente: pacientePrueba.idPaciente,
            progreso: 60.5,
            respuestas: {
                "pregunta1": "Respuesta API Test 1",
                "pregunta2": "Respuesta API Test 2",
                "pregunta3": "Respuesta API Test 3",
                "seccion_auditiva": "Completada",
                "seccion_visual": "En progreso",
                "observaciones_generales": "Prueba realizada vía API",
                "timestamp_api_test": new Date().toISOString()
            },
            evaluadorNombre: 'API Tester',
            evaluadorCorreo: 'api.test@sistema.com',
            observaciones: 'Evaluación creada mediante prueba de API REST',
            estado: 'En Progreso'
        };

        const crearResponse = await axios.post(`${BASE_URL}/evaluaciones`, nuevaEvaluacion);
        console.log('✅ Evaluación creada exitosamente');
        console.log('📊 Respuesta del servidor:', crearResponse.data);

        const nuevaEvaluacionId = crearResponse.data.evaluacion.idEvaluacion;
        console.log(`🆔 ID de nueva evaluación: ${nuevaEvaluacionId}`);

        // 4. Obtener la evaluación recién creada
        console.log('\n🔍 4. Verificando evaluación creada...');
        const evaluacionResponse = await axios.get(`${BASE_URL}/evaluaciones/${nuevaEvaluacionId}`);
        console.log('✅ Evaluación obtenida correctamente');
        const evaluacionCreada = evaluacionResponse.data;
        
        console.log('📝 Detalles de la evaluación:');
        console.log(`   ID: ${evaluacionCreada.idEvaluacion}`);
        console.log(`   Paciente: ${evaluacionCreada.nombreCompleto}`);
        console.log(`   Progreso: ${evaluacionCreada.progreso}%`);
        console.log(`   Estado: ${evaluacionCreada.estado}`);
        console.log(`   Evaluador: ${evaluacionCreada.evaluadorNombre}`);
        console.log(`   Fecha: ${evaluacionCreada.fechaEvaluacion}`);

        // 5. Actualizar la evaluación
        console.log('\n🔄 5. Actualizando evaluación...');
        const actualizacion = {
            progreso: 85.75,
            respuestas: {
                ...JSON.parse(evaluacionCreada.respuestas),
                "pregunta4": "Respuesta añadida en actualización",
                "seccion_final": "Completada",
                "actualizacion_timestamp": new Date().toISOString()
            },
            estado: 'Completada',
            observaciones: 'Evaluación actualizada vía API - Completada'
        };

        const actualizarResponse = await axios.put(`${BASE_URL}/evaluaciones/${nuevaEvaluacionId}`, actualizacion);
        console.log('✅ Evaluación actualizada exitosamente');
        console.log('📊 Progreso actualizado:', actualizarResponse.data.evaluacion.progreso + '%');
        console.log('📝 Estado actualizado:', actualizarResponse.data.evaluacion.estado);

        // 6. Obtener evaluaciones por paciente
        console.log('\n👤 6. Obteniendo evaluaciones del paciente...');
        const evaluacionesPacienteResponse = await axios.get(`${BASE_URL}/evaluaciones/paciente/${pacientePrueba.idPaciente}`);
        console.log(`✅ ${evaluacionesPacienteResponse.data.length} evaluaciones encontradas para el paciente`);

        // 7. Verificar estadísticas actualizadas
        console.log('\n📊 7. Verificando estadísticas actualizadas...');
        const statsFinalesResponse = await axios.get(`${BASE_URL}/evaluaciones-stats`);
        const statsFinales = statsFinalesResponse.data;
        
        console.log('📈 Estadísticas finales:');
        console.log(`   📋 Total evaluaciones: ${statsFinales.totalEvaluaciones}`);
        console.log(`   👥 Pacientes con evaluaciones: ${statsFinales.pacientesConEvaluaciones}`);
        console.log(`   📊 Progreso promedio: ${statsFinales.progresoPromedio?.toFixed(2)}%`);
        console.log(`   ✅ Completadas: ${statsFinales.evaluacionesCompletadas}`);
        console.log(`   🔄 En progreso: ${statsFinales.evaluacionesEnProgreso}`);

        // 8. Opcional: Eliminar la evaluación de prueba
        console.log('\n🗑️ 8. ¿Eliminar evaluación de prueba? (descomenta para eliminar)');
        /*
        const eliminarResponse = await axios.delete(`${BASE_URL}/evaluaciones/${nuevaEvaluacionId}`);
        console.log('✅ Evaluación de prueba eliminada');
        */
        console.log('💡 La evaluación de prueba se mantuvo para inspección manual');

        console.log('\n🎉 ¡TODAS LAS PRUEBAS DE API PASARON EXITOSAMENTE!');
        console.log('✅ La API REST está funcionando correctamente');
        console.log('✅ Las evaluaciones se guardan, actualizan y consultan correctamente');

    } catch (error) {
        console.error('❌ Error durante las pruebas de API:', error.message);
        
        if (error.response) {
            console.log('\n📄 Respuesta del servidor:');
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        }
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Sugerencias:');
            console.log('1. Asegúrate de que el servidor esté corriendo: npm start');
            console.log('2. Verifica que el puerto 3000 esté disponible');
            console.log('3. Confirma que las rutas estén configuradas correctamente');
        }
    }
}

// Función para instalar axios si no está disponible
async function checkAndInstallAxios() {
    try {
        require('axios');
        return true;
    } catch (error) {
        console.log('📦 Axios no está instalado. Instalando...');
        const { exec } = require('child_process');
        return new Promise((resolve, reject) => {
            exec('npm install axios', (error, stdout, stderr) => {
                if (error) {
                    console.log('❌ Error instalando axios:', error);
                    console.log('💡 Instala manualmente: npm install axios');
                    reject(error);
                } else {
                    console.log('✅ Axios instalado correctamente');
                    resolve(true);
                }
            });
        });
    }
}

// Ejecutar las pruebas
console.log('🚀 Iniciando pruebas de API REST...');
console.log('===================================');

checkAndInstallAxios()
    .then(() => testAPIEvaluaciones())
    .catch((error) => {
        console.error('❌ No se pudo ejecutar las pruebas:', error.message);
        console.log('\n💡 Asegúrate de tener axios instalado: npm install axios');
    });
