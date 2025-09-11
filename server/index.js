require('dotenv').config();
const express = require('express');
const path = require('path');
const { sequelize, Trip } = require('./models');
const { register, login, verifyToken } = require('./auth');

const app = express();
app.use(express.json());

// Router para endpoints de la API
const api = express.Router();

// Registro de usuarios
api.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  try {
    const user = await register(username, password);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Inicio de sesión
api.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  try {
    const token = await login(username, password);
    res.json({ token });
  } catch (err) {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// Rutas protegidas de viajes
api.post('/trips', verifyToken, async (req, res) => {
  const { country_code, visited_at } = req.body;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!country_code || !dateRegex.test(visited_at)) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }
  try {
    const trip = await Trip.create({ user_id: req.user.id, country_code, visited_at });
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

api.get('/trips', verifyToken, async (req, res) => {
  try {
    const trips = await Trip.findAll({ where: { user_id: req.user.id } });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 404 para rutas no existentes dentro de /api
api.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Montar el router bajo /api
app.use('/api', api);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '..', 'public')));


const PORT = process.env.PORT || 3000;
sequelize
  // Ensure database schema stays in sync with the models, adding any new
  // columns (e.g. `visited_at` in `Trip`) without requiring a manual migration
  // or deleting existing data.
  .sync({ alter: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to sync database:', err);
  });

module.exports = app;
