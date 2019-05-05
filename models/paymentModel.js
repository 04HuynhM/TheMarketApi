const Sequelize = require('sequelize');
const db = require('../config/database');

const Payment = db.define('Payment', {
    paymentId: {
        type: Sequelize.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    cardNumber: {
        type: Sequelize.STRING,
    },
    nameOnCard: {
        type: Sequelize.STRING,
    },
    expiryDate: {
        type: Sequelize.STRING,
    }
}, {
    freezeTableName: true,
    timestamps: false,
});

module.exports = Payment;