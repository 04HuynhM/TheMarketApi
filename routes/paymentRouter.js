const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jsonParser = bodyParser.json();
const cors = require('cors');

const secretKey = process.env.SECRETKEY;

const User = require('../models/userModel');
const Payment = require('../models/paymentModel');

/*
Add payment option
 */
router.post('/', cors(), jsonParser, passport.authenticate('jwt', { session: false }), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);

    User.findOne({
        where : {
            userId: decodedAuth.userId
        }
    }).then(user => {
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }
        let data = req.body;
        if (!data.nameOnCard || !data.cardNumber || !data.expiryDate) {
            return res.status(400).json({
                message: 'Json body must contain: nameOnCard, cardNumber, expiryDate'
            })
        }
        Payment.create({
            nameOnCard: data.nameOnCard,
            cardNumber: data.cardNumber,
            expiryDate: data.expiryDate,
            userId: decodedAuth.userId
        }).then(payment => {
            return res.status(201).json(payment)
        }).catch(error => {
            return res.status(500).json({
                message: 'Error when creating payment option',
                error: error
            })
        })
    }).catch(error => {
        return res.status(500).json({
            message: 'Error finding user',
            error: error
        })
    });
});

/*
Get all payment options for user
 */
router.get('/', cors(), jsonParser, passport.authenticate('jwt', { session: false }), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);

    User.findOne({
        where : {
            userId: decodedAuth.userId
        }
    }).then(user => {
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }
        Payment.findAll({
            where : {
                userId: decodedAuth.userId
            }
        }).then(paymentOptions => {
            return res.status(200).json(paymentOptions)
        }).catch(error => {
            return res.status(500).json({
                message: 'Error finding payment options',
                error: error
            })
        });
    }).catch(error => {
        return res.status(500).json({
            message: 'Error finding user',
            error: error
        })
    });
});

/*
Get single payment option for user
 */
router.get('/:paymentId', cors(), jsonParser, passport.authenticate('jwt', { session: false }), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);

    User.findOne({
        where : {
            userId: decodedAuth.userId
        }
    }).then(user => {
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }
        Payment.findOne({
            where : {
                paymentId: req.params.paymentId
            }
        }).then(paymentOption => {
            return res.status(200).json(paymentOption)
        }).catch(error => {
            return res.status(500).json({
                message: 'Error finding payment option',
                error: error
            })
        });
    }).catch(error => {
        return res.status(500).json({
            message: 'Error finding user',
            error: error
        })
    });
});

/*
Update payment option
 */
router.put('/:paymentId', cors(), jsonParser, passport.authenticate('jwt', { session: false }), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);

    let data = req.body;
    if (!data.nameOnCard && !data.cardNumber && !data.expiryDate) {
        return res.status(400).json({
            message: 'Json body must contain at least one of: nameOnCard, cardNumber, expiryDate'
        })
    }

    User.findOne({
        where: {
            userId: decodedAuth.userId
        }
    }).then(user => {
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }
        Payment.findOne({
            where: {
                paymentId: req.params.paymentId
            }
        }).then(payment => {
            if(!payment) {
                return res.status(404).json({
                    message: 'Address not found'
                })
            }
            let newNameOnCard = data.nameOnCard || payment.nameOnCard;
            let newCardNumber = data.cardNumber || payment.cardNumber;
            let newExpiryDate = data.expiryDate || payment.expiryDate;


            Payment.update({
                nameOnCard: newNameOnCard,
                cardNumber: newCardNumber,
                expiryDate: newExpiryDate
            }, {
                where: {
                    paymentId: req.params.paymentId
                }
            }).then(rowsUpdated => {
                if(rowsUpdated > 0) {
                    return res.status(200).json({
                        message: 'Payment updated successfully'
                    })
                } else {
                    return res.status(200).json({
                        message: 'No changes to payment were made, possibly identical data submitted.'
                    })
                }
            }).catch(error => {
                return res.status(500).json({
                    message: 'Error when updating Payment option',
                    error: error
                })
            })
        }).catch(error => {
            return res.status(500).json({
                message: 'Error when finding Payment option',
                error: error
            })
        });
    }).catch(error => {
        return res.status(500).json({
            message: 'Error when finding user',
            error: error
        })
    });
});

/*
Delete payment option
 */
router.delete('/:paymentId', cors(), jsonParser, passport.authenticate('jwt', { session: false }), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);

    User.findOne({
        where : {
            userId: decodedAuth.userId
        }
    }).then(user => {
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }
        Payment.findOne({
            where: {
                paymentId: req.params.paymentId
            }
        }).then(payment => {
            if(!payment) {
                return res.status(404).json({
                    message: 'Payment option not found'
                })
            }
            Payment.destroy({
                where: {
                    paymentId: req.params.paymentId
                }
            }).then(() => {
                return res.status(200).json({
                    message: 'Payment option deleted successfully'
                })
            }).catch(error => {
                return res.status(500).json({
                    message: 'Error when deleting payment option',
                    error: error
                })
            })
        }).catch(error => {
            return res.status(500).json({
                message: 'Error finding payment option',
                error: error
            })
        })
    }).catch(error => {
        return res.status(500).json({
            message: 'Error finding user',
            error: error
        })
    });
});

module.exports = router;