const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jsonParser = bodyParser.json();
const cors = require('cors');

const secretKey = process.env.SECRETKEY;

const Vendor = require('../models/vendorModel');
const Item = require('../models/itemModel');

/*
Find vendor by id or name
 */
router.get('/:vendorIdOrName', cors(), (req, res) => {
    Vendor.findAll({
        where: {
            $or: [
                { vendorId: { $eq: req.params.vendorIdOrName }},
                { name: { $eq: req.params.vendorIdOrName }}
            ]
        }
    }).then(vendor => {
        if (!vendor) {
            return res.status(404).json({
                message: 'Vendor not found'
            })
        }
        return res.status(200).json({
            vendor: vendor
        })
    }).catch(error => {
        return res.status(500).json({
            message: 'Error when finding vendor',
            error: error
        })
    })
});

/*
Get items/storefront for vendorId
 */
router.get('/:vendorId/store', cors(), (req, res) => {
    Item.findAll({
        where: {
            vendorId: req.params.vendorId
        }
    }).then(items => {
        return res.status(200).json({
            items: items
        })
    }).catch(error => {
        return res.status(500).json({
            message: 'Error when finding items for vendor',
            error: error
        })
    })
});

/*
Create a vendor
 */
router.post('/', cors(), jsonParser, passport.authenticate('jwt', {session: false}), (req, res) => {
    let data = req.body;
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);
    let loggedInUser = decodedAuth.userId;
    console.log(loggedInUser);

    Vendor.findOrCreate({
        where: {
            userId : loggedInUser
        },
        defaults: {
            userId: loggedInUser,
            name: data.vendorName
        }
    }).then(result => {
        if (result[1]) {
            return res.status(201).json({
                vendor: result[0]
            })
        } else {
            return res.status(200).json({
                vendor: result[0],
                message: 'User is already a vendor.'
            })
        }
    }).catch(error => {
        return res.status(500).json({
            message: 'Error while creating vendor',
            error: error
        })
    })
});

/*
Update a vendor name
 */
router.put('/:vendorId/edit', cors(), jsonParser, passport.authenticate('jwt', {session: false}), (req, res) => {
    let data = req.body;
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, secretKey);
    let loggedInUser = decodedAuth.userId;
    console.log(loggedInUser);

    Vendor.findOne({
        where: {
            vendorId: req.params.vendorId
        }
    }).then(vendor => {
        if (!vendor) {
            return res.status(404).json({
                message: 'Vendor not found'
            })
        }
        let values = {name : data.name};
        let selector = {where: { vendorId: req.params.vendorId }};

        Vendor.update(values, selector)
            .then(updatedVendor => {
                res.status(200).json(updatedVendor)
            }).catch(error => {
            return res.status(500).json({
                message: 'There was an error when updating this vendor.',
                error: error
            });
        });
    })
});