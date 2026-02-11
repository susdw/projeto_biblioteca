const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // ajuste o caminho conforme necessário

const Book = sequelize.define('Book', {
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
});

module.exports = Book;