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
const { sql, poolPromise } = require("./db");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.get('/api/reparticion-comuna', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT rc.idReparticion, r.Nombre AS NombreReparticion,
             rc.idComuna, c.Nombre AS NombreComuna,
             rc.fechaExpiracion
      FROM ReparticionComuna rc
      INNER JOIN CMReparticion r ON rc.idReparticion = r.idReparticion
      INNER JOIN CMComuna c ON rc.idComuna = c.idComuna
      WHERE rc.fechaExpiracion IS NULL
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las relaciones' });
  }
});
app.post('/api/reparticion-comuna/expirar', async (req, res) => {
  try {
    const { idReparticion, idComuna } = req.body;
    const pool = await poolPromise;

    // Actualiza fechaExpiracion a fecha actual
    await pool.request()
      .input('idReparticion', sql.Int, idReparticion)
      .input('idComuna', sql.Int, idComuna)
      .input('fechaExpiracion', sql.DateTime, new Date())
      .query(`
        UPDATE ReparticionComuna
        SET fechaExpiracion = @fechaExpiracion
        WHERE idReparticion = @idReparticion AND idComuna = @idComuna
      `);

    res.status(200).json({ message: 'Relación expirada correctamente' });
  } catch (error) {
    console.error('Error al expirar relación:', error);
    res.status(500).json({ error: 'Error al expirar relación' });
  }
});
// app.post('/api/reparticion-comuna/expirar', async (req, res) => {
//   try {
//     const { idReparticion, idComuna } = req.body;
//     const pool = await poolPromise;

//     // Llamada al procedimiento almacenado
//     await pool.request()
//       .input('idReparticion', sql.Int, idReparticion)
//       .input('idComuna', sql.Int, idComuna)
//       .execute('ExpirarRelacionReparticionComuna');

//     res.status(200).json({ message: 'Relación expirada correctamente usando PA' });
//   } catch (error) {
//     console.error('Error al expirar relación con PA:', error);
//     res.status(500).json({ error: 'Error al expirar relación' });
//   }
// });
app.post('/api/reparticion-comuna', async (req, res) => {
  try {
    const { idReparticion, idComuna } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input('idReparticion', sql.Int, idReparticion)
      .input('idComuna', sql.Int, idComuna)
      .query(`
        INSERT INTO ReparticionComuna (idReparticion, idComuna)
        VALUES (@idReparticion, @idComuna)
      `);

    res.status(200).json({ message: 'Relación guardada correctamente.' });
  } catch (err) {
    console.error('Error al guardar relación:', err);
    res.status(500).json({ error: 'No se pudo guardar la relación.' });
  }
});
app.get("/api/reparticion", async (req, res) => {
  try {
    const pool = await poolPromise;

    if (!pool) {
      throw new Error("Conexión con la base de datos no disponible.");
    }

    const result = await pool.request().query("SELECT * FROM CMReparticion");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error completo de conexión:", err);
    res.status(500).json({ error: "Error al acceder a la base de datos." });
  }
});

app.get("/api/comunas", async (req, res) => {
  try {
    const pool = await poolPromise;

    if (!pool) {
      throw new Error("Conexión con la base de datos no disponible.");
    }

    const result = await pool
      .request()
      .query("select * from NuevoCCMM.dbo.CMComuna");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error completo de conexión:", err);
    res.status(500).json({ error: "Error al acceder a la base de datos." });
  }
});

app.post("/api/comunas", (req, res) => {
  const nuevaComuna = req.body;

  // Validar datos (opcional)
  if (!nuevaComuna || !nuevaComuna.name || !nuevaComuna.population) {
    return res.status(400).json({ message: "Datos incompletos o inválidos" });
  }

  // Agregar a la base de datos simulada
  comunas.push(nuevaComuna);

  // Responder con éxito
  res.status(201).json({
    message: "Comuna creada exitosamente",
    comuna: nuevaComuna,
  });
});

app.get("/api/sector", async (req, res) => {
  try {
    const pool = await poolPromise;

    if (!pool) {
      throw new Error("Conexión con la base de datos no disponible.");
    }

    const result = await pool
      .request()
      .query("  select * from NuevoCCMM.dbo.CMSector");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error completo de conexión:", err);
    res.status(500).json({ error: "Error al acceder a la base de datos." });
  }
});

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
