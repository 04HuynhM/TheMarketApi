const Sequelize = require('sequelize');
const db = require('../config/database');

const Address = db.define('Address', {
    addressId: {
        type: Sequelize.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING
    },
    addressLineOne: {
        type: Sequelize.STRING
    },
    addressLineTwo: {
        type: Sequelize.STRING
    },
    city: {
        type: Sequelize.STRING
    },
    postcode: {
        type: Sequelize.STRING
    },
    country: {
        type: Sequelize.STRING
    }
}, {
    freezeTableName: true,
    timestamps: false,
});

module.exports = Address;