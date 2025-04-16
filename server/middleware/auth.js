// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware for protecting routes - verifies JWT token
exports.protect = async (req, res, next) => {
    let token;

    // Check if token exists in headers
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Extract token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
    } 
    // Check if token exists in cookies
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    // If no token found, return error
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'your_jwt_secret_key_for_english_center_app'
        );

        // Check if user still exists
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'The user belonging to this token no longer exists'
            });
        }

        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
            error: error.message
        });
    }
};

// Middleware for authorizing specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        // Check if user has required role
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user ? req.user.role : 'unknown'}' is not authorized to access this route`
            });
        }
        next();
    };
};