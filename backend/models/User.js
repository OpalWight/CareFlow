const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Google OAuth fields
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  
  // Basic user information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  
  name: {
    type: String,
    required: true
  },
  
  picture: {
    type: String,
    default: ''
  },
  
  password: {
    type: String,
  },
  
  refreshToken: {
    type: String,
  },
  
  authMethod: {
    type: String,
    enum: ['google', 'email', 'both'],
    default: 'google'
  },
  
  isVerified: {
    type: Boolean,
    default: true
  },
  
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);