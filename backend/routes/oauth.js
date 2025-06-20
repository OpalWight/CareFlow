const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();

const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');

async function getUserData(access_token) {
  const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
  const data = await response.json();
  return data;
}

router.get('/', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('No code provided');
  }

  try {
    const redirectURL = 'http://localhost:3001/oauth';
    const oAuth2Client = new OAuth2Client(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      redirectURL
    );
    const r = await oAuth2Client.getToken(code);
    await oAuth2Client.setCredentials(r.tokens);

    // Optionally fetch user info
    const userData = await getUserData(oAuth2Client.credentials.access_token);
    console.log('User data:', userData);

    // Redirect to frontend (optionally with user info or a session)
    res.redirect('http://localhost:5173/');
  } catch (err) {
    console.error('OAuth error:', err);
    res.status(500).send('Authentication failed');
  }
});

module.exports = router;
