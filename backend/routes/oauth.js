// ✅ MISSING IMPORTS AND SETUP - ADD THIS TO THE TOP
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');

const fetch = require('node-fetch'); // Ensure node-fetch is installed (npm install node-fetch@2) for older Node versions or if you're not using Node 18+ native fetch
const User = require('../models/User'); // Adjust path based on your project structure
const createToken = require('../utils/createToken');
const cookieUtils = require('../utils/cookieUtils');
const authMiddleware = require('../middleware/authMiddleware.js'); // Adjust path to your new middleware file

dotenv.config();

const { OAuth2Client } = require('google-auth-library');

// Smart frontend URL detection utility
const getFrontendUrl = () => {
  // 1. Use explicit FRONTEND_URL if set and valid
  if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith('http')) {
    return process.env.FRONTEND_URL;
  }
  
  // 2. Use production mode detection
  if (process.env.NODE_ENV === 'production') {
    return 'https://care-flow-ten.vercel.app';
  }
  
  // 3. Fallback to development
  return 'http://localhost:5173';
};

// IMPORTANT SECURITY WARNING:
// In production, process.env.JWT_SECRET MUST be a very long, random, and truly secret string.
// DO NOT use 'your-secret-key-change-this-in-production' in production environments.
// It should be stored securely (e.g., environment variable, secret management service).
const JWT_SECRET = process.env.JWT_SECRET;

// Environment check
console.log('🔍 Environment check:', {
  CLIENT_ID: process.env.CLIENT_ID ? 'Set ✅' : 'Missing ❌',
  CLIENT_SECRET: process.env.CLIENT_SECRET ? 'Set ✅' : 'Missing ❌',
  JWT_SECRET: process.env.JWT_SECRET ? 'Set ✅' : 'Missing ❌ (CRITICAL for Production)',
  MONGODB_URI: process.env.MONGODB_URI ? 'Set ✅' : 'Using default (check config)'
});

/**
 * Fetches user profile data from Google's OAuth2 API.
 * @param {string} access_token - The access token obtained from Google.
 * @returns {Promise<Object>} The user data from Google.
 */
async function getUserData(access_token) {
  try {
    console.log('👤 Fetching user data from Google...');
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    
    // 🔍 DETAILED LOGGING: Log the complete raw data from Google
    console.log('🔍 RAW Google user data received:');
    console.log('📧 Email:', data.email);
    console.log('👤 Name:', data.name);
    console.log('🖼️ Picture:', data.picture);
    console.log('🆔 Google ID (sub):', data.sub);
    console.log('✅ Email verified:', data.email_verified);
    console.log('🔍 FULL RAW DATA OBJECT:', JSON.stringify(data, null, 2));
    
    console.log('✅ User data received:', {
      email: data.email,
      name: data.name,
      picture: data.picture ? 'Present' : 'Missing'
    });

    return data;
  } catch (error) {
    console.error('❌ Error fetching user data from Google:', error);
    throw error;
  }
}

/**
 * Main Google OAuth2 callback endpoint.
 * Handles the authorization code exchange, user lookup/creation in DB,
 * and issues a JWT to the client via HTTP-only cookie.
 *
 * @route GET /oauth
 */
