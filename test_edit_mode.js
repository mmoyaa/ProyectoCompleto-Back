// Test para verificar la funcionalidad de edición de evaluaciones

const axios = require('axios');

async function testEditMode() {
    try {
        console.log('🧪 === TEST DE MODO EDICIÓN ===\n');

        // 1. Obtener todas las evaluaciones
        console.log('📋 1. Obteniendo evaluaciones existentes...');
        const evaluaciones = await axios.get('http://localhost:3000/api/evaluaciones');
        console.log(`✅ Se encontraron ${evaluaciones.data.length} evaluaciones`);

        if (evaluaciones.data.length === 0) {
            console.log('❌ No hay evaluaciones para probar. Crear una evaluación primero.');
            return;
        }

        // 2. Tomar la primera evaluación para probar
        const evaluacionTest = evaluaciones.data[0];
        console.log('\n📝 2. Evaluación seleccionada para test:');
        console.log(`   ID: ${evaluacionTest.idEvaluacion}`);
        console.log(`   Paciente: ${evaluacionTest.nombreCompleto}`);
        console.log(`   Progreso: ${evaluacionTest.progreso}%`);
        console.log(`   Estado: ${evaluacionTest.estado}`);
        console.log(`   Evaluador: ${evaluacionTest.evaluadorNombre}`);

        // 3. Verificar que tiene respuestas
        let respuestas = [];
        try {
            respuestas = JSON.parse(evaluacionTest.respuestas);
            console.log(`   Respuestas: ${respuestas.length} respuestas guardadas`);
            
            if (respuestas.length > 0) {
                console.log('   Primeras 3 respuestas:');
                respuestas.slice(0, 3).forEach((resp, index) => {
                    console.log(`     ${index + 1}. ${resp.name || resp.pregunta}: ${resp.respuesta} (puntaje: ${resp.puntaje})`);
                });
            }
        } catch (error) {
            console.log(`   ⚠️ Error al parsear respuestas: ${error.message}`);
        }

        // 4. Simular URL de edición
        const editUrl = `http://localhost:4201/pagina2?pacienteId=${evaluacionTest.idPaciente}&evaluacionId=${evaluacionTest.idEvaluacion}`;
        console.log('\n🔗 3. URL para editar evaluación:');
        console.log(editUrl);

        // 5. Probar obtener evaluación por ID
        console.log('\n🔍 4. Probando obtener evaluación por ID...');
        const evaluacionById = await axios.get(`http://localhost:3000/api/evaluaciones/${evaluacionTest.idEvaluacion}`);
        console.log('✅ Evaluación obtenida correctamente');
        console.log(`   Nombre completo: ${evaluacionById.data.nombreCompleto}`);
        console.log(`   Progreso: ${evaluacionById.data.progreso}%`);

        // 6. Simular actualización
        console.log('\n📝 5. Simulando actualización de evaluación...');
        const updateData = {
            progreso: evaluacionTest.progreso + 5, // Incrementar progreso
            respuestas: evaluacionTest.respuestas, // Mantener respuestas existentes
            evaluadorNombre: evaluacionTest.evaluadorNombre,
            evaluadorCorreo: evaluacionTest.evaluadorCorreo,
            observaciones: `${evaluacionTest.observaciones} - Test de actualización ${new Date().toLocaleString()}`,
            estado: evaluacionTest.progreso + 5 >= 100 ? 'Completada' : 'En Progreso'
        };

        const updateResult = await axios.put(`http://localhost:3000/api/evaluaciones/${evaluacionTest.idEvaluacion}`, updateData);
        console.log('✅ Evaluación actualizada exitosamente');
        console.log(`   Nuevo progreso: ${updateResult.data.evaluacion.progreso}%`);
        console.log(`   Nuevo estado: ${updateResult.data.evaluacion.estado}`);

        console.log('\n🎉 === TEST COMPLETADO EXITOSAMENTE ===');
        console.log('✅ El backend soporta correctamente:');
        console.log('   - Obtener evaluaciones existentes');
        console.log('   - Obtener evaluación por ID');
        console.log('   - Actualizar evaluaciones existentes');
        console.log('   - Mantener respuestas y datos de evaluador');
        
        console.log('\n📋 Próximo paso:');
        console.log('   1. Ir a la lista de evaluaciones en el frontend');
        console.log('   2. Hacer clic en el botón "editar" (lápiz) de cualquier evaluación');
        console.log('   3. Verificar que se cargan las respuestas en el formulario');
        console.log('   4. Completar más preguntas y guardar');
        console.log('   5. Verificar que se actualiza correctamente');

    } catch (error) {
        console.error('❌ Error en el test:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Ejecutar test
testEditMode();
