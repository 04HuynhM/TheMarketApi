const Sequelize = require('sequelize');
const db = require('../config/database');

const Cart = db.define('Cart', {
    cartId: {
        type: Sequelize.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    items: {
        type: Sequelize.JSONB,
    }
}, {
    freezeTableName: true,
    timestamps: false,
});

module.exports = Cart;