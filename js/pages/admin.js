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
    const createUserForm = document.getElementById('create-user-form');
    if (createUserForm) {
        createUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showCreateUserModal();
        });
    } else {
        console.error('Could not find element with ID "create-user-form"');
    }
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
    // Use the admin stats endpoint to get all stats at once
    ELC.apiRequest('/admin/stats', 'GET')
        .then(response => {
            if (response.success) {
                updateStatCards(response.data);
            } else {
                console.error('Error loading stats:', response.message);
                
                // Fallback: Try to fetch individual stats if the combined endpoint fails
                fetchIndividualStats();
            }
        })
        .catch(error => {
            console.error('Error fetching stats:', error);
            
            // Fallback: Try to fetch individual stats if the combined endpoint fails
            fetchIndividualStats();
        });
}

/**
 * Fallback function to fetch stats individually
 */
function fetchIndividualStats() {
    // Get students
    ELC.apiRequest('/admin/students', 'GET')
        .then(studentResponse => {
            // Get teachers
            ELC.apiRequest('/admin/teachers', 'GET')
                .then(teacherResponse => {
                    // Get courses
                    ELC.apiRequest('/admin/courses', 'GET')
                        .then(courseResponse => {
                            // Get reports
                            ELC.apiRequest('/admin/reports', 'GET')
                                .then(reportResponse => {
                                    // Calculate stats from the responses
                                    const students = studentResponse.success ? studentResponse.data : [];
                                    const teachers = teacherResponse.success ? teacherResponse.data : [];
                                    const courses = courseResponse.success ? courseResponse.data : [];
                                    const reports = reportResponse.success ? reportResponse.data : [];
                                    
                                    // Update stat cards
                                    const stats = {
                                        totalStudents: students.length,
                                        totalTeachers: teachers.length,
                                        activeCourses: courses.filter(c => c.status === 'Active').length,
                                        newReports: reports.length
                                    };
                                    updateStatCards(stats);
                                })
                                .catch(error => {
                                    console.error('Error fetching reports:', error);
                                    
                                    // Still show other stats
                                    const students = studentResponse.success ? studentResponse.data : [];
                                    const teachers = teacherResponse.success ? teacherResponse.data : [];
                                    const courses = courseResponse.success ? courseResponse.data : [];
                                    
                                    updateStatCards({
                                        totalStudents: students.length,
                                        totalTeachers: teachers.length,
                                        activeCourses: courses.filter(c => c.status === 'Active').length,
                                        newReports: 0
                                    });
                                });
                        })
                        .catch(error => {
                            console.error('Error fetching courses:', error);
                            
                            // Still show student and teacher stats
                            const students = studentResponse.success ? studentResponse.data : [];
                            const teachers = teacherResponse.success ? teacherResponse.data : [];
                            
                            updateStatCards({
                                totalStudents: students.length,
                                totalTeachers: teachers.length,
                                activeCourses: 0,
                                newReports: 0
                            });
                        });
                })
                .catch(error => {
                    console.error('Error fetching teachers:', error);
                    
                    // Still show student stats
                    const students = studentResponse.success ? studentResponse.data : [];
                    
                    updateStatCards({
                        totalStudents: students.length,
                        totalTeachers: 0,
                        activeCourses: 0,
                        newReports: 0
                    });
                });
        })
        .catch(error => {
            console.error('Error fetching students:', error);
            
            // Show default values
            updateStatCards({
                totalStudents: 0,
                totalTeachers: 0,
                activeCourses: 0,
                newReports: 0
            });
        });
}

/**
 * Update stat cards with data
 */
function updateStatCards(stats) {
    // Use the data if available, otherwise keep default values
    document.getElementById('stat-students').textContent = stats?.totalStudents || document.getElementById('stat-students').textContent || '0';
    document.getElementById('stat-teachers').textContent = stats?.totalTeachers || document.getElementById('stat-teachers').textContent || '0';
    document.getElementById('stat-courses').textContent = stats?.activeCourses || document.getElementById('stat-courses').textContent || '0';
    document.getElementById('stat-reports').textContent = stats?.newReports || document.getElementById('stat-reports').textContent || '0';
}
// Change all other API calls to remove the /api prefix:
function loadRecentActivities() {
    // Instead of: ELC.apiRequest('/api/admin/activities', 'GET')
    // Use: ELC.apiRequest('/admin/activities', 'GET')
    // But if that doesn't exist, we'll create mock activity data
    
    // Create some placeholder activities based on student and teacher data
    ELC.apiRequest('/students', 'GET')
        .then(studentResponse => {
            ELC.apiRequest('/teachers', 'GET')
                .then(teacherResponse => {
                    const students = studentResponse.success ? studentResponse.data : [];
                    const teachers = teacherResponse.success ? teacherResponse.data : [];
                    
                    // Create mock activities based on the most recent students and teachers
                    const mockActivities = [];
                    
                    // Sort by creation date (newest first)
                    const sortedStudents = [...students].sort((a, b) => 
                        new Date(b.createdAt) - new Date(a.createdAt)
                    );
                    
                    const sortedTeachers = [...teachers].sort((a, b) => 
                        new Date(b.createdAt) - new Date(a.createdAt)
                    );
                    
                    // Add student registrations (most recent 3)
                    sortedStudents.slice(0, 3).forEach(student => {
                        mockActivities.push({
                            type: 'user',
                            description: `New student ${student.fullName} registered`,
                            timestamp: student.createdAt
                        });
                    });
                    
                    // Add teacher registrations (most recent 3)
                    sortedTeachers.slice(0, 3).forEach(teacher => {
                        mockActivities.push({
                            type: 'user',
                            description: `New teacher ${teacher.fullName} joined`,
                            timestamp: teacher.createdAt
                        });
                    });
                    
                    // Sort all activities by timestamp (newest first)
                    mockActivities.sort((a, b) => 
                        new Date(b.timestamp) - new Date(a.timestamp)
                    );
                    
                    // Update the activity list
                    updateActivityList(mockActivities);
                })
                .catch(error => {
                    console.error('Error fetching teachers for activities:', error);
                    // Still show student activities if available
                    if (studentResponse.success) {
                        const students = studentResponse.data;
                        const sortedStudents = [...students].sort((a, b) => 
                            new Date(b.createdAt) - new Date(a.createdAt)
                        );
                        
                        const mockActivities = sortedStudents.slice(0, 5).map(student => ({
                            type: 'user',
                            description: `New student ${student.fullName} registered`,
                            timestamp: student.createdAt
                        }));
                        
                        updateActivityList(mockActivities);
                    }
                });
        })
        .catch(error => {
            console.error('Error fetching students for activities:', error);
            // Show empty activities list
            updateActivityList([]);
        });
}

/**
 * Update activity list with data
 */
function updateActivityList(activities) {
    if (!activities || activities.length === 0) return;
    
    const activityList = document.getElementById('recent-activities');
    if (!activityList) return;
    
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
                <div class="activity-time">${formatTimeAgo(activity.timestamp)}</div>
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
}

/**
 * Format time ago
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} - Formatted time ago string
 */
function formatTimeAgo(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Convert milliseconds to minutes
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) {
        return 'Just now';
    } else if (minutes < 60) {
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else if (minutes < 1440) { // Less than a day
        const hours = Math.floor(minutes / 60);
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (minutes < 10080) { // Less than a week
        const days = Math.floor(minutes / 1440);
        return `${days} day${days === 1 ? '' : 's'} ago`;
    } else {
        // Format date
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

/**
 * Initialize button event listeners
 */
function initButtonListeners() {
    // Quick action buttons
    const btnAddUser = document.getElementById('btn-add-user');
    if (btnAddUser) {
        btnAddUser.addEventListener('click', () => {
            showCreateUserModal();
        });
    }
    
    const btnAddCourse = document.getElementById('btn-add-course');
    if (btnAddCourse) {
        btnAddCourse.addEventListener('click', () => {
            showCreateCourseModal();
        });
    }
    
    const btnPendingApprovals = document.getElementById('btn-pending-approvals');
    if (btnPendingApprovals) {
        btnPendingApprovals.addEventListener('click', () => {
            // Switch to user management tab and filter for pending status
            const userMenuItem = document.querySelector('.menu-item[data-section="users"]');
            if (userMenuItem) userMenuItem.click();
            const filterStatus = document.getElementById('filter-status');
            if (filterStatus) {
                filterStatus.value = 'pending';
                filterUsers();
            }
        });
    }
    
    const btnSystemBackup = document.getElementById('btn-system-backup');
    if (btnSystemBackup) {
        btnSystemBackup.addEventListener('click', () => {
            createSystemBackup();
        });
    }
    
    // Other section buttons
    const btnCreateUser = document.getElementById('btn-create-user');
    if (btnCreateUser) {
        btnCreateUser.addEventListener('click', () => {
            showCreateUserModal();
        });
    }
    
    const btnCreateCourse = document.getElementById('btn-create-course');
    if (btnCreateCourse) {
        btnCreateCourse.addEventListener('click', () => {
            showCreateCourseModal();
        });
    }
}

/**
 * Initialize user table - fetch and display data from API
 */
function initUserTable() {
    // Load users from API
    loadUsers();
    
    // Add search and filter functionality
    const searchInput = document.getElementById('search-users');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterUsers();
        });
    }
    
    const roleFilter = document.getElementById('filter-role');
    if (roleFilter) {
        roleFilter.addEventListener('change', () => {
            filterUsers();
        });
    }
    
    const statusFilter = document.getElementById('filter-status');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            filterUsers();
        });
    }
}

/**
 * Load users for the user table
 */
