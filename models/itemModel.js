const Sequelize = require('sequelize');
const db = require('../config/database');

const Item = db.define('Item', {
    itemId: {
        type: Sequelize.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING
    },
    price: {
        type: Sequelize.INTEGER
    },
    description: {
        type: Sequelize.STRING
    },
    rating: {
        type: Sequelize.INTEGER
    },
    category: {
        type: Sequelize.STRING
    },
    imageUrl: {
        type: Sequelize.STRING
    }
}, {
    freezeTableName: true,
    timestamps: true,
});

module.exports = Item;