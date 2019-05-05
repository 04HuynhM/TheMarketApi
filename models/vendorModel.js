const Sequelize = require('sequelize');
const db = require('../config/database');

const Vendor = db.define('Vendor', {
    vendorId: {
        type: Sequelize.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING,
    }
}, {
    freezeTableName: true,
    timestamps: false,
});

module.exports = Vendor;