function loadUsers() {
    console.log("Loading users...");
    // Fetch students
    ELC.apiRequest('/admin/students', 'GET')
        .then(studentResponse => {
            console.log("Student response:", studentResponse);
            // Fetch teachers
            ELC.apiRequest('/admin/teachers', 'GET')
                .then(teacherResponse => {
                    console.log("Teacher response:", teacherResponse);
                    // Process the data
                    const students = studentResponse.success ? studentResponse.data : [];
                    const teachers = teacherResponse.success ? teacherResponse.data : [];
                    
                    console.log("Students:", students.length, "Teachers:", teachers.length);
                    
                    // Add role property to each user for filtering
                    const studentsWithRole = students.map(student => ({
                        ...student, 
                        role: 'student',
                        isActive: student.isActive !== false
                    }));
                    
                    const teachersWithRole = teachers.map(teacher => ({
                        ...teacher, 
                        role: 'teacher',
                        isActive: teacher.isActive !== false
                    }));
                    
                    // Combine the data
                    const combinedUsers = [...studentsWithRole, ...teachersWithRole];
                    
                    // Populate the table
                    populateUserTable(combinedUsers);
                })
                .catch(error => {
                    console.error('Error fetching teachers:', error);
                    // Still show students if available
                    if (studentResponse.success) {
                        const studentsWithRole = studentResponse.data.map(student => ({
                            ...student, 
                            role: 'student',
                            isActive: student.isActive !== false
                        }));
                        populateUserTable(studentsWithRole);
                    }
                });
        })
        .catch(error => {
            console.error('Error fetching students:', error);
            ELC.showNotification('Failed to load users', 'error');
        });
}

/**
 * Populate user table with data
 */
