const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Creates a JWT for a given user payload.
 *
 * @param {object} user - The user object to include in the token payload.
 * @param {string} expiresIn - Token expiration (default: '1h')
 * @returns {string} The generated JWT.
 */
const createToken = (user, expiresIn = '1h') => {
    const jwtPayload = {
        userId: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role || 'user',
        authMethod: user.authMethod
    };

    // The token expires based on the expiresIn parameter
    return jwt.sign(jwtPayload, JWT_SECRET, { expiresIn });
};

module.exports = createToken;
