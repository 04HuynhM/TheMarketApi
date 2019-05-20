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
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);
    let loggedInUser = decodedAuth.userId;
    Cart.findOrCreate({
        where: {
            userId: loggedInUser
        }
        , defaults: {
            userId: loggedInUser,
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

    let itemId = req.body.itemId;

    Cart.findOrCreate({
        where: {
            userId: loggedInUser
        }
        , defaults: {
            userId: loggedInUser,
            items: [{
                itemId: itemId,
                quantity: 1
            }]
        }
    }).then(result => {
        let cartObject = result[0];
        let created = result[1];

        // If cart was just created, return new cart
        if(created) {
            return res.status(200).json({
                items: cartObject.items
            })
        }

        // If cart is not just created, check if item is in cart and alter quantity
        let items = cartObject.items;
        if (items == "") {
            items = [];
        }
        let isAdded = false;
        for(let i = 0; i < items.length; i++)
        {
            if(items[i].itemId == itemId)
            {
                items[i].quantity = items[i].quantity+1;
                isAdded = true;
                break;
            }
        }
        if (isAdded) {
            console.log('updating quantity');
            Cart.update({
                items: items
            }, {
                where: {
                    userId: loggedInUser
                }
            }).then(() => {
                return res.status(200).json(items)
            }).catch(error => {
                return res.status(500).json({
                    message: 'Error after altering quantity.',
                    error: error
                })
            })
        } else {
            console.log('Updating raw array');
            //If cart doesn't have item, add it in and return cart
            items.push({
                itemId: itemId,
                quantity: 1
            });

            Cart.update({
                items: items
            }, {
                where: {
                    userId: loggedInUser
                }
            }).then(() => {
                return res.status(200).json({
                    cart: items
                })
            }).catch(error => {
                return res.status(500).json({
                    message: 'Error after adding new item.',
                    error: error
                })
            })
        }
    }).catch(error => {
        console.log(error);
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

    let itemId = req.body.itemId;

    Cart.findOne({
        where: {
            userId: loggedInUser
        }
    }).then(cart => {
        let items = cart.items;
        if (items == "") {
            return res.status(404).json({
                message: 'No items are in the cart'
            })
        }
        let isRemoved = false;
        for(let i = 0; i < items.length; i++)
        {
            if(items[i].itemId == itemId)
            {
                if (items[i].quantity > 1) {
                    items[i].quantity = items[i].quantity-1;
                    isRemoved = true;
                    break;
                } else {
                    items.splice(i, 1);
                    isRemoved = true;
                }
            }
        }
        if (isRemoved) {
            Cart.update({
                items: items
            }, {
                where: {
                    userId: loggedInUser
                }
            }).then(() => {
                return res.status(200).json(items)
            }).catch(error => {
                console.log(error)
                return res.status(500).json({
                    message: 'Error while updating cart.',
                    error: error
                })
            })
        } else {
            return res.status(404).json({
                message: 'Item is not in cart'
            })
        }
    }).catch(error => {
        return res.status(500).json({
            message: 'Error removing item to cart.',
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