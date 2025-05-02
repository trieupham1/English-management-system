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

function loadAssignmentsData() {
    console.log('Loading assignments data...');
    ELC.showNotification('Loading your assignments...', 'info');
    
    // Updated API endpoint to match your routes
    ELC.apiRequest('/assignments', 'GET')
        .then(response => {
            if (response.success) {
                console.log('Assignments data loaded:', response.data);
                
                 // Check if we just submitted an assignment and update its status
                 if (window.lastSubmittedAssignment) {
                    response.data.forEach(assignment => {
                        if (assignment._id === window.lastSubmittedAssignment) {
                            assignment.status = 'completed';
                        }
                    });
                    // Clear the flag after use
                    window.lastSubmittedAssignment = null;
                }

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
        assignmentRow.setAttribute('data-id', assignment._id || '');
        
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
                    <button class="btn ${assignment.status === 'completed' ? 'btn-secondary start-view-submission' : 'btn-primary start-assignment'}" data-id="${assignment._id || ''}">
                        ${assignment.status === 'completed' ? 'View Submission' : 'Add Submission'}
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

// Assignment Submission Functionality - New Code Below

// Global variables for assignment submission
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
    // Set the selected assignment
    selectedAssignment = assignmentId;
    
    // Update the assignment title and description in the submission section
    const submissionTitle = document.getElementById('submission-assignment-title');
    const submissionDescription = document.getElementById('submission-description');
    
    if (submissionTitle) submissionTitle.textContent = title;
    if (submissionDescription) submissionDescription.innerHTML = `<p>${description}</p>`;
    
    // Load submission data
    loadSubmissionData(assignmentId);
    
    // Navigate to submission section
    navigateToSection('assignment-submission');
}

function loadSubmissionData(assignmentId) {
    // Show loading notification
    ELC.showNotification('Loading submission...', 'info');
    
    // Make API request to get assignment details with submission
    ELC.apiRequest(`/assignments/${assignmentId}`, 'GET')
        .then(response => {
            if (response.success) {
                const assignment = response.data;
                
                // Find current user's submission
                const currentUserId = ELC.getCurrentUser().id;
                const userSubmission = assignment.submissions.find(sub => 
                    sub.student._id === currentUserId || sub.student === currentUserId
                );
                
                if (userSubmission) {
                    // Extract file details if available
                    submissionFiles = [];
                    if (userSubmission.file) {
                        const fileName = userSubmission.file.split('/').pop();
                        submissionFiles.push({
                            name: fileName,
                            // For size, we don't have it, so use placeholder
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
                    
                    // Update the UI with submission data
                    showSubmissionStatus(submissionData);
                    
                    // Show success notification
                    ELC.showNotification('Submission loaded successfully', 'success');
                } else {
                    // No submission found
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
    
    console.log("Submitting with MongoDB ID:", mongoId);

    // Use a log to verify what's in the FormData
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
    }

    // Debug log
    console.log("Submitting with MongoDB ID:", mongoId);

    // Make API request
    ELC.apiRequest(url, 'POST', formData, true, true)
    .then(response => {
       if (response.success) {
           // Show success notification
           ELC.showNotification('Submission saved successfully', 'success');
           // Update the assignment status in the UI
           updateAssignmentStatus(selectedAssignment, 'completed');
           
           navigateToSection('assignments');

           // Show submission status
           showSubmissionStatus({
               submittedAt: new Date(),
               status: 'submitted',
               gradingStatus: 'not_graded'
           });
                
                // Show success notification
                ELC.showNotification('Submission saved successfully', 'success');
                
                // Navigate back to assignment list after a delay
                setTimeout(() => {
                    loadAssignmentsData();
                }, 500);
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

function showSubmissionStatus(data) {
    // Get the file upload and status sections
    const fileUploadSection = document.getElementById('file-upload-section');
    const submissionStatus = document.getElementById('submission-status');
    
    // Get date elements
    const submissionDate = document.getElementById('submission-date');
    const submittedFilesList = document.getElementById('submitted-files-list');
    
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
    const formattedDate = date.toLocaleDateString('en-US', options);
    
    // Update the submission date
    if (submissionDate) submissionDate.textContent = formattedDate;
    
    // Update the submitted files list
    if (submittedFilesList) {
        submittedFilesList.innerHTML = '';
        
        submissionFiles.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-link';
            fileItem.innerHTML = `
                <i class="fas fa-file"></i>
                <span style="margin-left: 10px;">${file.name}</span>
                <span style="margin-left: 10px; color: #666;">${formattedDate}</span>
            `;
            submittedFilesList.appendChild(fileItem);
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
                const currentUserId = ELC.getCurrentUser().id;
                const userSubmission = assignment.submissions.find(sub => 
                    sub.student._id === currentUserId || sub.student === currentUserId
                );
                
                if (userSubmission) {
                    // Extract file details if available
                    submissionFiles = [];
                    if (userSubmission.file) {
                        const fileName = userSubmission.file.split('/').pop();
                        submissionFiles.push({
                            name: fileName,
                            // For size, we don't have it, so use placeholder
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
// Update the showSubmissionStatus function to format the file list better
function showSubmissionStatus(data) {
    // Get the file upload and status sections
    const fileUploadSection = document.getElementById('file-upload-section');
    const submissionStatus = document.getElementById('submission-status');
    
    // Get date elements
    const submissionDate = document.getElementById('submission-date');
    const submittedFilesList = document.getElementById('submitted-files-list');
    
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
    
    // Hide upload section, show status section
    if (fileUploadSection) fileUploadSection.style.display = 'none';
    if (submissionStatus) submissionStatus.style.display = 'block';
}
}