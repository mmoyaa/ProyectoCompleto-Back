const { sql, poolPromise } = require('./db');

async function verificarTablas() {
  try {
    const pool = await poolPromise;
    
    console.log('🔍 Verificando estructura de base de datos...\n');
    
    // Verificar tabla paciente
    console.log('📋 Verificando tabla paciente...');
    const pacienteColumns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'paciente'
      ORDER BY ORDINAL_POSITION
    `);
    
    if (pacienteColumns.recordset.length > 0) {
      console.log('✅ Tabla paciente existe');
      console.log('Columnas:');
      pacienteColumns.recordset.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    } else {
      console.log('❌ Tabla paciente no existe');
    }
    
    console.log('\n📋 Verificando tabla representantes...');
    const representantesColumns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'representantes'
      ORDER BY ORDINAL_POSITION
    `);
    
    if (representantesColumns.recordset.length > 0) {
      console.log('✅ Tabla representantes existe');
      console.log('Columnas:');
      representantesColumns.recordset.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    } else {
      console.log('❌ Tabla representantes no existe');
    }
    
    console.log('\n📋 Verificando tabla paciente_representante...');
    const relacionColumns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'paciente_representante'
      ORDER BY ORDINAL_POSITION
    `);
    
    if (relacionColumns.recordset.length > 0) {
      console.log('✅ Tabla paciente_representante existe');
      console.log('Columnas:');
      relacionColumns.recordset.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    } else {
      console.log('❌ Tabla paciente_representante no existe');
    }
    
    // Verificar todas las tablas del sistema
    console.log('\n📋 Todas las tablas en la base de datos:');
    const todasTablas = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    todasTablas.recordset.forEach(tabla => {
      console.log(`  - ${tabla.TABLE_NAME}`);
    });
    
  } catch (error) {
    console.error('❌ Error al verificar tablas:', error);
  } finally {
    process.exit(0);
  }
}

verificarTablas();
