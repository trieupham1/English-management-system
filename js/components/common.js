
/**
 * Common utility functions for the English Learning Center frontend
 */

// API endpoint base URL
const API_BASE_URL = '/api';

/**
 * API Request Handler
 * Makes API requests and handles common error cases
 * 
 * @param {string} endpoint - API endpoint to call
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object} body - Request body (for POST/PUT requests)
 * @param {boolean} includeAuth - Whether to include the authentication token
 * @returns {Promise} - Promise resolving to the response data
 */
async function apiRequest(endpoint, method = 'GET', body = null, includeAuth = true) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json'
        };

        // Include authentication token if required
        if (includeAuth) {
            const token = getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            } else {
                // Redirect to login if no token is available
                window.location.href = '/login.html';
                return;
            }
        }

        const options = {
            method,
            headers
        };

        if (body && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
            // Handle authentication errors
            if (response.status === 401) {
                // Clear token and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login.html?error=session_expired';
                return;
            }
            
            // Handle other errors
            throw new Error(data.message || 'An error occurred with the API request');
        }

        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        showNotification(error.message || 'An error occurred. Please try again.', 'error');
        throw error;
    }
}

/**
 * Get auth token from localStorage
 * @returns {string|null} - The auth token or null if not found
 */
function getAuthToken() {
    return localStorage.getItem('token');
}

/**
 * Get current user from localStorage
 * @returns {object|null} - The user object or null if not found
 */
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    try {
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error('Error parsing user data', e);
        return null;
    }
}

/**
 * Check if the user is authenticated
 * @returns {boolean} - Whether the user is authenticated
 */
function isAuthenticated() {
    return !!getAuthToken() && !!getCurrentUser();
}

/**
 * Check if the current user has the specified role
 * @param {string|Array} roles - The role(s) to check
 * @returns {boolean} - Whether the user has the specified role
 */
function hasRole(roles) {
    const user = getCurrentUser();
    
    if (!user) return false;
    
    if (Array.isArray(roles)) {
        return roles.includes(user.role);
    }
    
    return user.role === roles;
}

/**
 * Show a notification to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, warning, info)
 * @param {number} duration - How long to show the notification (in ms)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Check if notification container exists, create it if not
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Style the notification
    notification.style.backgroundColor = getNotificationColor(type);
    notification.style.color = '#fff';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.marginBottom = '10px';
    notification.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    notification.style.minWidth = '200px';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';
    
    // Add close button functionality
    const closeButton = notification.querySelector('.notification-close');
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = '#fff';
    closeButton.style.cursor = 'pointer';
    closeButton.style.float = 'right';
    closeButton.style.fontSize = '20px';
    closeButton.style.marginLeft = '10px';
    
    closeButton.addEventListener('click', () => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 300);
    });
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Auto-remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notificationContainer.removeChild(notification);
                }
            }, 300);
        }
    }, duration);
}

/**
 * Get the appropriate color for a notification type
 * @param {string} type - The notification type
 * @returns {string} - The color for the notification
 */
function getNotificationColor(type) {
    switch (type) {
        case 'success': return '#10b981'; // Green
        case 'error': return '#ef4444';   // Red
        case 'warning': return '#f59e0b'; // Yellow
        case 'info':
        default: return '#3b82f6';        // Blue
    }
}

/**
 * Format a date string to a readable format
 * @param {string|Date} dateString - The date to format
 * @param {boolean} includeTime - Whether to include the time
 * @returns {string} - The formatted date string
 */
function formatDate(dateString, includeTime = false) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('en-US', options);
}

/**
 * Initialize the sidebar toggle functionality
 */
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebarToggle && sidebar && mainContent) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        });
    }
}

/**
 * Initialize tab switching functionality
 * @param {string} containerId - The ID of the container with tabs
 */
