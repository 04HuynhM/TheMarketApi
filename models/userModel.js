const Sequelize = require('sequelize');
const db = require('../config/database');

const User = db.define('User', {
    userId: {
        type: Sequelize.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: Sequelize.STRING,
        unique: true,
    },
    password: {
        type: Sequelize.STRING,
    },
    firstName: {
        type: Sequelize.STRING,
    },
    lastName: {
        type: Sequelize.STRING,
    }
}, {
    freezeTableName: true,
    timestamps: false,
});

module.exports = User;