const { Trip } = require('../models');

// Insert a new trip
async function addTrip(req, res) {
  const { userId, countryCode } = req.body;
  try {
    const trip = await Trip.create({ user_id: userId, country_code: countryCode });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Retrieve trips, optionally filtered by user
async function getTrips(req, res) {
  const { userId } = req.query;
  const where = {};
  if (userId) {
    where.user_id = userId;
  }
  try {
    const trips = await Trip.findAll({ where });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  addTrip,
  getTrips,
};
