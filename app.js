const express = require('express');
const passport = require('passport');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

const db = require('./config/database');

const userRouter = require('./routes/userRoute');
const itemRouter = require('./routes/itemRoute');
const vendorRouter = require('./routes/vendorRoute');
const cartRouter = require('./routes/cartRoute');
const reviewRouter = require('./routes/reviewRoute');
const paymentRouter= require('./routes/paymentRoute');

require('./config/passport')(passport);

app.use(passport.initialize());
app.use(morgan('dev'));
app.use(cors());

app.use('/user', userRouter);
app.use('/item', itemRouter);
app.use('/cart', cartRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
   console.log(`App listening on port $(PORT)`);
   db.sync({force: false}).then(() => {
       console.log('Database is synced')
   }).catch(err => {
       console.log(err)
   })
});