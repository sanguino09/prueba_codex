const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite. Allow the database location to be
// configured via an environment variable so that deployments on
// platforms with read-only filesystems (e.g. Vercel) can store the
// SQLite file in a writable directory like `/tmp`.
const defaultStorage =
  process.env.NODE_ENV === 'production'
    ? '/tmp/database.sqlite'
    : path.join(__dirname, '..', 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DATABASE_PATH || defaultStorage,
  logging: false,
});

// User model
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Trip model
const Trip = sequelize.define('Trip', {
  country_code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  visited_at: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
});

User.hasMany(Trip, { foreignKey: 'user_id' });
Trip.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Trip,
};
