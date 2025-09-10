const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

// User model
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Trip model
const Trip = sequelize.define('Trip', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  country_code: {
    type: DataTypes.STRING,
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
