const verifyToken = require('../utils/verifyToken');

/**
 * Middleware to authenticate requests using a JWT from an HTTP-only cookie.
 *
 * It extracts the token, uses the verifyToken utility to validate it,
 * and attaches the authenticated user object to the `req` object.
 */
const authMiddleware = async (req, res, next) => {
    // 🍪 COOKIE DEBUGGING: Log all incoming request details
    console.log('🔍 AUTH MIDDLEWARE DEBUG:');
    console.log('  - Request origin:', req.get('origin') || 'No origin header');
    console.log('  - Request host:', req.get('host'));
    console.log('  - Request method:', req.method);
    console.log('  - Request URL:', req.originalUrl);
    console.log('  - User-Agent:', req.get('user-agent')?.substring(0, 100) + '...');
    console.log('🍪 All incoming cookies:', req.cookies);
    console.log('🍪 Raw cookie header:', req.get('cookie'));
    console.log('🍪 authToken present:', !!req.cookies.authToken);
    
    // Get token from httpOnly cookie (secure approach)
    const token = req.cookies.authToken;
    
    if (token) {
      console.log('🍪 Using token from httpOnly cookie');
    } else {
      console.log('🚫 No authToken cookie found');
    }

    try {
        const user = await verifyToken(token);
        req.user = user; // Attach user to the request object
        next(); // Pass control to the next handler

    } catch (error) {
        console.error('❌ Authentication failed:', error.message);

        // Handle specific JWT errors for more precise feedback
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Authentication token has expired. Please re-authenticate.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ error: 'Invalid authentication token.' });
        }
        
        // Handle custom errors from verifyToken utility
        if (error.message === 'No authentication token provided.') {
            return res.status(401).json({ error: error.message + ' Please log in.' });
        }
        if (error.message === 'Authenticated user not found.') {
            return res.status(404).json({ error: error.message });
        }

        // Generic error for other issues
        res.status(500).json({ error: 'Failed to authenticate token.' });
    }
};

module.exports = authMiddleware;