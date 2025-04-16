/**
 * Main JavaScript file for the English Learning Center
 * This script handles page initialization and common functionality
 */

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize common components if authenticated
    if (ELC.isAuthenticated()) {
        initializeAuthenticatedComponents();
    } else {
        // Handle login page if not authenticated
        initializeLoginPage();
    }
    
    // Page-specific initialization
    initializeCurrentPage();
});

/**
 * Initialize components that should be available on all authenticated pages
 */
function initializeAuthenticatedComponents() {
    // Initialize sidebar toggle
    ELC.initSidebar();
    
    // Initialize user profile in header
    ELC.initUserProfile();
    
    // Initialize logout functionality
    ELC.initLogout();
    
    // Initialize tab switching if present on page
    ELC.initTabs();
    
    // Initialize notifications
    initializeNotifications();
}

/**
 * Initialize login page functionality
 */
function initializeLoginPage() {
    const loginForm = document.getElementById('loginForm');
    
    if (!loginForm) return; // Not on login page
    
    // Handle login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        
        try {
            // Call login API
            const response = await ELC.apiRequest('/auth/login', 'POST', {
                username,
                password,
                role
            }, false); // No auth token needed for login
            
            if (response.success) {
                // Store auth token and user data
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                // Redirect based on role
                redirectBasedOnRole(response.data.user.role);
            } else {
                ELC.showNotification(response.message || 'Login failed', 'error');
            }
        } catch (error) {
            ELC.showNotification('Login failed: ' + (error.message || 'Unknown error'), 'error');
        }
    });
    
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error')) {
        const errorMsg = urlParams.get('error') === 'session_expired'
            ? 'Your session has expired. Please log in again.'
            : 'An error occurred. Please log in again.';
        
        ELC.showNotification(errorMsg, 'warning');
    }
}

/**
 * Redirect user based on their role
 * @param {string} role - The user's role
 */
function redirectBasedOnRole(role) {
    switch (role) {
        case 'student':
            window.location.href = 'student.html';
            break;
        case 'teacher':
            window.location.href = 'teacher.html';
            break;
        case 'receptionist':
            window.location.href = 'receptionist.html';
            break;
        case 'manager':
            window.location.href = 'admin.html';
            break;
        default:
            window.location.href = 'index.html';
    }
}

/**
 * Initialize notifications system
 * This checks for new notifications periodically
 */
function initializeNotifications() {
    const notificationBadge = document.querySelector('.notification-badge');
    const notificationIcon = document.querySelector('.notifications i');
    
    if (!notificationBadge || !notificationIcon) return;
    
    // Check for notifications every 30 seconds
    checkNotifications();
    setInterval(checkNotifications, 30000);
    
    // Toggle notifications panel when clicked
    notificationIcon.addEventListener('click', toggleNotificationsPanel);
}

/**
 * Check for new notifications
 */
async function checkNotifications() {
    try {
        const user = ELC.getCurrentUser();
        if (!user) return;
        
        // Get notifications count from API
        const response = await ELC.apiRequest(`/notifications/count/${user._id}`);
        
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            const count = response.data.count || 0;
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    } catch (error) {
        console.error('Error checking notifications:', error);
    }
}

/**
 * Toggle the notifications panel
 */
