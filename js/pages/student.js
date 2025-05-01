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

function loadStudentDashboard() {
    console.log('Loading dashboard data...');
    ELC.showNotification('Loading dashboard...', 'info');
    
    // Make the API request
    ELC.apiRequest('/students/dashboard', 'GET')
        .then(response => {
            console.log('Dashboard API response:', response);
            if (response.success) {
                updateDashboardData(response.data);
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
// Improved updateDashboardData function in student.js to better handle assignments
// Update the assignment handling in the updateDashboardData function in student.js

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
        if (nextClass) nextClass.textContent = data.nextClass.name;
        if (nextClassTime) nextClassTime.textContent = data.nextClass.startsIn;
    }
    
    // Update announcements
    if (data.announcements && data.announcements.length > 0) {
        console.log('Found announcements to display:', data.announcements);
        
        // Find the card that contains announcements
        const cards = document.querySelectorAll('.card');
        let announcementCard;
        
        // Look for the card with an h3 containing "Announcements"
        for (const card of cards) {
            const header = card.querySelector('.card-header h3');
            if (header && header.textContent.includes('Announcements')) {
                announcementCard = card;
                break;
            }
        }
        
        if (!announcementCard) {
            console.error('Could not find announcements card');
            return;
        }
        
        // Save the header
        const cardHeader = announcementCard.querySelector('.card-header');
        
        // Clear existing content
        announcementCard.innerHTML = '';
        
        // Add back the header
        announcementCard.appendChild(cardHeader);
        
        // Add each announcement
        data.announcements.forEach(announcement => {
            const announcementItem = document.createElement('div');
            announcementItem.className = 'announcement-item';
            
            // Format date
            const date = new Date(announcement.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            announcementItem.innerHTML = `
                <h4>${announcement.title}</h4>
                <div class="announcement-date">${formattedDate}</div>
                <p>${announcement.content}</p>
            `;
            
            announcementCard.appendChild(announcementItem);
        });
        
        console.log('Announcements updated successfully');
    } else {
        console.log('No announcements to display');
    }
    
    // Update assignments
    if (data.assignments && data.assignments.length > 0) {
        console.log('Found assignments to display:', data.assignments);
        
        // Find the assignments card - specifically the third card which contains assignments
        const assignmentsCard = document.querySelector('.card:nth-child(3)');
        
        if (!assignmentsCard) {
            console.error('Could not find assignments card');
            return;
        }
        
        // Get the dashboard-assignments container
        const assignmentsContainer = assignmentsCard.querySelector('.dashboard-assignments');
        
        if (!assignmentsContainer) {
            console.error('Could not find assignments container');
            return;
        }
        
        // Clear existing content
        assignmentsContainer.innerHTML = '';
        
        // Add each assignment
        data.assignments.forEach(assignment => {
            let statusClass = 'pending-indicator';
            
            if (assignment.status === 'completed') {
                statusClass = 'completed-indicator';
            } else if (assignment.status === 'overdue') {
                statusClass = 'overdue-indicator';
            }
            
            // Format date safely
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
            
            const assignmentItem = document.createElement('div');
            assignmentItem.className = 'dashboard-assignment-item';
            assignmentItem.innerHTML = `
                <div class="assignment-content">
                    <div class="assignment-title">${assignment.title}</div>
                    <div class="assignment-due">Due: ${formattedDate}</div>
                </div>
                <div class="status-indicator ${statusClass}"></div>
            `;
            
            assignmentsContainer.appendChild(assignmentItem);
        });
        
        console.log('Assignments updated successfully');
    } else {
        console.log('No assignments to display');
    }
}
function updateAnnouncements(announcements) {
    if (!announcements || announcements.length === 0) {
        console.log('No announcements to display');
        return;
    }
    
    console.log('Updating announcements:', announcements);
    
    // Find the announcements section - try different selectors
    let announcementContainer = document.querySelector('.card:nth-of-type(1)');
    
    // If not found by the first selector, try a different approach
    if (!announcementContainer || !announcementContainer.querySelector('.announcement-item')) {
        announcementContainer = document.querySelector('.card:has(.announcement-item)');
    }
    
    // Final fallback
    if (!announcementContainer) {
        announcementContainer = document.querySelector('.card:has(.card-header h3:contains("Announcements"))');
    }
    
    if (!announcementContainer) {
        console.error('Could not find announcements container');
        return;
    }
    
    // Save the card header
    const cardHeader = announcementContainer.querySelector('.card-header');
    if (!cardHeader) {
        console.error('Could not find card header');
        return;
    }
    
    // Clear existing content
    announcementContainer.innerHTML = '';
    
    // Add back the header
    announcementContainer.appendChild(cardHeader);
    
    // Add each announcement
    announcements.forEach(announcement => {
        const announcementItem = document.createElement('div');
        announcementItem.className = 'announcement-item';
        
        // Format the date
        const date = new Date(announcement.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        // Create the announcement HTML
        announcementItem.innerHTML = `
            <h4>${announcement.title}</h4>
            <div class="announcement-date">${formattedDate}</div>
            <p>${announcement.content}</p>
        `;
        
        // Add to container
        announcementContainer.appendChild(announcementItem);
    });
    
    console.log('Announcements updated successfully');
}

function updateAssignments(assignments) {
    if (!assignments || assignments.length === 0) {
        console.log('No assignments to display');
        return;
    }
    
    console.log('Updating assignments:', assignments);
    
    // Find the assignments container
    const assignmentsContainer = document.querySelector('.dashboard-assignments');
    if (!assignmentsContainer) {
        console.error('Could not find assignments container');
        return;
    }
    
    // Clear existing content
    assignmentsContainer.innerHTML = '';
    
    // Add each assignment
    assignments.forEach(assignment => {
        let statusClass = 'pending-indicator';
        
        if (assignment.status === 'completed') {
            statusClass = 'completed-indicator';
        } else if (assignment.status === 'overdue') {
            statusClass = 'overdue-indicator';
        }
        
        // Format the date
        const date = new Date(assignment.dueDate);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        // Create the assignment item
        const assignmentItem = document.createElement('div');
        assignmentItem.className = 'dashboard-assignment-item';
        assignmentItem.innerHTML = `
            <div class="assignment-content">
                <div class="assignment-title">${assignment.title}</div>
                <div class="assignment-due">Due: ${formattedDate}</div>
            </div>
            <div class="status-indicator ${statusClass}"></div>
        `;
        
        // Add to container
        assignmentsContainer.appendChild(assignmentItem);
    });
    
    console.log('Assignments updated successfully');
}

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
                    
                    // Trigger the filter change
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

function filterMaterials(courseId) {
    // Get all material rows
    const materialRows = document.querySelectorAll('.material-row');
    
    if (courseId === 'all') {
        // Show all materials
        materialRows.forEach(row => {
            row.style.display = 'flex';
        });
    } else {
        // Show only selected course materials
        materialRows.forEach(row => {
            if (row.getAttribute('data-course') === courseId) {
                row.style.display = 'flex';
            } else {
                row.style.display = 'none';
            }
        });
    }
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
    }
}

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
                loadMaterialsData();
            } else if (targetSection === 'assignments') {
                loadAssignmentsData();
            }
        });
    });
    
    const chatbotToggle = document.getElementById('chatbot-toggle');
    if (chatbotToggle) {
        chatbotToggle.addEventListener('click', function(e) {
            e.preventDefault();
            toggleChatbot();
        });
    }
}
function loadCoursesData() {
    console.log('Loading courses data...');
    ELC.showNotification('Loading your courses...', 'info');
    
    ELC.apiRequest('/students/courses', 'GET')
        .then(response => {
            if (response.success) {
                console.log('Courses data loaded:', response.data);
                
                // Check if we have actual data
                if (response.data && response.data.length > 0) {
                    updateCoursesUI(response.data);
                    ELC.showNotification('Courses loaded successfully', 'success');
                } else {
                    console.error('No course data received from API');
                    ELC.showNotification('No courses found', 'warning');
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

function updateCoursesUI(courses) {
    console.log('Updating courses UI with data:', courses);
    
    // Find the courses container
    const coursesGrid = document.querySelector('.courses-grid');
    if (!coursesGrid) {
        console.error('Could not find courses grid');
        return;
    }
    
    // Clear existing content
    coursesGrid.innerHTML = '';
    
    // Add each course
    courses.forEach((course, index) => {
        console.log(`Processing course ${index}:`, course);
        
        // Generate background color based on level
        let bgColor = '#e0f2fe'; // Default blue
        
        if (course.level) {
            switch (course.level.toLowerCase()) {
                case 'beginner':
                    bgColor = '#e0f2fe'; // Light blue
                    break;
                case 'intermediate':
                    bgColor = '#dcfce7'; // Light green
                    break;
                case 'upper-intermediate':
                    bgColor = '#fef9c3'; // Light yellow
                    break;
                case 'advanced':
                    bgColor = '#ede9fe'; // Light purple
                    break;
                case 'proficient':
                    bgColor = '#fee2e2'; // Light red
                    break;
            }
        }
        
        // Get teacher name
        let teacherName = 'Unknown Teacher';
        if (course.teacher) {
            if (typeof course.teacher === 'string') {
                teacherName = course.teacher;
            } else if (course.teacher.fullName) {
                teacherName = course.teacher.fullName;
            }
        }
        
        // Get duration
        let durationText = '3 months'; // Default
        if (course.duration) {
            durationText = `${course.duration.value || 3} ${course.duration.unit || 'months'}`;
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
                    <i class="fas fa-calendar"></i> Duration: ${durationText}
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
    
    // Reinitialize the material buttons
    initCourseMaterialsNavigation();
    console.log('Courses UI updated successfully');
}

function loadMaterialsData() {
    console.log('Loading materials data...');
    ELC.showNotification('Loading your course materials...', 'info');
    
    // Add API call to get materials data
    ELC.apiRequest('/students/materials', 'GET')
        .then(response => {
            if (response.success) {
                console.log('Materials data loaded:', response.data);
                // You can add code here to update the materials section with dynamic data
            } else {
                console.error('Error loading materials data:', response.message);
            }
        })
        .catch(error => {
            console.error('Error fetching materials data:', error);
        });
    
    // Apply initial filtering based on current dropdown value
    const materialFilter = document.getElementById('material-filter');
    if (materialFilter) {
        filterMaterials(materialFilter.value);
    }
}
// Add this to your student.js file

function loadAssignmentsData() {
    console.log('Loading assignments data...');
    ELC.showNotification('Loading your assignments...', 'info');
    
    // Make the API request to get assignments
    ELC.apiRequest('/students/assignments', 'GET')
        .then(response => {
            if (response.success) {
                console.log('Assignments data loaded:', response.data);
                
                // Update the assignments section
                updateAssignmentsSection(response.data);
                
                ELC.showNotification('Assignments loaded successfully', 'success');
            } else {
                console.error('Error loading assignments data:', response.message);
                ELC.showNotification('Failed to load assignments data', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching assignments data:', error);
            ELC.showNotification('Failed to connect to server', 'error');
        });
    
    // Apply initial filtering based on current dropdown value
    const assignmentFilter = document.getElementById('assignment-filter');
    if (assignmentFilter) {
        filterAssignments(assignmentFilter.value);
    }
}

function updateAssignmentsSection(assignments) {
    if (!assignments || assignments.length === 0) {
        console.log('No assignments to display in assignments section');
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
    
    // Add each assignment
    assignments.forEach(assignment => {
        let statusClass = 'status-pending';
        let statusLabel = '';
        
        if (assignment.status === 'completed') {
            statusClass = 'status-completed';
            statusLabel = '<span class="status-label completed">Completed</span>';
        } else if (assignment.status === 'overdue') {
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
        
        // Get course name if available
        const courseName = assignment.course && assignment.course.name ? 
                           assignment.course.name : 
                           'General Course';
        
        // Create the assignment row
        const assignmentRow = document.createElement('div');
        assignmentRow.className = 'assignment-row';
        assignmentRow.setAttribute('data-course', assignment.course ? assignment.course._id : 'all');
        
        // Create assignment content
        assignmentRow.innerHTML = `
            <div class="assignment-status-indicator ${statusClass}"></div>
            <div class="assignment-content">
                <h3 class="assignment-title">${assignment.title} ${statusLabel}</h3>
                <div class="assignment-details">
                    <div class="assignment-course"><i class="fas fa-book"></i> ${courseName}</div>
                    <div class="assignment-due"><i class="fas fa-calendar"></i> Due: ${formattedDate}</div>
                    <div class="assignment-teacher"><i class="fas fa-user"></i> Teacher: Unknown</div>
                </div>
                <div class="assignment-description">
                    <p>${assignment.description || 'Complete this assignment before the due date.'}</p>
                </div>
                <div class="assignment-actions">
                    <button class="btn ${assignment.status === 'completed' ? 'btn-secondary' : 'btn-primary'}">
                        ${assignment.status === 'completed' ? 'View Submission' : 'Start Assignment'}
                    </button>
                </div>
            </div>
        `;
        
        // Add to container
        assignmentsContainer.appendChild(assignmentRow);
    });
    
    console.log('Assignments section updated successfully');
}