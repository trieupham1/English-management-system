document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page script loaded');
    
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        console.log('Login form found, attaching event listener');
        
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Login form submitted');
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            
            // Input validation
            if (!username || !password || !role) {
                showLoginError('Please fill in all fields');
                return;
            }
            
            // Logging for debugging
            console.log('Login attempt:', { username, role });
            
            // Attempt to login with the database
            login(username, password, role);
        });
    } else {
        console.error('Login form not found!');
    }
});

/**
 * Authenticate user with the backend
 */
function login(username, password, role) {
    // Show loading state
    const loginButton = document.querySelector('#loginForm button[type="submit"]');
    const originalButtonText = loginButton.textContent;
    loginButton.textContent = 'Logging in...';
    loginButton.disabled = true;
    
    // Clear previous error messages
    const errorElement = document.getElementById('login-error');
    if (errorElement) {
        errorElement.textContent = '';
    }
    
    // Make API request
    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include', // Important for handling cookies
        body: JSON.stringify({
            username,
            password,
            role
        })
    })
    .then(response => {
        // Log the full response for debugging
        console.log('Login Response Status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Login Response Data:', data);
        
        if (data.success) {
            // Store auth data in localStorage
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            localStorage.setItem('userRole', data.data.user.role);
            
            // Redirect based on user role
            redirectByRole(data.data.user.role);
        } else {
            // Show error message
            showLoginError(data.message || 'Invalid username or password');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showLoginError('An error occurred during login. Please try again.');
    })
    .finally(() => {
        // Reset button state
        loginButton.textContent = originalButtonText;
        loginButton.disabled = false;
    });
}

/**
 * Redirect user based on their role
 */
function redirectByRole(role) {
    console.log('Redirecting user with role:', role);
    
    const roleRedirects = {
        'student': '/student',
        'teacher': '/teacher',
        'manager': '/admin'
    };
    
    const redirectUrl = roleRedirects[role];
    
    if (redirectUrl) {
        window.location.href = redirectUrl;
    } else {
        showLoginError('Invalid user role');
    }
}

/**
 * Display login error message
 */
function showLoginError(message) {
    // Look for an existing error element
    let errorElement = document.getElementById('login-error');
    
    // Create the error element if it doesn't exist
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'login-error';
        errorElement.style.color = '#e53e3e';
        errorElement.style.marginTop = '10px';
        errorElement.style.textAlign = 'center';
        errorElement.style.padding = '8px';
        errorElement.style.backgroundColor = '#fff5f5';
        errorElement.style.borderRadius = '4px';
        
        // Insert it after the form
        const form = document.getElementById('loginForm');
        form.parentNode.insertBefore(errorElement, form.nextSibling);
    }
    
    // Set the error message
    errorElement.textContent = message;
    
    // Shake animation for the login container
    const loginContainer = document.querySelector('.login-container');
    loginContainer.style.animation = 'shake 0.5s';
    setTimeout(() => {
        loginContainer.style.animation = '';
    }, 500);
}

// Add a keyframe animation for the shake effect
const style = document.createElement('style');
style.textContent = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}`;
document.head.appendChild(style);