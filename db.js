

const sql = require('mssql');

// const config = {
//   server: 'localhost',
//   database: 'NuevoCCMM',
//   user: 'ccmm_user',
//   password: 'CcmmSegura123!',
//   port: 1433,
//   authentication: {
//     type: 'default'
//   },
//   options: {
//     encrypt: false,
//     trustServerCertificate: true
//   }
// };






const config = {
  user: 'ccmm_user',
  password: 'CcmmSegura123!',
  server: 'localhost',           // o tu IP/nombre de servidor
  database: 'NuevoCCMM',
  options: {
    encrypt: false,              // true si estás usando Azure
    trustServerCertificate: true
  }
};
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ Conexión a la base de datos exitosa');
    return pool;
  })
  .catch(err => {
    console.error('❌ Error de conexión a la base de datos:', err);
  });

module.exports = {
  sql, poolPromise
};





// -------------------------------------------------------
