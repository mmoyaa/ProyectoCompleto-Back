// Script para crear la tabla EvaluacionesSensoriales desde Node.js
// Ejecutar con: node crear_tabla_desde_nodejs.js

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

async function crearTablaEvaluaciones() {
    try {
        console.log('🔌 Conectando a SQL Server...');
        const pool = await sql.connect(config);
        console.log('✅ Conexión exitosa a la base de datos');

        // Verificar si la tabla ya existe
        console.log('🔍 Verificando si la tabla ya existe...');
        const checkTable = await pool.request().query(`
            SELECT name FROM sys.tables WHERE name = 'EvaluacionesSensoriales'
        `);

        if (checkTable.recordset.length > 0) {
            console.log('⚠️  La tabla EvaluacionesSensoriales ya existe');
            
            // Mostrar estructura actual
            const structure = await pool.request().query(`
                SELECT 
                    COLUMN_NAME,
                    DATA_TYPE,
                    IS_NULLABLE,
                    COLUMN_DEFAULT
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'EvaluacionesSensoriales'
                ORDER BY ORDINAL_POSITION
            `);
            
            console.log('📋 Estructura actual de la tabla:');
            console.table(structure.recordset);
            return;
        }

        // Crear la tabla
        console.log('🏗️  Creando tabla EvaluacionesSensoriales...');
        const createTableQuery = `
            CREATE TABLE [dbo].[EvaluacionesSensoriales] (
                [idEvaluacion] [int] IDENTITY(1,1) NOT NULL,
                [idPaciente] [int] NOT NULL,
                [fechaEvaluacion] [datetime] NOT NULL DEFAULT GETDATE(),
                [progreso] [decimal](5,2) NOT NULL DEFAULT 0,
                [respuestas] [nvarchar](MAX) NOT NULL,
                [evaluadorNombre] [nvarchar](100) NULL,
                [evaluadorCorreo] [nvarchar](100) NULL,
                [observaciones] [nvarchar](500) NULL,
                [fechaCreacion] [datetime] NOT NULL DEFAULT GETDATE(),
                [fechaActualizacion] [datetime] NULL,
                [estado] [nvarchar](20) NOT NULL DEFAULT 'En Progreso',
                CONSTRAINT [PK_EvaluacionesSensoriales] PRIMARY KEY CLUSTERED ([idEvaluacion] ASC)
            );
        `;
        
        await pool.request().query(createTableQuery);
        console.log('✅ Tabla EvaluacionesSensoriales creada exitosamente');

        // Crear índices
        console.log('📊 Creando índices...');
        
        await pool.request().query(`
            CREATE NONCLUSTERED INDEX [IX_EvaluacionesSensoriales_idPaciente] 
            ON [dbo].[EvaluacionesSensoriales] ([idPaciente] ASC);
        `);
        console.log('✅ Índice IX_EvaluacionesSensoriales_idPaciente creado');

        await pool.request().query(`
            CREATE NONCLUSTERED INDEX [IX_EvaluacionesSensoriales_fechaEvaluacion] 
            ON [dbo].[EvaluacionesSensoriales] ([fechaEvaluacion] DESC);
        `);
        console.log('✅ Índice IX_EvaluacionesSensoriales_fechaEvaluacion creado');

        // Verificar que existe al menos un paciente para testing
        console.log('🔍 Verificando pacientes existentes...');
        const pacientes = await pool.request().query('SELECT TOP 1 idPaciente, nombre, apellidoPaterno FROM paciente');
        
        if (pacientes.recordset.length === 0) {
            console.log('⚠️  No hay pacientes en la base de datos');
            console.log('💡 Necesitarás crear al menos un paciente para poder crear evaluaciones');
        } else {
            console.log('✅ Paciente encontrado:', pacientes.recordset[0]);
            
            // Insertar un registro de prueba
            console.log('🧪 Insertando registro de prueba...');
            const testResult = await pool.request()
                .input('idPaciente', sql.Int, pacientes.recordset[0].idPaciente)
                .input('progreso', sql.Decimal(5, 2), 15.75)
                .input('respuestas', sql.NVarChar(sql.MAX), JSON.stringify({
                    "pregunta1": "Respuesta de prueba 1",
                    "pregunta2": "Respuesta de prueba 2",
                    "section": "Testing inicial"
                }))
                .input('evaluadorNombre', sql.NVarChar(100), 'Sistema de Pruebas')
                .input('evaluadorCorreo', sql.NVarChar(100), 'sistema@testing.com')
                .input('observaciones', sql.NVarChar(500), 'Registro creado automáticamente para testing')
                .query(`
                    INSERT INTO EvaluacionesSensoriales 
                    (idPaciente, progreso, respuestas, evaluadorNombre, evaluadorCorreo, observaciones, estado)
                    VALUES (@idPaciente, @progreso, @respuestas, @evaluadorNombre, @evaluadorCorreo, @observaciones, 'En Progreso');
                    
                    SELECT SCOPE_IDENTITY() AS idEvaluacion;
                `);
            
            console.log('✅ Registro de prueba creado con ID:', testResult.recordset[0].idEvaluacion);
        }

        // Mostrar estructura final
        console.log('📋 Estructura final de la tabla:');
        const finalStructure = await pool.request().query(`
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                IS_NULLABLE,
                COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'EvaluacionesSensoriales'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.table(finalStructure.recordset);

        console.log('🎉 ¡Tabla EvaluacionesSensoriales lista para usar!');
        console.log('💡 Ahora puedes probar las rutas API en http://localhost:3000/api/evaluaciones');

    } catch (error) {
        console.error('❌ Error al crear la tabla:', error);
        
        if (error.message.includes('permission denied')) {
            console.log('');
            console.log('🔧 Sugerencias para resolver permisos:');
            console.log('1. Ejecutar como administrador');
            console.log('2. Verificar credenciales en el archivo .env');
            console.log('3. Otorgar permisos CREATE TABLE al usuario');
            console.log('4. Usar el archivo CREAR_TABLA_SIMPLE.sql en SSMS');
        }
    } finally {
        try {
            await sql.close();
            console.log('🔌 Conexión cerrada');
        } catch (err) {
            console.error('Error al cerrar conexión:', err);
        }
    }
}

// Ejecutar el script
console.log('🚀 Iniciando creación de tabla EvaluacionesSensoriales...');
console.log('');
crearTablaEvaluaciones();
