// server/middleware/auth.js

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

            // Convert user to plain object to ensure all properties are accessible
            const userObject = user.toObject();

            // Add user to request with role and ensure ID is accessible in multiple formats
            req.user = {
                ...userObject,
                role: decoded.role,
                _id: userObject._id, // Ensure _id is directly accessible
                id: userObject._id.toString(), // Add string version of ID
                userId: userObject._id.toString() // Add alternative ID property
            };

            // Log the user object for debugging
            console.log('Auth middleware - user object:', {
                _id: req.user._id,
                id: req.user.id,
                userId: req.user.userId,
                role: req.user.role
            });
            
            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            
            // Check if it's a token expiration error
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired. Please login again.'
                });
            }
            
            // Check if it's a JWT malformed error
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token. Please login again.'
                });
            }
            
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
            // Check if user exists on request
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authenticated. Please login first.'
                });
            }
            
            // Check if user has required role
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Role '${req.user.role}' is not authorized to access this route`
                });
            }
            
            next();
        };
    },

    // Middleware to check user activation status
    checkActiveStatus: async (req, res, next) => {
        try {
            // Check if user exists on request
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authenticated. Please login first.'
                });
            }
            
            const { role } = req.user;
            
            // Check for different activation criteria based on role
            switch(role) {
                case 'student':
                    if (req.user.studentInfo && req.user.studentInfo.status !== 'active') {
                        return res.status(403).json({
                            success: false,
                            message: 'Your account is not active. Please contact administration.'
                        });
                    }
                    break;
                case 'teacher':
                case 'manager':
                    if (req.user.isActive === false) {
                        return res.status(403).json({
                            success: false,
                            message: 'Your account is currently inactive.'
                        });
                    }
                    break;
                default:
                    // Unknown role - allow through but log warning
                    console.warn(`Unknown role '${role}' checking activation status`);
            }

            next();
        } catch (error) {
            console.error('Error checking account status:', error);
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
        
        // Check if user exists on request
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated. Please login first.'
            });
        }
        
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
    },

    // Middleware to refresh token if needed
    checkTokenExpiration: async (req, res, next) => {
        try {
            // This is an optional middleware to check if token is about to expire
            // and provide a new token if needed
            
            if (!req.user || !req.user._id) {
                return next();
            }
            
            // Get token from header or cookie
            let token;
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                token = req.headers.authorization.split(' ')[1];
            } else if (req.cookies && req.cookies.token) {
                token = req.cookies.token;
            }
            
            if (token) {
                // Decode token without verifying to check expiration
                const decoded = jwt.decode(token);
                const currentTime = Math.floor(Date.now() / 1000);
                
                // If token expires in less than 1 hour, provide new token
                if (decoded.exp - currentTime < 3600) {
                    const newToken = jwt.sign(
                        { id: req.user._id, role: req.user.role },
                        process.env.JWT_SECRET || 'your_jwt_secret_key_for_english_center_app',
                        { expiresIn: process.env.JWT_EXPIRE || '24h' }
                    );
                    
                    // Set new token in response header
                    res.setHeader('X-New-Token', newToken);
                    
                    // Optionally set new token in cookie
                    res.cookie('token', newToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        maxAge: 24 * 60 * 60 * 1000 // 24 hours
                    });
                }
            }
            
            next();
        } catch (error) {
            console.error('Error checking token expiration:', error);
            // Don't block the request on error
            next();
        }
    }
};

// Export the entire middleware object
module.exports = authMiddleware;