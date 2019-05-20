const Sequelize = require('sequelize');
const db = require('../config/database');

const Order = db.define('Order', {
    orderId: {
        type: Sequelize.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    total: {
        type: Sequelize.INTEGER,
    },
    items: {
        type: Sequelize.JSONB,
    }
}, {
    freezeTableName: true,
    timestamps: true,
});

module.exports = Order;