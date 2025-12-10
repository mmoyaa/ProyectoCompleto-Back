// index.js
// const express = require('express');
// require('dotenv').config();
// const { sql, pool } = require('./db');

// const app = express();
// const PORT = process.env.PORT || 3000;

// Middleware
// app.use(express.json());

// Rutas
// const usersRouter = require('./routes/users');
// app.use('/users', usersRouter);

// app.get('/', (req, res) => {
//     res.send('¡Backend funcionando correctamente!');
//   });

//   app.get('/api/reparticion', async (req, res) => {
//     try {
//       const poolClient = await pool;  // Espera la conexión a la base de datos
//       const result = await poolClient.request().query('SELECT * FROM CMReparticion');
//       res.status(200).json(result.recordset);
//     } catch (err) {
//       console.error('Error de conexión o consulta:', err);  // Log completo del error
//       res.status(500).json({ error: 'Error al ejecutar la consulta', details: err });
//     }
//   });

// // Servidor
// app.listen(PORT, () => {
//   console.log(`Servidor corriendo en http://localhost:${PORT}`);
// });

const express = require("express");
const cors = require("cors");

// Importar las rutas organizadas
const getRoutes = require('./routes/getRoutes');
const postRoutes = require('./routes/postRoutes');
const expireRoutes = require('./routes/expireRoutes');
const setupRoutes = require('./routes/setupRoutes');
const evaluacionesRoutes = require('./routes/evaluacionesRoutes');
const documentosRoutes = require('./routes/documentosRoutes'); // Nueva ruta para documentos

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Usar las rutas organizadas
app.use('/api', getRoutes);           // Rutas GET
app.use('/api', postRoutes);          // Rutas POST
app.use('/api', expireRoutes);        // Rutas de expirar
app.use('/api', setupRoutes);         // Rutas de configuración/setup
app.use('/api', evaluacionesRoutes);  // Rutas de evaluaciones sensoriales
app.use('/api', documentosRoutes);    // Rutas de gestión de documentos

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
