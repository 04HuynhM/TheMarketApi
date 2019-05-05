const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jsonParser = bodyParser.json();
const cors = require('cors');

const secretKey = process.env.SECRETKEY;

const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Vendor = require('../models/vendorModel');
const Item = require('../models/itemModel');

