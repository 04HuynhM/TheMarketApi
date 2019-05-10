const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jsonParser = bodyParser.json();
const cors = require('cors');
const nodemailer = require('nodemailer');

const secretKey = process.env.SECRETKEY;

const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Item = require('../models/itemModel');

/*
==============================================================
Shopping Cart Endpoints
==============================================================
 */

/* Get shopping cart for user */
router.get('/', cors(), jsonParser, passport.authenticate('jwt', { session: false }), (req, res) => {
    Cart.findOrCreate({
        where: {
            userId: req.params.userId
        }
        , defaults: {
            userId: req.params.userId,
            items: ''
        }
    }).then(result => {
        let cart = result[0];
        return res.status(200).json({
            items: cart.items
        })
    })
});

/* Add item to cart

    Takes JSON body of:
        item: itemId (integer)

    Returns:
        cart JSON array
 */
router.put('/add', cors(), jsonParser, passport.authenticate('jwt', { session: false }), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);
    let loggedInUser = decodedAuth.userId;

    let item = req.body.item;

    Cart.findOrCreate({
        where: {
            userId: loggedInUser
        }
        , defaults: {
            userId: loggedInUser,
            items: [{
                itemId: item,
                quantity: 1
            }]
        }
    }).then(result => {
        let cart = result[0];
        let created = result[1];

        // If cart was just created, return new cart
        if(created) {
            return res.status(200).json({
                items: cart
            })
        }

        // If cart is not just created, check if item is in cart and alter quantity
        for(let i = 0; i < cart.length; i++)
        {
            if(cart[i].itemId == item)
            {
                cart[i].quantity = cart[i].quantity++
                return res.status(200).json({
                    cart: cart
                })
            }
        }

        //If cart doesn't have item, add it in and return cart
        cart.push({
            itemId: item,
            quantity: 1
        }).then(() => {
            return res.status(200).json({
                cart: cart
            })
        });
    }).catch(error => {
        return res.status(500).json({
            message: 'Error adding item to cart.',
            error: error
        })
    })
});

/*
Remove item from cart

 */
router.put('/remove', cors(), jsonParser, passport.authenticate('jwt', { session: false }), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);
    let loggedInUser = decodedAuth.userId;

    let item = req.body.item;

    Cart.find({
        where: {
            userId: loggedInUser
        }
    }).then(cart => {
        for(let i = 0; i < cart.length; i++)
        {
            if(cart[i].itemId == item)
            {
                if (cart[i].quantity > 1) {
                    cart[i].quantity = cart[i].quantity--;
                    return res.status(200).json({
                        cart: cart
                    })
                } else {
                    delete cart[i];
                    return res.status(200).json({
                        cart: cart
                    })
                }
            }
        }
    }).catch(error => {
        return res.status(500).json({
            message: 'Error adding item to cart.',
            error: error
        })
    })
});

/*
Checkout cart / create order
 */
router.post('/checkout', cors(), jsonParser, passport.authenticate('jwt', { session: false }), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);
    let loggedInUser = decodedAuth.userId;

    Cart.findOne({
        where: {
            userId: loggedInUser
        }
    }).then(cart => {
        if (cart.items === '') {
            return res.status(400).json({
                message: 'Cart is empty'
            })
        }
        let itemIdArray = [];

        for (let i = 0; i<cart.length; i++) {
            itemIdArray.push(cart[i].itemId)
        }

        Item.findAll({
            where: {
                itemId: itemIdArray
            }
        }).then(items => {
            console.log(items);

            let price = 0;

            for (let i = 0; i<items.length; i++) {
                let itemPrice = items[i].price;
                let quantity = cart[i].quantity;

                let total = itemPrice * quantity;
                price += total;
            }

            let addressId = req.body.addressId;

            Order.create({
                total: price,
                items: items,
                userId: loggedInUser,
                addressId: addressId
            }).then(order => {
                return res.status(201).json(order)
            }).catch(error => {
                return res.status(500).json({
                    message: 'Error while creating order',
                    error: error
                })
            })
        }).catch(error => {
            return res.status(500).json({
                message: 'Error while finding items in cart',
                error: error
            })
        })
    }).catch(error => {
        return res.status(500).json({
            message: 'Error while finding cart',
            error: error
        })
    })
});

function sendOrderEmail(userId, order) {
    User.findOne({
        where: {
            userId: userId
        }
    }).then(user => {

    })
}

module.exports = router;