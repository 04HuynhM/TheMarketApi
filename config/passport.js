const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/userModel');

const secretKey = process.env.SECRETKEY;

module.exports = function(passport) {
    const jwtOptions = {};
    jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    jwtOptions.secretOrKey = secretKey;
    passport.use(new JwtStrategy(jwtOptions, function(jwt_payload, done) {
        User.findOne({
            where: {userId: jwt_payload.userId}
        }).then(appUser => {
            if (appUser) {
                done(null, appUser)
            } else {
                done(null, false, {message: 'Jwt invalid, could not find user.'})
            }
        }).catch(err =>
            done(err, false, {message: 'There was an error when searching for a user.'})
        )
    }))
};