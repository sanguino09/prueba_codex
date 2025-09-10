const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
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
