const express = require('express');
const { sequelize, User } = require('./models');
const { addTrip, getTrips } = require('./controllers/tripsController');
const { register, login, verifyToken } = require('./auth');

const app = express();
app.use(express.json());

// Register user
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.create({ username, password });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username, password } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trips routes
app.post('/api/trips', addTrip);
app.get('/api/trips', getTrips);

const PORT = process.env.PORT || 3000;
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});
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

const trips = [
  { id: 1, destination: 'Paris' },
  { id: 2, destination: 'Tokyo' }
];

app.get('/api/trips', verifyToken, (req, res) => {
  res.json(trips);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