function toggleNotificationsPanel() {
    // Check if panel already exists
    let panel = document.getElementById('notifications-panel');
    
    if (panel) {
        // Toggle visibility
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            loadNotifications(panel);
        } else {
            panel.style.display = 'none';
        }
        return;
    }
    
    // Create panel if it doesn't exist
    panel = document.createElement('div');
    panel.id = 'notifications-panel';
    panel.className = 'notifications-panel';
    panel.style.position = 'absolute';
    panel.style.top = '60px';
    panel.style.right = '20px';
    panel.style.width = '300px';
    panel.style.maxHeight = '400px';
    panel.style.overflowY = 'auto';
    panel.style.backgroundColor = 'white';
    panel.style.border = '1px solid #ddd';
    panel.style.borderRadius = '4px';
    panel.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    panel.style.zIndex = '1000';
    
    // Add header
    panel.innerHTML = `
        <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 16px;">Notifications</h3>
            <button id="mark-all-read" style="background: none; border: none; color: #1e40af; cursor: pointer; font-size: 14px;">Mark all as read</button>
        </div>
        <div id="notifications-list" style="padding: 10px;">
            <p class="text-center">Loading notifications...</p>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(panel);
    
    // Load notifications
    loadNotifications(panel);
    
    // Add event listener to mark all as read
    document.getElementById('mark-all-read').addEventListener('click', markAllNotificationsAsRead);
    
    // Close panel when clicking outside
    document.addEventListener('click', function(event) {
        if (!panel.contains(event.target) && !document.querySelector('.notifications').contains(event.target)) {
            panel.style.display = 'none';
        }
    });
}

/**
 * Load notifications into the panel
 * @param {HTMLElement} panel - The notifications panel element
 */
async function loadNotifications(panel) {
    const notificationsList = panel.querySelector('#notifications-list');
    
    try {
        const user = ELC.getCurrentUser();
        if (!user) return;
        
        // Get notifications from API
        const response = await ELC.apiRequest(`/notifications/${user._id}`);
        const notifications = response.data || [];
        
        if (notifications.length === 0) {
            notificationsList.innerHTML = '<p class="text-center">No notifications</p>';
            return;
        }
        
        // Display notifications
        notificationsList.innerHTML = notifications.map(notification => `
            <div class="notification-item" style="padding: 10px; border-bottom: 1px solid #eee; ${notification.read ? 'opacity: 0.7;' : 'background-color: #f0f9ff;'}">
                <div style="display: flex; justify-content: space-between;">
                    <strong>${notification.title}</strong>
                    <small>${ELC.formatDate(notification.createdAt, true)}</small>
                </div>
                <p style="margin: 5px 0;">${notification.message}</p>
                <div style="display: flex; justify-content: flex-end;">
                    <button class="mark-read-btn" data-id="${notification._id}" style="background: none; border: none; color: #1e40af; cursor: pointer; font-size: 12px;">
                        ${notification.read ? 'Mark as unread' : 'Mark as read'}
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to mark as read buttons
        const markReadButtons = notificationsList.querySelectorAll('.mark-read-btn');
        markReadButtons.forEach(button => {
            button.addEventListener('click', () => {
                toggleNotificationReadStatus(button.getAttribute('data-id'));
            });
        });
    } catch (error) {
        console.error('Error loading notifications:', error);
        notificationsList.innerHTML = '<p class="text-center text-red-500">Error loading notifications</p>';
    }
}

/**
 * Toggle the read status of a notification
 * @param {string} notificationId - The ID of the notification
 */
async function toggleNotificationReadStatus(notificationId) {
    try {
        await ELC.apiRequest(`/notifications/toggle-read/${notificationId}`, 'PUT');
        
        // Refresh notifications panel
        const panel = document.getElementById('notifications-panel');
        if (panel) {
            loadNotifications(panel);
        }
        
        // Update badge count
        checkNotifications();
    } catch (error) {
        console.error('Error toggling notification status:', error);
        ELC.showNotification('Error updating notification', 'error');
    }
}

/**
 * Mark all notifications as read
 */
async function markAllNotificationsAsRead() {
    try {
        const user = ELC.getCurrentUser();
        if (!user) return;
        
        await ELC.apiRequest(`/notifications/mark-all-read/${user._id}`, 'PUT');
        
        // Refresh notifications panel
        const panel = document.getElementById('notifications-panel');
        if (panel) {
            loadNotifications(panel);
        }
        
        // Update badge count
        checkNotifications();
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        ELC.showNotification('Error updating notifications', 'error');
    }
}

