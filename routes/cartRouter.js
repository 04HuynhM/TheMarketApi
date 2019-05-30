const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jsonParser = bodyParser.json();
const cors = require('cors');
const nodemailer = require('nodemailer');
const MailGen = require('mailgen');
const secretKey = process.env.SECRETKEY;

const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Item = require('../models/itemModel');
const User = require('../models/userModel');
const Address = require('../models/addressModel');

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
            items: []
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

    if (!req.body.addressId || !req.body.paymentId) {
        return res.status(400).json({
            message:'Json body must have addressId and paymentId'
        })
    }

    Cart.findOne({
        where: {
            userId: loggedInUser
        }
    }).then(cart => {
        if (cart.items === "") {
            return res.status(400).json({
                message: 'Cart is empty'
            })
        }
        let cartItems = cart.items;
        let itemIdArray = [];

        for (let i = 0; i<cartItems.length; i++) {
            let quantity = cartItems[i].quantity;
            for(let j = 0; j<quantity; j++) {
                console.log(cartItems[i]);
                let item = cartItems[i];
                itemIdArray.push(item.itemId);
            }
        }
        Item.findAll({
            where: {
                itemId: itemIdArray
            }
        }).then(items => {
            let price = 0;
            let itemsForOrder = [];
            for (let i = 0; i<items.length; i++) {
                let quantity = 0;
                for (let j = 0; j < itemIdArray.length; j++) {
                    if (itemIdArray[j] === items[i].itemId) {
                        itemsForOrder.push(items[i]);
                        quantity++
                    }
                }
                console.log(quantity);
                let itemPrice = items[i].price;
                let total = itemPrice * quantity;
                price += total;
            }
            let addressId = req.body.addressId;
            Order.create({
                total: price,
                items: itemsForOrder,
                userId: loggedInUser,
                addressId: addressId,
                paymentId: req.body.paymentId
            }).then(order => {
                Cart.update({
                    items: []
                }, { where: {
                    userId: loggedInUser
                    }
                }).then(() => {
                    sortEmailDetails(order, loggedInUser);
                    return res.status(200).json(order)
                }).catch(error => {
                    return res.status(500).json({
                        message: 'Error while clearing cart',
                        error: error
                    })
                })
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
        console.log(error);
        return res.status(500).json({
            message: 'Error while finding cart',
            error: error
        })
    })
});

function sortEmailDetails(order, user) {
    User.findOne({
        where: {
            userId: user
        }
    }).then(user => {
        let items = order.items;
        let orderId = order.orderId;
        let finalItems = [];
        for (let i = 0; i<items.length; i++) {
            finalItems.push({
                name: items[i].name,
                description: items[i].description,
                price: items[i].price,
            })
        }
        createEmail(orderId, finalItems, user);
    }).catch(error => {
        console.log(error)
    })
}

function createEmail(orderId, emailItemDetails, user) {
    let emailSubject = `TheMarket - Order confirmation for order ID: ${orderId}`;
    let mailGenerator = new MailGen({
        theme: 'default',
        product:{
            name: 'TheMarket',
            link: 'https://www.themarket.com',
            logo: ''
        }
    });

    let email = {
        body: {
            name: user.firstName + ' ' + user.lastName,
            intro: `Your order (ID number: ${orderId}) has been confirmed with us and will be shipped soon!`,
            table: {
                data: emailItemDetails,
            },
            outro: 'Thank you for your purchase!'
        }
    };

    let emailBody = mailGenerator.generate(email);

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: emailSubject,
        html: emailBody
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error)
        } else {
            console.log(info)
        }
    });
}

module.exports = router;
