// Script para obtener pacientes disponibles
const { poolPromise } = require('./db');

async function obtenerPacientes() {
  try {
    console.log('📋 Obteniendo pacientes disponibles...\n');
    
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        idPaciente, 
        nombre, 
        apellidoPaterno, 
        apellidoMaterno, 
        rut,
        telefono,
        correo
      FROM paciente
      ORDER BY idPaciente
    `);
    
    if (result.recordset.length === 0) {
      console.log('❌ No hay pacientes en la base de datos');
      return;
    }
    
    console.log(`✅ Se encontraron ${result.recordset.length} paciente(s):\n`);
    
    result.recordset.forEach((paciente, index) => {
      console.log(`${index + 1}. ID: ${paciente.idPaciente}`);
      console.log(`   Nombre: ${paciente.nombre} ${paciente.apellidoPaterno} ${paciente.apellidoMaterno || ''}`);
      console.log(`   RUT: ${paciente.rut}`);
      console.log(`   Teléfono: ${paciente.telefono || 'N/A'}`);
      console.log(`   Correo: ${paciente.correo || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error al obtener pacientes:', error);
  } finally {
    process.exit(0);
  }
}

obtenerPacientes();
