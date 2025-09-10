require('dotenv').config();
const express = require('express');
const { sequelize, Trip } = require('./models');
const { register, login, verifyToken } = require('./auth');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await register(username, password);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const token = await login(username, password);
    res.json({ token });
  } catch (err) {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

app.post('/api/trips', verifyToken, async (req, res) => {
  const { country_code, visited_at } = req.body;
  try {
    const trip = await Trip.create({ user_id: req.user.id, country_code, visited_at });
    res.status(201).json(trip);
  } catch (err) {
    res.status(400).json({ error: err.message });
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

const PORT = process.env.PORT || 3000;
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

module.exports = app;
