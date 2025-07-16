const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Creates a JWT for a given user payload.
 *
 * @param {object} user - The user object to include in the token payload.
 * @returns {string} The generated JWT.
 */
const createToken = (user) => {
    const jwtPayload = {
        userId: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role || 'user',
        authMethod: user.authMethod
    };

    // The token is set to expire in 1 hour.
    return jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: '1h' });
};

module.exports = createToken;
