const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

UserSchema.methods.serialize = function() {
  return {
    id: this._id,
    name: this.name || '',
    email: this.email || '',
    avatar: this.avatar,
    date: this.date
  };
};

module.exports = User = mongoose.model('User', UserSchema);
