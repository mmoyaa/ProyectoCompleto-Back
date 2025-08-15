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

async function verificarEstructuraTabla() {
    try {
        console.log('🔌 Conectando a SQL Server...');
        await sql.connect(dbConfig);
        console.log('✅ Conexión exitosa');

        // Verificar si la tabla existe
        console.log('\n🔍 Verificando si existe la tabla EvaluacionesSensoriales...');
        const tablaExiste = await new sql.Request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'EvaluacionesSensoriales'
        `);

        if (tablaExiste.recordset.length === 0) {
            console.log('❌ La tabla EvaluacionesSensoriales NO EXISTE');
            
            console.log('\n📋 Creando la tabla EvaluacionesSensoriales...');
            await new sql.Request().query(`
                CREATE TABLE EvaluacionesSensoriales (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    pacienteId INT NOT NULL,
                    fechaEvaluacion DATE NOT NULL,
                    nombreEvaluador NVARCHAR(255),
                    observaciones NVARCHAR(MAX),
                    respuestas NVARCHAR(MAX),
                    fechaCreacion DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (pacienteId) REFERENCES Pacientes(id)
                )
            `);
            console.log('✅ Tabla EvaluacionesSensoriales creada exitosamente');
        } else {
            console.log('✅ La tabla EvaluacionesSensoriales existe');
            
            // Verificar estructura de la tabla
            console.log('\n📊 Estructura de la tabla:');
            const estructura = await new sql.Request().query(`
                SELECT 
                    COLUMN_NAME,
                    DATA_TYPE,
                    IS_NULLABLE,
                    CHARACTER_MAXIMUM_LENGTH
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'EvaluacionesSensoriales'
                ORDER BY ORDINAL_POSITION
            `);

            estructura.recordset.forEach(col => {
                console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });
        }

        // Verificar registros existentes
        console.log('\n🔍 Registros existentes en la tabla:');
        const registros = await new sql.Request().query(`
            SELECT COUNT(*) as total FROM EvaluacionesSensoriales
        `);
        console.log(`📈 Total de registros: ${registros.recordset[0].total}`);

        if (registros.recordset[0].total > 0) {
            const ultimos = await new sql.Request().query(`
                SELECT TOP 3 * FROM EvaluacionesSensoriales 
                ORDER BY fechaCreacion DESC
            `);
            console.log('\n📋 Últimos registros:');
            ultimos.recordset.forEach((record, index) => {
                console.log(`${index + 1}. ID: ${record.id}, Paciente: ${record.pacienteId}, Fecha: ${record.fechaEvaluacion || record.fechaCreacion}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
        console.log('\n🔌 Conexión cerrada');
    }
}

verificarEstructuraTabla();
