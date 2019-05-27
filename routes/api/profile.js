const express = require('express');
const request = require('request');
const config = require('config');
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
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      'user',
      ['username', 'name', 'avatar']
    );

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
  [
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
    ]
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
// @desc     Get profile by user id
// @access   Public

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

// @route    DELETE api/profile
// @desc     Delete profile, user & posts
// @access   Private

router.delete('/', auth, async (req, res) => {
  try {
    // @todo - remove user's posts

    await Profile.findOneAndRemove({ user: req.user.id });
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Internal Server Error');
  }
});

// @route    PUT api/profile/experience
// @desc     Add profile experience
// @access   Private
router.put(
  '/blogpost',
  [
    auth,
    [
      check('title', 'Please enter the title of your post')
        .not()
        .isEmpty(),
      check('content', 'Content is required')
        .not()
        .isEmpty(),
      check('published', 'Published date is required')
        .not()
        .isEmpty(),
      check(
        'description',
        'Please enter a short description of the content of your post'
      )
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      content,
      location,
      published,
      updated,
      description
    } = req.body;

    const newBlog = {
      title,
      content,
      location,
      published,
      updated,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.blogpost.unshift(newBlog);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    DELETE api/profile/blogpost/:blog_id
// @desc     Delete blogpost entry from profile
// @access   Private

router.delete('/blogpost/:blog_id', auth, async (req, res) => {
  try {
    // get profile that has the blog we want to delete
    const profile = await Profile.findOne({ user: req.user.id });

    const blogIndex = profile.blogpost
      .map(blog => blog.id)
      .indexOf(req.params.blog_id);

    profile.blogpost.splice(blogIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Internal Server Error');
  }
});

// @route    GET api/profile/github/:username
// @desc     Get user repos from Github
// @access   Public
router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' }
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'No Github profile found' });
      }

      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
