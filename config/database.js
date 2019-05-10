const Sequelize = require('sequelize');

module.exports = new Sequelize(
    process.env.DATABASE_NAME,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD,
    {
        port: process.env.DATABASE_PORT,
        host: process.env.DATABASE_HOST,
        dialect: 'postgres',
    },
);

const User = require('../models/userModel');
const Vendor = require('../models/vendorModel');
const Payment = require('../models/paymentModel');
const Review = require('../models/reviewModel');
const Item = require('../models/itemModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Address = require('../models/addressModel');

User.hasOne(Cart, {foreignKey: 'userId'});
Cart.belongsTo(User, {foreignKey: 'userId'});

User.hasOne(Vendor, {foreignKey: 'userId'});
Vendor.belongsTo(User, {foreignKey: 'userId'});

User.hasMany(Address, {foreignKey: 'userId'});
Address.belongsTo(User, {foreignKey: 'userId'});

User.hasMany(Payment, {foreignKey: 'userId'});
Payment.belongsTo(User, {foreignKey:'userId'});

Vendor.hasMany(Item, {foreignKey: 'vendorId'});
Item.belongsTo(Vendor, {foreignKey: 'vendorId'});

Item.hasMany(Review, {foreignKey: 'itemId'});
Review.belongsTo(Item, {foreignKey: 'itemId'});

User.hasMany(Review, {foreignKey: 'userId'});
Review.belongsTo(User, {foreignKey: 'userId'});

User.hasMany(Order, {foreignKey: 'userId'});
Order.belongsTo(User, {foreignKey: 'userId'});

Order.hasOne(Address, {foreignKey: 'addressId'});