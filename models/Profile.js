const mongoose = require('mongoose');

const ProfileSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  website: {
    type: String
  },
  location: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  githubusername: {
    type: String
  },
  hobbies: {
    type: [String],
    required: true
  },
  skills: {
    type: [String],
    required: true
  },
  blogpost: [
    {
      title: {
        type: String,
        required: true
      },
      content: {
        type: String,
        required: true
      },
      location: {
        type: String
      },
      published: {
        type: Date,
        required: true
      },
      updated: {
        type: Date
      },
      description: {
        type: String,
        required: true
      }
    }
  ],
  social: {
    youtube: {
      type: String
    },
    twitter: {
      type: String
    },
    facebook: {
      type: String
    },
    linkedin: {
      type: String
    },
    instagram: {
      type: String
    }
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Profile = mongoose.model('Profile', ProfileSchema);

module.exports = Profile;
