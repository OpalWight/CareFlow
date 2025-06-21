const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken'); // ✅ ADD: JWT for session management
const fetch = require('node-fetch');
dotenv.config();

const { OAuth2Client } = require('google-auth-library');

// ✅ ADD: JWT secret (add this to your .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

async function getUserData(access_token) {
  try {
    console.log('👤 Fetching user data from Google...');
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
    
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ User data received:', {
      email: data.email,
      name: data.name,
      picture: data.picture ? 'Present' : 'Missing'
    });
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    throw error;
  }
}

router.get('/', async (req, res) => {
  const { code, error } = req.query;
  
  console.log('📥 OAuth callback received');
  console.log('Code present:', !!code);
  console.log('Error present:', !!error);

  // ✅ FIXED: Handle OAuth errors from Google
  if (error) {
    console.error('❌ OAuth error from Google:', error);
    return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    console.error('❌ No authorization code provided');
    return res.redirect('http://localhost:5173/login?error=no_code');
  }

  try {
    const redirectURL = 'http://localhost:3001/oauth';
    const oAuth2Client = new OAuth2Client(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      redirectURL
    );

    console.log('🔄 Exchanging code for tokens...');
    const tokenResponse = await oAuth2Client.getToken(code);
    await oAuth2Client.setCredentials(tokenResponse.tokens);

    console.log('🎫 Tokens received:', {
      access_token: tokenResponse.tokens.access_token ? 'Present ✅' : 'Missing ❌',
      refresh_token: tokenResponse.tokens.refresh_token ? 'Present ✅' : 'Missing ❌',
      id_token: tokenResponse.tokens.id_token ? 'Present ✅' : 'Missing ❌'
    });

    // ✅ FIXED: Get user data with better error handling
    const userData = await getUserData(oAuth2Client.credentials.access_token);

    if (!userData.email) {
      throw new Error('No email received from Google');
    }

    // ✅ ADD: Create JWT token for frontend authentication
    const jwtToken = jwt.sign(
      {
        userId: userData.sub, // Google user ID
        email: userData.email,
        name: userData.name,
        picture: userData.picture
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🎫 JWT token created for user:', userData.email);
    console.log('🔄 Redirecting to frontend with token...');

    // ✅ FIXED: Redirect with JWT token
    res.redirect(`http://localhost:5173/dashboard?token=${jwtToken}`);

  } catch (err) {
    console.error('❌ OAuth error:', err);
    res.redirect(`http://localhost:5173/login?error=auth_failed`);
  }
});

// ✅ ADD: Route to verify JWT tokens
router.get('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded, valid: true });
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    res.status(403).json({ error: 'Invalid token' });
  }
});

module.exports = router;
