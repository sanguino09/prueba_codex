require('dotenv').config();
const express = require('express');
const path = require('path');
const { sequelize, Trip } = require('./models');
const { register, login, verifyToken } = require('./auth');

const app = express();
app.use(express.json());


app
  .route('/api/register')
  .post(async (req, res) => {
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
  })
  .all((req, res) => res.status(405).json({ error: 'Método no permitido' }));

app
  .route('/api/login')
  .post(async (req, res) => {
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
  })
  .all((req, res) => res.status(405).json({ error: 'Método no permitido' }));


app.post('/api/trips', verifyToken, async (req, res) => {
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

app.get('/api/trips', verifyToken, async (req, res) => {
  try {
    const trips = await Trip.findAll({ where: { user_id: req.user.id } });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Return JSON 404 for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Serve static files after API routes so they don't override /api paths
app.use(express.static(path.join(__dirname, '..', 'public')));


const PORT = process.env.PORT || 3000;
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

module.exports = app;
