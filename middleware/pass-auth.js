const passport = require('passport-jwt');
const config = require('config');
var JwtStrategy = require('passport-jwt').Strategy,
  ExtractJwt = require('passport-jwt').ExtractJwt;
const JWT_SECRET = config.get('jwtSecret');
var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = JWT_SECRET;

let token;

module.exports = function() {
  passport.use(
    new JwtStrategy(opts, function(jwt_payload, done) {
      token = jwt_payload;
      console.log('token ', token);

      if (err) {
        return done(err, false);
      }
      if (token) {
        return done(null, token);
      } else {
        return done(null, false);
        // or you could create a new account
      }
    })
  );
};
