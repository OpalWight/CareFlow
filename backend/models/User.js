const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    required: function() {
      return this.authMethod === 'email' || this.authMethod === 'both';
    },
    select: false
  },
  
  refreshToken: {
    type: String,
  },
  
  authMethod: {
    type: String,
    enum: ['google', 'email', 'both'],
    default: 'email'
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verificationToken: {
    type: String
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  delete user.verificationToken;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);