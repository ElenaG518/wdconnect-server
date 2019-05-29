const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const auth = require('../../middleware/auth');

const Post = require('../../models/Posts');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route    POST api/posts
// @desc     Create a post
// @access   Private

router.post(
  '/',
  [
    auth,
    [
      check('content', 'Please add the content to your post')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id);

      console.log('user ', user);

      const newPost = {
        user: req.user.id,
        name: user.name,
        username: user.username,
        content: req.body.content,
        avatar: user.avatar
      };

      const post = await Post.create(newPost);

      res.json(post);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Internal Server Error');
    }
  }
);

// @route    GET api/posts
// @desc     Get all posts
// @access   Private

router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Internal Server Error');
  }
});

// @route    GET api/posts/:id
// @desc     Get post by ID
// @access   Private

router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      console.log('no post found');
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    return res.status(500).send('Internal Server Error');
  }
});

// @route    DELETE api/posts/:id
// @desc     Delete post by ID
// @access   Private

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      console.log('no post found');
      return res.status(404).json({ msg: 'Post not found' });
    }
    // ensure only owner of post can delete post
    // need to convert the ObjectId to a string in order to do comparison
    if (post.user.toString() !== req.user.id) {
      return res.status(400).json({ msg: 'User not authorized' });
    }

    await post.remove();
    res.json({ msg: 'Post deletion was successful' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    return res.status(500).send('Internal Server Error');
  }
});

// @route    PUT api/posts/like/:id
// @desc     Like a  post
// @access   Private

router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // check if post has already been liked by user
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json(post.likes);

    if (!post) {
      console.log('no post found');
      return res.status(404).json({ msg: 'Post not found' });
    }
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    return res.status(500).send('Internal Server Error');
  }
});

// @route    PUT api/posts/unlike/:id
// @desc     unlike a  post
// @access   Private

router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // check if post has already been liked by user
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({ msg: "Post hasn't been liked" });
    }

    // get the remove index
    const removeIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);
    await post.save();

    res.json(post.likes);

    if (!post) {
      console.log('no post found');
      return res.status(404).json({ msg: 'Post not found' });
    }
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    return res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
