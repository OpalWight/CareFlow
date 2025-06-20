const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();

const { OAuth2Client } = require('google-auth-library');

router.get('/', (req, res) => {
  const redirectURL = 'http://localhost:3001/oauth';
  const oAuth2Client = new OAuth2Client(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    redirectURL
  );

  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/userinfo.profile openid',
    prompt: 'consent'
  });

  res.redirect(authorizeUrl);
});

module.exports = router;
