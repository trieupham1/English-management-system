const roleCheck = (req, res, next) => {
    // If no user is logged in, redirect to login page
    if (!req.user) {
        // Save the original URL they were trying to access
        req.session.returnTo = req.originalUrl;
        return res.redirect('/login.html');
    }

    // Get the current page/route
    const route = req.path;
    
    // Define route access based on roles
    const roleRouteAccess = {
        student: ['/student.html', '/chatbot.html', '/index.html'],
        teacher: ['/teacher.html', '/chatbot.html', '/index.html'],
        receptionist: ['/receptionist.html', '/chatbot.html', '/index.html'],
        manager: ['/admin.html', '/chatbot.html', '/index.html']
    };
    
    // Check if user has access to the requested route
    const userRole = req.user.role;
    
    // Allow access to common routes like logout, CSS, JS, etc.
    const commonRoutes = ['/login.html', '/logout', '/css', '/js', '/images'];
    const isCommonRoute = commonRoutes.some(commonRoute => route.startsWith(commonRoute));
    
    if (isCommonRoute) {
        return next();
    }
    
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
};

module.exports = roleCheck;