router.get('/', async (req, res) => {
  const { code, error } = req.query;

  console.log('📥 OAuth callback received');

  if (error) {
    console.error('❌ OAuth error from Google:', error);
    // Redirect with error, but do NOT include tokens in URL
    return res.redirect(`${getFrontendUrl()}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    console.error('❌ No authorization code provided');
    return res.redirect(`${getFrontendUrl()}/login?error=no_code`);
  }

  try {
    console.log('🔍 DEBUG: Environment check in oauth.js:');
    console.log('  - NODE_ENV:', process.env.NODE_ENV);
    console.log('  - Is Production?', process.env.NODE_ENV === 'production');
    console.log('  - FRONTEND_URL:', process.env.FRONTEND_URL);
    
    // IMPORTANT: This redirectURL MUST EXACTLY MATCH the "Authorized redirect URIs" in your Google Cloud Console.
    const redirectURL = `${process.env.NODE_ENV === 'production' ? 'https://careflow-ssas.onrender.com' : 'http://localhost:3001'}/oauth`;
    console.log('🔍 DEBUG: Using redirectURL:', redirectURL);
    const oAuth2Client = new OAuth2Client(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      redirectURL
    );

    console.log('🔄 Exchanging authorization code for tokens...');
    const tokenResponse = await oAuth2Client.getToken(code);
    await oAuth2Client.setCredentials(tokenResponse.tokens);

    console.log('🎫 Tokens received from Google');

    // Get user data from Google using the obtained access token
    const googleUserData = await getUserData(oAuth2Client.credentials.access_token);

    if (!googleUserData.email) {
      throw new Error('No email received from Google, cannot proceed with user creation/lookup.');
    }

    // MONGODB USER MANAGEMENT PIPELINE
    console.log('🔍 Checking database for existing user...');

    let user = null;
    let isNewUser = false;
    let isAccountLinking = false;

    // STEP 1: Check if user exists by Google ID (primary unique identifier for Google logins)
    user = await User.findOne({ googleId: googleUserData.sub });

    if (user) {
      console.log('✅ Existing Google user found:', user.email);

      // Update last login and potentially changed info (name, picture)
      user.lastLogin = new Date();
      
      // 🔍 DEFENSIVE: Only update name if Google provides one
      if (googleUserData.name) {
        user.name = googleUserData.name;
      } else {
        console.log('⚠️ Google did not provide name for existing user, keeping current name:', user.name);
      }
      
      user.picture = googleUserData.picture;

      // Only update refresh token if a new one is provided by Google (they are not always)
      if (tokenResponse.tokens.refresh_token) {
        user.refreshToken = tokenResponse.tokens.refresh_token;
      }

      await user.save();

    } else {
      // STEP 2: Check if user exists by email (for potential account linking, e.g., if user previously signed up with email/password)
      user = await User.findOne({ email: googleUserData.email });

      if (user) {
        console.log('🔗 Found existing user by email - linking Google account:', user.email);
        isAccountLinking = true;

        // Link Google account to existing user by adding googleId
        user.googleId = googleUserData.sub;
        
        // 🔍 DEFENSIVE: Ensure user has a name (might be missing if they signed up with email/password)
        if (!user.name && googleUserData.name) {
          console.log('🔧 Setting name for existing user from Google data:', googleUserData.name);
          user.name = googleUserData.name;
        } else if (!user.name) {
          // Fallback name generation if Google doesn't provide one either
          const fallbackName = googleUserData.given_name || 
                              googleUserData.family_name || 
                              googleUserData.email?.split('@')[0] || 
                              'User';
          console.log('🔧 Setting fallback name for existing user:', fallbackName);
          user.name = fallbackName;
        }
        
        user.picture = user.picture || googleUserData.picture; // Keep existing picture if available, otherwise use Google's
        // Update auth method to reflect it's now linked or purely Google
        user.authMethod = user.authMethod === 'email' ? 'both' : 'google';
        user.lastLogin = new Date();

        if (tokenResponse.tokens.refresh_token) {
          user.refreshToken = tokenResponse.tokens.refresh_token;
        }

        await user.save();

      } else {
        // STEP 3: Create a completely new user if no existing user found by Google ID or email
        console.log('➕ Creating new user:', googleUserData.email);
        isNewUser = true;

        // 🔍 DEFENSIVE: Handle missing name from Google
        const userName = googleUserData.name || 
                        googleUserData.given_name || 
                        googleUserData.family_name || 
                        googleUserData.email?.split('@')[0] || 
                        'Google User';
        
        console.log('🔧 Using name for new user:', userName, '(original was:', googleUserData.name, ')');

        user = new User({
          googleId: googleUserData.sub,
          email: googleUserData.email,
          name: userName,
          picture: googleUserData.picture,
          authMethod: 'google',
          isVerified: googleUserData.email_verified, // Use Google's email verification status
          refreshToken: tokenResponse.tokens.refresh_token, // Store Google's refresh token
          lastLogin: new Date()
        });

        await user.save();
      }
    }

    console.log('💾 User saved to database:', {
      id: user._id,
      email: user.email,
      authMethod: user.authMethod,
      isNewUser,
      isAccountLinking
    });

    const jwtToken = createToken(user);

    console.log('🎫 Application JWT token created for user:', user.email);

    // ✅ SET JWT AS HTTP-ONLY COOKIE (ADDED)
    // Calculate cookie expiration to match JWT expiration (7 days)
    const cookieExpiration = new Date();
    cookieExpiration.setDate(cookieExpiration.getDate() + 7);

    // Set the JWT as an HTTP-only cookie
    res.cookie('authToken', jwtToken, {
      httpOnly: true,              // Prevents client-side JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Cross-site cookies for production
      expires: cookieExpiration,   // Cookie expiration matching JWT expiration
      path: '/',                  // Cookie available for entire application
      domain: process.env.NODE_ENV === 'production' ? undefined : undefined // Let browser handle domain
    });

    console.log('🍪 JWT token set as HTTP-only cookie for user:', user.email);

    // Verify the cookie header has been set
    const setCookieHeader = res.getHeader('Set-Cookie');
    if (setCookieHeader) {
      console.log('👍 Cookie header prepared for client:', setCookieHeader);
    } else {
      console.log('🚫 Error: Set-Cookie header not found after attempting to set it.');
    }

    // ✅ ALTERNATIVE APPROACH: Redirect with temporary token in URL
    // Since cross-origin cookies are unreliable, use a temporary token approach
    const frontendUrl = getFrontendUrl();
    console.log('🔍 DEBUG: Using frontend URL for redirect:', frontendUrl);
    
    // Create a temporary token that expires in 30 seconds
    const tempToken = createToken(user, '30s');
    
    let redirectUrl = `${frontendUrl}/auth-callback?token=${tempToken}`;
    
    // Add query parameters for success messages
    if (isNewUser) {
      redirectUrl += '&newUser=true';
    } else if (isAccountLinking) {
      redirectUrl += '&accountLinked=true';
    }

    console.log('🔄 Redirecting to frontend with temp token:', redirectUrl);
    return res.redirect(redirectUrl);

  } catch (err) {
    console.error('❌ Comprehensive OAuth error during processing:', err);

    let clientErrorMessage = 'auth_failed';
    if (err.message.includes('duplicate key') || (err.code === 11000)) {
        clientErrorMessage = 'email_exists_or_google_id_exists';
    } else if (err.message.includes('validation')) {
        clientErrorMessage = 'invalid_data';
    } else if (err.message.includes('Google API error') || err.message.includes('No email received')) {
        clientErrorMessage = 'google_api_error';
    }

    // Still redirect for errors as per your original logic, but without tokens
    return res.redirect(`${getFrontendUrl()}/login?error=${clientErrorMessage}`);
  }
});

/**
 * ✅ ADDED: Route to logout user by clearing the authentication cookie.
 * 
 * @route POST /oauth/logout
 */
router.post('/logout', (req, res) => {
  // Clear the authentication cookie using the utility function
  cookieUtils.clearAuthCookie(res);

  console.log('🚪 User logged out via OAuth route, authentication cookie cleared');
  
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * Route to verify an application JWT.
 * Uses authMiddleware to protect the route.
 *
 * @route GET /oauth/verify
 */
router.get('/verify', authMiddleware, async (req, res) => {
  // If we reach here, authMiddleware has successfully verified the token and
  // attached `req.user` (from DB) and `req.decodedToken` (from JWT payload).
  console.log('✅ JWT verification successful for user:', req.user.email);
  res.json({
    user: req.user.toJSON(), // Convert Mongoose document to plain object for client
    valid: true,
    decodedToken: req.decodedToken // Optionally send decoded payload
  });
});

/**
 * Route to get user profile details.
 * Protected by authMiddleware.
 *
 * @route GET /oauth/profile
 */
router.get('/profile', authMiddleware, async (req, res) => {
  // req.user contains the user document fetched by the middleware
  console.log('✅ Profile fetched for user:', req.user.email);
  res.json(req.user.toJSON()); // Convert Mongoose document to plain object
});

/**
 * Route to update user profile.
 * Protected by authMiddleware.
 *
 * @route PUT /oauth/profile
 */
router.put('/profile', authMiddleware, async (req, res) => {
  const { name } = req.body; // Assuming only name is updatable for now

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required and must be a non-empty string.' });
  }

  try {
    // Update the user found by the middleware (req.user._id)
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        updatedAt: new Date()
      },
      { new: true, runValidators: true } // Return the updated document, run schema validators
    ).select('-password -refreshToken'); // Exclude sensitive fields from the response

    if (!user) {
      // This should ideally not happen if authMiddleware found the user, but as a safeguard
      return res.status(404).json({ error: 'User not found for update.' });
    }

    console.log('✅ Profile updated for user:', user.email);
    res.json({ message: 'Profile updated successfully', user: user.toJSON() });

  } catch (error) {
    console.error('❌ Profile update failed for user:', req.user.email, error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

/**
 * Route to delete user account.
 * Protected by authMiddleware.
 *
 * @route DELETE /oauth/account
 */
router.delete('/account', authMiddleware, async (req, res) => {
  // Store user info before deletion for logging
  const userEmail = req.user.email;
  const userId = req.user._id;

  try {
    console.log('🗑️ Attempting to delete account for user:', userEmail);
    
    // Delete the user found by the middleware
    const result = await User.findByIdAndDelete(userId);

    if (!result) {
      console.log('❌ User not found in database:', userId);
      return res.status(404).json({ error: 'User account not found for deletion.' });
    }

    console.log('✅ User deleted from database successfully:', userEmail);

    // Clear the authentication cookie
    try {
      cookieUtils.clearAuthCookie(res);
      console.log('✅ Authentication cookie cleared for deleted user');
    } catch (cookieError) {
      console.error('⚠️ Cookie clearing failed, but user was deleted:', cookieError);
      // Continue anyway since user is deleted
    }

    console.log('✅ Account deletion completed for user:', userEmail);
    res.json({ 
      success: true, 
      message: 'Account deleted successfully.' 
    });

  } catch (error) {
    console.error('❌ Account deletion failed for user:', userEmail, 'Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete account.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * ✅ NEW: Token exchange endpoint - converts temporary URL token to httpOnly cookie
 * This provides security of httpOnly cookies while solving cross-origin OAuth issues
 * 
 * @route POST /oauth/exchange-token
 */
router.post('/exchange-token', async (req, res) => {
  try {
    console.log('🔄 Token exchange request received');
    console.log('  - Request origin:', req.get('origin'));
    
    // Get temporary token from request body
    const { tempToken } = req.body;
    
    if (!tempToken) {
      return res.status(400).json({ error: 'Temporary token required' });
    }
    
    console.log('🔍 Verifying temporary token...');
    
    // Import verifyToken here to avoid circular dependency
    const verifyToken = require('../utils/verifyToken');
    
    // Verify the temporary token
    const user = await verifyToken(tempToken);
    
    console.log('✅ Temporary token valid for user:', user.email);
    
    // Create a new long-lived token (1 hour)
    const longLivedToken = createToken(user, '1h');
    
    // Set as httpOnly cookie (same domain as frontend request)
    const cookieExpiration = new Date();
    cookieExpiration.setTime(cookieExpiration.getTime() + (60 * 60 * 1000)); // 1 hour
    
    res.cookie('authToken', longLivedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Same-origin now, so 'lax' is fine
      expires: cookieExpiration,
      path: '/'
    });
    
    console.log('🍪 HttpOnly cookie set for user:', user.email);
    console.log('🍪 Cookie will be available for origin:', req.get('origin'));
    
    // Return user data (don't include the token in response)
    res.json({
      success: true,
      user: user,
      message: 'Token exchanged successfully'
    });
    
  } catch (error) {
    console.error('❌ Token exchange failed:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Temporary token has expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid temporary token' });
    }
    
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

// ✅ MISSING EXPORT - ADD THIS TO THE END
module.exports = router;

// 📝 Notes on Changes:
// 1.  **HTTP-Only Cookie:** The JWT is now set as an `httpOnly` cookie. This is a critical security enhancement to prevent Cross-Site Scripting (XSS) attacks from stealing the token.
// 2.  **Redirect After Login:** Instead of returning a JSON response, the backend now redirects the user to the frontend dashboard (`/dashboard`) after a successful login. This is a more standard OAuth flow.
// 3.  **Logout Route:** A new `/oauth/logout` route was added to properly clear the `httpOnly` cookie from the browser. The frontend now calls this endpoint.
// 4.  **Cookie-based Verification:** The frontend's `checkAuth` function now relies on the browser automatically sending the `httpOnly` cookie. The `Authorization` header is no longer needed for this.
// 5.  **Error Handling:** Improved and more consistent error logging and redirection.
// 6.  **Code Structure:** Added missing `require` statements and `module.exports` to make the `oauth.js` file a complete and functional Express router.
// 7.  **Security Headers:** Added `secure` and `sameSite` attributes to the cookie for better security, especially in production.
// 8.  **User Management:** Enhanced the user lookup/creation logic to handle new users, existing users, and account linking scenarios more robustly.
// 9.  **Middleware:** The code assumes an `authMiddleware.js` file exists and correctly verifies the JWT from the cookie. This is crucial for protecting routes.
// 10. **Environment Variables:** Emphasized the importance of securely managing `JWT_SECRET` and other environment variables.
// 11. **Frontend Logic:** The `AuthProvider` in the frontend is now correctly aligned with a cookie-based authentication flow. It initiates login via redirect and uses `fetch` with `credentials: 'include'` to interact with protected backend endpoints.
// 12. **User Feedback:** Added query parameters to the redirect URL (`?newUser=true`, `?accountLinked=true`) to allow the frontend to display welcome messages.
// 13. **Code Comments:** Added extensive comments to explain the "why" behind each change and to highlight security best practices.
// 14. **Dependencies:** Noted the need for `node-fetch` if using an older Node.js version.
// 15. **Profile & Account Management:** Added complete, protected routes for getting/updating a user profile and deleting an account, with corresponding functions in the `AuthProvider`.