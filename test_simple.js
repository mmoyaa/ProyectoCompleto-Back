// Prueba simple para verificar que el endpoint funciona
// Ejecutar con: node test_simple.js

const http = require('http');

function testEndpoint(path, callback) {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            callback(null, {
                statusCode: res.statusCode,
                data: data
            });
        });
    });

    req.on('error', (err) => {
        callback(err, null);
    });

    req.end();
}

console.log('🧪 Prueba Simple de API...');
console.log('========================');

// Test 1: Verificar estadísticas
console.log('\n📊 1. Probando endpoint de estadísticas...');
testEndpoint('/api/evaluaciones-stats', (err, result) => {
    if (err) {
        console.log('❌ Error:', err.message);
        return;
    }
    
    if (result.statusCode === 200) {
        console.log('✅ Endpoint de estadísticas funciona');
        try {
            const stats = JSON.parse(result.data);
            console.log(`📋 Total evaluaciones: ${stats.totalEvaluaciones}`);
            console.log(`👥 Pacientes con evaluaciones: ${stats.pacientesConEvaluaciones}`);
            console.log(`📈 Progreso promedio: ${stats.progresoPromedio || 0}%`);
        } catch (e) {
            console.log('📄 Respuesta:', result.data);
        }
    } else {
        console.log(`❌ Error HTTP ${result.statusCode}: ${result.data}`);
    }

    // Test 2: Obtener evaluaciones
    console.log('\n📋 2. Probando endpoint de evaluaciones...');
    testEndpoint('/api/evaluaciones', (err, result) => {
        if (err) {
            console.log('❌ Error:', err.message);
            return;
        }
        
        if (result.statusCode === 200) {
            console.log('✅ Endpoint de evaluaciones funciona');
            try {
                const evaluaciones = JSON.parse(result.data);
                console.log(`📊 Se encontraron ${evaluaciones.length} evaluaciones`);
                
                if (evaluaciones.length > 0) {
                    const primera = evaluaciones[0];
                    console.log('🔍 Primera evaluación:');
                    console.log(`   ID: ${primera.idEvaluacion}`);
                    console.log(`   Paciente: ${primera.nombreCompleto || 'N/A'}`);
                    console.log(`   Progreso: ${primera.progreso}%`);
                    console.log(`   Estado: ${primera.estado}`);
                }
            } catch (e) {
                console.log('📄 Respuesta:', result.data.substring(0, 200) + '...');
            }
        } else {
            console.log(`❌ Error HTTP ${result.statusCode}: ${result.data}`);
        }

        console.log('\n🎉 Prueba completada!');
        console.log('💡 Si ambos endpoints funcionan, el sistema de guardar evaluaciones está operativo');
    });
});

console.log('⏳ Esperando respuesta del servidor...');