function initTabs(containerId = 'tabs-container') {
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    const tabs = container.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to selected tab and content
            tab.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

/**
 * Handle form submission with API integration
 * @param {string} formId - The ID of the form element
 * @param {string} apiEndpoint - The API endpoint to submit to
 * @param {string} method - The HTTP method to use
 * @param {Function} onSuccess - Callback function on successful submission
 * @param {Function} onError - Callback function on error
 * @param {Function} transformData - Function to transform form data before submission
 */
function handleFormSubmit(
    formId, 
    apiEndpoint, 
    method = 'POST', 
    onSuccess = null, 
    onError = null,
    transformData = null
) {
    const form = document.getElementById(formId);
    
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        let data = {};
        
        formData.forEach((value, key) => {
            data[key] = value;
        });
        
        // Apply transformation if provided
        if (transformData && typeof transformData === 'function') {
            data = transformData(data);
        }
        
        try {
            // Submit to API
            const response = await apiRequest(apiEndpoint, method, data);
            
            // Call success callback if provided
            if (onSuccess && typeof onSuccess === 'function') {
                onSuccess(response);
            } else {
                // Default success behavior
                showNotification('Operation completed successfully', 'success');
                form.reset();
            }
        } catch (error) {
            // Call error callback if provided
            if (onError && typeof onError === 'function') {
                onError(error);
            } else {
                // Default error behavior
                showNotification(error.message || 'An error occurred', 'error');
            }
        }
    });
}

/**
 * Load and populate a data table from an API
 * @param {string} tableId - The ID of the table element
 * @param {string} apiEndpoint - The API endpoint to fetch data from
 * @param {Function} rowRenderer - Function to render a table row from an item
 * @param {Function} onDataLoaded - Callback when data is loaded
 */
async function loadDataTable(tableId, apiEndpoint, rowRenderer, onDataLoaded = null) {
    const tableBody = document.querySelector(`#${tableId} tbody`);
    
    if (!tableBody) return;
    
    try {
        // Show loading state
        tableBody.innerHTML = '<tr><td colspan="100%" class="text-center">Loading...</td></tr>';
        
        // Fetch data
        const response = await apiRequest(apiEndpoint);
        const data = response.data || [];
        
        // Clear loading state
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
            return;
        }
        
        // Render rows
        data.forEach(item => {
            const rowHtml = rowRenderer(item);
            tableBody.innerHTML += rowHtml;
        });
        
        // Call callback if provided
        if (onDataLoaded && typeof onDataLoaded === 'function') {
            onDataLoaded(data);
        }
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="100%" class="text-center text-red-500">Error loading data: ${error.message}</td></tr>`;
    }
}

/**
 * Initialize the user profile information
 */
function initUserProfile() {
    const user = getCurrentUser();
    
    if (!user) return;
    
    // Update user name and role in the header
    const userNameElement = document.getElementById('user-name');
    const userRoleElement = document.getElementById('user-role');
    const userAvatarElement = document.getElementById('user-avatar');
    
    if (userNameElement) {
        userNameElement.textContent = user.fullName;
    }
    
    if (userRoleElement) {
        userRoleElement.textContent = capitalizeFirstLetter(user.role);
    }
    
    if (userAvatarElement) {
        // Set first letter of name as avatar
        const firstLetter = user.fullName.charAt(0).toUpperCase();
        userAvatarElement.textContent = firstLetter;
    }
}

/**
 * Capitalize the first letter of a string
 * @param {string} string - The string to capitalize
 * @returns {string} - The capitalized string
 */
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Initialize the logout functionality
 */
function initLogout() {
    const logoutButton = document.getElementById('logout-btn');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Clear localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Redirect to login page
            window.location.href = '/login.html';
        });
    }
}

/**
 * Initialize the search functionality
 * @param {string} searchInputId - The ID of the search input element
 * @param {string} itemSelector - The selector for items to search within
 * @param {Function} filterFunction - Function to determine if an item matches the search
 */
function initSearch(searchInputId, itemSelector, filterFunction) {
    const searchInput = document.getElementById(searchInputId);
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const items = document.querySelectorAll(itemSelector);
        
        items.forEach(item => {
            const visible = filterFunction(item, searchTerm);
            item.style.display = visible ? '' : 'none';
        });
    });
}

// Export all functions for use in other scripts
window.ELC = {
    apiRequest,
    getAuthToken,
    getCurrentUser,
    isAuthenticated,
    hasRole,
    showNotification,
    formatDate,
    initSidebar,
    initTabs,
    handleFormSubmit,
    loadDataTable,
    initUserProfile,
    initLogout,
    initSearch,
    capitalizeFirstLetter
};