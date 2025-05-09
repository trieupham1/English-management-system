// js/pages/student.js

document.addEventListener('DOMContentLoaded', function() {
    if (!ELC.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    if (!ELC.hasRole('student')) {
        window.location.href = 'login.html?error=unauthorized';
        return;
    }
    
    console.log('Student dashboard initializing...');
    initStudentDashboard();
});

function initStudentDashboard() {
    ELC.initUserProfile();
    ELC.initLogout();
    loadStudentDashboard();
    initTabNavigation();
    initCourseMaterialsNavigation();
    initAssignmentFiltering();
    initAssignmentSubmission(); // Add this line to initialize assignment submission
    
    // Initialize assignments view all button
    const assignmentsViewAll = document.getElementById('assignments-view-all');
    if (assignmentsViewAll) {
        assignmentsViewAll.addEventListener('click', function(e) {
            e.preventDefault();
            navigateToSection('assignments');
        });
    }
    
    if (typeof initStudentChatbot === 'function') {
        initStudentChatbot();
    }
}
// In student.js, update the loadStudentDashboard function
function loadStudentDashboard() {
    console.log('Loading dashboard data...');
    ELC.showNotification('Loading dashboard...', 'info');
    
    // Make the API request
    ELC.apiRequest('/students/dashboard', 'GET')
        .then(response => {
            console.log('Dashboard API response:', response);
            if (response.success) {
                updateDashboardData(response.data);
                
                // Now also load assignments for the dashboard
                loadDashboardAssignments();
                
                ELC.showNotification('Dashboard loaded successfully', 'success');
            } else {
                console.error('Error loading dashboard data:', response.message);
                ELC.showNotification('Failed to load dashboard data', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching dashboard data:', error);
            ELC.showNotification('Failed to connect to server', 'error');
        });
}
// Add a new function to load assignments for the dashboard
function loadDashboardAssignments() {
    // First, get the student's enrolled course
    ELC.apiRequest('/students/courses', 'GET')
        .then(coursesResponse => {
            if (coursesResponse.success && coursesResponse.data.length > 0) {
                const enrolledCourse = coursesResponse.data[0];
                
                // Now fetch assignments
                return ELC.apiRequest('/assignments', 'GET')
                    .then(assignmentsResponse => {
                        if (assignmentsResponse.success) {
                            // Filter assignments for the enrolled course
                            const filteredAssignments = assignmentsResponse.data.filter(assignment => {
                                if (!assignment.course) return false;
                                const courseId = typeof assignment.course === 'object' ? assignment.course._id : assignment.course;
                                return courseId === enrolledCourse._id;
                            });
                            
                            // Update the dashboard assignments section
                            updateDashboardAssignments(filteredAssignments);
                        }
                    });
            } else {
                // No course enrolled
                updateDashboardAssignments([]);
            }
        })
        .catch(error => {
            console.error('Error fetching dashboard assignments:', error);
        });
}
// Add function to update dashboard assignments
function updateDashboardAssignments(assignments) {
    const dashboardAssignments = document.querySelector('.dashboard-assignments');
    if (!dashboardAssignments) return;
    
    // Clear existing content
    dashboardAssignments.innerHTML = '';
    
    if (assignments.length === 0) {
        dashboardAssignments.innerHTML = '<p style="text-align: center; color: #666;">No assignments found</p>';
        return;
    }
    
    // Get current user ID
    const currentUser = ELC.getCurrentUser();
    const currentUserId = currentUser._id || currentUser.id;
    
    // Show only the first 3 assignments
    const displayAssignments = assignments.slice(0, 3);
    
    displayAssignments.forEach(assignment => {
        // Check if current user has submitted
        let hasSubmitted = false;
        
        if (assignment.submissions && assignment.submissions.length > 0) {
            const userSubmission = assignment.submissions.find(sub => {
                const studentId = typeof sub.student === 'object' ? sub.student._id : sub.student;
                return studentId === currentUserId;
            });
            hasSubmitted = !!userSubmission;
        }
        
        let statusClass = 'pending-indicator';
        let statusText = 'Pending';
        
        if (hasSubmitted) {
            statusClass = 'completed-indicator';
            statusText = 'Completed';
        } else if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) {
            statusClass = 'overdue-indicator';
            statusText = 'Overdue';
        }
        
        // Format the date
        let formattedDate = '';
        try {
            const date = new Date(assignment.dueDate);
            formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (error) {
            formattedDate = 'No due date';
        }
        
        const assignmentItem = document.createElement('div');
        assignmentItem.className = 'dashboard-assignment-item';
        assignmentItem.innerHTML = `
            <div class="assignment-content">
                <div class="assignment-title">${assignment.title}</div>
                <div class="assignment-due">Due: ${formattedDate}</div>
            </div>
            <div class="status-indicator ${statusClass}"></div>
        `;
        
        dashboardAssignments.appendChild(assignmentItem);
    });
}
// Update the updateDashboardData function
function updateDashboardData(data) {
    if (!data) {
        console.error('No data provided to update dashboard');
        return;
    }
    
    console.log('Updating dashboard with data:', data);
    
    // Update welcome name
    const welcomeName = document.getElementById('welcome-name');
    if (welcomeName && data.firstName) {
        welcomeName.textContent = data.firstName;
    }
    
    // Update next class information
    const nextClass = document.getElementById('next-class');
    const nextClassTime = document.getElementById('next-class-time');
    
    if (data.nextClass) {
        if (nextClass) nextClass.textContent = data.nextClass.name || 'No upcoming class';
        if (nextClassTime) nextClassTime.textContent = data.nextClass.startsIn || 'N/A';
    } else {
        if (nextClass) nextClass.textContent = 'No upcoming class';
        if (nextClassTime) nextClassTime.textContent = 'N/A';
    }
    
    // Update announcements
    updateDashboardAnnouncements(data.announcements);
}

// Add function to update announcements
function updateDashboardAnnouncements(announcements) {
    const announcementsContainer = document.getElementById('announcements-container');
    if (!announcementsContainer) return;
    
    // Clear loading message
    announcementsContainer.innerHTML = '';
    
    if (!announcements || announcements.length === 0) {
        announcementsContainer.innerHTML = '<p style="text-align: center; color: #666;">No announcements at this time</p>';
        return;
    }
    
    announcements.forEach(announcement => {
        // Format date
        const date = new Date(announcement.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        const announcementItem = document.createElement('div');
        announcementItem.className = 'announcement-item';
        announcementItem.innerHTML = `
            <h4>${announcement.title}</h4>
            <div class="announcement-date">${formattedDate}</div>
            <p>${announcement.content}</p>
        `;
        
        announcementsContainer.appendChild(announcementItem);
    });
}
// Update the dashboard assignments function
function updateDashboardAssignments(assignments) {
    const dashboardAssignments = document.querySelector('.dashboard-assignments');
    if (!dashboardAssignments) return;
    
    // Clear loading message
    dashboardAssignments.innerHTML = '';
    
    if (!assignments || assignments.length === 0) {
        dashboardAssignments.innerHTML = '<p style="text-align: center; color: #666;">No assignments found</p>';
        return;
    }
    
    // Get current user ID
    const currentUser = ELC.getCurrentUser();
    const currentUserId = currentUser._id || currentUser.id;
    
    // Show only the first 3 assignments
    const displayAssignments = assignments.slice(0, 3);
    
    displayAssignments.forEach(assignment => {
        // Check if current user has submitted
        let hasSubmitted = false;
        
        if (assignment.submissions && assignment.submissions.length > 0) {
            const userSubmission = assignment.submissions.find(sub => {
                const studentId = typeof sub.student === 'object' ? sub.student._id : sub.student;
                return studentId === currentUserId;
            });
            hasSubmitted = !!userSubmission;
        }
        
        let statusClass = 'pending-indicator';
        
        if (hasSubmitted) {
            statusClass = 'completed-indicator';
        } else if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) {
            statusClass = 'overdue-indicator';
        }
        
        // Format the date
        let formattedDate = '';
        try {
            const date = new Date(assignment.dueDate);
            formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (error) {
            formattedDate = 'No due date';
        }
        
        const assignmentItem = document.createElement('div');
        assignmentItem.className = 'dashboard-assignment-item';
        assignmentItem.innerHTML = `
            <div class="assignment-content">
                <div class="assignment-title">${assignment.title}</div>
                <div class="assignment-due">Due: ${formattedDate}</div>
            </div>
            <div class="status-indicator ${statusClass}"></div>
        `;
        
        dashboardAssignments.appendChild(assignmentItem);
    });
}
// Update the initCourseMaterialsNavigation function
function initCourseMaterialsNavigation() {
    // Add event listeners to the "View Course Materials" buttons
    const viewMaterialsButtons = document.querySelectorAll('.view-course-materials');
    
    viewMaterialsButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const courseId = this.getAttribute('data-course');
            
            // Navigate to materials section
            navigateToSection('materials');
            
            // Set the filter dropdown to the specified course
            setTimeout(() => {
                const materialFilter = document.getElementById('material-filter');
                if (materialFilter) {
                    materialFilter.value = courseId;
                    
                    // Trigger the filter change to load materials
                    filterMaterials(courseId);
                }
            }, 100); // Small timeout to ensure the materials section is loaded
        });
    });
    
    // Add event listener to the materials filter dropdown
    const materialFilter = document.getElementById('material-filter');
    if (materialFilter) {
        materialFilter.addEventListener('change', function() {
            filterMaterials(this.value);
        });
    }
}
// Update the filterMaterials function to work with the above
function filterMaterials(courseId) {
    console.log('Filtering materials for course:', courseId);
    
    // Show loading state
    const materialsContainer = document.querySelector('.materials-container');
    if (materialsContainer) {
        materialsContainer.innerHTML = '<div class="loading-message">Loading materials...</div>';
    }
    
    // Fetch materials for the selected course
    ELC.apiRequest(`/students/materials/course/${courseId}`, 'GET')
        .then(response => {
            if (response.success) {
                updateMaterialsUI(response.data);
            } else {
                console.error('Error loading materials:', response.message);
                if (materialsContainer) {
                    materialsContainer.innerHTML = '<div class="error-message">Failed to load materials</div>';
                }
            }
        })
        .catch(error => {
            console.error('Error fetching materials:', error);
            if (materialsContainer) {
                materialsContainer.innerHTML = '<div class="error-message">Failed to connect to server</div>';
            }
        });
}
// Keep the updateMaterialsUI function as it is
function updateMaterialsUI(materials) {
    const materialsContainer = document.querySelector('.materials-container');
    if (!materialsContainer) return;
    
    // Clear existing content
    materialsContainer.innerHTML = '';
    
    if (materials.length === 0) {
        materialsContainer.innerHTML = '<div class="no-materials">No materials available for this course</div>';
        return;
    }
    
    // Add each material
    materials.forEach(material => {
        // Get icon based on material type
        let iconClass = 'fas fa-file';
        switch (material.type) {
            case 'document':
                iconClass = 'fas fa-file-word';
                break;
            case 'presentation':
            case 'slides':
                iconClass = 'fas fa-file-powerpoint';
                break;
            case 'video':
                iconClass = 'fas fa-file-video';
                break;
            case 'audio':
                iconClass = 'fas fa-file-audio';
                break;
            case 'image':
                iconClass = 'fas fa-file-image';
                break;
            case 'link':
                iconClass = 'fas fa-link';
                break;
            case 'exercise':
                iconClass = 'fas fa-pen';
                break;
            default:
                iconClass = 'fas fa-file';
        }
        
        // Format date
        const date = new Date(material.createdAt);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        // Create material row
        const materialRow = document.createElement('div');
        materialRow.className = 'material-row';
        materialRow.setAttribute('data-course', material.course);
        
        materialRow.innerHTML = `
            <div class="material-icon">
                <i class="${iconClass}"></i>
            </div>
            <div class="material-content">
                <h3 class="material-title">${material.title}</h3>
                <div class="material-subtitle">${material.description || ''}</div>
                <div class="material-date">${formattedDate}</div>
            </div>
            <div class="material-action">
                ${material.file ? 
                    `<button class="btn btn-primary download-material" data-id="${material._id}">Download</button>` :
                    material.url ? 
                    `<a href="${material.url}" target="_blank" class="btn btn-primary">View</a>` :
                    `<button class="btn btn-secondary" disabled>Not Available</button>`
                }
            </div>
        `;
        
        materialsContainer.appendChild(materialRow);
    });
    
    // Add download event listeners
    initMaterialDownloads();
}
// Add function to handle material downloads
function initMaterialDownloads() {
    const downloadButtons = document.querySelectorAll('.download-material');
    downloadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const materialId = this.getAttribute('data-id');
            downloadMaterial(materialId);
        });
    });
}
// Add function to download material
function downloadMaterial(materialId) {
    ELC.showNotification('Starting download...', 'info');
    
    // Create a link element and trigger download
    const downloadUrl = `${ELC.getApiUrl()}/materials/${materialId}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    ELC.showNotification('Download started', 'success');
}

function initAssignmentFiltering() {
    // Add event listener to the assignments filter dropdown
    const assignmentFilter = document.getElementById('assignment-filter');
    if (assignmentFilter) {
        assignmentFilter.addEventListener('change', function() {
            filterAssignments(this.value);
        });
    }
}

function filterAssignments(courseId) {
    // Get all assignment rows
    const assignmentRows = document.querySelectorAll('.assignment-row');
    
    if (courseId === 'all') {
        // Show all assignments
        assignmentRows.forEach(row => {
            row.style.display = 'flex';
        });
    } else {
        // Show only selected course assignments
        assignmentRows.forEach(row => {
            if (row.getAttribute('data-course') === courseId) {
                row.style.display = 'flex';
            } else {
                row.style.display = 'none';
            }
        });
    }
}

function navigateToSection(sectionName) {
    // Find the menu item
    const menuItem = document.querySelector(`.menu-item[data-section="${sectionName}"]`);
    if (menuItem) {
        // Trigger click event on the menu item
        menuItem.click();
    } else if (sectionName === 'assignment-submission') {
        // Custom handling for assignment submission section
        const menuItems = document.querySelectorAll('.menu-item[data-section]');
        const sections = document.querySelectorAll('.content-section');
        
        // Remove active class from all menu items
        menuItems.forEach(mi => mi.classList.remove('active'));
        // Add active class to assignments menu item
        const assignmentsMenuItem = document.querySelector('.menu-item[data-section="assignments"]');
        if (assignmentsMenuItem) {
            assignmentsMenuItem.classList.add('active');
        }
        
        // Hide all sections
        sections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Show assignment submission section
        const submissionSection = document.getElementById('assignment-submission-section');
        if (submissionSection) {
            submissionSection.style.display = 'block';
        }
    }
}
// Update tab navigation to use the new automatic loading
function initTabNavigation() {
    const menuItems = document.querySelectorAll('.menu-item[data-section]');
    const sections = document.querySelectorAll('.content-section');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetSection = this.getAttribute('data-section');
            
            menuItems.forEach(mi => mi.classList.remove('active'));
            this.classList.add('active');
            
            sections.forEach(section => {
                if (section.id === `${targetSection}-section`) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
            
            if (targetSection === 'dashboard') {
                loadStudentDashboard();
            } else if (targetSection === 'courses') {
                loadCoursesData();
            } else if (targetSection === 'materials') {
                loadMaterialsData(); // This now automatically loads materials for the enrolled course
            } else if (targetSection === 'assignments') {
                loadAssignmentsData();
            }
        });
    });
}
// In student.js, update the loadCoursesData function
function loadCoursesData() {
    console.log('Loading courses data...');
    ELC.showNotification('Loading your courses...', 'info');
    
    ELC.apiRequest('/students/courses', 'GET')
        .then(response => {
            if (response.success) {
                console.log('Courses data loaded:', response.data);
                
                // Check if student has a course
                if (response.data && response.data.length > 0) {
                    updateCoursesUI(response.data);
                    ELC.showNotification('Course loaded successfully', 'success');
                } else {
                    // Show message for no course enrolled
                    const coursesGrid = document.querySelector('.courses-grid');
                    if (coursesGrid) {
                        coursesGrid.innerHTML = `
                            <div class="no-course-message">
                                <h3>You are not enrolled in any course</h3>
                                <p>Please contact the administration to enroll in a course.</p>
                            </div>
                        `;
                    }
                    ELC.showNotification('You are not enrolled in any course', 'info');
                }
            } else {
                console.error('Error loading courses data:', response.message);
                ELC.showNotification('Failed to load courses data', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching courses data:', error);
            ELC.showNotification('Failed to connect to server', 'error');
        });
}
// In student.js, update the updateCoursesUI function
function updateCoursesUI(courses) {
    console.log('Updating courses UI with data:', courses);
    
    const coursesGrid = document.querySelector('.courses-grid');
    if (!coursesGrid) {
        console.error('Could not find courses grid');
        return;
    }
    
    coursesGrid.innerHTML = '';
    
    courses.forEach((course, index) => {
        console.log(`Processing course ${index}:`, course);
        
        // Generate background color based on IELTS level
        let bgColor = '#e0f2fe'; // Default blue
        
        if (course.level) {
            switch (course.level) {
                case '0-3':
                    bgColor = '#e0f2fe'; // Light blue
                    break;
                case '4-5.5':
                    bgColor = '#dcfce7'; // Light green
                    break;
                case '5.5-6.5':
                    bgColor = '#fef9c3'; // Light yellow
                    break;
                case '6.5+':
                    bgColor = '#ede9fe'; // Light purple
                    break;
            }
        }
        
        // Get teacher name - check if teacher is populated correctly
        let teacherName = 'Unknown Teacher';
        if (course.teacher) {
            if (typeof course.teacher === 'object' && course.teacher.fullName) {
                teacherName = course.teacher.fullName;
            } else if (typeof course.teacher === 'string') {
                // If teacher is still just an ID, we need to fix the population
                teacherName = `Teacher ID: ${course.teacher}`;
            }
        }
        
        // Create course card
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        courseCard.innerHTML = `
            <div class="course-header" style="background-color: ${bgColor};">
                <h3>${course.name}</h3>
                <span class="course-level">${course.level}</span>
            </div>
            <div class="course-content">
                <div class="course-instructor">
                    <i class="fas fa-user"></i> Teacher: ${teacherName}
                </div>
                <div class="course-duration">
                    <i class="fas fa-calendar"></i> Duration: 3 months
                </div>
                <div class="course-description">
                    <p>${course.description || `Improve your skills with our ${course.name} course.`}</p>
                </div>
                <div class="course-actions">
                    <button class="btn btn-primary view-course-materials" data-course="${course._id}">View Course Materials</button>
                </div>
            </div>
        `;
        
        coursesGrid.appendChild(courseCard);
    });
    
    initCourseMaterialsNavigation();
    console.log('Courses UI updated successfully');
}

// In student.js, add this function to fetch courses for dropdown
function loadCoursesForDropdown() {
    return ELC.apiRequest('/students/courses/dropdown', 'GET')
        .then(response => {
            if (response.success) {
                return response.data;
            }
            throw new Error('Failed to load courses');
        })
        .catch(error => {
            console.error('Error fetching courses for dropdown:', error);
            return [];
        });
}
function loadMaterialsData() {
    console.log('Loading materials data...');
    ELC.showNotification('Loading your course materials...', 'info');
    
    // First, get the student's enrolled course
    ELC.apiRequest('/students/courses', 'GET')
        .then(coursesResponse => {
            if (coursesResponse.success && coursesResponse.data.length > 0) {
                const enrolledCourse = coursesResponse.data[0];
                
                // Update header to show the course name
                const sectionTitle = document.querySelector('#materials-section .section-title');
                if (sectionTitle) {
                    sectionTitle.textContent = `Course Materials - ${enrolledCourse.name}`;
                }
                
                // Now fetch materials for this specific course
                filterMaterials(enrolledCourse._id);
                
            } else {
                // No course enrolled
                const materialsContainer = document.querySelector('.materials-container');
                if (materialsContainer) {
                    materialsContainer.innerHTML = `
                        <div class="no-course-message">
                            <h3>No Course Enrolled</h3>
                            <p>You need to be enrolled in a course to see materials.</p>
                        </div>
                    `;
                }
                ELC.showNotification('You are not enrolled in any course', 'info');
            }
        })
        .catch(error => {
            console.error('Error fetching courses:', error);
            ELC.showNotification('Failed to connect to server', 'error');
        });
}
// In student.js, update the loadAssignmentsData function
function loadAssignmentsData() {
    console.log('Loading assignments data...');
    ELC.showNotification('Loading your assignments...', 'info');
    
    // First, get the student's enrolled course
    ELC.apiRequest('/students/courses', 'GET')
        .then(coursesResponse => {
            if (coursesResponse.success && coursesResponse.data.length > 0) {
                const enrolledCourse = coursesResponse.data[0]; // Since student has only one course
                
                // Now fetch assignments
                return ELC.apiRequest('/assignments', 'GET')
                    .then(assignmentsResponse => {
                        if (assignmentsResponse.success) {
                            console.log('Assignments data loaded:', assignmentsResponse.data);
                            
                            // Filter assignments to show only those for the enrolled course
                            const filteredAssignments = assignmentsResponse.data.filter(assignment => {
                                if (!assignment.course) return false;
                                const courseId = typeof assignment.course === 'object' ? assignment.course._id : assignment.course;
                                return courseId === enrolledCourse._id;
                            });
                            
                            // Update the assignments section with filtered assignments
                            updateAssignmentsSection(filteredAssignments, enrolledCourse);
                            
                            ELC.showNotification('Assignments loaded successfully', 'success');
                        } else {
                            console.error('Error loading assignments data:', assignmentsResponse.message);
                            ELC.showNotification('Failed to load assignments data', 'error');
                        }
                    });
            } else {
                // No course enrolled
                const assignmentsContainer = document.querySelector('.assignments-container');
                if (assignmentsContainer) {
                    assignmentsContainer.innerHTML = `
                        <div class="no-course-message">
                            <h3>No Course Enrolled</h3>
                            <p>You need to be enrolled in a course to see assignments.</p>
                        </div>
                    `;
                }
                ELC.showNotification('You are not enrolled in any course', 'info');
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            ELC.showNotification('Failed to connect to server', 'error');
        });
}

// Update the updateAssignmentsSection function to hide dropdown and show course name
function updateAssignmentsSection(assignments, enrolledCourse) {
    // Hide the filter dropdown
    const filterDropdown = document.querySelector('.filter-dropdown');
    if (filterDropdown) {
        filterDropdown.style.display = 'none';
    }
    
    // Update header to show the course name
    const assignmentsHeader = document.querySelector('.assignments-header');
    if (assignmentsHeader) {
        const sectionTitle = assignmentsHeader.querySelector('.section-title');
        if (sectionTitle && enrolledCourse) {
            sectionTitle.textContent = `My Assignments - ${enrolledCourse.name}`;
        }
    }
    
    if (!assignments || assignments.length === 0) {
        console.log('No assignments to display');
        const assignmentsContainer = document.querySelector('.assignments-container');
        if (assignmentsContainer) {
            assignmentsContainer.innerHTML = `
                <div class="no-assignments-message">
                    <h3>No Assignments</h3>
                    <p>There are no assignments for your course yet.</p>
                </div>
            `;
        }
        return;
    }
    
    console.log('Updating assignments section with:', assignments);
    
    // Find the assignments container
    const assignmentsContainer = document.querySelector('.assignments-container');
    if (!assignmentsContainer) {
        console.error('Could not find assignments container');
        return;
    }
    
    // Clear existing content
    assignmentsContainer.innerHTML = '';
    
    // Get current user ID
    const currentUser = ELC.getCurrentUser();
    const currentUserId = currentUser._id || currentUser.id;
    
    // Add each assignment
    assignments.forEach(assignment => {
        // Check if current user has submitted
        let hasSubmitted = false;
        let userSubmission = null;
        
        if (assignment.submissions && assignment.submissions.length > 0) {
            userSubmission = assignment.submissions.find(sub => {
                const studentId = typeof sub.student === 'object' ? sub.student._id : sub.student;
                return studentId === currentUserId;
            });
            hasSubmitted = !!userSubmission;
        }
        
        let statusClass = 'status-pending';
        let statusLabel = '';
        
        if (hasSubmitted) {
            statusClass = 'status-completed';
            statusLabel = '<span class="status-label completed">Completed</span>';
        } else if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) {
            statusClass = 'status-overdue';
            statusLabel = '<span class="status-label overdue">Overdue</span>';
        }
        
        // Format the date
        let formattedDate = '';
        try {
            const date = new Date(assignment.dueDate);
            formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            formattedDate = 'Unknown date';
        }
        
        // Create the assignment row
        const assignmentRow = document.createElement('div');
        assignmentRow.className = 'assignment-row';
        assignmentRow.setAttribute('data-id', assignment._id || '');
        
        // Create assignment content
        assignmentRow.innerHTML = `
            <div class="assignment-status-indicator ${statusClass}"></div>
            <div class="assignment-content">
                <h3 class="assignment-title">${assignment.title} ${statusLabel}</h3>
                <div class="assignment-details">
                    <div class="assignment-due"><i class="fas fa-calendar"></i> Due: ${formattedDate}</div>
                    <div class="assignment-teacher"><i class="fas fa-user"></i> Teacher: Unknown</div>
                </div>
                <div class="assignment-description">
                    <p>${assignment.instructions || 'Complete this assignment before the due date.'}</p>
                </div>
                <div class="assignment-actions">
                    <button class="btn ${hasSubmitted ? 'btn-secondary start-view-submission' : 'btn-primary start-assignment'}" data-id="${assignment._id || ''}">
                        ${hasSubmitted ? 'View Submission' : 'Add Submission'}
                    </button>
                </div>
            </div>
        `;
        
        // Add to container
        assignmentsContainer.appendChild(assignmentRow);
    });
    
    // Add event listeners to the assignment buttons
    initAssignmentActionButtons();
    
    console.log('Assignments section updated successfully');
}

let selectedAssignment = null;
let submissionFiles = [];

function initAssignmentSubmission() {
    // Add event listeners for file upload functionality
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const selectFilesBtn = document.getElementById('select-files-btn');
    const saveChangesBtn = document.getElementById('save-changes-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const editSubmissionBtn = document.getElementById('edit-submission-btn');
    const removeSubmissionBtn = document.getElementById('remove-submission-btn');
    
    if (selectFilesBtn) {
        selectFilesBtn.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
    }
    
    if (dropzone) {
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });
        
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });
    }
    
    if (saveChangesBtn) {
        saveChangesBtn.addEventListener('click', () => {
            if (submissionFiles.length > 0) {
                saveSubmission();
            } else {
                ELC.showNotification('Please add at least one file before submitting.', 'warning');
            }
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                navigateToSection('assignments');
            }
        });
    }
    
    if (editSubmissionBtn) {
        editSubmissionBtn.addEventListener('click', () => {
            showFileUploadSection();
        });
    }
    
    if (removeSubmissionBtn) {
        removeSubmissionBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to remove your submission?')) {
                removeSubmission();
            }
        });
    }
}
function initAssignmentActionButtons() {
    // Add event listeners to the assignment action buttons
    const startAssignmentButtons = document.querySelectorAll('.start-assignment');
    const viewSubmissionButtons = document.querySelectorAll('.start-view-submission');
    
    startAssignmentButtons.forEach(button => {
        button.addEventListener('click', function() {
            const assignmentId = this.getAttribute('data-id');
            const assignmentRow = this.closest('.assignment-row');
            const assignmentTitle = assignmentRow.querySelector('.assignment-title').textContent.trim().replace(/completed|overdue/i, '').trim();
            const assignmentDescription = assignmentRow.querySelector('.assignment-description p').textContent.trim();
            
            openAssignmentSubmission(assignmentId, assignmentTitle, assignmentDescription);
        });
    });
    
    viewSubmissionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const assignmentId = this.getAttribute('data-id');
            const assignmentRow = this.closest('.assignment-row');
            const assignmentTitle = assignmentRow.querySelector('.assignment-title').textContent.trim().replace(/completed|overdue/i, '').trim();
            const assignmentDescription = assignmentRow.querySelector('.assignment-description p').textContent.trim();
            
            viewAssignmentSubmission(assignmentId, assignmentTitle, assignmentDescription);
        });
    });
}

function openAssignmentSubmission(assignmentId, title, description) {
    // Set the selected assignment
    selectedAssignment = assignmentId;
    
    // Update the assignment title and description in the submission section
    const submissionTitle = document.getElementById('submission-assignment-title');
    const submissionDescription = document.getElementById('submission-description');
    
    if (submissionTitle) submissionTitle.textContent = title;
    if (submissionDescription) submissionDescription.innerHTML = `<p>${description}</p>`;
    
    // Reset files
    submissionFiles = [];
    const fileList = document.getElementById('file-list');
    if (fileList) fileList.innerHTML = '';
    
    // Show file upload section, hide status section
    showFileUploadSection();
    
    // Navigate to submission section
    navigateToSection('assignment-submission');
    
    // Check if there's already a submission for this assignment
    checkExistingSubmission(assignmentId);
}
function viewAssignmentSubmission(assignmentId, title, description) {
    console.log('Viewing submission for assignment:', assignmentId);
    
    // Set the selected assignment
    selectedAssignment = assignmentId;
    
    // Update the assignment title and description in the submission section
    const submissionTitle = document.getElementById('submission-assignment-title');
    const submissionDescription = document.getElementById('submission-description');
    
    if (submissionTitle) submissionTitle.textContent = title;
    if (submissionDescription) submissionDescription.innerHTML = `<p>${description}</p>`;
    
    // Navigate to submission section
    navigateToSection('assignment-submission');
    
    // Load submission data
    loadSubmissionData(assignmentId);
}

// Now update the student side to show the correct total points
function loadSubmissionData(assignmentId) {
    // Show loading notification
    ELC.showNotification('Loading submission...', 'info');
    
    // Make API request to get assignment details with submission
    ELC.apiRequest(`/assignments/${assignmentId}`, 'GET')
        .then(response => {
            if (response.success) {
                const assignment = response.data;
                
                // Find current user's submission
                const currentUser = ELC.getCurrentUser();
                const currentUserId = currentUser._id || currentUser.id;
                
                // Find the submission from the assignment data
                let userSubmission = null;
                
                if (assignment.submissions && assignment.submissions.length > 0) {
                    userSubmission = assignment.submissions.find(sub => {
                        // Handle both string and object student references
                        const studentId = typeof sub.student === 'object' ? (sub.student._id || sub.student.id) : sub.student;
                        return studentId === currentUserId;
                    });
                }
                
                if (userSubmission) {
                    console.log("User submission found:", userSubmission);
                    // Extract file details if available
                    submissionFiles = [];
                    if (userSubmission.file) {
                        const fileName = userSubmission.file.split('/').pop();
                        submissionFiles.push({
                            name: fileName,
                            size: 0, // We don't have size info from the API
                            type: getFileTypeFromName(fileName)
                        });
                    }
                    
                    // Create submission data object including grade information and total points
                    const submissionData = {
                        submittedAt: new Date(userSubmission.submittedAt),
                        status: 'submitted',
                        gradingStatus: userSubmission.grade ? 'graded' : 'not_graded',
                        grade: userSubmission.grade,
                        feedback: userSubmission.feedback,
                        totalPoints: assignment.totalPoints || 100  // Pass the assignment's total points
                    };
                    
                    console.log("Submission data with grade info:", submissionData);
                    
                    // Update the UI with submission data
                    showSubmissionStatus(submissionData);
                    
                    // Show success notification
                    ELC.showNotification('Submission loaded successfully', 'success');
                } else {
                    // No submission found - show file upload section
                    showFileUploadSection();
                    ELC.showNotification('No submission found', 'info');
                }
            } else {
                console.error('Error loading submission:', response.message);
                ELC.showNotification('Failed to load submission', 'error');
                showFileUploadSection();
            }
        })
        .catch(error => {
            console.error('Error fetching submission:', error);
            ELC.showNotification('Failed to connect to server', 'error');
            showFileUploadSection();
        });
}

// Helper function to determine file type from filename
function getFileTypeFromName(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const typeMap = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif'
    };
    return typeMap[ext] || 'application/octet-stream';
}
function handleFiles(filesList) {
    for (const file of filesList) {
        // Check if file is already in the list
        if (!submissionFiles.some(f => f.name === file.name)) {
            submissionFiles.push(file);
            addFileToList(file);
        }
    }
}

function addFileToList(file) {
    const fileList = document.getElementById('file-list');
    if (!fileList) return;
    
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    // Format file size
    const fileSize = formatFileSize(file.size);
    
    fileItem.innerHTML = `
        <div class="file-info">
            <span class="file-icon"><i class="fas fa-file"></i></span>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${fileSize}</span>
        </div>
        <button class="file-remove" data-filename="${file.name}"><i class="fas fa-times"></i></button>
    `;
    
    fileList.appendChild(fileItem);
    
    // Add event listener to remove button
    const removeBtn = fileItem.querySelector('.file-remove');
    removeBtn.addEventListener('click', () => {
        removeFile(file.name);
    });
}

function removeFile(filename) {
    submissionFiles = submissionFiles.filter(file => file.name !== filename);
    
    // Remove from UI
    const fileList = document.getElementById('file-list');
    if (!fileList) return;
    
    const fileItems = fileList.querySelectorAll('.file-item');
    for (const item of fileItems) {
        const removeBtn = item.querySelector('.file-remove');
        if (removeBtn.getAttribute('data-filename') === filename) {
            fileList.removeChild(item);
            break;
        }
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) {
        return bytes + ' bytes';
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(2) + ' KB';
    } else {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}
function saveSubmission() {
    // Show loading notification
    ELC.showNotification('Uploading files...', 'info');
    
    // Get current user information
    const currentUser = ELC.getCurrentUser();
    console.log("Current user:", currentUser);

    if (!currentUser || !currentUser._id) {
        ELC.showNotification('Error: User information not available', 'error');
        return;
    }

    // Use MongoDB ID
    const mongoId = currentUser._id || currentUser.id;
    console.log("Using MongoDB ID:", mongoId);
    
    // Build the URL with ID as query parameter
    const url = `/assignments/${selectedAssignment}/submit?studentId=${encodeURIComponent(mongoId)}`;

    // Create FormData for file
    const formData = new FormData();
    if (submissionFiles.length > 0) {
        formData.append('file', submissionFiles[0]);
        console.log("file:", submissionFiles[0]);
    }
    
    // Make API request
    ELC.apiRequest(url, 'POST', formData, true, true)
        .then(response => {
            if (response.success) {
                // Show success notification
                ELC.showNotification('Submission saved successfully', 'success');
                
                // Create submission data object
                const submissionData = {
                    submittedAt: new Date(),
                    status: 'submitted',
                    gradingStatus: 'not_graded',
                    grade: null,
                    feedback: null
                };
                
                // Show submission status
                showSubmissionStatus(submissionData);
                
                // Reload assignments to update the button status
                setTimeout(() => {
                    loadAssignmentsData();
                }, 1000);
                
            } else {
                ELC.showNotification('Failed to save submission: ' + response.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error saving submission:', error);
            ELC.showNotification('Error uploading files', 'error');
        });
}

function updateAssignmentStatus(assignmentId, newStatus) {
    // Find the assignment in the UI
    const assignmentRow = document.querySelector(`.assignment-row[data-id="${assignmentId}"]`);
    if (!assignmentRow) return;
    
    // Update status indicator
    const statusIndicator = assignmentRow.querySelector('.assignment-status-indicator');
    if (statusIndicator) {
        const oldClass = statusIndicator.className;
        statusIndicator.className = oldClass.replace(/status-\w+/, `status-${newStatus}`);
    }
    
    // Update title label
    const assignmentTitle = assignmentRow.querySelector('.assignment-title');
    if (assignmentTitle) {
        // Remove any existing status labels
        assignmentTitle.innerHTML = assignmentTitle.innerHTML.replace(/<span class="status-label.*?<\/span>/, '');
        
        // Add the new status label if it's completed or overdue
        if (newStatus === 'completed') {
            assignmentTitle.innerHTML += ' <span class="status-label completed">Completed</span>';
        } else if (newStatus === 'overdue') {
            assignmentTitle.innerHTML += ' <span class="status-label overdue">Overdue</span>';
        }
    }
    
    // Update action button
    const actionButton = assignmentRow.querySelector('.assignment-actions button');
    if (actionButton) {
        if (newStatus === 'completed') {
            actionButton.className = 'btn btn-secondary start-view-submission';
            actionButton.textContent = 'View Submission';
        } else if (newStatus === 'overdue') {
            actionButton.className = 'btn btn-primary start-assignment';
            actionButton.textContent = 'Complete Now';
        } else {
            actionButton.className = 'btn btn-primary start-assignment';
            actionButton.textContent = 'Add Submission';
        }
    }
}
// Student view: Update the showSubmissionStatus function to show correct total points
function showSubmissionStatus(data) {
    // Get the file upload and status sections
    const fileUploadSection = document.getElementById('file-upload-section');
    const submissionStatus = document.getElementById('submission-status');
    
    // Get date elements
    const submissionDate = document.getElementById('submission-date');
    const submittedFilesList = document.getElementById('submitted-files-list');
    
    // Get status table elements
    const submissionStatusBadge = document.querySelector('.status-table .status-badge.badge-submitted');
    const gradingStatusBadge = document.querySelector('.status-table .status-badge.badge-not-graded');
    
    // Format current date for display
    const date = data.submittedAt || new Date();
    const options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const formattedDate = date.toLocaleDateString('en-US', options) + ' at ' + 
                          date.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
    
    // Update the submission date
    if (submissionDate) submissionDate.textContent = formattedDate;
    
    // Update the submitted files list
    if (submittedFilesList) {
        submittedFilesList.innerHTML = '';
        
        submissionFiles.forEach(file => {
            // Determine file icon based on file type
            let fileIconClass = 'fas fa-file';
            if (file.name.endsWith('.pdf')) {
                fileIconClass = 'fas fa-file-pdf';
            } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
                fileIconClass = 'fas fa-file-word';
            } else if (file.name.endsWith('.jpg') || file.name.endsWith('.png') || file.name.endsWith('.gif')) {
                fileIconClass = 'fas fa-file-image';
            }
            
            const fileItem = document.createElement('div');
            fileItem.className = 'file-link';
            fileItem.innerHTML = `
                <div class="file-icon">
                    <i class="${fileIconClass}"></i>
                </div>
                <div class="file-name">${file.name}</div>
                <div class="file-date">${formattedDate}</div>
            `;
            submittedFilesList.appendChild(fileItem);
        });
    }
    
    // Update submission status
    if (submissionStatusBadge) {
        // If graded, change the submission status badge
        if (data.grade !== null && data.grade !== undefined) {
            submissionStatusBadge.className = 'status-badge badge-graded'; 
            submissionStatusBadge.textContent = 'Graded';
        } else {
            submissionStatusBadge.className = 'status-badge badge-submitted';
            submissionStatusBadge.textContent = 'Submitted for grading';
        }
    }
    
    // Update grading status - Use totalPoints from the assignment data
    const totalPoints = data.totalPoints || 100; // Make sure we use the correct total
    
    if (gradingStatusBadge) {
        if (data.grade !== null && data.grade !== undefined) {
            gradingStatusBadge.className = 'status-badge badge-graded';
            gradingStatusBadge.textContent = `${data.grade}/${totalPoints} points`;
        } else {
            gradingStatusBadge.className = 'status-badge badge-not-graded';
            gradingStatusBadge.textContent = 'Not graded';
        }
    }
    
    // Add feedback toggle functionality
    const feedbackToggle = document.getElementById('feedback-toggle');
    const feedbackContent = document.getElementById('feedback-content');
    
    if (feedbackToggle && feedbackContent) {
        // Update the feedback count in the toggle
        const feedbackCount = data.feedback ? 1 : 0;
        const feedbackSpan = feedbackToggle.querySelector('span');
        if (feedbackSpan) {
            feedbackSpan.textContent = `Feedback (${feedbackCount})`;
        }
        
        // Update the feedback content
        if (data.feedback) {
            feedbackContent.innerHTML = `<p class="feedback-text">${data.feedback}</p>`;
        } else {
            feedbackContent.innerHTML = '<p class="feedback-empty">No feedback has been provided yet.</p>';
        }
        
        // Make sure the toggle works
        feedbackToggle.addEventListener('click', function() {
            const icon = this.querySelector('.feedback-toggle-icon');
            const isHidden = feedbackContent.style.display === 'none' || !feedbackContent.style.display;
            
            feedbackContent.style.display = isHidden ? 'block' : 'none';
            
            if (icon) {
                icon.className = isHidden ? 
                    'fas fa-chevron-down feedback-toggle-icon' : 
                    'fas fa-chevron-right feedback-toggle-icon';
            }
        });
    }
    
    // Hide upload section, show status section
    if (fileUploadSection) fileUploadSection.style.display = 'none';
    if (submissionStatus) submissionStatus.style.display = 'block';
}
function showFileUploadSection() {
    // Get the file upload and status sections
    const fileUploadSection = document.getElementById('file-upload-section');
    const submissionStatus = document.getElementById('submission-status');
    
    // Show upload section, hide status section
    if (fileUploadSection) fileUploadSection.style.display = 'block';
    if (submissionStatus) submissionStatus.style.display = 'none';
}
function checkExistingSubmission(assignmentId) {
    // Make API request to get assignment details
    ELC.apiRequest(`/assignments/${assignmentId}`, 'GET')
        .then(response => {
            if (response.success) {
                const assignment = response.data;
                
                // Find current user's submission
                const currentUser = ELC.getCurrentUser();
                const currentUserId = currentUser._id || currentUser.id;
                
                let userSubmission = null;
                
                if (assignment.submissions && assignment.submissions.length > 0) {
                    userSubmission = assignment.submissions.find(sub => {
                        const studentId = sub.student?._id || sub.student?.id || sub.student;
                        return studentId === currentUserId;
                    });
                }
                
                if (userSubmission) {
                    // Extract file details if available
                    submissionFiles = [];
                    if (userSubmission.file) {
                        const fileName = userSubmission.file.split('/').pop();
                        submissionFiles.push({
                            name: fileName,
                            size: 0
                        });
                    }
                    
                    // Create submission data object
                    const submissionData = {
                        submittedAt: new Date(userSubmission.submittedAt),
                        status: 'submitted',
                        gradingStatus: userSubmission.grade ? 'graded' : 'not_graded',
                        grade: userSubmission.grade,
                        feedback: userSubmission.feedback
                    };
                    
                    // Show submission status
                    showSubmissionStatus(submissionData);
                } else {
                    // No submission found
                    showFileUploadSection();
                }
            } else {
                console.error('Error checking submission:', response.message);
                showFileUploadSection();
            }
        })
        .catch(error => {
            console.error('Error fetching submission:', error);
            showFileUploadSection();
        });
}

function removeSubmission() {
    // Show loading notification
    ELC.showNotification('Removing submission...', 'info');
    
    // Define a custom API endpoint for removing a submission
    // Your controller doesn't have a direct endpoint for this, so you may need to add one
    // This is a workaround using the update assignment endpoint
    
    ELC.apiRequest(`/assignments/${selectedAssignment}/remove-submission`, 'POST')
        .then(response => {
            if (response.success) {
                // Update UI to show submission is removed
                updateAssignmentStatus(selectedAssignment, 'pending');
                
                // Navigate back to assignments
                navigateToSection('assignments');
                
                // Show success notification
                ELC.showNotification('Submission removed successfully', 'success');
            } else {
                ELC.showNotification('Failed to remove submission: ' + response.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error removing submission:', error);
            ELC.showNotification('Error removing submission', 'error');
        });
    
        // Add feedback toggle functionality
        const feedbackToggle = document.getElementById('feedback-toggle');
        const feedbackContent = document.getElementById('feedback-content');

        if (feedbackToggle && feedbackContent && data.feedback) {
            feedbackToggle.querySelector('span').textContent = 'Feedback (1)';
            feedbackContent.innerHTML = `<p>${data.feedback}</p>`;
        } else if (feedbackToggle && feedbackContent) {
            feedbackToggle.querySelector('span').textContent = 'Feedback (0)';
            feedbackContent.innerHTML = '<p class="feedback-empty">No feedback has been provided yet.</p>';
        }
        if (fileUploadSection) fileUploadSection.style.display = 'none';
        if (submissionStatus) submissionStatus.style.display = 'block';

}