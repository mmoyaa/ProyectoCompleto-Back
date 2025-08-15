// Script de prueba para verificar que las evaluaciones se guardan correctamente
// Ejecutar con: node test_guardar_evaluacion.js

const sql = require('mssql');
require('dotenv').config();

// Configuración de la base de datos
const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'tu_password',
    server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.DB_NAME || 'NuevoCCMM',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function testGuardarEvaluacion() {
    try {
        console.log('🔌 Conectando a SQL Server...');
        const pool = await sql.connect(config);
        console.log('✅ Conexión exitosa');

        // 1. Verificar que existe la tabla EvaluacionesSensoriales
        console.log('\n📋 1. Verificando tabla EvaluacionesSensoriales...');
        const tableExists = await pool.request().query(`
            SELECT name FROM sys.tables WHERE name = 'EvaluacionesSensoriales'
        `);
        
        if (tableExists.recordset.length === 0) {
            console.log('❌ La tabla EvaluacionesSensoriales NO existe');
            console.log('💡 Ejecuta primero el script de creación de tabla');
            return;
        }
        console.log('✅ Tabla EvaluacionesSensoriales existe');

        // 2. Verificar que existe al menos un paciente
        console.log('\n👥 2. Verificando pacientes disponibles...');
        const pacientes = await pool.request().query('SELECT TOP 3 idPaciente, nombre, apellidoPaterno FROM paciente');
        
        if (pacientes.recordset.length === 0) {
            console.log('❌ No hay pacientes en la base de datos');
            console.log('💡 Necesitas crear al menos un paciente primero');
            return;
        }
        
        console.log('✅ Pacientes encontrados:');
        pacientes.recordset.forEach(p => {
            console.log(`   - ID: ${p.idPaciente}, Nombre: ${p.nombre} ${p.apellidoPaterno}`);
        });

        const pacientePrueba = pacientes.recordset[0];

        // 3. Crear una evaluación de prueba
        console.log('\n💾 3. Creando evaluación de prueba...');
        const evaluacionPrueba = {
            idPaciente: pacientePrueba.idPaciente,
            progreso: 45.75,
            respuestas: JSON.stringify({
                "pregunta1": "Muy bien",
                "pregunta2": "Regular", 
                "pregunta3": "Excelente",
                "seccion": "Prueba automatizada",
                "timestamp": new Date().toISOString()
            }),
            evaluadorNombre: 'Sistema de Pruebas',
            evaluadorCorreo: 'test@sistema.com',
            observaciones: 'Evaluación creada automáticamente para testing',
            estado: 'En Progreso'
        };

        const insertResult = await pool.request()
            .input('idPaciente', sql.Int, evaluacionPrueba.idPaciente)
            .input('progreso', sql.Decimal(5, 2), evaluacionPrueba.progreso)
            .input('respuestas', sql.NVarChar(sql.MAX), evaluacionPrueba.respuestas)
            .input('evaluadorNombre', sql.NVarChar(100), evaluacionPrueba.evaluadorNombre)
            .input('evaluadorCorreo', sql.NVarChar(100), evaluacionPrueba.evaluadorCorreo)
            .input('observaciones', sql.NVarChar(500), evaluacionPrueba.observaciones)
            .input('estado', sql.NVarChar(20), evaluacionPrueba.estado)
            .query(`
                INSERT INTO EvaluacionesSensoriales 
                (idPaciente, progreso, respuestas, evaluadorNombre, evaluadorCorreo, observaciones, estado, fechaEvaluacion)
                VALUES (@idPaciente, @progreso, @respuestas, @evaluadorNombre, @evaluadorCorreo, @observaciones, @estado, GETDATE());
                
                SELECT SCOPE_IDENTITY() AS idEvaluacion;
            `);

        const nuevaEvaluacionId = insertResult.recordset[0].idEvaluacion;
        console.log(`✅ Evaluación creada con ID: ${nuevaEvaluacionId}`);

        // 4. Verificar que se guardó correctamente
        console.log('\n🔍 4. Verificando que se guardó correctamente...');
        const evaluacionGuardada = await pool.request()
            .input('idEvaluacion', sql.Int, nuevaEvaluacionId)
            .query(`
                SELECT 
                    e.idEvaluacion,
                    e.idPaciente,
                    e.progreso,
                    e.respuestas,
                    e.evaluadorNombre,
                    e.evaluadorCorreo,
                    e.observaciones,
                    e.estado,
                    e.fechaEvaluacion,
                    e.fechaCreacion,
                    p.nombre + ' ' + p.apellidoPaterno AS nombrePaciente
                FROM EvaluacionesSensoriales e
                INNER JOIN paciente p ON e.idPaciente = p.idPaciente
                WHERE e.idEvaluacion = @idEvaluacion
            `);

        if (evaluacionGuardada.recordset.length === 0) {
            console.log('❌ ERROR: La evaluación no se encontró después de crearla');
            return;
        }

        const eval_guardada = evaluacionGuardada.recordset[0];
        console.log('✅ Evaluación verificada:');
        console.log(`   📊 ID: ${eval_guardada.idEvaluacion}`);
        console.log(`   👤 Paciente: ${eval_guardada.nombrePaciente} (ID: ${eval_guardada.idPaciente})`);
        console.log(`   📈 Progreso: ${eval_guardada.progreso}%`);
        console.log(`   👨‍⚕️ Evaluador: ${eval_guardada.evaluadorNombre}`);
        console.log(`   📧 Email: ${eval_guardada.evaluadorCorreo}`);
        console.log(`   📝 Estado: ${eval_guardada.estado}`);
        console.log(`   📅 Fecha: ${eval_guardada.fechaEvaluacion}`);
        console.log(`   💬 Observaciones: ${eval_guardada.observaciones}`);

        // 5. Verificar que las respuestas JSON se guardaron correctamente
        console.log('\n📄 5. Verificando respuestas JSON...');
        try {
            const respuestasObj = JSON.parse(eval_guardada.respuestas);
            console.log('✅ Respuestas JSON válidas:');
            Object.entries(respuestasObj).forEach(([key, value]) => {
                console.log(`   ${key}: ${value}`);
            });
        } catch (error) {
            console.log('❌ ERROR: Las respuestas JSON no son válidas');
            console.log('Contenido:', eval_guardada.respuestas);
        }

        // 6. Probar actualización
        console.log('\n🔄 6. Probando actualización de evaluación...');
        await pool.request()
            .input('idEvaluacion', sql.Int, nuevaEvaluacionId)
            .input('progreso', sql.Decimal(5, 2), 75.25)
            .input('estado', sql.NVarChar(20), 'Completada')
            .query(`
                UPDATE EvaluacionesSensoriales 
                SET progreso = @progreso, estado = @estado, fechaActualizacion = GETDATE()
                WHERE idEvaluacion = @idEvaluacion
            `);

        console.log('✅ Evaluación actualizada correctamente');

        // 7. Mostrar estadísticas finales
        console.log('\n📊 7. Estadísticas finales...');
        const stats = await pool.request().query(`
            SELECT 
                COUNT(*) as totalEvaluaciones,
                COUNT(DISTINCT idPaciente) as pacientesConEvaluaciones,
                AVG(progreso) as progresoPromedio,
                COUNT(CASE WHEN estado = 'Completada' THEN 1 END) as completadas,
                COUNT(CASE WHEN estado = 'En Progreso' THEN 1 END) as enProgreso
            FROM EvaluacionesSensoriales
        `);

        const estadisticas = stats.recordset[0];
        console.log('📊 Estadísticas actuales:');
        console.log(`   📋 Total evaluaciones: ${estadisticas.totalEvaluaciones}`);
        console.log(`   👥 Pacientes con evaluaciones: ${estadisticas.pacientesConEvaluaciones}`);
        console.log(`   📈 Progreso promedio: ${estadisticas.progresoPromedio?.toFixed(2)}%`);
        console.log(`   ✅ Completadas: ${estadisticas.completadas}`);
        console.log(`   🔄 En progreso: ${estadisticas.enProgreso}`);

        console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
        console.log('✅ El sistema de guardar evaluaciones está funcionando correctamente');

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error);
        
        if (error.message.includes('Invalid object name')) {
            console.log('\n💡 Sugerencia: La tabla no existe. Ejecuta el script de creación primero.');
        } else if (error.message.includes('permission denied')) {
            console.log('\n💡 Sugerencia: Problema de permisos. Verifica las credenciales de la base de datos.');
        } else if (error.message.includes('FOREIGN KEY constraint')) {
            console.log('\n💡 Sugerencia: El paciente especificado no existe o hay un problema con la FK.');
        }
    } finally {
        try {
            await sql.close();
            console.log('\n🔌 Conexión cerrada');
        } catch (err) {
            console.error('Error al cerrar conexión:', err);
        }
    }
}

// Ejecutar las pruebas
console.log('🚀 Iniciando pruebas del sistema de evaluaciones...');
console.log('==========================================');
testGuardarEvaluacion();
