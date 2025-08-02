const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();

const { OAuth2Client } = require('google-auth-library');

router.get('/', (req, res) => {
  console.log('🔄 Starting Google OAuth flow...');
  
  const redirectURL = `${process.env.NODE_ENV === 'production' ? 'https://careflow-ssas.onrender.com' : 'http://localhost:3001'}/oauth`;
  const oAuth2Client = new OAuth2Client(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    redirectURL
  );

  // ✅ FIXED: Add email scope and improve scopes
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [ 
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid'
    ].join(' '),
    prompt: 'consent'
  });

  console.log('📤 Redirecting to Google:', authorizeUrl);
  res.redirect(authorizeUrl);
});

module.exports = router;