function populateUserTable(users) {
    if (!users || users.length === 0) return;
    
    const tableBody = document.querySelector('#users-table tbody');
    if (!tableBody) return;
    
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
    const searchInput = document.getElementById('search-users');
    const roleFilter = document.getElementById('filter-role');
    const statusFilter = document.getElementById('filter-status');
    
    if (!searchInput || !roleFilter || !statusFilter) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const roleValue = roleFilter.value;
    const statusValue = statusFilter.value;
    
    const rows = document.querySelectorAll('#users-table tbody tr');
    
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        const role = row.cells[2].textContent.toLowerCase();
        const status = row.cells[4].textContent.toLowerCase();
        
        const matchesSearch = searchTerm === '' || name.includes(searchTerm);
        const matchesRole = roleValue === '' || role.toLowerCase() === roleValue.toLowerCase();
        const matchesStatus = statusValue === '' || status.toLowerCase() === statusValue.toLowerCase();
        
        if (matchesSearch && matchesRole && matchesStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}
/**
 * Edit user
 */
function editUser(userId) {
    // Fetch user data and display in edit form
    const userType = document.querySelector(`tr[data-id="${userId}"] td:nth-child(3)`).textContent.toLowerCase();
    
    const endpoint = userType === 'student' ? `/admin/students/${userId}` : `/admin/teachers/${userId}`;
    
    ELC.apiRequest(endpoint, 'GET')
        .then(response => {
            if (response.success) {
                // Show edit form with user data
                showEditUserModal(response.data, userType);
            } else {
                ELC.showNotification('Error loading user details', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching user details:', error);
            ELC.showNotification('Error loading user details', 'error');
        });
}
function toggleUserStatus(userId, setActive) {
    const action = setActive ? 'activate' : 'deactivate';
    
    console.log(`Attempting to ${action} user with ID: ${userId}`);
    
    if (confirm(`Are you sure you want to ${action} this user?`)) {
        ELC.apiRequest(`/admin/users/${userId}/status`, 'PUT', { isActive: setActive })
            .then(response => {
                console.log("Toggle status response:", response);
                if (response && response.success) {
                    ELC.showNotification(`User ${action}d successfully`, 'success');
                    // Reload the user table
                    loadUsers();
                } else {
                    const errorMsg = response ? response.message : 'Unknown error';
                    ELC.showNotification(`Error ${action}ing user: ${errorMsg}`, 'error');
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
        // Determine if student or teacher
        const userType = document.querySelector(`tr[data-id="${userId}"] td:nth-child(3)`).textContent.toLowerCase();
        const endpoint = userType === 'student' ? `/admin/students/${userId}` : `/admin/teachers/${userId}`;
        
        ELC.apiRequest(endpoint, 'DELETE')
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
function showEditUserModal(userData, userType) {
    console.log("Showing edit modal for", userType, userData);
    
    // Create modal if it doesn't exist
    let modalContainer = document.getElementById('edit-user-modal');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'edit-user-modal';
        modalContainer.className = 'modal';
        document.body.appendChild(modalContainer);
    }
    
    // Determine current status and level
    const currentStatus = userType === 'student' 
        ? (userData.studentInfo?.status || 'active')
        : (userData.isActive ? 'active' : 'inactive');
    
    // Generate form fields based on user type
    const studentFields = userType === 'student' ? `
        <div class="form-group">
            <label for="edit-student-level">Level</label>
            <select id="edit-student-level" class="form-control">
                <option value="beginner" ${userData.studentInfo?.currentLevel === 'beginner' ? 'selected' : ''}>Beginner</option>
                <option value="intermediate" ${userData.studentInfo?.currentLevel === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                <option value="upper-intermediate" ${userData.studentInfo?.currentLevel === 'upper-intermediate' ? 'selected' : ''}>Upper-Intermediate</option>
                <option value="advanced" ${userData.studentInfo?.currentLevel === 'advanced' ? 'selected' : ''}>Advanced</option>
            </select>
        </div>
    ` : '';
    
    const teacherFields = userType === 'teacher' ? `
        <div class="form-group">
            <label for="edit-teacher-specialization">Specialization</label>
            <select id="edit-teacher-specialization" class="form-control">
                <option value="general" ${userData.teacherInfo?.specialization === 'general' ? 'selected' : ''}>General English</option>
                <option value="business" ${userData.teacherInfo?.specialization === 'business' ? 'selected' : ''}>Business English</option>
                <option value="ielts" ${userData.teacherInfo?.specialization === 'ielts' ? 'selected' : ''}>IELTS Preparation</option>
                <option value="toefl" ${userData.teacherInfo?.specialization === 'toefl' ? 'selected' : ''}>TOEFL Preparation</option>
                <option value="children" ${userData.teacherInfo?.specialization === 'children' ? 'selected' : ''}>Children's English</option>
            </select>
        </div>
    ` : '';
    
    // Create modal content
    modalContainer.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit ${capitalizeFirstLetter(userType)}</h3>
                <button class="close-modal" onclick="closeEditUserModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="edit-user-form">
                    <input type="hidden" id="edit-user-id" value="${userData._id}">
                    <input type="hidden" id="edit-user-type" value="${userType}">
                    
                    <div class="form-group">
                        <label for="edit-user-name">Full Name</label>
                        <input type="text" id="edit-user-name" class="form-control" value="${userData.fullName}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-user-email">Email</label>
                        <input type="email" id="edit-user-email" class="form-control" value="${userData.email}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-user-phone">Phone</label>
                        <input type="text" id="edit-user-phone" class="form-control" value="${userData.phone || ''}" required>
                    </div>
                    
                    ${studentFields}
                    ${teacherFields}
                    
                    <div class="form-group">
                        <label for="edit-user-status">Status</label>
                        <select id="edit-user-status" class="form-control">
                            <option value="active" ${currentStatus === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${currentStatus === 'inactive' ? 'selected' : ''}>Inactive</option>
                            ${userType === 'student' ? `
                                <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>Pending</option>
                            ` : ''}
                        </select>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Update User</button>
                        <button type="button" class="btn btn-secondary" onclick="closeEditUserModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Show modal
    modalContainer.style.display = 'block';
    
    // Add event listener to form
    document.getElementById('edit-user-form').addEventListener('submit', function(e) {
        e.preventDefault();
        updateUser();
    });

}

/**
 * Close the edit user modal
 */
function closeEditUserModal() {
    const modal = document.getElementById('edit-user-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}
/**
 * Update user information
 */
function updateUser() {
    const userId = document.getElementById('edit-user-id').value;
    const userType = document.getElementById('edit-user-type').value;
    
    // Get form values
    const fullName = document.getElementById('edit-user-name').value;
    const email = document.getElementById('edit-user-email').value;
    const phone = document.getElementById('edit-user-phone').value;
    const status = document.getElementById('edit-user-status').value;
    
    // Create update data object
    let updateData = {
        fullName,
        email,
        phone
    };
    
    // Add user type specific fields
    if (userType === 'student') {
        const level = document.getElementById('edit-student-level').value;
        
        // Use $set for nested fields instead of replacing the entire studentInfo object
        updateData = {
            ...updateData,
            'studentInfo.currentLevel': level,
            'studentInfo.status': status,
            isActive: status !== 'inactive'
        };
    } else if (userType === 'teacher') {
        const specialization = document.getElementById('edit-teacher-specialization').value;
        
        // Use $set for nested fields
        updateData = {
            ...updateData,
            'teacherInfo.specialization': specialization,
            isActive: status !== 'inactive'
        };
    }
    
    console.log("Sending update data:", updateData);
    
    // Determine the endpoint based on user type
    const endpoint = userType === 'student' 
        ? `/admin/students/${userId}`
        : `/admin/teachers/${userId}`;
    
    // Make API request
    ELC.apiRequest(endpoint, 'PUT', updateData)
        .then(response => {
            if (response.success) {
                ELC.showNotification(`${capitalizeFirstLetter(userType)} updated successfully`, 'success');
                
                // Close modal
                closeEditUserModal();
                
                // Reload users table
                loadUsers();
            } else {
                ELC.showNotification(`Error updating ${userType}: ${response.message}`, 'error');
            }
        })
        .catch(error => {
            console.error(`Error updating ${userType}:`, error);
            ELC.showNotification(`Error updating ${userType}`, 'error');
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
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterCourses();
        });
    }
    
    const levelFilter = document.getElementById('filter-level');
    if (levelFilter) {
        levelFilter.addEventListener('change', () => {
            filterCourses();
        });
    }
    
    const categoryFilter = document.getElementById('filter-category');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            filterCourses();
        });
    }
}

/**
 * Load courses from API
 */
function loadCourses() {
    // Fixed API path by removing the extra '/api' prefix
    ELC.apiRequest('/courses', 'GET')
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
    if (!tableBody) return;
    
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
            <td>${course.name || course.title}</td>
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
    const searchInput = document.getElementById('search-courses');
    const levelFilter = document.getElementById('filter-level');
    const categoryFilter = document.getElementById('filter-category');
    
    if (!searchInput || !levelFilter || !categoryFilter) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const levelValue = levelFilter.value;
    const categoryValue = categoryFilter.value;
    
    const rows = document.querySelectorAll('#courses-table tbody tr');
    
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        const level = row.cells[2].textContent.toLowerCase();
        // Category would be in the data-category attribute
        const category = row.dataset.category || '';
        
        const matchesSearch = searchTerm === '' || name.includes(searchTerm);
        const matchesLevel = levelValue === '' || level === levelValue;
        const matchesCategory = categoryValue === '' || category === categoryValue;
        
        if (matchesSearch && matchesLevel && matchesCategory) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}







/**
 * Create system backup
 */
function createSystemBackup() {
    ELC.showNotification('Creating system backup...', 'info');
    
    // Fixed API path by removing the extra '/api' prefix
    ELC.apiRequest('/settings/backup', 'POST')
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
 * Show create user modal and process the form submission
 */
function showCreateUserModal() {
    // Get form elements
    const nameInput = document.querySelector('input[id="user-name"]');
    const roleSelect = document.querySelector('select[id="user-role"]');
    const emailInput = document.querySelector('input[id="user-email"]');
    const statusSelect = document.querySelector('select[id="user-status"]');
    
    // Get values safely
    const fullName = nameInput ? nameInput.value : '';
    const role = roleSelect ? roleSelect.value : '';
    const email = emailInput ? emailInput.value : '';
    const status = statusSelect ? statusSelect.value : 'active';
    
    console.log("Creating user with:", { fullName, role, email, status });
    
    // Basic validation
    if (!fullName || !role || !email) {
        ELC.showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Use fullName as username (remove spaces and convert to lowercase)
    const username = fullName.replace(/\s+/g, '').toLowerCase();
    
    // Set default password
    const password = "password123";
    
    // Create user based on role
    if (role === 'student') {
        // Generate a student ID
        const studentId = 'S' + Math.floor(1000 + Math.random() * 9000);
        
        const studentData = {
            username,
            password,
            fullName,
            email,
            phone: '1234567890',
            studentInfo: {
                studentId,
                currentLevel: 'beginner',
                status: status.toLowerCase()
            },
            isActive: status.toLowerCase() === 'active'
        };
        
        console.log("Sending student data:", studentData);
        
        // Create the student
        ELC.apiRequest('/admin/students', 'POST', studentData)
            .then(response => {
                console.log("Student creation response:", response);
                if (response && response.success) {
                    ELC.showNotification('Student created successfully', 'success');
                    alert(`Student created successfully!\n\nUsername: ${username}\nPassword: ${password}\n\nPlease save these credentials.`);
                    
                    // Clear form
                    if (nameInput) nameInput.value = '';
                    if (roleSelect) roleSelect.value = '';
                    if (emailInput) emailInput.value = '';
                    if (statusSelect) statusSelect.value = 'active';
                    
                    // Reload dashboard
                    try {
                        loadDashboardStats();
                        loadUsers();
                    } catch (e) {
                        console.error("Error refreshing dashboard:", e);
                    }
                } else {
                    const errorMsg = response && response.message ? response.message : 'Unknown error occurred';
                    ELC.showNotification('Error creating student: ' + errorMsg, 'error');
                }
            })
            .catch(error => {
                console.error('Error creating student:', error);
                let errorMessage = 'Error creating student';
                if (error.message) {
                    if (error.message.includes('duplicate key')) {
                        errorMessage = 'This email or username is already registered';
                    }
                }
                ELC.showNotification(errorMessage, 'error');
            });
    } else if (role === 'teacher') {
        // Generate a teacher ID
        const teacherId = 'T' + Math.floor(1000 + Math.random() * 9000);
        
        const teacherData = {
            username,
            password,
            fullName,
            email,
            phone: '1234567890',
            teacherInfo: {
                teacherId,
                specialization: 'general'
            },
            isActive: status.toLowerCase() === 'active'
        };
        
        console.log("Sending teacher data:", teacherData);
        
        // Create the teacher
        ELC.apiRequest('/admin/teachers', 'POST', teacherData)
            .then(response => {
                console.log("Teacher creation response:", response);
                if (response && response.success) {
                    ELC.showNotification('Teacher created successfully', 'success');
                    alert(`Teacher created successfully!\n\nUsername: ${username}\nPassword: ${password}\n\nPlease save these credentials.`);
                    
                    // Clear form
                    if (nameInput) nameInput.value = '';
                    if (roleSelect) roleSelect.value = '';
                    if (emailInput) emailInput.value = '';
                    if (statusSelect) statusSelect.value = 'active';
                    
                    // Reload dashboard
                    try {
                        loadDashboardStats();
                        loadUsers();
                    } catch (e) {
                        console.error("Error refreshing dashboard:", e);
                    }
                } else {
                    const errorMsg = response && response.message ? response.message : 'Unknown error occurred';
                    ELC.showNotification('Error creating teacher: ' + errorMsg, 'error');
                }
            })
            .catch(error => {
                console.error('Error creating teacher:', error);
                let errorMessage = 'Error creating teacher';
                if (error.message) {
                    if (error.message.includes('duplicate key')) {
                        errorMessage = 'This email or username is already registered';
                    }
                }
                ELC.showNotification(errorMessage, 'error');
            });
    }
}

// Ensure DOM is loaded before adding event listener
document.addEventListener('DOMContentLoaded', function() {
    const createUserForm = document.getElementById('create-user-form');
    if (createUserForm) {
        createUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showCreateUserModal();
        });
    } else {
        console.error('Could not find element with ID "create-user-form"');
    }
});

/**
 * Show create course modal and process the form submission
 */
function showCreateCourseModal() {
    // Get form elements
    const courseNameInput = document.getElementById('course-name');
    const levelSelect = document.getElementById('course-level');
    const maxStudentsInput = document.getElementById('course-max-students');
    const statusSelect = document.getElementById('course-status');
    
    // Get values safely
    const name = courseNameInput ? courseNameInput.value.trim() : '';
    const level = levelSelect ? levelSelect.value : '';
    const maxStudents = maxStudentsInput ? parseInt(maxStudentsInput.value) || 20 : 20;
    const status = statusSelect ? statusSelect.value : 'active';
    
    // Set category to be the same as name (as requested)
    const category = name;
    
    console.log("Creating course with:", { name, level, category, maxStudents, status });
    
    // Basic validation
    if (!name || !level) {
        ELC.showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // We need to find a teacher first since it's required by the model
    ELC.apiRequest('/admin/teachers', 'GET')
        .then(response => {
            if (response.success && response.data && response.data.length > 0) {
                // Use the first teacher from the list
                const teacherId = response.data[0]._id;
                
                // Create course data
                const courseData = {
                    name,
                    level,
                    category,  // Using name as category
                    teacher: teacherId,
                    maxStudents,
                    status,
                    students: []
                };
                
                console.log("Sending course data:", courseData);
                
                // Create the course
                ELC.apiRequest('/admin/courses', 'POST', courseData)
                    .then(courseResponse => {
                        console.log("Course creation response:", courseResponse);
                        
                        if (courseResponse && courseResponse.success) {
                            ELC.showNotification('Course created successfully', 'success');
                            
                            // Clear form
                            if (courseNameInput) courseNameInput.value = '';
                            if (levelSelect) levelSelect.value = '';
                            if (maxStudentsInput) maxStudentsInput.value = '20';
                            if (statusSelect) statusSelect.value = 'active';
                            
                            // Reload dashboard
                            try {
                                loadDashboardStats();
                                loadCourses();
                            } catch (e) {
                                console.error("Error refreshing dashboard:", e);
                            }
                        } else {
                            const errorMsg = courseResponse && courseResponse.message ? 
                                courseResponse.message : 'Unknown error occurred';
                            ELC.showNotification('Error creating course: ' + errorMsg, 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error creating course:', error);
                        ELC.showNotification('Error creating course', 'error');
                    });
            } else {
                ELC.showNotification('No teachers available. Please create a teacher first.', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching teachers:', error);
            ELC.showNotification('Error: Could not find a teacher for this course', 'error');
        });
}

// Ensure DOM is loaded before adding event listener
document.addEventListener('DOMContentLoaded', function() {
    // Update the level options in the form to match the data format
    const levelSelect = document.getElementById('course-level');
    if (levelSelect) {
        // Clear existing options
        levelSelect.innerHTML = '';
        
        // Add the default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select Level';
        levelSelect.appendChild(defaultOption);
        
        // Add the level options based on the data format
        const levelOptions = [
            { value: '0-3', text: '0-3' },
            { value: '3-5.5', text: '3-5.5' },
            { value: '5.5-6.5', text: '5.5-6.5' },
            { value: '6.5+', text: '6.5+' }
        ];
        
        levelOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            levelSelect.appendChild(optionElement);
        });
    }
    
    const createCourseForm = document.getElementById('create-course-form');
    if (createCourseForm) {
        createCourseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showCreateCourseModal();
        });
    } else {
        console.error('Could not find element with ID "create-course-form"');
    }
});

/**
 * Edit course - opens modal with course details for editing
 * @param {string} courseId - The ID of the course to edit
 */
function editCourse(courseId) {
    console.log(`Editing course with ID: ${courseId}`);
    
    // Fetch course data
    ELC.apiRequest(`/admin/courses/${courseId}`, 'GET')
        .then(response => {
            if (response.success) {
                showEditCourseModal(response.data);
            } else {
                ELC.showNotification('Error loading course details', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching course details:', error);
            ELC.showNotification('Error loading course details', 'error');
        });
}

/**
 * View course details - opens a detailed view of the course
 * @param {string} courseId - The ID of the course to view
 */
function viewCourse(courseId) {
    console.log(`Viewing course with ID: ${courseId}`);
    
    // Fetch course data
    ELC.apiRequest(`/admin/courses/${courseId}`, 'GET')
        .then(response => {
            if (response.success) {
                showCourseDetailsModal(response.data);
            } else {
                ELC.showNotification('Error loading course details', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching course details:', error);
            ELC.showNotification('Error loading course details', 'error');
        });
}

/**
 * Delete course - prompts for confirmation then deletes
 * @param {string} courseId - The ID of the course to delete
 */
function deleteCourse(courseId) {
    console.log(`Deleting course with ID: ${courseId}`);
    
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
        ELC.apiRequest(`/admin/courses/${courseId}`, 'DELETE')
            .then(response => {
                if (response.success) {
                    ELC.showNotification('Course deleted successfully', 'success');
                    // Reload courses to update the table
                    loadCourses();
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
 * Show modal with course details for editing
 * @param {Object} courseData - The course data to edit
 */
function showEditCourseModal(courseData) {
    console.log("Showing edit modal for course:", courseData);
    
    // Create modal if it doesn't exist
    let modalContainer = document.getElementById('edit-course-modal');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'edit-course-modal';
        modalContainer.className = 'modal';
        document.body.appendChild(modalContainer);
        
        // Add CSS for modal centering if not already present
        if (!document.getElementById('modal-styles')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'modal-styles';
            styleElement.textContent = `
                .modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    z-index: 1000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                
                .modal-content {
                    background-color: #fff;
                    width: 500px;
                    max-width: 90%;
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    position: relative;
                    animation: modalAppear 0.3s ease-out;
                }
                
                @keyframes modalAppear {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .modal-header {
                    padding: 15px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #eee;
                }
                
                .modal-header h3 {
                    margin: 0;
                    font-size: 18px;
                }
                
                .modal-body {
                    padding: 20px;
                }
                
                .form-group {
                    margin-bottom: 15px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                }
                
                .form-control {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    box-sizing: border-box;
                }
                
                .form-actions {
                    display: flex;
                    justify-content: flex-start;
                    gap: 10px;
                    margin-top: 20px;
                }
                
                .btn {
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                    border: none;
                }
                
                .btn-primary {
                    background-color: #1a56db;
                    color: white;
                }
                
                .btn-secondary {
                    background-color: #e5e7eb;
                    color: #4b5563;
                }
                
                .close-modal {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #6b7280;
                }
            `;
            document.head.appendChild(styleElement);
        }
    }
    
    // Create modal content
    modalContainer.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Course</h3>
                <button class="close-modal" onclick="closeEditCourseModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="edit-course-form">
                    <input type="hidden" id="edit-course-id" value="${courseData._id}">
                    
                    <div class="form-group">
                        <label for="edit-course-name">Course Name</label>
                        <input type="text" id="edit-course-name" class="form-control" value="${courseData.name || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-course-level">Level</label>
                        <select id="edit-course-level" class="form-control" required>
                            <option value="0-3" ${courseData.level === '0-3' ? 'selected' : ''}>0-3</option>
                            <option value="3-5.5" ${courseData.level === '3-5.5' ? 'selected' : ''}>3-5.5</option>
                            <option value="5.5-6.5" ${courseData.level === '5.5-6.5' ? 'selected' : ''}>5.5-6.5</option>
                            <option value="6.5+" ${courseData.level === '6.5+' ? 'selected' : ''}>6.5+</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-course-category">Category</label>
                        <input type="text" id="edit-course-category" class="form-control" value="${courseData.category || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-course-max-students">Max Students</label>
                        <input type="number" id="edit-course-max-students" class="form-control" min="1" max="30" value="${courseData.maxStudents || 20}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-course-status">Status</label>
                        <select id="edit-course-status" class="form-control" required>
                            <option value="Active" ${courseData.status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Upcoming" ${courseData.status === 'Upcoming' ? 'selected' : ''}>Upcoming</option>
                            <option value="Completed" ${courseData.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="Cancelled" ${courseData.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Update Course</button>
                        <button type="button" class="btn btn-secondary" onclick="closeEditCourseModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Show modal with flex display to enable centering
    modalContainer.style.display = 'flex';
    
    // Add event listener to form
    document.getElementById('edit-course-form').addEventListener('submit', function(e) {
        e.preventDefault();
        updateCourse();
    });
}

/**
 * Show detailed view of course
 * @param {Object} courseData - The course data to view
 */
function showCourseDetailsModal(courseData) {
    console.log("Showing details for course:", courseData);
    
    // Create modal if it doesn't exist
    let modalContainer = document.getElementById('course-details-modal');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'course-details-modal';
        modalContainer.className = 'modal';
        document.body.appendChild(modalContainer);
    }
    
    // Get teacher name
    let teacherName = 'Unassigned';
    if (courseData.teacher) {
        if (typeof courseData.teacher === 'object' && courseData.teacher.fullName) {
            teacherName = courseData.teacher.fullName;
        }
    }
    
    // Format student count
    const studentCount = Array.isArray(courseData.students) ? courseData.students.length : 0;
    const maxStudents = courseData.maxStudents || 0;
    
    // Create modal content
    modalContainer.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Course Details</h3>
                <button class="close-modal" onclick="closeCourseDetailsModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="course-details">
                    <h4>${courseData.name || 'Unnamed Course'}</h4>
                    
                    <div class="detail-row">
                        <strong>ID:</strong> 
                        <span>${courseData._id ? `C${courseData._id.toString().substring(0, 4)}` : ''}</span>
                    </div>
                    
                    <div class="detail-row">
                        <strong>Level:</strong> 
                        <span>${courseData.level || ''}</span>
                    </div>
                    
                    <div class="detail-row">
                        <strong>Category:</strong> 
                        <span>${courseData.category || ''}</span>
                    </div>
                    
                    <div class="detail-row">
                        <strong>Teacher:</strong> 
                        <span>${teacherName}</span>
                    </div>
                    
                    <div class="detail-row">
                        <strong>Students:</strong> 
                        <span>${studentCount}/${maxStudents}</span>
                    </div>
                    
                    <div class="detail-row">
                        <strong>Status:</strong> 
                        <span class="badge ${courseData.status === 'Active' ? 'badge-success' : 
                                              courseData.status === 'Upcoming' ? 'badge-warning' : 'badge-danger'}">
                            ${courseData.status || 'Unknown'}
                        </span>
                    </div>
                    
                    <div class="detail-row">
                        <strong>Created:</strong> 
                        <span>${new Date(courseData.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                
                <div class="form-actions" style="justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" onclick="closeCourseDetailsModal()">Close</button>
                    <button type="button" class="btn btn-primary" onclick="editCourse('${courseData._id}')">Edit</button>
                </div>
            </div>
        </div>
    `;
    
    // Add some extra styles for the details view
    const detailStyles = `
        .course-details h4 {
            margin-top: 0;
            margin-bottom: 20px;
            color: #1a56db;
        }
        
        .detail-row {
            display: flex;
            margin-bottom: 10px;
            border-bottom: 1px solid #f0f0f0;
            padding-bottom: 8px;
        }
        
        .detail-row strong {
            width: 100px;
            flex-shrink: 0;
        }
        
        .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .badge-success {
            background-color: #def7ec;
            color: #03543e;
        }
        
        .badge-warning {
            background-color: #fef3c7;
            color: #92400e;
        }
        
        .badge-danger {
            background-color: #fee2e2;
            color: #b91c1c;
        }
    `;
    
    // Add styles if not already present
    if (!document.getElementById('detail-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'detail-styles';
        styleElement.textContent = detailStyles;
        document.head.appendChild(styleElement);
    }
    
    // Show modal
    modalContainer.style.display = 'flex';
}

/**
 * Close the edit course modal
 */
function closeEditCourseModal() {
    const modal = document.getElementById('edit-course-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}


/**
 * Update course information
 */
function updateCourse() {
    const courseId = document.getElementById('edit-course-id').value;
    
    // Get form values
    const name = document.getElementById('edit-course-name').value;
    const level = document.getElementById('edit-course-level').value;
    const category = document.getElementById('edit-course-category').value;
    const maxStudents = parseInt(document.getElementById('edit-course-max-students').value) || 20;
    const status = document.getElementById('edit-course-status').value;
    
    // Create update data object
    const updateData = {
        name,
        level,
        category,
        maxStudents,
        status
    };
    
    console.log("Updating course with data:", updateData);
    
    // Make API request
    ELC.apiRequest(`/admin/courses/${courseId}`, 'PUT', updateData)
        .then(response => {
            if (response.success) {
                ELC.showNotification('Course updated successfully', 'success');
                
                // Close modal
                closeEditCourseModal();
                
                // Reload courses table
                loadCourses();
            } else {
                ELC.showNotification(`Error updating course: ${response.message}`, 'error');
            }
        })
        .catch(error => {
            console.error('Error updating course:', error);
            ELC.showNotification('Error updating course', 'error');
        });
}

// Function to load teachers
function loadTeachers() {
    console.log("Loading teachers...");
    
    // Fetch teachers from API
    ELC.apiRequest('/admin/teachers', 'GET')
        .then(response => {
            if (response.success) {
                // Fetch courses to ensure we can map course names
                return ELC.apiRequest('/admin/courses', 'GET')
                    .then(coursesResponse => {
                        if (coursesResponse.success) {
                            // Create a map of course IDs to course names
                            const courseMap = coursesResponse.data.reduce((map, course) => {
                                map[course._id] = course.name || course.title || 'Unnamed Course';
                                return map;
                            }, {});
                        
                            // Populate teachers table with course mapping
                            populateTeachersTable(response.data, courseMap);
                        }
                    });
            } else {
                console.error('Error loading teachers:', response.message);
                ELC.showNotification('Error loading teachers', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching teachers:', error);
            ELC.showNotification('Failed to load teachers', 'error');
        });
}

// Function to populate teachers table
function populateTeachersTable(teachers, courseMap = {}) {
    const tableBody = document.querySelector('#teacher-placements-table tbody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    teachers.forEach(teacher => {
        const row = document.createElement('tr');
        
        // Prepare assigned courses
        let assignedCoursesHtml = '<span class="course-tag">No courses assigned</span>';
        let totalHours = 0;
        
        // Check if classes exist and has valid entries
        if (teacher.classes && teacher.classes.length > 0) {
            const validCourses = teacher.classes.filter(course => 
                course && (course._id || course)
            );
            
            if (validCourses.length > 0) {
                assignedCoursesHtml = validCourses.map(course => {
                    // Get course ID and name
                    const courseId = course._id || course;
                    const courseName = courseMap[courseId] || 'Unnamed Course';
                    return `<span class="course-tag">${courseName}</span>`;
                }).join('');
                
                // Calculate total hours (8 hours per course)
                totalHours = validCourses.length * 8;
            }
        }
        
        row.innerHTML = `
            <td>${teacher.teacherInfo?.teacherId || 'N/A'}</td>
            <td>${teacher.fullName}</td>
            <td>${teacher.email}</td>
            <td>
                <div class="course-tags">
                    ${assignedCoursesHtml}
                </div>
            </td>
            <td>${totalHours}</td>
            <td>
                <span class="badge ${teacher.isActive ? 'badge-success' : 'badge-danger'}">
                    ${teacher.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <button class="action-btn" title="Edit Assignments" 
                    onclick="openTeacherAssignmentModal('${teacher._id}', '${teacher.fullName}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" title="Remove" 
                    onclick="removeTeacher('${teacher._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}
// Open teacher assignment modal
function openTeacherAssignmentModal(teacherId, teacherName) {
    // Get modal elements
    const modal = document.getElementById('teacher-assignment-modal');
    const teacherNameSpan = document.getElementById('teacher-name-modal');
    const teacherIdInput = document.getElementById('teacher-id-modal');
    
    if (!modal || !teacherNameSpan || !teacherIdInput) return;
    
    // Set teacher name and ID
    teacherNameSpan.textContent = teacherName;
    teacherIdInput.value = teacherId;
    
    // Fetch available courses and current teacher's courses
    Promise.all([
        ELC.apiRequest('/admin/courses', 'GET'),
        ELC.apiRequest(`/admin/teachers/${teacherId}`, 'GET')
    ])
    .then(([coursesResponse, teacherResponse]) => {
        if (!coursesResponse.success || !teacherResponse.success) {
            throw new Error('Failed to fetch courses or teacher details');
        }
        
        // Populate available courses
        const availableCoursesContainer = document.querySelector('.checkbox-group');
        if (availableCoursesContainer) {
            // Clear existing courses
            availableCoursesContainer.innerHTML = '';
            
            // Get teacher's current courses
            const teacherCourses = teacherResponse.data.classes || [];
            const teacherCourseIds = teacherCourses.map(course => 
                typeof course === 'string' ? course : course._id
            );
            
            // Create checkboxes for each course
            coursesResponse.data.forEach(course => {
                const label = document.createElement('label');
                label.className = 'checkbox-label';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.name = 'courses';
                checkbox.value = course._id;
                
                // Check if this course is already assigned to the teacher
                checkbox.checked = teacherCourseIds.includes(course._id);
                
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(` ${course.name || course.title || 'Unnamed Course'}`));
                
                availableCoursesContainer.appendChild(label);
            });
        }
        
        // Show modal
        modal.style.display = 'block';
    })
    .catch(error => {
        console.error('Error fetching courses or teacher details:', error);
        ELC.showNotification('Error loading course assignments', 'error');
    });
}
// Handle teacher assignment form submission
function handleTeacherAssignment(event) {
    event.preventDefault();
    
    const teacherId = document.getElementById('teacher-id-modal').value;
    const selectedCourses = Array.from(
        document.querySelectorAll('input[name="courses"]:checked')
    ).map(checkbox => checkbox.value);
    
    // Update teacher's course assignments
    ELC.apiRequest(`/admin/teachers/${teacherId}/courses`, 'PUT', {
        courseIds: selectedCourses
    })
    .then(response => {
        if (response.success) {
            ELC.showNotification('Teacher course assignments updated', 'success');
            
            // Close modal
            const modal = document.getElementById('teacher-assignment-modal');
            if (modal) modal.style.display = 'none';
            
            // Reload teachers table
            loadTeachers();
        } else {
            ELC.showNotification('Error updating assignments: ' + response.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error updating teacher assignments:', error);
        ELC.showNotification('Error updating assignments', 'error');
    });
}
// Remove teacher
function removeTeacher(teacherId) {
    if (confirm('Are you sure you want to remove this teacher? This action cannot be undone.')) {
        ELC.apiRequest(`/admin/teachers/${teacherId}`, 'DELETE')
            .then(response => {
                if (response.success) {
                    ELC.showNotification('Teacher removed successfully', 'success');
                    loadTeachers();
                } else {
                    ELC.showNotification('Error removing teacher: ' + response.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error removing teacher:', error);
                ELC.showNotification('Error removing teacher', 'error');
            });
    }
}
// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load teachers when page loads
    loadTeachers();
    
    // Add event listener to teacher assignment form
    const assignmentForm = document.getElementById('teacher-assignment-form');
    if (assignmentForm) {
        assignmentForm.addEventListener('submit', handleTeacherAssignment);
    }
    
    // Add event listeners to close modal buttons
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = document.getElementById('teacher-assignment-modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // Add search functionality
    const searchInput = document.getElementById('search-teachers');
    if (searchInput) {
        searchInput.addEventListener('input', filterTeachers);
    }
    
    // Add status filter functionality
    const statusFilter = document.getElementById('filter-teacher-status');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterTeachers);
    }
});
// Filter teachers based on search and status
function filterTeachers() {
    const searchInput = document.getElementById('search-teachers');
    const statusFilter = document.getElementById('filter-teacher-status');
    
    if (!searchInput || !statusFilter) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;
    
    const rows = document.querySelectorAll('#teacher-placements-table tbody tr');
    
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        const email = row.cells[2].textContent.toLowerCase();
        const status = row.cells[5].textContent.toLowerCase();
        
        const matchesSearch = searchTerm === '' || 
            name.includes(searchTerm) || 
            email.includes(searchTerm);
        
        const matchesStatus = statusValue === '' || 
            status.includes(statusValue);
        
        if (matchesSearch && matchesStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Robust error handling for course name retrieval
function getCourseName(course, courseMap = {}) {
    if (typeof course === 'string') {
        return courseMap[course] || 'Unnamed Course';
    }
    if (typeof course === 'object' && course !== null) {
        return course.name || course.title || courseMap[course._id] || 'Unnamed Course';
    }
    return 'Unnamed Course';
}
// Function to load students with complete course information
function loadStudents() {
    console.log("Loading students...");
    
    // First fetch all courses to get complete course data including levels
    ELC.apiRequest('/admin/courses', 'GET')
        .then(coursesResponse => {
            if (coursesResponse.success) {
                // Create a map with full course objects
                const courseMap = coursesResponse.data.reduce((map, course) => {
                    map[course._id] = course; // Store the whole course object
                    return map;
                }, {});
                
                // Now fetch students
                return ELC.apiRequest('/admin/students', 'GET')
                    .then(studentsResponse => {
                        if (studentsResponse.success) {
                            // Populate students table with full course data
                            populateStudentsTable(studentsResponse.data, courseMap);
                        } else {
                            console.error('Error loading students:', studentsResponse.message);
                            ELC.showNotification('Error loading students', 'error');
                        }
                    });
            } else {
                console.error('Error loading courses:', coursesResponse.message);
                ELC.showNotification('Failed to load courses', 'error');
            }
        })
        .catch(error => {
            console.error('Error in loadStudents:', error);
            ELC.showNotification('Failed to load data', 'error');
        });
}
// Populate students table with dynamic action buttons and course levels
function populateStudentsTable(students, courseMap = {}) {
    const tableBody = document.querySelector('#student-placements-table tbody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // First, ensure courseMap has complete course objects with levels
    const enhancedCourseMap = { ...courseMap };
    
    students.forEach(student => {
        const row = document.createElement('tr');
        
        // Get student's course ID
        const courseId = student.studentInfo?.course;
        
        // Determine student status and current course name
        const currentCourse = courseId 
            ? (enhancedCourseMap[courseId]?.name || enhancedCourseMap[courseId] || 'Unnamed Course')
            : '-';
        
        // Get course level directly from the course, not from the student
        let displayLevel = 'Not enrolled';
        if (courseId && enhancedCourseMap[courseId]) {
            // If we have the full course object
            if (typeof enhancedCourseMap[courseId] === 'object' && enhancedCourseMap[courseId].level) {
                displayLevel = enhancedCourseMap[courseId].level;
            } 
            // If we only have the course name, we need to look up the level
            // This would require another API call if not already available
        }
        
        const status = student.studentInfo?.status || 'unplaced';
        
        // Set status badge
        let statusBadgeClass = 'badge-warning';
        if (status === 'active' || status === 'placed') {
            statusBadgeClass = 'badge-success';
        } else if (status === 'inactive') {
            statusBadgeClass = 'badge-danger';
        }
        
        // Set level badge class
        let levelBadgeClass = 'badge-info';
        
        row.innerHTML = `
            <td>${student.studentInfo?.studentId || 'N/A'}</td>
            <td>${student.fullName}</td>
            <td>${student.email}</td>
            <td><span class="badge ${levelBadgeClass}">${displayLevel}</span></td>
            <td>${currentCourse}</td>
            <td><span class="badge ${statusBadgeClass}">${status}</span></td>
            <td>
                ${status === 'unplaced' || !courseId || currentCourse === '-' 
                    ? `<button class="action-btn place-student" 
                        data-student-id="${student._id}" 
                        data-student-name="${student.fullName}" 
                        data-current-course="${currentCourse}">
                        <i class="fas fa-plus"></i>
                    </button>`
                    : `
                    <button class="action-btn change-course" 
                        data-student-id="${student._id}" 
                        data-student-name="${student.fullName}" 
                        data-current-course="${currentCourse}">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button class="action-btn remove-course" 
                        data-student-id="${student._id}"
                        data-student-name="${student.fullName}">
                        <i class="fas fa-times"></i>
                    </button>
                    `
                }
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners after populating the table
    addStudentActionListeners();
}
// Add event listeners for student actions
function addStudentActionListeners() {
    const tableBody = document.querySelector('#student-placements-table tbody');
    
    // Place/Change course buttons
    const placementButtons = tableBody.querySelectorAll('.place-student, .change-course');
    placementButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const studentId = this.getAttribute('data-student-id');
            const studentName = this.getAttribute('data-student-name');
            const studentLevel = this.getAttribute('data-student-level');
            const currentCourse = this.getAttribute('data-current-course');
            
            openStudentPlacementModal(studentId, studentName, studentLevel, currentCourse);
        });
    });
    
    // Remove course buttons
    const removeCourseButtons = tableBody.querySelectorAll('.remove-course');
    removeCourseButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const studentId = this.getAttribute('data-student-id');
            const studentName = this.getAttribute('data-student-name');
            
            // Show confirmation modal before removing course
            if (confirm(`Are you sure you want to remove ${studentName} from their current course?`)) {
                removeStudentFromCourse(studentId);
            }
        });
    });
}
// Open student placement modal
function openStudentPlacementModal(studentId, studentName, studentLevel, currentCourse) {
    // Fetch available courses first
    ELC.apiRequest('/admin/courses', 'GET')
        .then(coursesResponse => {
            if (!coursesResponse.success) {
                throw new Error('Failed to fetch courses');
            }

            const modal = document.getElementById('student-placement-modal');
            const courseSelect = modal.querySelector('#select-course');
            
            // Clear existing options
            courseSelect.innerHTML = '<option value="">Choose a course</option>';
            
            // Find the current course's details
            const currentCourseDetails = coursesResponse.data.find(
                course => course.name === currentCourse
            );

            // Rest of the modal opening logic
            const nameDisplay = modal.querySelector('#student-name-display');
            const levelDisplay = modal.querySelector('#student-level-display');
            const currentCourseDisplay = modal.querySelector('#student-current-course');
            
            let studentIdInput = modal.querySelector('input[name="studentId"]');
            if (!studentIdInput) {
                studentIdInput = document.createElement('input');
                studentIdInput.type = 'hidden';
                studentIdInput.name = 'studentId';
                modal.querySelector('form').appendChild(studentIdInput);
            }
            
            // Set student information
            nameDisplay.textContent = studentName || 'N/A';
            
            // Update level display to show the course's level
            levelDisplay.textContent = currentCourseDetails 
                ? currentCourseDetails.level 
                : studentLevel;
            
            currentCourseDisplay.textContent = currentCourse || '-';
            studentIdInput.value = studentId;
            
            // Populate courses for selection
            coursesResponse.data.forEach(course => {
                const option = document.createElement('option');
                option.value = course._id;
                option.textContent = `${course.name} (${course.students.length}/${course.maxStudents})`;
                courseSelect.appendChild(option);
            });

            // Add event listener to update level when course is selected
            courseSelect.addEventListener('change', function() {
                const selectedCourseId = this.value;
                const selectedCourse = coursesResponse.data.find(
                    course => course._id === selectedCourseId
                );
                
                if (selectedCourse) {
                    levelDisplay.textContent = selectedCourse.level;
                }
            });
            
            // Show modal
            modal.style.display = 'flex';
        })
        .catch(error => {
            console.error('Error preparing course selection:', error);
            ELC.showNotification('Error loading courses', 'error');
        });
}

// Initialize modal event listeners
function initStudentPlacementModal() {
    const modal = document.getElementById('student-placement-modal');
    if (!modal) return;

    // Close modal buttons
    const closeButtons = modal.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Prevent clicks inside modal content from closing the modal
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }

    // Form submission
    const form = modal.querySelector('form');
    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            handleStudentPlacement(event);
        });
    }
}
// Attach event listeners to action buttons in the table
function attachStudentActionListeners() {
    const tableBody = document.querySelector('#student-placements-table tbody');
    if (!tableBody) return;

    // Delegate event listeners
    tableBody.addEventListener('click', (event) => {
        const actionButton = event.target.closest('.action-btn');
        if (!actionButton) return;

        // Prevent event propagation
        event.preventDefault();
        event.stopPropagation();

        // Get data attributes
        const studentId = actionButton.getAttribute('data-student-id');
        const studentName = actionButton.getAttribute('data-student-name');
        const studentLevel = actionButton.getAttribute('data-student-level');
        const currentCourse = actionButton.getAttribute('data-current-course');

        // Open placement modal
        if (studentId) {
            openStudentPlacementModal(studentId, studentName, studentLevel, currentCourse);
        }
    });
}
// Handle student placement form submission
function handleStudentPlacement(event) {
    event.preventDefault();
    
    const modal = document.getElementById('student-placement-modal');
    const studentIdInput = modal.querySelector('input[name="studentId"]');
    const courseSelect = modal.querySelector('#select-course');
    
    if (!studentIdInput || !courseSelect) {
        console.error('Required elements not found');
        return;
    }
    
    const studentId = studentIdInput.value;
    const courseId = courseSelect.value;
    
    // Get the selected course to access its level
    const selectedCourseOption = courseSelect.options[courseSelect.selectedIndex];
    const courseName = selectedCourseOption.textContent;
    
    // Find the course in the courses data to get its level
    ELC.apiRequest('/admin/courses/' + courseId, 'GET')
        .then(response => {
            if (response.success && response.data) {
                const course = response.data;
                const courseLevel = course.level; // Get the level from the course
                
                console.log('Assigning student to course with level:', courseLevel);
                
                // Update student's course assignment AND level at the same time
                ELC.apiRequest(`/admin/students/${studentId}/course`, 'PUT', {
                    courseId: courseId,
                    level: courseLevel // This is the important part - update level to match course
                })
                .then(updateResponse => {
                    if (updateResponse.success) {
                        ELC.showNotification('Student course placement updated', 'success');
                        
                        // Close modal
                        modal.style.display = 'none';
                        
                        // Reload students table
                        loadStudents();
                    } else {
                        console.error('Course placement error:', updateResponse);
                        ELC.showNotification(updateResponse.message || 'Error updating placement', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error updating student placement:', error);
                    ELC.showNotification('Error updating student placement', 'error');
                });
            } else {
                ELC.showNotification('Could not load course details', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching course details:', error);
            ELC.showNotification('Error loading course details', 'error');
        });
}
// Remove student from current course
function removeStudentFromCourse(studentId) {
    ELC.apiRequest(`/admin/students/${studentId}/course`, 'DELETE')
        .then(response => {
            if (response.success) {
                ELC.showNotification('Student removed from course', 'success');
                loadStudents();
            } else {
                ELC.showNotification('Error removing student from course: ' + response.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error removing student from course:', error);
            ELC.showNotification('Error removing student from course', 'error');
        });
}
// Filter students
function filterStudents() {
    const searchInput = document.getElementById('search-students-placement');
    const placementStatusFilter = document.getElementById('filter-placement-status');
    const studentLevelFilter = document.getElementById('filter-student-level');
    
    if (!searchInput || !placementStatusFilter || !studentLevelFilter) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const placementStatusValue = placementStatusFilter.value;
    const studentLevelValue = studentLevelFilter.value;
    
    const rows = document.querySelectorAll('#student-placements-table tbody tr');
    
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        const email = row.cells[2].textContent.toLowerCase();
        const level = row.cells[3].textContent.toLowerCase();
        const status = row.cells[5].textContent.toLowerCase();
        
        const matchesSearch = searchTerm === '' || 
            name.includes(searchTerm) || 
            email.includes(searchTerm);
        
        const matchesPlacementStatus = placementStatusValue === '' || 
            status.includes(placementStatusValue);
        
        const matchesLevel = studentLevelValue === '' || 
            level.includes(studentLevelValue);
        
        if (matchesSearch && matchesPlacementStatus && matchesLevel) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load students when page loads
    loadStudents();
    
    // Add event listener to student placement form
    const placementForm = document.getElementById('student-placement-form');
    if (placementForm) {
        placementForm.addEventListener('submit', handleStudentPlacement);
    }
    
    // Add event listeners to close modal buttons
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = document.getElementById('student-placement-modal');
            if (modal) modal.classList.remove('show');
        });
    });
    
    // Optional: Close modal when clicking outside the modal content
    const modal = document.getElementById('student-placement-modal');
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.remove('show');
            }
        });
    }
    
    // Add search and filter event listeners
    const searchInput = document.getElementById('search-students-placement');
    const placementStatusFilter = document.getElementById('filter-placement-status');
    const studentLevelFilter = document.getElementById('filter-student-level');
    
    if (searchInput) searchInput.addEventListener('input', filterStudents);
    if (placementStatusFilter) placementStatusFilter.addEventListener('change', filterStudents);
    if (studentLevelFilter) studentLevelFilter.addEventListener('change', filterStudents);
    initStudentPlacementModal();
    attachStudentActionListeners();

});
// Function to load reports with optional filtering
function loadReports(filters = {}) {
    // Fetch courses, teachers, and reports
    Promise.all([
        ELC.apiRequest('/admin/courses', 'GET'),
        ELC.apiRequest('/admin/teachers', 'GET'),
        ELC.apiRequest('/admin/reports', 'GET')
    ])
    .then(([coursesResponse, teachersResponse, reportsResponse]) => {
        // Create maps for easy lookup
        const courseMap = coursesResponse.success 
            ? coursesResponse.data.reduce((map, course) => {
                map[course._id] = course.name || course.title;
                return map;
            }, {}) 
            : {};
        
        const teacherMap = teachersResponse.success
            ? teachersResponse.data.reduce((map, teacher) => {
                map[teacher._id] = teacher.fullName;
                return map;
            }, {})
            : {};
        
        // Process reports
        if (reportsResponse.success) {
            // Populate course filter with ALL courses
            updateIndividualReportFilters(coursesResponse.data, courseMap);
            
            // Apply filters
            let filteredReports = reportsResponse.data;
            
            if (filters.type) {
                filteredReports = filteredReports.filter(report => report.type === filters.type);
            }
            
            if (filters.course) {
                filteredReports = filteredReports.filter(report => report.course === filters.course);
            }
            
            // Separate and populate reports
            const individualReports = filteredReports.filter(report => report.type === 'individual');
            const classReports = filteredReports.filter(report => report.type === 'class');
            
            // Populate reports
            populateIndividualReports(individualReports, courseMap, teacherMap, courseMap);
            populateClassReports(classReports, courseMap, teacherMap);
        }
    })
    .catch(error => {
        console.error('Error loading reports:', error);
        ELC.showNotification('Failed to load reports', 'error');
    });
}

// Update filter options for individual reports
function updateIndividualReportFilters(courses, courseMap) {
    const individualCourseFilter = document.getElementById('filter-individual-class');
    if (!individualCourseFilter) return;
    
    // Clear existing options
    individualCourseFilter.innerHTML = '<option value="">All Classes</option>';
    
    // Add ALL courses as options
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course._id;
        option.textContent = course.name || course.title;
        individualCourseFilter.appendChild(option);
    });
}
// Update filter options for class reports
function updateClassReportFilters(reports) {
    const classPeriodFilter = document.getElementById('filter-class-period');
    if (!classPeriodFilter) return;
    
    // Get unique academic periods for class reports
    const classPeriods = new Set(
        reports
            .filter(report => report.type === 'class')
            .map(report => report.academicPeriod)
    );
    
    // Clear existing options
    classPeriodFilter.innerHTML = '<option value="">All Periods</option>';
    
    // Add periods as options
    classPeriods.forEach(period => {
        const option = document.createElement('option');
        option.value = period;
        option.textContent = capitalizeFirstLetter(period);
        classPeriodFilter.appendChild(option);
    });
}
// Modify populateIndividualReports to show reports for selected course or all courses
function populateIndividualReports(reports, courseMap, teacherMap, allCourses) {
    const individualReportsContainer = document.getElementById('individual-reports');
    if (!individualReportsContainer) return;
    
    const reportsList = individualReportsContainer.querySelector('.reports-list');
    if (!reportsList) return;
    
    // Clear existing reports
    reportsList.innerHTML = '';
    
    // Sort reports by creation date (most recent first)
    reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // If no reports, show "No reports" message
    if (reports.length === 0) {
        reportsList.innerHTML = `
            <div class="no-reports-message">
                <p>No reports available for the selected course.</p>
            </div>
        `;
        return;
    }
    
    // Populate reports
    reports.forEach(report => {
        const reportItem = document.createElement('div');
        reportItem.className = 'report-item';
        
        reportItem.innerHTML = `
            <div class="report-header" onclick="toggleReport(this)">
                <div class="report-info">
                    <h4>${report.title}</h4>
                    <div class="report-meta">
                        <span><i class="fas fa-calendar"></i> Generated: ${ELC.formatDate(report.createdAt)}</span>
                        <span><i class="fas fa-book"></i> Course: ${courseMap[report.course] || 'Unknown Course'}</span>
                        <span><i class="fas fa-user"></i> By: ${teacherMap[report.generatedBy] || 'Unknown Teacher'}</span>
                    </div>
                </div>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="report-content">
                <p>${report.description || 'No description available'}</p>
                <div class="report-actions">
                    <button class="btn btn-primary btn-sm" onclick="viewReport('${report._id}')">View Report</button>
                    <button class="btn btn-secondary btn-sm" onclick="downloadReport('${report._id}')">Download PDF</button>
                </div>
                <div class="report-stats">
                    <span><i class="fas fa-eye"></i> Views: ${report.viewCount}</span>
                    <span><i class="fas fa-download"></i> Downloads: ${report.downloadCount}</span>
                </div>
            </div>
        `;
        
        reportsList.appendChild(reportItem);
    });
}
// Populate class reports (similar to individual reports)
function populateClassReports(reports, courseMap, teacherMap) {
    const classReportsContainer = document.getElementById('class-reports');
    if (!classReportsContainer) return;
    
    const reportsList = classReportsContainer.querySelector('.reports-list');
    if (!reportsList) return;
    
    // Clear existing reports
    reportsList.innerHTML = '';
    
    // Sort reports by creation date (most recent first)
    reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Populate reports
    reports.forEach(report => {
        const reportItem = document.createElement('div');
        reportItem.className = 'report-item';
        
        reportItem.innerHTML = `
            <div class="report-header" onclick="toggleReport(this)">
                <div class="report-info">
                    <h4>${report.title}</h4>
                    <div class="report-meta">
                        <span><i class="fas fa-calendar"></i> Generated: ${ELC.formatDate(report.createdAt)}</span>
                        <span><i class="fas fa-book"></i> Course: ${courseMap[report.course] || 'Unknown Course'}</span>
                        <span><i class="fas fa-user"></i> By: ${teacherMap[report.generatedBy] || 'Unknown Teacher'}</span>
                    </div>
                </div>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="report-content">
                <p>${report.description || 'No description available'}</p>
                <div class="report-actions">
                    <button class="btn btn-primary btn-sm" onclick="viewReport('${report._id}')">View Report</button>
                    <button class="btn btn-secondary btn-sm" onclick="downloadReport('${report._id}')">Download PDF</button>
                </div>
                <div class="report-stats">
                    <span><i class="fas fa-users"></i> Students: ${report.studentCount}</span>
                    <span><i class="fas fa-eye"></i> Views: ${report.viewCount}</span>
                    <span><i class="fas fa-download"></i> Downloads: ${report.downloadCount}</span>
                </div>
            </div>
        `;
        
        reportsList.appendChild(reportItem);
    });
}

// Toggle report content visibility
function toggleReport(headerElement) {
    const reportItem = headerElement.closest('.report-item');
    const reportContent = reportItem.querySelector('.report-content');
    const chevronIcon = headerElement.querySelector('.fa-chevron-down');
    
    reportContent.classList.toggle('active');
    headerElement.classList.toggle('active');
}
// Initialize reports section with filter functionality
function initReportsSection() {
    // Tab switching functionality
    const reportsTabs = document.querySelectorAll('.reports-tabs .tab-btn');
    reportsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            reportsTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding tab content
            const tabId = tab.getAttribute('data-tab');
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
            
            // Reload reports based on active tab
            loadReports({
                type: tabId === 'individual-reports' ? 'individual' : 'class'
            });
        });
    });
    
    // Course filter for individual reports
    const individualCourseFilter = document.getElementById('filter-individual-class');
    if (individualCourseFilter) {
        individualCourseFilter.addEventListener('change', function() {
            const selectedCourse = this.value;
            
            loadReports({
                type: 'individual',
                course: selectedCourse || undefined
            });
        });
    }
    
    // Initial reports load
    loadReports({
        type: 'individual'
    });
}
// View report details
function viewReport(reportId) {
    ELC.apiRequest(`/admin/reports/${reportId}`, 'GET')
        .then(response => {
            if (response.success) {
                const report = response.data;
                
                // Create report details modal
                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Report Details</h3>
                            <button class="close-modal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="report-details">
                                <h4>${report.title}</h4>
                                <p><strong>Description:</strong> ${report.description || 'No description'}</p>
                                <div class="report-metadata">
                                    <p><strong>Type:</strong> ${capitalizeFirstLetter(report.type)}</p>
                                    <p><strong>Course:</strong> ${report.course?.name || 'No course'}</p>
                                    <p><strong>Generated By:</strong> ${report.generatedBy?.fullName || 'Unknown'}</p>
                                    <p><strong>Academic Period:</strong> ${capitalizeFirstLetter(report.academicPeriod)}</p>
                                    <p><strong>Student Count:</strong> ${report.studentCount || 0}</p>
                                    <p><strong>Views:</strong> ${report.viewCount || 0}</p>
                                    <p><strong>Downloads:</strong> ${report.downloadCount || 0}</p>
                                </div>
                                ${report.file 
                                    ? `<div class="report-file">
                                        <strong>Attached File:</strong> ${report.file}
                                    </div>` 
                                    : '<p><em>No file attached</em></p>'}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary close-modal">Close</button>
                            ${report.file 
                                ? `<button class="btn btn-primary" onclick="downloadReport('${reportId}')">Download</button>` 
                                : ''}
                        </div>
                    </div>
                `;
                
                // Add close functionality
                const closeButtons = modal.querySelectorAll('.close-modal');
                closeButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        document.body.removeChild(modal);
                    });
                });
                
                // Style the modal
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100%';
                modal.style.height = '100%';
                modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
                modal.style.display = 'flex';
                modal.style.justifyContent = 'center';
                modal.style.alignItems = 'center';
                modal.style.zIndex = '1000';
                
                // Add modal to body
                document.body.appendChild(modal);
            } else {
                ELC.showNotification('Error loading report details', 'error');
            }
        })
        .catch(error => {
            console.error('Error viewing report:', error);
            ELC.showNotification('Error viewing report', 'error');
        });
}

// Similarly for downloadReport
function downloadReport(reportId) {
    // Get token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
        ELC.showNotification('Authentication required. Please login again.', 'error');
        return;
    }
    
    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = `/api/reports/${reportId}/pdf?token=${token}`;
    downloadLink.target = '_blank';
    
    // Append to body, click, and remove
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    ELC.showNotification('Downloading report...', 'success');
}

// Show report details modal
function showReportDetailsModal(reportData) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${reportData.title}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="report-details">
                    <p><strong>Description:</strong> ${reportData.description}</p>
                    <p><strong>Type:</strong> ${reportData.type}</p>
                    <p><strong>Academic Period:</strong> ${reportData.academicPeriod}</p>
                    <p><strong>View Count:</strong> ${reportData.viewCount}</p>
                    <p><strong>Download Count:</strong> ${reportData.downloadCount}</p>
                </div>
            </div>
        </div>
    `;
    
    // Add close functionality
    const closeButton = modal.querySelector('.close-modal');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Add modal to body
    document.body.appendChild(modal);
}
/**
 * Updates system settings with the provided data using the ELC API utilities
 * @param {Object} settingsData - Object containing the settings to update
 * @returns {Promise} - Promise resolving to the API response
 */
function updateSystemSettings(settingsData) {
    // Validate input data
    if (!settingsData || typeof settingsData !== 'object') {
        return Promise.reject(new Error('Invalid settings data provided'));
    }
    
    // Get values from the form if not directly provided
    const formData = {
        centerName: settingsData.centerName || document.querySelector('input[placeholder="Center Name"]')?.value || '',
        address: settingsData.address || document.querySelector('input[placeholder="Address"]')?.value || '',
        phone: settingsData.phone || document.querySelector('input[placeholder="Phone Number"]')?.value || '',
        email: settingsData.email || document.querySelector('input[placeholder="Email"]')?.value || '',
        workingHours: settingsData.workingHours || document.getElementById('center-hours')?.value || '',
        
        // Add additional fields as needed from your form
        maxStudentsPerClass: settingsData.maxStudentsPerClass || parseInt(document.getElementById('max-students')?.value) || 20,
        currencySymbol: settingsData.currencySymbol || document.getElementById('currency')?.value || '$',
        language: settingsData.language || document.getElementById('system-language')?.value || 'en',
        theme: settingsData.theme || document.getElementById('system-theme')?.value || 'light'
    };
    
    // Show loading notification
    if (typeof ELC !== 'undefined' && typeof ELC.showNotification === 'function') {
        ELC.showNotification('Saving settings...', 'info');
    }
    
    // Try multiple endpoints to see which one works
    const endpoints = [
        '/admin/settings',
        '/settings',
        '/api/settings',
        '/api/admin/settings'
    ];
    
    // Try each endpoint until one works
    return tryEndpoints(endpoints, 0, formData, 'PUT');
}

/**
 * Load system settings from the server
 * @returns {Promise} - Promise resolving to the settings data
 */
function loadSystemSettings() {
    // Show loading notification
    if (typeof ELC !== 'undefined' && typeof ELC.showNotification === 'function') {
        ELC.showNotification('Loading settings...', 'info');
    }
    
    // Try multiple endpoints to see which one works
    const endpoints = [
        '/admin/settings',
        '/settings',
        '/api/settings',
        '/api/admin/settings'
    ];
    
    // Try each endpoint until one works
    return tryEndpoints(endpoints, 0, null, 'GET')
        .then(response => {
            if (response.success && response.data) {
                // Update form fields with the retrieved data
                updateFormFields(response.data);
                
                if (typeof ELC !== 'undefined' && typeof ELC.showNotification === 'function') {
                    ELC.showNotification('Settings loaded successfully', 'success');
                }
                
                return response.data;
            } else {
                throw new Error('No settings data returned from server');
            }
        })
        .catch(error => {
            console.error('Error loading settings:', error);
            
            if (typeof ELC !== 'undefined' && typeof ELC.showNotification === 'function') {
                ELC.showNotification('Error loading settings: ' + error.message, 'error');
            }
            
            throw error;
        });
}

/**
 * Helper function to try multiple endpoints
 * @param {Array} endpoints - Array of endpoint URLs to try
 * @param {number} index - Current index in the endpoints array
 * @param {Object} data - Data to send (for PUT/POST requests)
 * @param {string} method - HTTP method (GET, PUT, POST, DELETE)
 * @returns {Promise} - Promise resolving to the API response
 */
function tryEndpoints(endpoints, index, data, method) {
    if (index >= endpoints.length) {
        return Promise.reject(new Error('All endpoints failed'));
    }
    
    const endpoint = endpoints[index];
    console.log(`Trying ${method} request to endpoint: ${endpoint}`);
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token') || ''}`
        }
    };
    
    // Add body for PUT/POST requests
    if (data && (method === 'PUT' || method === 'POST')) {
        options.body = JSON.stringify(data);
    }
    
    return fetch(endpoint, options)
        .then(response => {
            console.log(`Endpoint ${endpoint} response:`, response.status);
            
            if (response.ok) {
                return response.json();
            }
            
            // If this endpoint fails, try the next one
            console.log(`Endpoint ${endpoint} failed with status ${response.status}, trying next endpoint`);
            return tryEndpoints(endpoints, index + 1, data, method);
        })
        .then(responseData => {
            if (responseData.success) {
                console.log(`Endpoint ${endpoint} succeeded!`, responseData);
                
                if (method === 'PUT' && typeof ELC !== 'undefined' && typeof ELC.showNotification === 'function') {
                    ELC.showNotification('Settings saved successfully', 'success');
                }
                
                return responseData;
            } else {
                // This endpoint returned a valid response but with success: false
                throw new Error(responseData.message || `Endpoint ${endpoint} returned unsuccessful response`);
            }
        })
        .catch(error => {
            // Only throw if this is the last endpoint
            if (index === endpoints.length - 1) {
                console.error('All endpoints failed:', error);
                
                if (typeof ELC !== 'undefined' && typeof ELC.showNotification === 'function') {
                    ELC.showNotification(`Error ${method === 'GET' ? 'loading' : 'saving'} settings: ${error.message}`, 'error');
                }
                
                throw error;
            }
            
            // Otherwise, try the next endpoint
            console.log(`Endpoint ${endpoint} failed with error:`, error.message);
            return tryEndpoints(endpoints, index + 1, data, method);
        });
}

/**
 * Helper function to update form fields with new values
 * @param {Object} settings - The settings object with data to display
 */
function updateFormFields(settings) {
    if (!settings) {
        console.warn('No settings data provided to update form fields');
        return;
    }
    
    console.log('Updating form fields with settings data:', settings);
    
    // First try to find inputs by ID
    const centerNameInput = document.getElementById('center-name');
    const addressInput = document.getElementById('center-address');
    const phoneInput = document.getElementById('center-phone');
    const emailInput = document.getElementById('center-email');
    
    // If not found by ID, try placeholders or labels
    const inputs = Array.from(document.querySelectorAll('input'));
    
    // Find input by placeholder or label text
    const findInput = (placeholder, defaultInput) => {
        if (defaultInput) return defaultInput;
        
        // Try to find by placeholder
        const byPlaceholder = inputs.find(input => 
            input.placeholder && input.placeholder.toLowerCase().includes(placeholder.toLowerCase())
        );
        
        if (byPlaceholder) return byPlaceholder;
        
        // Try to find by preceding label
        return inputs.find(input => {
            const label = document.querySelector(`label[for="${input.id}"]`);
            return label && label.textContent.toLowerCase().includes(placeholder.toLowerCase());
        });
    };
    
    // Get inputs with fallbacks
    const centerName = findInput('center name', centerNameInput);
    const address = findInput('address', addressInput);
    const phone = findInput('phone', phoneInput);
    const email = findInput('email', emailInput);
    
    // Alternative approach for missing IDs - try the first 4 inputs in order
    if (!centerName && !address && !phone && !email && inputs.length >= 4) {
        if (inputs[0]) inputs[0].value = settings.centerName || '';
        if (inputs[1]) inputs[1].value = settings.address || '';
        if (inputs[2]) inputs[2].value = settings.phone || '';
        if (inputs[3]) inputs[3].value = settings.email || '';
    } else {
        // Update input values if elements were found
        if (centerName) centerName.value = settings.centerName || '';
        if (address) address.value = settings.address || '';
        if (phone) phone.value = settings.phone || '';
        if (email) email.value = settings.email || '';
    }
    
    // Update additional fields if they exist
    if (document.getElementById('center-hours'))
        document.getElementById('center-hours').value = settings.workingHours || '';
    
    if (document.getElementById('max-students'))
        document.getElementById('max-students').value = settings.maxStudentsPerClass || '20';
    
    if (document.getElementById('currency'))
        document.getElementById('currency').value = settings.currencySymbol || '$';
    
    if (document.getElementById('system-language'))
        document.getElementById('system-language').value = settings.language || 'en';
    
    if (document.getElementById('system-theme'))
        document.getElementById('system-theme').value = settings.theme || 'light';
}

/**
 * Reset form to the last loaded settings
 */
function resetSettingsForm() {
    console.log('Resetting settings form...');
    
    // Reload settings from the server
    loadSystemSettings();
}

// Initialize and setup event handlers when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing settings page...');
    
    // Load current settings to populate the form
    loadSystemSettings();
    
    // Find the settings form
    const settingsForm = document.getElementById('system-settings-form');
    
    // If no form with ID, try to find form by containing 'Save Settings' button
    const saveButton = document.querySelector('button.btn-primary, button[type="submit"]');
    let form = settingsForm;
    
    if (!form && saveButton) {
        form = saveButton.closest('form');
    }
    
    // Set up form submission handler
    if (form) {
        console.log('Settings form found, setting up event listener');
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data - try to find inputs by different means
            const formInputs = form.querySelectorAll('input');
            let centerName, address, phone, email;
            
            // Try to identify inputs by their placeholder or position
            formInputs.forEach(input => {
                const placeholder = input.placeholder?.toLowerCase() || '';
                const labelFor = document.querySelector(`label[for="${input.id}"]`)?.textContent.toLowerCase() || '';
                
                if (placeholder.includes('center name') || labelFor.includes('center name')) {
                    centerName = input.value;
                } else if (placeholder.includes('address') || labelFor.includes('address')) {
                    address = input.value;
                } else if (placeholder.includes('phone') || labelFor.includes('phone')) {
                    phone = input.value;
                } else if (placeholder.includes('email') || labelFor.includes('email')) {
                    email = input.value;
                }
            });
            
            // If couldn't identify by labels, try position (only if we have 4 inputs)
            if (!centerName && !address && !phone && !email && formInputs.length >= 4) {
                centerName = formInputs[0].value;
                address = formInputs[1].value;
                phone = formInputs[2].value;
                email = formInputs[3].value;
            }
            
            // Collect settings data
            const settingsData = {
                centerName: centerName || '',
                address: address || '',
                phone: phone || '',
                email: email || ''
                // Add other fields as needed
            };
            
            console.log('Submitting settings data:', settingsData);
            
            // Update settings
            updateSystemSettings(settingsData)
                .then(response => {
                    console.log('Settings updated successfully:', response);
                })
                .catch(error => {
                    console.error('Error updating settings:', error);
                });
        });
    } else {
        console.log('No settings form found, looking for save button');
        
        // If no form found, add click event to save button
        if (saveButton) {
            console.log('Save button found, adding click event');
            
            saveButton.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get all inputs on the page
                const allInputs = document.querySelectorAll('input');
                let settingsData = {};
                
                // If we have 4 inputs, assume they're center name, address, phone, email in that order
                if (allInputs.length >= 4) {
                    settingsData = {
                        centerName: allInputs[0].value || '',
                        address: allInputs[1].value || '',
                        phone: allInputs[2].value || '',
                        email: allInputs[3].value || ''
                    };
                } else {
                    // Try to find inputs by placeholder
                    allInputs.forEach(input => {
                        const placeholder = input.placeholder?.toLowerCase() || '';
                        
                        if (placeholder.includes('center name')) {
                            settingsData.centerName = input.value;
                        } else if (placeholder.includes('address')) {
                            settingsData.address = input.value;
                        } else if (placeholder.includes('phone')) {
                            settingsData.phone = input.value;
                        } else if (placeholder.includes('email')) {
                            settingsData.email = input.value;
                        }
                    });
                }
                
                console.log('Submitting settings from button click:', settingsData);
                
                // Update settings
                updateSystemSettings(settingsData)
                    .then(response => {
                        console.log('Settings updated successfully:', response);
                    })
                    .catch(error => {
                        console.error('Error updating settings:', error);
                    });
            });
        }
    }
    
    // Set up reset button handler
    const resetButton = document.querySelector('button.btn-secondary, button[type="reset"]');
    if (resetButton) {
        resetButton.addEventListener('click', function(e) {
            e.preventDefault();
            resetSettingsForm();
        });
    }
});


/**
 * Helper function to capitalize first letter
 */
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

