document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!ELC.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Check if user has manager role
    if (!ELC.hasRole('manager')) {
        window.location.href = 'login.html?error=unauthorized';
        return;
    }
    
    // Initialize admin dashboard
    initAdminDashboard();
});

/**
 * Initialize the admin dashboard
 */
function initAdminDashboard() {
    // Load user profile
    loadUserProfile();
    
    // Initialize tab navigation
    initTabNavigation();
    
    // Initialize logout functionality
    initLogout();
    
    // Load dashboard data
    loadDashboardStats();
    loadRecentActivities();
    
    // Initialize event listeners for buttons
    initButtonListeners();
    
    // Initialize tables
    initUserTable();
    initCourseTable();
    
    // Initialize settings form
    initSettingsForm();
}

/**
 * Load user profile information
 */
function loadUserProfile() {
    const user = ELC.getCurrentUser();
    if (user) {
        document.getElementById('user-name').textContent = user.fullName;
        document.getElementById('admin-name').textContent = user.fullName.split(' ')[0];
        document.querySelector('.user-avatar').textContent = user.fullName.charAt(0);
    }
}

/**
 * Initialize tab navigation
 */
function initTabNavigation() {
    const menuItems = document.querySelectorAll('.menu-item[data-section]');
    const sections = document.querySelectorAll('.content-section');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetSection = this.getAttribute('data-section');
            
            // Toggle active class on menu items
            menuItems.forEach(mi => mi.classList.remove('active'));
            this.classList.add('active');
            
            // Toggle visibility of sections
            sections.forEach(section => {
                if (section.id === `${targetSection}-section`) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        });
    });
}

/**
 * Initialize logout functionality
 */
function initLogout() {
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });
}

/**
 * Load dashboard statistics
 */
function loadDashboardStats() {
    // Make API request to get system stats
    ELC.apiRequest('/api/admin/stats', 'GET')
        .then(response => {
            if (response.success) {
                updateStatCards(response.data);
            } else {
                console.error('Error loading stats:', response.message);
            }
        })
        .catch(error => {
            console.error('Error fetching stats:', error);
            // Use default values from HTML
        });
}

/**
 * Update stat cards with data
 */
function updateStatCards(stats) {
    if (stats.totalStudents) {
        document.getElementById('stat-students').textContent = stats.totalStudents;
    }
    
    if (stats.totalTeachers) {
        document.getElementById('stat-teachers').textContent = stats.totalTeachers;
    }
    
    if (stats.activeCourses) {
        document.getElementById('stat-courses').textContent = stats.activeCourses;
    }
    
    if (stats.monthlyRevenue) {
        document.getElementById('stat-revenue').textContent = `${stats.monthlyRevenue}K`;
    }
}

/**
 * Load recent activities
 */
function loadRecentActivities() {
    // Make API request to get recent activities
    ELC.apiRequest('/api/admin/activities', 'GET')
        .then(response => {
            if (response.success) {
                updateActivityList(response.data);
            } else {
                console.error('Error loading activities:', response.message);
            }
        })
        .catch(error => {
            console.error('Error fetching activities:', error);
            // Keep default activities from HTML
        });
}

/**
 * Update activity list with data
 */