/**
 * Initialize the current page based on its type
 */
function initializeCurrentPage() {
    // Get current page name from URL
    const path = window.location.pathname;
    const page = path.split('/').pop();
    
    switch (page) {
        case 'index.html':
            initializeHomePage();
            break;
        case 'student.html':
            initializeStudentDashboard();
            break;
        case 'teacher.html':
            initializeTeacherDashboard();
            break;
        case 'receptionist.html':
            initializeReceptionistDashboard();
            break;
        case 'admin.html':
            initializeAdminDashboard();
            break;
        case 'chatbot.html':
            initializeChatbot();
            break;
        // Add more pages as needed
    }
}

/**
 * Initialize the home page
 */
function initializeHomePage() {
    // Home page specific initialization
    console.log('Home page initialized');
}

/**
 * Initialize the student dashboard
 */
function initializeStudentDashboard() {
    // Check if user has correct role
    if (!ELC.hasRole('student')) {
        window.location.href = 'login.html?error=unauthorized';
        return;
    }
    
    // Load student-specific data
    loadStudentCourses();
    loadStudentAssignments();
    loadStudentProgress();
}

/**
 * Initialize the teacher dashboard
 */
function initializeTeacherDashboard() {
    // Check if user has correct role
    if (!ELC.hasRole('teacher')) {
        window.location.href = 'login.html?error=unauthorized';
        return;
    }
    
    // Load teacher-specific data
    loadTeacherClasses();
    loadAssignmentsToGrade();
}

/**
 * Initialize the receptionist dashboard
 */
function initializeReceptionistDashboard() {
    // Check if user has correct role
    if (!ELC.hasRole('receptionist')) {
        window.location.href = 'login.html?error=unauthorized';
        return;
    }
    
    // Load receptionist-specific data
    loadRecentStudents();
    loadTodayClasses();
    
    // Initialize form handlers
    initializeRegistrationForm();
    initializeClassAssignmentForm();
}

/**
 * Initialize the admin dashboard
 */
function initializeAdminDashboard() {
    // Check if user has correct role
    if (!ELC.hasRole('manager')) {
        window.location.href = 'login.html?error=unauthorized';
        return;
    }
    
    // Load admin-specific data
    loadSystemStats();
    loadRecentActivities();
}

/**
 * Initialize the chatbot page
 */
function initializeChatbot() {
    // Chatbot specific initialization
    setupChatbotInterface();
}

// Placeholder functions for data loading - these would be implemented with actual API calls

function loadStudentCourses() {
    // Implementation would load student courses from API
    console.log('Loading student courses...');
}

function loadStudentAssignments() {
    // Implementation would load student assignments from API
    console.log('Loading student assignments...');
}

function loadStudentProgress() {
    // Implementation would load student progress from API
    console.log('Loading student progress...');
}

function loadTeacherClasses() {
    // Implementation would load teacher classes from API
    console.log('Loading teacher classes...');
}

function loadAssignmentsToGrade() {
    // Implementation would load assignments to grade from API
    console.log('Loading assignments to grade...');
}

function loadRecentStudents() {
    // Implementation would load recent students from API
    console.log('Loading recent students...');
}

function loadTodayClasses() {
    // Implementation would load today's classes from API
    console.log('Loading today\'s classes...');
}

function initializeRegistrationForm() {
    // Implementation would set up the student registration form
    console.log('Initializing registration form...');
}

function initializeClassAssignmentForm() {
    // Implementation would set up the class assignment form
    console.log('Initializing class assignment form...');
}

function loadSystemStats() {
    // Implementation would load system statistics from API
    console.log('Loading system stats...');
}

function loadRecentActivities() {
    // Implementation would load recent activities from API
    console.log('Loading recent activities...');
}

function setupChatbotInterface() {
    // Implementation would set up the chatbot interface
    console.log('Setting up chatbot interface...');
}