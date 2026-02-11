const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Book = require('./book');

const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

User.hasMany(Book, { foreignKey: 'userId', as: 'books' });
Book.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

module.exports = User;