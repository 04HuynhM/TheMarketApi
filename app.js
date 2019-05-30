require('dotenv').config();
const express = require('express');
const passport = require('passport');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

const db = require('./config/database');

const userRouter = require('./routes/userRouter');
const itemRouter = require('./routes/itemRouter');
const vendorRouter = require('./routes/vendorRouter');
const cartRouter = require('./routes/cartRouter');
const paymentRouter = require('./routes/paymentRouter');
const addressRouter = require('./routes/addressRouter');
const orderRouter = require('./routes/orderRouter');

require('./config/passport')(passport);
app.use(passport.initialize());
app.use(morgan('dev'));
app.use(cors());

app.use('/user', userRouter);
app.use('/item', itemRouter);
app.use('/cart', cartRouter);
app.use('/vendor', vendorRouter);
app.use('/payment', paymentRouter);
app.use('/address', addressRouter);
app.use('/order', orderRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
   console.log(`App listening on port $(PORT)`);
   db.sync({force: false}).then(() => {
       console.log('Database is synced')
   }).catch(err => {
       console.log(err)
   })
});