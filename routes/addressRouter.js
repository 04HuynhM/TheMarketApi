const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jsonParser = bodyParser.json();
const cors = require('cors');

const secretKey = process.env.SECRETKEY;

const User = require('../models/userModel');
const Address = require('../models/addressModel');

/*
==============================================================
Address Endpoints
==============================================================
 */

/*
Get Addresses for User
 */
router.get('/:userId', cors(), passport.authenticate('jwt', { session : false }), (req, res) => {
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
        Address.findAll({
            where : {
                userId: decodedAuth.userId
            }
        }).then(addresses => {
            return res.status(200).json(addresses)
        }).catch(error => {
            return res.status(500).json({
                message: 'Error finding addresses',
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
Get single address
 */
router.get('/:addressId', cors(), passport.authenticate('jwt', { session : false }), (req, res) => {
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
        Address.findOne({
            where : {
                addressId: req.params.addressId
            }
        }).then(address => {
            return res.status(200).json(address)
        }).catch(error => {
            return res.status(500).json({
                message: 'Error finding addresses',
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
Add Address
*/
router.post('/add', cors(), jsonParser, passport.authenticate('jwt', { session: false}), (req, res) => {
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
        if (!data.addressLineOne || !data.addressLineTwo || !data.name || !data.city || !data.country || !data.postcode) {
            return res.status(400).json({
                message: 'Incomplete data. Must contain name, addressLineOne, addressLineTwo, city, country, postcode.'
            })
        }
        Address.create({
            name: data.name,
            addressLineOne: data.addressLineOne,
            addressLineTwo: data.addressLineTwo,
            city: data.city,
            country: data.country,
            postcode: data.postcode,
            userId: decodedAuth.userId
        }).then(address => {
            return res.status(201).json(address)
        }).catch(error => {
            return res.status(500).json({
                message: 'Error when creating address',
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
Update Address
 */
router.put(':addressId/update', cors(), jsonParser, passport.authenticate('jwt', { session: false }), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);

    let data = req.body;
    if (data.name && data.addressLineOne && data.addressLineTwo && data.city && data.country && data.postcode) {
        return res.status(400).json({
            message: 'Json body must contain at least one of: name, addressLineOne, addressLineTwo, city, country or postcode'
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
        Address.findOne({
            where: {
                addressId: req.params.addressId
            }
        }).then(address => {
            if(!address) {
                return res.status(404).json({
                    message: 'Address not found'
                })
            }
            let newName = data.name || address.name;
            let newLineOne = data.addressLineOne || address.addressLineOne;
            let newLineTwo = data.addressLineTwo || address.addressLineTwo;
            let newCity = data.city || address.city;
            let newCountry = data.country || address.country;
            let newPostcode = data.postcode || address.postcode;

            Address.update({
                name: newName,
                addressLineOne: newLineOne,
                addressLineTwo: newLineTwo,
                city: newCity,
                country: newCountry,
                postcode: newPostcode
            }, {
                where: {
                    addressId: req.params.addressId
                }
            }).then(rowsUpdated => {
                if(rowsUpdated > 0) {
                    return res.status(200).json({
                        message: 'Address updated successfully'
                    })
                } else {
                    return res.status(200).json({
                        message: 'No changes to address were made, possibly identical data submitted.'
                    })
                }
            }).catch(error => {
                return res.status(500).json({
                    message: 'Error when updating address',
                    error: error
                })
            })
        }).catch(error => {
            return res.status(500).json({
                message: 'Error when finding address',
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
Delete Address
 */
router.delete('/:addressId/delete', cors(), jsonParser, passport.authenticate('jwt', { session: false }), (req, res) => {
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
        Address.findOne({
            where: {
                addressId: req.params.addressId
            }
        }).then(address => {
            if(!address) {
                return res.status(404).json({
                    message: 'Address not found'
                })
            }
            Address.destroy({
                where: {
                    addressId: req.params.addressId
                }
            }).then(() => {
                return res.status(200).json({
                    message: 'Address deleted successfully'
                })
            }).catch(error => {
                return res.status(500).json({
                    message: 'Error when deleting address',
                    error: error
                })
            })
        }).catch(error => {
            return res.status(500).json({
                message: 'Error finding address',
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