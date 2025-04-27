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
    const publicRoutes = [
        '/login.html', 
        '/api/auth/login', 
        '/api/auth/register', 
        '/css', 
        '/js', 
        '/images', 
        '/register.html'
    ];
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
        
        // Get the appropriate model based on role
        const UserModel = getUserModel(decoded.role);
        
        // Fetch user from database
        const user = await UserModel.findById(decoded.id);
        if (!user) {
            return res.redirect('/login.html');
        }
        
        // Set user in request with role
        req.user = {
            ...user.toJSON(),
            role: decoded.role
        };
        
        // Define route access based on roles
        const roleRouteAccess = {
            student: ['/student', '/student.html', '/profile', '/courses'],
            teacher: ['/teacher', '/teacher.html', '/classes', '/assignments'],
            manager: ['/admin', '/admin.html', '/dashboard', '/reports', '/settings']
        };
        
        // Check if user has access to the requested route
        const userRole = decoded.role;
        
        // Additional account status check
        switch(userRole) {
            case 'student':
                if (user.studentInfo.status !== 'active') {
                    return res.status(403).json({
                        success: false,
                        message: 'Your account is not active. Please contact administration.'
                    });
                }
                break;
            case 'teacher':
            case 'manager':
                if (!user.isActive) {
                    return res.status(403).json({
                        success: false,
                        message: 'Your account is currently inactive.'
                    });
                }
                break;
        }
        
        // Check role-specific access
        const allowedRoutes = roleRouteAccess[userRole] || [];
        const hasAccess = allowedRoutes.some(allowedRoute => {
            // Check for exact match or if the path starts with the allowed route
            return route === allowedRoute || 
                   route.startsWith(allowedRoute) ||
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
        const roleRedirects = {
            student: '/student.html',
            teacher: '/teacher.html',
            manager: '/admin.html'
        };
        
        const redirectUrl = roleRedirects[userRole] || '/login.html';
        return res.redirect(redirectUrl);
    } catch (error) {
        console.error('Role check error:', error);
        return res.redirect('/login.html');
    }
};

module.exports = roleCheck;