const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jsonParser = bodyParser.json();
const cors = require('cors');
const nodemailer = require('nodemailer');
const MailGen = require('mailgen');

const secretKey = process.env.SECRETKEY;

const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Vendor = require('../models/vendorModel');
const Item = require('../models/itemModel');

/*
==============================================================
User Endpoints
==============================================================
 */

/*
Get all users
 */
router.get('/', cors(), (req, res) => {
    User.findAll()
      .then(users => {
        return res.status(200).json(users)
    }).catch(error => {
        return res.status(500).json({
            message: "An error occurred when getting users",
            error: error
        })
    })
});

/*
Get user by ID
 */
router.get('/:userId', cors(), (req, res) => {
    User.findOne({
        where: {
            userId: req.params.userId
        }
    }).then(user => {
        return res.status(200).json(user)
    }).catch(error => {
        return res.status(500).json({
            message: "An error occured while fetching user",
            error: error
        })
    })
});

/*
==============================================================
User Endpoints
==============================================================
 */

/*
Get all users
 */
router.get('/', cors(),  (req, res) => {
    User.findAll()
      .then(users => {
        return res.status(200).json(users)
    }).catch(error => {
        return res.status(500).json({
            message: "An error occurred when getting users",
            error: error
        })
    })
});

/* Get currently logged in user */
router.get('/current/me', cors(), passport.authenticate('jwt', { session : false }), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);

    User.findOne({
        where: {
            userId: decodedAuth.userId
        }
    }).then(user => {
        return res.status(200).json(user);
    }).catch(error => {
        return res.status(500).json({
            message: 'Error finding user',
            error: error
        })
    })
});

/*
Get user by ID
 */
router.get('/:userId', cors(), (req, res) => {
    User.findOne({
        where: {
            userId: req.params.userId
        }
    }).then(user => {
        return res.status(200).json(user)
    }).catch(error => {
        return res.status(500).json({
            message: "An error occured while fetching user",
            error: error
        })
    })
});

/*
User Login
    Takes JSON body of:
        email: string
        password: string
    Returns:
        token: string
*/
router.post('/login', cors(), jsonParser, (req, res) => {
    User.findOne( {
        where: {
            email: req.body.email
        }
    }).then(user => {
        if(!user) {
            res.status(404).json({
                message: 'A user with the specified email does not exist.'
            })
        }
        let isAuthorised = bcrypt.compareSync(req.body.password, user.password);
        if (isAuthorised) {
            let token = jwt.sign({
                userId: user.userId,
                email: user.email
            },
                secretKey, {
                expiresIn: 1814400
            });
            res.status(200).json({
                token: token,
                userId: user.userId
            })
        } else {
            return res.status(403).json({
                message: 'Unauthorized.'
            })
        }
    }).catch(error => {
        res.status(500).json({
            message: 'Something went wrong.',
            error: error
        })
    })
});

/*
Create User
    Takes json body of minimum:
        email: string,
        firstName: string,
        lastName: string,
        password: string,
    Returns:
        User json object
 */
router.post('/', cors(), jsonParser, (req, res) => {
    const data = req.body;
    if (!data.email ||
        !data.password ||
        !data.firstName ||
        !data.lastName ) {

        return res.status(404).json({
            message: 'Incomplete data. Please ensure all required fields are filled:' +
                'email (string), firstName (string), lastName (string), password (string)',
            receivedData: data
        })
    } else {
        User.findOrCreate({
            where: {
                email: data.email
                },
            defaults: {
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                password: hashPassword(data.password)
            }
        }).then(result => {
            let user = result[0],
                created = result[1];

            if (!created) {
                return res.status(400).json({
                    message: 'Email already associated with another account.',
                })
            }
            createEmail(user);
            return res.status(200).json(user);
        }).catch(error => {
            console.log("ERROR: " + error);
            return res.status(500).json({
                message: 'An unknown error occurred',
                error: error
            })
        })
    }
});

function hashPassword(password) {
    let salt = bcrypt.genSaltSync(10);
    let hash = bcrypt.hashSync(password, salt);
    console.log("HASH =====" + hash);
    return hash
}

