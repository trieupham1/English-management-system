/**
 * Common Utility Functions for English Learning Center Frontend
 * @version 1.1.0
 */

// Configuration
const CONFIG = {
    API_BASE_URL: '/api',
    NOTIFICATION_DURATION: 3000,
    DEBUG_MODE: true
};

// Utility Functions
const Utils = {
    /**
     * Capitalize the first letter of a string
     * @param {string} str - The string to capitalize
     * @returns {string} Capitalized string
     */
    capitalizeFirstLetter(str) {
        return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    },

    /**
     * Debounce function to limit rapid event firing
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * Check if the application is online
     * @returns {boolean} Online status
     */
    isOnline() {
        return navigator.onLine;
    }
};

// Authentication Utilities
const AuthUtils = {
    /**
     * Get authentication token from localStorage
     * @returns {string|null} Authentication token
     */
    getAuthToken() {
        return localStorage.getItem('token');
    },

    /**
     * Get current user from localStorage
     * @returns {object|null} User object
     */
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error parsing user data', error);
            return null;
        }
    },

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return !!this.getAuthToken() && !!this.getCurrentUser();
    },

    /**
     * Check if user has specified role(s)
     * @param {string|string[]} roles - Role(s) to check
     * @returns {boolean} Role match status
     */
    hasRole(roles) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        return Array.isArray(roles) 
            ? roles.includes(user.role)
            : user.role === roles;
    },

    /**
     * Refresh authentication token
     * @returns {Promise<string|null>} New token or null
     */
    async refreshToken() {
        try {
            const response = await this.apiRequest('/auth/refresh-token', 'POST', null, true);
            if (response.success) {
                localStorage.setItem('token', response.data.token);
                return response.data.token;
            }
            return null;
        } catch (error) {
            this.logout();
            return null;
        }
    },

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }
};

// Notification Utilities
const NotificationUtils = {
    /**
     * Get color for different notification types
     * @param {string} type - Notification type
     * @returns {string} Color code
     */
    getNotificationColor(type) {
        const colors = {
            success: '#10b981',  // Green
            error: '#ef4444',    // Red
            warning: '#f59e0b',  // Yellow
            info: '#3b82f6'      // Blue
        };
        return colors[type] || colors.info;
    },

    /**
     * Show notification to user
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     * @param {number} duration - Display duration
     */
    showNotification(message, type = 'info', duration = CONFIG.NOTIFICATION_DURATION) {
        const container = this.ensureNotificationContainer();
        const notification = this.createNotificationElement(message, type);
        
        container.appendChild(notification);
        
        // Fade in
        setTimeout(() => notification.style.opacity = '1', 10);
        
        // Auto-remove
        setTimeout(() => this.removeNotification(notification), duration);
    },

    /**
     * Create notification container if not exists
     * @returns {HTMLElement} Notification container
     */
    ensureNotificationContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
            `;
            document.body.appendChild(container);
        }
        return container;
    },

    /**
     * Create notification element
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     * @returns {HTMLElement} Notification element
     */
    createNotificationElement(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        notification.style.cssText = `
            background-color: ${this.getNotificationColor(type)};
            color: #fff;
            padding: 10px 20px;
            border-radius: 4px;
            margin-bottom: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            min-width: 200px;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        const closeButton = notification.querySelector('.notification-close');
        closeButton.style.cssText = `
            background: none;
            border: none;
            color: #fff;
            cursor: pointer;
            float: right;
            font-size: 20px;
            margin-left: 10px;
        `;

        closeButton.addEventListener('click', () => this.removeNotification(notification));

        return notification;
    },

    /**
     * Remove notification element
     * @param {HTMLElement} notification - Notification to remove
     */
    removeNotification(notification) {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
};

// API Request Utility
const APIUtils = {
    /**
     * Make API request
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method
     * @param {object} body - Request body
     * @param {boolean} includeAuth - Include authentication
     * @returns {Promise<object>} API response
     */
    async apiRequest(endpoint, method = 'GET', body = null, includeAuth = true) {
        if (!Utils.isOnline()) {
            NotificationUtils.showNotification('No internet connection', 'warning');
            throw new Error('Offline');
        }

        try {
            const url = `${CONFIG.API_BASE_URL}${endpoint}`;
            const headers = { 'Content-Type': 'application/json' };

            if (includeAuth) {
                const token = AuthUtils.getAuthToken();
                if (!token) {
                    window.location.href = '/login.html';
                    return;
                }
                headers['Authorization'] = `Bearer ${token}`;
            }

            const options = { method, headers };

            if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(url, options);

            if (!response.ok) {
                const errorData = await response.json();
                
                if (response.status === 401) {
                    AuthUtils.logout();
                    return;
                }

                throw new Error(errorData.message || 'Request failed');
            }

            return await response.json();
        } catch (error) {
            NotificationUtils.showNotification(
                error.message || 'An unexpected error occurred', 
                'error'
            );
            throw error;
        }
    }
};

// Form and UI Utilities
const FormUtils = {
    /**
     * Handle form submission
     * @param {string} formId - Form element ID
     * @param {string} endpoint - API endpoint
     * @param {object} options - Submission options
     */
    handleFormSubmit(formId, endpoint, options = {}) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const transformData = options.transformData || (d => d);
                const processedData = transformData(data);

                const response = await APIUtils.apiRequest(
                    endpoint, 
                    options.method || 'POST', 
                    processedData
                );

                if (options.onSuccess) {
                    options.onSuccess(response);
                } else {
                    NotificationUtils.showNotification(
                        'Operation successful', 
                        'success'
                    );
                }

                form.reset();
            } catch (error) {
                if (options.onError) {
                    options.onError(error);
                } else {
                    NotificationUtils.showNotification(
                        error.message || 'Operation failed', 
                        'error'
                    );
                }
            }
        });
    }
};

// Global Event Listeners
window.addEventListener('online', () => {
    NotificationUtils.showNotification('Network connection restored', 'success');
});

window.addEventListener('offline', () => {
    NotificationUtils.showNotification('No internet connection', 'warning');
});

// Expose utilities to global scope
window.ELC = {
    ...Utils,
    ...AuthUtils,
    ...NotificationUtils,
    ...APIUtils,
    ...FormUtils,
    CONFIG
};