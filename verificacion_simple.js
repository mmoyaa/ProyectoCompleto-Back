const { poolPromise } = require('./db');

async function verificarTabla() {
  console.log('🔍 VERIFICACIÓN SIMPLE DE TABLA EvaluacionesSensoriales');
  console.log('===================================================\n');

  try {
    const pool = await poolPromise;

    // 1. Verificar si la tabla existe
    console.log('1️⃣ Verificando que la tabla existe...');
    const tablaExiste = await pool.request().query(`
      SELECT COUNT(*) as existe 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'EvaluacionesSensoriales'
    `);

    if (tablaExiste.recordset[0].existe === 0) {
      console.log('❌ La tabla EvaluacionesSensoriales NO EXISTE');
      return;
    }
    console.log('✅ La tabla EvaluacionesSensoriales existe\n');

    // 2. Contar registros totales
    console.log('2️⃣ Contando registros en la tabla...');
    const conteo = await pool.request().query('SELECT COUNT(*) as total FROM EvaluacionesSensoriales');
    const total = conteo.recordset[0].total;
    console.log(`📊 Total de registros: ${total}\n`);

    // 3. Mostrar todos los registros si hay pocos
    if (total > 0 && total <= 10) {
      console.log('3️⃣ Mostrando todos los registros...');
      const todos = await pool.request().query(`
        SELECT 
          idEvaluacion,
          idPaciente,
          progreso,
          estado,
          evaluadorNombre,
          fechaCreacion,
          fechaActualizacion
        FROM EvaluacionesSensoriales 
        ORDER BY fechaCreacion DESC
      `);

      todos.recordset.forEach((reg, index) => {
        console.log(`   ${index + 1}. ID: ${reg.idEvaluacion} | Paciente: ${reg.idPaciente} | Progreso: ${reg.progreso}% | Estado: ${reg.estado}`);
        console.log(`      Evaluador: ${reg.evaluadorNombre || 'N/A'} | Creado: ${new Date(reg.fechaCreacion).toLocaleString('es-ES')}`);
      });
    } else if (total > 10) {
      console.log('3️⃣ Mostrando últimos 5 registros...');
      const ultimos = await pool.request().query(`
        SELECT TOP 5
          idEvaluacion,
          idPaciente,
          progreso,
          estado,
          evaluadorNombre,
          fechaCreacion
        FROM EvaluacionesSensoriales 
        ORDER BY fechaCreacion DESC
      `);

      ultimos.recordset.forEach((reg, index) => {
        console.log(`   ${index + 1}. ID: ${reg.idEvaluacion} | Paciente: ${reg.idPaciente} | Progreso: ${reg.progreso}% | Estado: ${reg.estado}`);
        console.log(`      Evaluador: ${reg.evaluadorNombre || 'N/A'} | Creado: ${new Date(reg.fechaCreacion).toLocaleString('es-ES')}`);
      });
    } else {
      console.log('3️⃣ La tabla está vacía (0 registros)\n');
    }

    // 4. Verificar estructura de la tabla
    console.log('\n4️⃣ Estructura de la tabla:');
    const estructura = await pool.request().query(`
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
      console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? '(' + col.CHARACTER_MAXIMUM_LENGTH + ')' : ''} | Nullable: ${col.IS_NULLABLE}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

verificarTabla();