function createEmail(user) {
    let emailSubject = `Welcome to TheMarket ${user.firstName} ${user.lastName}!`;
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
            intro: 'Thank you for registering with us.',
            action: {
                instructions: 'To get shopping, please click the button below.',
                button: {
                    color: '#22BC66',
                    text: 'Start Shopping!',
                    link: 'https:www.reddit.com'
                }
            },
            outro: 'We look forward to serving you soon!'
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

/* Update User
    REQUIRES Authorization header with bearer token
    Takes json body of:
        updatedType: <option>
            options =
                firstName: string,
                lastName: string,
                email: String,
        newValue: string
    Returns:
        User json object
 */
router.put('/:userId', cors(), jsonParser, passport.authenticate('jwt', { session : false }), (req, res) => {
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
                message: 'User not found'
            })
        }

        let data = req.body;
        if (!data.firstName && !data.lastName && !data.email) {
            return res.status(400).json({
                message: 'Bad request, json body must contain one of the following: ' +
                    'firstName, lastName or email'
            })
        }

        let newFirstName = data.firstName || user.firstName;
        let newLastName = data.lastName || user.lastName;
        let newEmail = data.email || user.email;

        if (data.password && !(bcrypt.compareSync(data.password, user.password))) {
            return res.status(400).json({
                message: 'To change your password, call the relevant endpoint'
            })
        }

        User.update({
            firstName: newFirstName,
            lastName: newLastName,
            email: newEmail
        }, { where: {
                userId: user.userId
        }
        }).then(updatedUser => {
            return res.status(202).json(updatedUser)
        }).catch(error => {
            return res.status(500).json({
                message: 'Error while updating user',
                error: error
            })
        })
    }).catch(error => {
        return res.status(500).json({
            message: 'Error while finding user',
            error: error
        })
    });
});

/* Delete User
REQUIRES AUTHORIZATION
 */
router.delete('/', cors(), jsonParser, passport.authenticate('jwt', { session : false }), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);
    let userId = decodedAuth.userId;
    User.findOne({
        where : {
            userId: userId
        }
    }).then(userToBeDeleted => {
        if (!userToBeDeleted) {
            return res.status(404).json({
                message: 'User not found'
            });
        }
        console.log('Deleting orders for user');
        Order.destroy({
            where: {
                userId: userToBeDeleted.userId
            }
        }).then(() => {
            console.log('Checking if user is a vendor');
            Vendor.findOne({
                where: {
                    userId: userToBeDeleted.userId
                }
            }).then(vendor => {
                if(!vendor) {
                    console.log('User is not a vendor, deleting user');
                    User.destroy({
                        where: {
                            userId: userToBeDeleted.userId
                        }
                    }).then(() => {
                        return res.status(200).json({
                            message: 'User deleted successfully'
                        })
                    }).catch(error => {
                        return res.status(500).json({
                            message: 'Error when deleting non-vendor user',
                            error: error
                        })
                    })
                } else {
                    console.log('User is a vendor. Deleting items.');
                    Item.destroy({
                        where: {
                            vendorId: vendor.vendorId
                        }
                    }).then(() => {
                        console.log('Items deleted, deleting vendor');
                        Vendor.destroy({
                            where: {
                                userId: vendor.userId
                            }
                        }).then(() => {
                            console.log('Vendor deleted. Deleting user.');
                            User.destroy({
                                where: {
                                    userId: userToBeDeleted.userId
                                }
                            }).then(() => {
                                return res.status(200).json({
                                    message: 'User, vendor and items deleted successfully'
                                })
                            }).catch(error => {
                                return res.status(500).json({
                                    message: 'Error when deleting vendor user',
                                    error: error
                                })
                            })
                        }).catch(error => {
                            return res.status(500).json({
                                message: 'Error when deleting vendor',
                                error: error
                            })
                        })
                    }).catch(error => {
                        return res.status(500).json({
                            message: 'Error when deleting items',
                            error: error
                        })
                    })
                }
            }).catch(error => {
                return res.status(500).json({
                    message: 'Error when searching for vendor',
                    error: error
                })
            })
        }).catch(error => {
            return res.status(500).json({
                message: 'Error when deleting orders',
                error: error
            })
        });
    }).catch(error => {
        return res.status(500).json({
            message: 'Error when finding user',
            error: error
        })
    })
});

module.exports = router;

