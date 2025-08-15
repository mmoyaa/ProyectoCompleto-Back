const sql = require('mssql');

// Configuración de la base de datos
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

async function testDirectSave() {
    try {
        console.log('🔌 Conectando a SQL Server...');
        await sql.connect(dbConfig);
        console.log('✅ Conexión exitosa');

        // Datos de prueba exactos
        const evaluacionData = {
            idPaciente: 1,
            fechaEvaluacion: new Date(),
            progreso: 37.5,
            evaluadorNombre: 'Test Evaluador Frontend',
            evaluadorCorreo: 'test@evaluador.com',
            observaciones: 'Prueba desde frontend mejorado',
            estado: 'completada',
            respuestas: [
                { pregunta: 'pregunta47', respuesta: 'frecuentemente', puntaje: 4 },
                { pregunta: 'pregunta48', respuesta: 'ocasionalmente', puntaje: 2 },
                { pregunta: 'pregunta49', respuesta: 'nunca', puntaje: 1 }
            ]
        };

        console.log('📝 Datos a insertar:', JSON.stringify(evaluacionData, null, 2));

        // Query de inserción con los campos correctos
        const query = `
            INSERT INTO EvaluacionesSensoriales 
            (idPaciente, fechaEvaluacion, progreso, respuestas, evaluadorNombre, evaluadorCorreo, observaciones, estado, fechaCreacion)
            VALUES (@idPaciente, @fechaEvaluacion, @progreso, @respuestas, @evaluadorNombre, @evaluadorCorreo, @observaciones, @estado, GETDATE())
        `;

        const request = new sql.Request();
        request.input('idPaciente', sql.Int, evaluacionData.idPaciente);
        request.input('fechaEvaluacion', sql.DateTime, evaluacionData.fechaEvaluacion);
        request.input('progreso', sql.Decimal(5,2), evaluacionData.progreso);
        request.input('respuestas', sql.NVarChar(sql.MAX), JSON.stringify(evaluacionData.respuestas));
        request.input('evaluadorNombre', sql.NVarChar(100), evaluacionData.evaluadorNombre);
        request.input('evaluadorCorreo', sql.NVarChar(100), evaluacionData.evaluadorCorreo);
        request.input('observaciones', sql.NVarChar(500), evaluacionData.observaciones);
        request.input('estado', sql.NVarChar(20), evaluacionData.estado);

        console.log('🚀 Ejecutando INSERT...');
        const result = await request.query(query);
        
        console.log('✅ INSERT exitoso!');
        console.log('📊 Filas afectadas:', result.rowsAffected[0]);

        // Verificar que se guardó
        console.log('\n🔍 Verificando registros guardados...');
        const verifyResult = await new sql.Request().query(`
            SELECT TOP 5 * FROM EvaluacionesSensoriales 
            ORDER BY fechaCreacion DESC
        `);

        console.log('📋 Últimos registros:');
        verifyResult.recordset.forEach((record, index) => {
            console.log(`${index + 1}. ID: ${record.idEvaluacion}, Paciente: ${record.idPaciente}, Fecha: ${record.fechaEvaluacion}, Evaluador: ${record.evaluadorNombre}`);
        });

        console.log(`\n📈 Total de registros mostrados: ${verifyResult.recordset.length}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
        console.log('🔌 Conexión cerrada');
    }
}

// Ejecutar el test
testDirectSave();
