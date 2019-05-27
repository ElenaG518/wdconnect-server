const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator/check');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route    GET api/profile/me
// @desc     Get current users profile
// @access   Private

router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findById(req.user.id).populate('user', [
      'name',
      'avatar'
    ]);

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// @route    POST api/profile
// @desc     Create users profile
// @access   Private

router.post(
  '/',
  auth,
  [
    check('bio', 'Bio field is required')
      .not()
      .isEmpty(),
    check('location', 'Please enter your location')
      .not()
      .isEmpty(),
    check('skills', 'Please list your skills')
      .not()
      .isEmpty(),
    check('hobbies', 'Please list your hobbies')
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error(errors);
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      website,
      location,
      bio,
      hobbies,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin
    } = req.body;

    // build profile object
    const profile = {
      user: req.user.id,
      location,
      bio
    };
    profile.skills = skills.split(',').map(skill => skill.trim());
    profile.hobbies = hobbies.split(',').map(hobby => hobby.trim());
    if (website) profile.website = website;

    profile.social = {};
    if (youtube) profile.social.youtube = youtube;
    if (twitter) profile.social.twitter = twitter;
    if (facebook) profile.social.facebook = facebook;
    if (instagram) profile.social.instagram = instagram;
    if (linkedin) profile.social.linkedin = linkedin;

    try {
      // mongoose returns a promise, so anytime we use mongoose, we need to use keyword await
      let newProfile = await Profile.findOne({ user: req.user.id });

      if (newProfile) {
        // update profile
        newProfile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profile },
          { new: true }
        );

        return res.json(newProfile);
      }

      newProfile = await Profile.create(profile);
      res.json(newProfile);
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  }
);

// @route    GET api/profile
// @desc     Get all users profiles
// @access   Public

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', [
      'name',
      'username',
      'avatar'
    ]);

    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Internal Server Error');
  }
});

// @route    GET api/profile/:id
// @desc     Get profile for user by user id
// @access   Private

router.get('/:id', async (req, res) => {
  // let id = req.params.id;
  // if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
  //   console.log("params id and req body id don't match");
  //   return res.status(400).send("ID's don't match");
  // }
  try {
    const profile = await Profile.findOne({ user: req.params.id }).populate(
      'user',
      ['name', 'user', 'avatar']
    );

    if (!profile) return res.status(400).json({ msg: 'Profile not found' });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