function updateActivityList(activities) {
    if (!activities || activities.length === 0) return;
    
    const activityList = document.getElementById('recent-activities');
    activityList.innerHTML = '';
    
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        let iconClass = 'fas fa-info-circle';
        switch (activity.type) {
            case 'user':
                iconClass = 'fas fa-user-plus';
                break;
            case 'payment':
                iconClass = 'fas fa-money-bill';
                break;
            case 'course':
                iconClass = 'fas fa-book';
                break;
            case 'profile':
                iconClass = 'fas fa-user-edit';
                break;
            case 'system':
                iconClass = 'fas fa-cogs';
                break;
        }
        
        activityItem.innerHTML = `
            <div class="activity-icon"><i class="${iconClass}"></i></div>
            <div class="activity-details">
                <div class="activity-title">${activity.description}</div>
                <div class="activity-time">${ELC.formatTimeAgo(activity.timestamp)}</div>
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
}

/**
 * Initialize button event listeners
 */
function initButtonListeners() {
    // Quick action buttons
    document.getElementById('btn-add-user').addEventListener('click', () => {
        showCreateUserModal();
    });
    
    document.getElementById('btn-add-course').addEventListener('click', () => {
        showCreateCourseModal();
    });
    
    document.getElementById('btn-pending-approvals').addEventListener('click', () => {
        // Switch to user management tab and filter for pending status
        const userMenuItem = document.querySelector('.menu-item[data-section="users"]');
        userMenuItem.click();
        document.getElementById('filter-status').value = 'pending';
        filterUsers();
    });
    
    document.getElementById('btn-system-backup').addEventListener('click', () => {
        createSystemBackup();
    });
    
    // Other section buttons
    document.getElementById('btn-create-user').addEventListener('click', () => {
        showCreateUserModal();
    });
    
    document.getElementById('btn-create-course').addEventListener('click', () => {
        showCreateCourseModal();
    });
}

/**
 * Initialize user table
 */
function initUserTable() {
    // Load users from API
    loadUsers();
    
    // Add search and filter functionality
    const searchInput = document.getElementById('search-users');
    searchInput.addEventListener('input', () => {
        filterUsers();
    });
    
    const roleFilter = document.getElementById('filter-role');
    roleFilter.addEventListener('change', () => {
        filterUsers();
    });
    
    const statusFilter = document.getElementById('filter-status');
    statusFilter.addEventListener('change', () => {
        filterUsers();
    });
}

/**
 * Load users from API
 */
function loadUsers() {
    ELC.apiRequest('/api/admin/users', 'GET')
        .then(response => {
            if (response.success) {
                populateUserTable(response.data);
            } else {
                console.error('Error loading users:', response.message);
                ELC.showNotification('Error loading users', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching users:', error);
            ELC.showNotification('Failed to load users', 'error');
        });
}

/**
 * Populate user table with data
 */
function populateUserTable(users) {
    if (!users || users.length === 0) return;
    
    const tableBody = document.querySelector('#users-table tbody');
    tableBody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.dataset.id = user._id;
        
        let statusBadgeClass = 'badge-success';
        if (user.studentInfo && user.studentInfo.status) {
            statusBadgeClass = user.studentInfo.status === 'active' ? 'badge-success' : 
                              user.studentInfo.status === 'pending' ? 'badge-warning' : 
                              'badge-danger';
        } else if (!user.isActive) {
            statusBadgeClass = 'badge-danger';
        }
        
        const userId = user.studentInfo ? user.studentInfo.studentId : 
                      user.teacherInfo ? user.teacherInfo.teacherId : 
                      `U${user._id.substring(0, 5)}`;
        
        row.innerHTML = `
            <td>${userId}</td>
            <td>${user.fullName}</td>
            <td>${capitalizeFirstLetter(user.role)}</td>
            <td>${user.email}</td>
            <td><span class="badge ${statusBadgeClass}">${getUserStatus(user)}</span></td>
            <td>${ELC.formatDate(user.createdAt)}</td>
            <td>
                <button class="action-btn" title="Edit" onclick="editUser('${user._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                ${user.isActive ? 
                `<button class="action-btn" title="Disable" onclick="toggleUserStatus('${user._id}', false)">
                    <i class="fas fa-ban"></i>
                </button>` : 
                `<button class="action-btn" title="Enable" onclick="toggleUserStatus('${user._id}', true)">
                    <i class="fas fa-check"></i>
                </button>`}
                <button class="action-btn" title="Delete" onclick="deleteUser('${user._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Get user status text
 */
function getUserStatus(user) {
    if (user.studentInfo && user.studentInfo.status) {
        return capitalizeFirstLetter(user.studentInfo.status);
    }
    
    return user.isActive ? 'Active' : 'Inactive';
}

/**
 * Filter users based on search and filter fields
 */
