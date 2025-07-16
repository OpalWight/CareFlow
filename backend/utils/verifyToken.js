
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path based on your project structure

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verifies the JWT token and returns the decoded user.
 *
 * @param {string} token - The JWT token from the cookie.
 * @returns {Promise<User>} The authenticated user object.
 * @throws {Error} If the token is invalid or the user is not found.
 */
const verifyToken = async (token) => {
    if (!token) {
        throw new Error('No authentication token provided.');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password -refreshToken');

        if (!user) {
            throw new Error('Authenticated user not found.');
        }

        return user;
    } catch (error) {
        // Re-throw the error to be caught by the middleware
        throw error;
    }
};

module.exports = verifyToken;
