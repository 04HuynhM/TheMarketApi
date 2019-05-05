const Sequelize = require('sequelize');
const db = require('../config/database');

const Review = db.define('Review', {
    reviewId: {
        type: Sequelize.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: Sequelize.STRING,
    },
    text: {
        type: Sequelize.STRING,
    },
    rating: {
        type: Sequelize.INTEGER,
    }
}, {
    freezeTableName: true,
    timestamps: false,
});

module.exports = Review;