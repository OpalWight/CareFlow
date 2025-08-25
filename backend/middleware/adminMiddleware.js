const verifyToken = require('../utils/verifyToken');

/**
 * Middleware to check if the authenticated user has admin role.
 * This middleware should be used after authMiddleware.
 */
const adminMiddleware = async (req, res, next) => {
    try {
        // Check if user is attached to request (should be done by authMiddleware)
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if user has admin role
        if (req.user.role !== 'admin') {
            console.log(`❌ Access denied for user ${req.user.email} - role: ${req.user.role}`);
            return res.status(403).json({ error: 'Admin access required' });
        }

        console.log(`✅ Admin access granted for user: ${req.user.email}`);
        next(); // User is admin, proceed

    } catch (error) {
        console.error('❌ Admin middleware error:', error.message);
        res.status(500).json({ error: 'Failed to verify admin permissions' });
    }
};

module.exports = adminMiddleware;