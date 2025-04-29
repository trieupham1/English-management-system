const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Manager = require('../models/Manager');

// Utility function to get model based on role
const getUserModel = (role) => {
    switch(role) {
        case 'student': return Student;
        case 'teacher': return Teacher;
        case 'manager': return Manager;
        default: throw new Error('Invalid role');
    }
};

// Create an auth middleware object
const authMiddleware = {
    // Middleware for protecting routes - verifies JWT token
    protect: async (req, res, next) => {
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

            // Get the appropriate model based on role
            const UserModel = getUserModel(decoded.role);

            // Check if user still exists
            const user = await UserModel.findById(decoded.id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'The user belonging to this token no longer exists'
                });
            }

            // Add user to request with role
            req.user = {
                ...user.toJSON(),
                role: decoded.role
            };
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
                error: error.message
            });
        }
    },

    // Middleware for authorizing specific roles
    authorize: (...roles) => {
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
    },

    // Middleware to check user activation status
    checkActiveStatus: async (req, res, next) => {
        try {
            const { role } = req.user;
            const UserModel = getUserModel(role);

            // Check for different activation criteria based on role
            switch(role) {
                case 'student':
                    if (req.user.studentInfo.status !== 'active') {
                        return res.status(403).json({
                            success: false,
                            message: 'Your account is not active. Please contact administration.'
                        });
                    }
                    break;
                case 'teacher':
                case 'manager':
                    if (!req.user.isActive) {
                        return res.status(403).json({
                            success: false,
                            message: 'Your account is currently inactive.'
                        });
                    }
                    break;
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error checking account status',
                error: error.message
            });
        }
    },

    // Optional: Rate limiting middleware
    rateLimiter: (req, res, next) => {
        // This is a basic in-memory rate limiter
        // In production, use a more robust solution like Redis
        const requestLimits = {
            student: 100,  // requests per hour
            teacher: 200,
            manager: 300
        };

        const userRole = req.user.role;
        const currentTime = Date.now();
        
        // You would need to implement request tracking logic here
        // This is a placeholder for a more comprehensive rate limiting strategy
        next();
    }
};

// Export the entire middleware object
module.exports = authMiddleware;