function filterUsers() {
    const searchTerm = document.getElementById('search-users').value.toLowerCase();
    const roleFilter = document.getElementById('filter-role').value;
    const statusFilter = document.getElementById('filter-status').value;
    
    const rows = document.querySelectorAll('#users-table tbody tr');
    
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        const role = row.cells[2].textContent.toLowerCase();
        const status = row.cells[4].textContent.toLowerCase();
        
        const matchesSearch = searchTerm === '' || name.includes(searchTerm);
        const matchesRole = roleFilter === '' || role.toLowerCase() === roleFilter.toLowerCase();
        const matchesStatus = statusFilter === '' || status.toLowerCase() === statusFilter.toLowerCase();
        
        if (matchesSearch && matchesRole && matchesStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/**
 * Initialize course table
 */
function initCourseTable() {
    // Load courses from API
    loadCourses();
    
    // Add search and filter functionality
    const searchInput = document.getElementById('search-courses');
    searchInput.addEventListener('input', () => {
        filterCourses();
    });
    
    const levelFilter = document.getElementById('filter-level');
    levelFilter.addEventListener('change', () => {
        filterCourses();
    });
    
    const categoryFilter = document.getElementById('filter-category');
    categoryFilter.addEventListener('change', () => {
        filterCourses();
    });
}

/**
 * Load courses from API
 */
function loadCourses() {
    ELC.apiRequest('/api/courses', 'GET')
        .then(response => {
            if (response.success) {
                populateCourseTable(response.data);
            } else {
                console.error('Error loading courses:', response.message);
                ELC.showNotification('Error loading courses', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching courses:', error);
            ELC.showNotification('Failed to load courses', 'error');
        });
}

/**
 * Populate course table with data
 */
function populateCourseTable(courses) {
    if (!courses || courses.length === 0) return;
    
    const tableBody = document.querySelector('#courses-table tbody');
    tableBody.innerHTML = '';
    
    courses.forEach(course => {
        const row = document.createElement('tr');
        row.dataset.id = course._id;
        
        let statusBadgeClass = 'badge-success';
        if (course.status === 'upcoming') {
            statusBadgeClass = 'badge-warning';
        } else if (course.status === 'completed' || course.status === 'cancelled') {
            statusBadgeClass = 'badge-danger';
        }
        
        const teacherName = course.teacher ? course.teacher.fullName : 'Unassigned';
        const students = course.students ? `${course.students.length}/${course.maxStudents}` : '0/0';
        
        row.innerHTML = `
            <td>C${course._id.substring(0, 4)}</td>
            <td>${course.name}</td>
            <td>${capitalizeFirstLetter(course.level)}</td>
            <td>${teacherName}</td>
            <td>${students}</td>
            <td><span class="badge ${statusBadgeClass}">${capitalizeFirstLetter(course.status)}</span></td>
            <td>
                <button class="action-btn" title="Edit" onclick="editCourse('${course._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" title="View" onclick="viewCourse('${course._id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" title="Delete" onclick="deleteCourse('${course._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Filter courses based on search and filter fields
 */
function filterCourses() {
    const searchTerm = document.getElementById('search-courses').value.toLowerCase();
    const levelFilter = document.getElementById('filter-level').value;
    const categoryFilter = document.getElementById('filter-category').value;
    
    const rows = document.querySelectorAll('#courses-table tbody tr');
    
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        const level = row.cells[2].textContent.toLowerCase();
        // Category would be in the data-category attribute
        const category = row.dataset.category || '';
        
        const matchesSearch = searchTerm === '' || name.includes(searchTerm);
        const matchesLevel = levelFilter === '' || level === levelFilter;
        const matchesCategory = categoryFilter === '' || category === categoryFilter;
        
        if (matchesSearch && matchesLevel && matchesCategory) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/**
 * Initialize settings form
 */
function initSettingsForm() {
    loadSystemSettings();
    
    document.getElementById('system-settings-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveSystemSettings();
    });
}

/**
 * Load system settings
 */
function loadSystemSettings() {
    ELC.apiRequest('/api/settings', 'GET')
        .then(response => {
            if (response.success) {
                populateSettingsForm(response.data);
            } else {
                console.error('Error loading settings:', response.message);
            }
        })
        .catch(error => {
            console.error('Error fetching settings:', error);
        });
}

/**
 * Populate settings form with data
 */
function populateSettingsForm(settings) {
    if (!settings) return;
    
    // Center information
    document.getElementById('center-name').value = settings.centerName || '';
    document.getElementById('center-address').value = settings.address || '';
    document.getElementById('center-phone').value = settings.phone || '';
    document.getElementById('center-email').value = settings.email || '';
    document.getElementById('center-hours').value = settings.workingHours || '';
    
    // System configuration
    document.getElementById('max-students').value = settings.maxStudentsPerClass || 20;
    document.getElementById('currency').value = settings.currencySymbol || 'vnd';
    document.getElementById('system-language').value = settings.language || 'en';
    document.getElementById('system-theme').value = settings.theme || 'light';
    
    // Features
    document.getElementById('enable-chatbot').checked = settings.enableChatbot !== false;
    document.getElementById('enable-online-learning').checked = settings.enableOnlineLearning !== false;
    document.getElementById('enable-auto-backup').checked = settings.backupSettings?.enableAutoBackup !== false;
    
    // Notifications
    if (settings.notificationSettings) {
        document.getElementById('email-notifications').checked = settings.notificationSettings.emailNotifications !== false;
        document.getElementById('sms-notifications').checked = settings.notificationSettings.smsNotifications === true;
        document.getElementById('registration-alerts').checked = settings.notificationSettings.newRegistrationAlert !== false;
        document.getElementById('payment-alerts').checked = settings.notificationSettings.newPaymentAlert !== false;
    }
}

/**
 * Save system settings
 */
function saveSystemSettings() {
    const settings = {
        centerName: document.getElementById('center-name').value,
        address: document.getElementById('center-address').value,
        phone: document.getElementById('center-phone').value,
        email: document.getElementById('center-email').value,
        workingHours: document.getElementById('center-hours').value,
        maxStudentsPerClass: parseInt(document.getElementById('max-students').value) || 20,
        currencySymbol: document.getElementById('currency').value,
        language: document.getElementById('system-language').value,
        theme: document.getElementById('system-theme').value,
        enableChatbot: document.getElementById('enable-chatbot').checked,
        enableOnlineLearning: document.getElementById('enable-online-learning').checked,
        backupSettings: {
            enableAutoBackup: document.getElementById('enable-auto-backup').checked
        },
        notificationSettings: {
            emailNotifications: document.getElementById('email-notifications').checked,
            smsNotifications: document.getElementById('sms-notifications').checked,
            newRegistrationAlert: document.getElementById('registration-alerts').checked,
            newPaymentAlert: document.getElementById('payment-alerts').checked
        }
    };
    
    ELC.apiRequest('/api/settings', 'PUT', settings)
        .then(response => {
            if (response.success) {
                ELC.showNotification('Settings saved successfully', 'success');
            } else {
                ELC.showNotification('Error saving settings: ' + response.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error saving settings:', error);
            ELC.showNotification('Error saving settings', 'error');
        });
}

/**
 * Create system backup
 */
function createSystemBackup() {
    ELC.showNotification('Creating system backup...', 'info');
    
    ELC.apiRequest('/api/settings/backup', 'POST')
        .then(response => {
            if (response.success) {
                ELC.showNotification('Backup created successfully', 'success');
            } else {
                ELC.showNotification('Error creating backup: ' + response.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error creating backup:', error);
            ELC.showNotification('Error creating backup', 'error');
        });
}

/**
 * Show create user modal
 */
function showCreateUserModal() {
    alert('Create user functionality will be implemented here');
    // In a real implementation, you would show a modal form
}

/**
 * Show create course modal
 */
function showCreateCourseModal() {
    alert('Create course functionality will be implemented here');
    // In a real implementation, you would show a modal form
}

/**
 * Edit user
 */
function editUser(userId) {
    alert(`Edit user with ID: ${userId}`);
    // In a real implementation, you would fetch user data and show a modal form
}

/**
 * Toggle user status (active/inactive)
 */
function toggleUserStatus(userId, setActive) {
    const action = setActive ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} this user?`)) {
        ELC.apiRequest(`/api/admin/users/${userId}/status`, 'PUT', { isActive: setActive })
            .then(response => {
                if (response.success) {
                    ELC.showNotification(`User ${action}d successfully`, 'success');
                    loadUsers(); // Reload the user table
                } else {
                    ELC.showNotification(`Error ${action}ing user: ${response.message}`, 'error');
                }
            })
            .catch(error => {
                console.error(`Error ${action}ing user:`, error);
                ELC.showNotification(`Error ${action}ing user`, 'error');
            });
    }
}

/**
 * Delete user
 */
function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        ELC.apiRequest(`/api/admin/users/${userId}`, 'DELETE')
            .then(response => {
                if (response.success) {
                    ELC.showNotification('User deleted successfully', 'success');
                    loadUsers(); // Reload the user table
                } else {
                    ELC.showNotification('Error deleting user: ' + response.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error deleting user:', error);
                ELC.showNotification('Error deleting user', 'error');
            });
    }
}

/**
 * Edit course
 */
function editCourse(courseId) {
    alert(`Edit course with ID: ${courseId}`);
    // In a real implementation, you would fetch course data and show a modal form
}

/**
 * View course details
 */
function viewCourse(courseId) {
    alert(`View course with ID: ${courseId}`);
    // In a real implementation, you would fetch course details and show them
}

/**
 * Delete course
 */
function deleteCourse(courseId) {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
        ELC.apiRequest(`/api/courses/${courseId}`, 'DELETE')
            .then(response => {
                if (response.success) {
                    ELC.showNotification('Course deleted successfully', 'success');
                    loadCourses(); // Reload the course table
                } else {
                    ELC.showNotification('Error deleting course: ' + response.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error deleting course:', error);
                ELC.showNotification('Error deleting course', 'error');
            });
    }
}

/**
 * Helper function to capitalize first letter
 */
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}