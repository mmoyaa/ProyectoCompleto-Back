const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'NuevoCCMM',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 1433,
  authentication: {
    type: 'default'
  },
  options: {
    encrypt: process.env.DB_ENCRYPT !== 'false',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false'
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
