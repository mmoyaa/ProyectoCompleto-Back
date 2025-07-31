// controllers/usersController.js
const { poolConnect, pool } = require('../db');

// GET /users
const getUsers = async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query('SELECT * FROM Usuarios'); // Cambia 'Usuarios' por tu tabla real
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).send('Error del servidor');
  }
};

// POST /users
const createUser = async (req, res) => {
  const { nombre, correo } = req.body;
  try {
    await poolConnect;
    const request = pool.request();
    request.input('nombre', nombre);
    request.input('correo', correo);
    await request.query('INSERT INTO Usuarios (nombre, correo) VALUES (@nombre, @correo)');
    res.status(201).send('Usuario creado');
  } catch (err) {
    console.error('Error al crear usuario:', err);
    res.status(500).send('Error al insertar');
  }
};





module.exports = {
  getUsers,
  createUser
};