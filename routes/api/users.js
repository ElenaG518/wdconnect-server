const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator/check');

const User = require('../../models/User');

// @route    POST api/users
// @desc     Register user
// @access   Public

router.get('/', async (req, res) => {
  let users = await User.find();
  res.json({ users });
});

router.post(
  '/',
  [
    check('name', 'Name is required')
      .not()
      .isEmpty(),
    check('username', 'Please provide a username')
      .not()
      .isEmpty(),
    check('email', 'Please include a valid email address').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, username, email, password } = req.body;

    const explicityTrimmedFields = ['username', 'password', 'email'];
    const nonTrimmedField = explicityTrimmedFields.find(
      field => req.body[field].trim() !== req.body[field]
    );

    if (nonTrimmedField) {
      return res.status(422).json({
        code: 422,
        reason: 'ValidationError',
        message: 'Cannot start or end with whitespace',
        location: nonTrimmedField
      });
    }

    try {
      // See if user exists
      console.log('this ', username, email);
      let usrname = await User.findOne({ $or: [{ username }, { email }] });
      if (usrname) {
        console.log(usrname.username);
        let msg =
          usrname.username === username
            ? 'That username is already taken'
            : 'That email address is already registered';
        return res.status(400).json({ errors: [{ msg }] });
      }

      // Get users gravatar
      const avatar = gravatar.url(email, {
        s: '200', //size
        r: 'pg', //rating
        d: 'mm' //default
      });

      user = new User({
        name,
        username,
        email,
        avatar,
        password
      });
      // Encrypt password
      user.password = await bcrypt.hash(password, 10);
      // Save user to the database.  This will return a promise that will return the user that was just created, plus the user id.
      await user.save();

      const payload = {
        user: {
          id: user.id
        }
      };

      // Return jsonwebtoken
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    }
  }
);

module.exports = router;
