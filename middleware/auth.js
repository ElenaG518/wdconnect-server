const jwt = require('jsonwebtoken');
const config = require('config');

// next is a callback that will be the next thing that will run after this middleware is done
module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'Not token, authorization denied' });
  }

  // Verify token
  try {
    // returns the user id encrypted in the token
    const decoded = jwt.verify(token, config.get('jwtSecret'));
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
