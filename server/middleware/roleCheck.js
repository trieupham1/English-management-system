// server/middleware/roleCheck.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const roleCheck = async (req, res, next) => {
    let token;
    
    // Extract token from Authorization header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    
    // Get the current page/route
    const route = req.path;
    
    // Allow access to login and static resources without a token
    const publicRoutes = ['/login.html', '/api/auth/login', '/api/auth/register', '/css', '/js', '/images'];
    const isPublicRoute = publicRoutes.some(publicRoute => route.startsWith(publicRoute));
    
    if (isPublicRoute) {
        return next();
    }
    
    // If no token is found and not a public route, redirect to login
    if (!token) {
        return res.redirect('/login.html');
    }
    
    try {
        // Verify the token
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'your_jwt_secret_key_for_english_center_app'
        );
        
        // Fetch user from database
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.redirect('/login.html');
        }
        
        // Set user in request
        req.user = user;
        
        // Define route access based on roles
        const roleRouteAccess = {
            student: ['/student.html', '/chatbot.html'],
            teacher: ['/teacher.html', '/chatbot.html'],
            receptionist: ['/receptionist.html', '/chatbot.html'],
            manager: ['/admin.html', '/chatbot.html']
        };
        
        // Check if user has access to the requested route
        const userRole = user.role;
        
        // Check role-specific access
        const allowedRoutes = roleRouteAccess[userRole] || [];
        const hasAccess = allowedRoutes.some(allowedRoute => {
            // Check for exact match or if the path starts with the allowed route
            return route === allowedRoute || 
                  (allowedRoute.endsWith('.html') && route.startsWith(allowedRoute.replace('.html', '')));
        });
        
        if (hasAccess) {
            return next();
        }
        
        // If API request and no access, return JSON error
        if (route.startsWith('/api/')) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this resource'
            });
        }
        
        // If no access, redirect to appropriate dashboard based on role
        let redirectUrl;
        switch (userRole) {
            case 'student':
                redirectUrl = '/student.html';
                break;
            case 'teacher':
                redirectUrl = '/teacher.html';
                break;
            case 'receptionist':
                redirectUrl = '/receptionist.html';
                break;
            case 'manager':
                redirectUrl = '/admin.html';
                break;
            default:
                redirectUrl = '/login.html';
        }
        
        return res.redirect(redirectUrl);
    } catch (error) {
        console.error('Role check error:', error);
        return res.redirect('/login.html');
    }
};

module.exports = roleCheck;