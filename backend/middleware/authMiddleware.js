// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path based on your project structure

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to authenticate requests using a JWT from the Authorization header.
 *
 * It verifies the JWT, decodes its payload, and attaches the
 * authenticated user object (fetched from DB) to the `req` object.
 */
const authMiddleware = async (req, res, next) => {
    // 1. Extract the token from the HTTP-only cookie
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: 'No authentication token provided. Please log in.' });
    }

    try {
        // 2. Verify the token's integrity and expiration
        const decoded = jwt.verify(token, JWT_SECRET);

        // 3. Fetch the user from the database using the userId from the decoded token
        //    We exclude sensitive fields like password and refresh token.
        const user = await User.findById(decoded.userId).select('-password -refreshToken');

        if (!user) {
            // User might have been deleted after the token was issued
            return res.status(404).json({ error: 'Authenticated user not found.' });
        }

        // 4. Attach user and decoded token payload to the request object
        //    This makes user data easily accessible in subsequent route handlers.
        req.user = user;
        req.decodedToken = decoded; // The raw decoded JWT payload

        // 5. Pass control to the next middleware or route handler
        next();

    } catch (error) {
        console.error('❌ Authentication failed:', error);
        // Handle specific JWT errors for more precise feedback
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Authentication token has expired. Please re-authenticate.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ error: 'Invalid authentication token.' });
        }
        // Generic error for other issues
        res.status(500).json({ error: 'Failed to authenticate token.' });
    }
};

module.exports = authMiddleware;