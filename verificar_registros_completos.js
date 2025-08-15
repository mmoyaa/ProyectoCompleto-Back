const sql = require('mssql');

const dbConfig = {
    user: 'ccmm_user',
    password: 'CcmmSegura123!',
    server: 'localhost',
    database: 'NuevoCCMM',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 30000,
        requestTimeout: 30000
    }
};

async function verificarRegistrosRecientes() {
    try {
        console.log('🔌 Conectando a SQL Server...');
        await sql.connect(dbConfig);
        console.log('✅ Conexión exitosa');

        // Consultar los últimos 10 registros con detalles completos
        console.log('\n📋 Últimos 10 registros en EvaluacionesSensoriales:');
        const result = await new sql.Request().query(`
            SELECT TOP 10 
                idEvaluacion,
                idPaciente,
                fechaEvaluacion,
                progreso,
                evaluadorNombre,
                observaciones,
                estado,
                fechaCreacion,
                LEN(respuestas) as longitudRespuestas
            FROM EvaluacionesSensoriales 
            ORDER BY fechaCreacion DESC
        `);

        result.recordset.forEach((record, index) => {
            console.log(`${index + 1}. ID: ${record.idEvaluacion} | Paciente: ${record.idPaciente} | Progreso: ${record.progreso}% | Evaluador: ${record.evaluadorNombre} | Estado: ${record.estado}`);
            console.log(`   Fecha: ${record.fechaCreacion.toLocaleString()} | Respuestas: ${record.longitudRespuestas} caracteres`);
            console.log(`   Observaciones: ${record.observaciones || 'Sin observaciones'}`);
            console.log('   ---');
        });

        // Contar registros por fecha de hoy
        console.log('\n📊 Registros creados hoy:');
        const hoyResult = await new sql.Request().query(`
            SELECT COUNT(*) as registrosHoy
            FROM EvaluacionesSensoriales 
            WHERE CAST(fechaCreacion AS DATE) = CAST(GETDATE() AS DATE)
        `);
        
        console.log(`📈 Total de registros creados hoy: ${hoyResult.recordset[0].registrosHoy}`);

        // Mostrar estadísticas generales
        console.log('\n📊 Estadísticas generales:');
        const statsResult = await new sql.Request().query(`
            SELECT 
                COUNT(*) as totalRegistros,
                COUNT(DISTINCT idPaciente) as pacientesUnicos,
                AVG(progreso) as progresoPromedio,
                MIN(fechaCreacion) as primeraEvaluacion,
                MAX(fechaCreacion) as ultimaEvaluacion
            FROM EvaluacionesSensoriales
        `);
        
        const stats = statsResult.recordset[0];
        console.log(`📝 Total de evaluaciones: ${stats.totalRegistros}`);
        console.log(`👥 Pacientes únicos: ${stats.pacientesUnicos}`);
        console.log(`📈 Progreso promedio: ${Math.round(stats.progresoPromedio)}%`);
        console.log(`📅 Primera evaluación: ${stats.primeraEvaluacion.toLocaleString()}`);
        console.log(`🕐 Última evaluación: ${stats.ultimaEvaluacion.toLocaleString()}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
        console.log('\n🔌 Conexión cerrada');
    }
}

verificarRegistrosRecientes();
