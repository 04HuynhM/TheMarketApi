const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const secretKey = process.env.SECRETKEY;

const User = require('../models/userModel');
const Order = require('../models/orderModel');

/*
Get all orders for authed user
 */
router.get('/', cors(), passport.authenticate('jwt', {session: false}), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);
    let loggedInUser = decodedAuth.userId;

    User.findOne({
        where: {
            userId: loggedInUser
        }
    }).then(user => {
        if (!user) {
            return res.status(404).json({
                message: 'User could not be found'
            })
        }

        Order.findAll({
            where: {
                userId: user.userId
            }
        }).then(orders => {
            return res.status(200).json(orders)
        }).catch(error => {
            console.log(error);
            return res.status(500).json({
                message: 'Error while finding orders',
                error: error
            })
        })
    }).catch(error => {
        console.log(error);
        return res.status(500).json({
            message: 'Error while finding user',
            error: error
        })
    })
});

/*
Get single order for authed user with :orderId
 */
router.get('/:orderId', cors(), passport.authenticate('jwt', {session: false}), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);
    let loggedInUser = decodedAuth.userId;

    User.findOne({
        where: {
            userId: loggedInUser
        }
    }).then(user => {
        if (!user) {
            return res.status(404).json({
                message: 'User could not be found'
            })
        }
        Order.findOne({
            where: {
                orderId: req.params.orderId
            }
        }).then(order => {
            if (!order) {
                return res.status(404).json({
                    message:'No order could be found'
                })
            }
            return res.status(200).json(order)
        }).catch(error => {
            console.log(error);
            return res.status(500).json({
                message: 'Error while finding order',
                error: error
            })
        })
    }).catch(error => {
        console.log(error);
        return res.status(500).json({
            message: 'Error while finding user',
            error: error
        })
    })
});

/*
Cancel/Delete order
 */
router.delete('/:orderId', cors(),passport.authenticate('jwt', {session: false}), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);
    let loggedInUser = decodedAuth.userId;

    User.findOne({
        where: {
            userId: loggedInUser
        }
    }).then(user => {
        if (!user) {
            return res.status(404).json({
                message: 'User could not be found'
            })
        }
        Order.destroy({
            where: {
                orderId: req.params.orderId,
                userId: user.userid
            }
        }).then(result => {
            if (result === 0) {
                return res.status(404).json({
                    message:'No order could be found'
                })
            }
            return res.status(200).json({
                message: 'Order was successfully cancelled'
            })
        }).catch(error => {
            console.log(error);
            return res.status(500).json({
                message: 'Error while deleting order',
                error: error
            })
        })
    }).catch(error => {
        console.log(error);
        return res.status(500).json({
            message: 'Error while finding user',
            error: error
        })
    })




});