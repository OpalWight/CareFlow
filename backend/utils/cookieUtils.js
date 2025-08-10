/**
 * Sets the authentication JWT as a secure, HTTP-only cookie.
 *
 * @param {object} res - The Express response object.
 * @param {string} token - The JWT to set in the cookie.
 */
const setAuthCookie = (res, token) => {
    // Cookie expires in 1 hour, matching the JWT token expiration.
    const cookieExpiration = new Date();
    cookieExpiration.setTime(cookieExpiration.getTime() + (60 * 60 * 1000)); // 1 hour

    res.cookie('authToken', token, {
        httpOnly: true,              // Prevents client-side JavaScript access (XSS protection)
        secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Cross-site cookies for production
        expires: cookieExpiration,   // Sets a persistent cookie
        path: '/'                    // Cookie is available for the entire application
    });
};

/**
 * Clears the authentication cookie.
 *
 * @param {object} res - The Express response object.
 */
const clearAuthCookie = (res) => {
    console.log('🗑️ Attempting to clear authentication cookie...');
    
    // Clear the cookie with the exact same options used when setting it
    res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/'
    });
    
    // Also try clearing without options as a fallback (for development)
    res.clearCookie('authToken');
    
    // Additional clearing attempts for different possible configurations
    res.clearCookie('authToken', { path: '/' });
    res.clearCookie('authToken', { 
        httpOnly: true,
        path: '/'
    });
    
    // Set an expired cookie as another fallback method
    res.cookie('authToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        expires: new Date(0) // Set to expire immediately
    });
    
    console.log('🍪 Authentication cookie clearing attempted with multiple methods');
};

module.exports = { setAuthCookie, clearAuthCookie };
