document.addEventListener('DOMContentLoaded', function() {
    if (!ELC.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    if (!ELC.hasRole('student')) {
        window.location.href = 'login.html?error=unauthorized';
        return;
    }
    
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

function loadStudentDashboard() {
    ELC.apiRequest('/api/students/dashboard', 'GET')
        .then(response => {
            if (response.success) {
                updateDashboardData(response.data);
            } else {
                console.error('Error loading dashboard data:', response.message);
            }
        })
        .catch(error => {
            console.error('Error fetching dashboard data:', error);
        });
}

function updateDashboardData(data) {
    if (!data) return;
    
    const welcomeName = document.getElementById('welcome-name');
    if (welcomeName && data.firstName) {
        welcomeName.textContent = data.firstName;
    }
    
    const nextClass = document.getElementById('next-class');
    const nextClassTime = document.getElementById('next-class-time');
    
    if (data.nextClass) {
        if (nextClass) nextClass.textContent = data.nextClass.name;
        if (nextClassTime) nextClassTime.textContent = data.nextClass.startsIn;
    }
    
    if (data.assignments && data.assignments.length > 0) {
        const assignmentsContainer = document.querySelector('.card .assignment-item').parentNode;
        if (assignmentsContainer) {
            assignmentsContainer.innerHTML = '';
            
            data.assignments.forEach(assignment => {
                let statusClass = 'assignment-pending';
                let statusText = 'Pending';
                
                if (assignment.status === 'completed') {
                    statusClass = 'assignment-completed';
                    statusText = 'Completed';
                } else if (assignment.status === 'overdue') {
                    statusClass = 'assignment-overdue';
                    statusText = 'Overdue';
                }
                
                const assignmentItem = document.createElement('div');
                assignmentItem.className = `assignment-item ${statusClass}`;
                assignmentItem.innerHTML = `
                    <div class="assignment-header">
                        <div class="assignment-title">${assignment.title}</div>
                        <div class="assignment-status status-${assignment.status}">${statusText}</div>
                    </div>
                    <div class="assignment-due">Due: ${ELC.formatDate(assignment.dueDate)}</div>
                `;
                
                assignmentsContainer.appendChild(assignmentItem);
            });
        }
    }
    
    if (data.announcements && data.announcements.length > 0) {
        const announcementsContainer = document.querySelector('.card:nth-child(2) .announcement-item').parentNode;
        if (announcementsContainer) {
            announcementsContainer.innerHTML = '';
            
            data.announcements.forEach(announcement => {
                const announcementItem = document.createElement('div');
                announcementItem.className = 'announcement-item';
                announcementItem.innerHTML = `
                    <h4>${announcement.title}</h4>
                    <div class="announcement-date">${ELC.formatDate(announcement.date)}</div>
                    <p>${announcement.content}</p>
                `;
                
                announcementsContainer.appendChild(announcementItem);
            });
        }
    }
}

function loadCoursesData() {
    console.log('Loading courses data...');
    ELC.showNotification('Loading your courses...', 'info');
}

function loadMaterialsData() {
    console.log('Loading materials data...');
    ELC.showNotification('Loading your course materials...', 'info');
    
    // Apply initial filtering based on current dropdown value
    const materialFilter = document.getElementById('material-filter');
    if (materialFilter) {
        filterMaterials(materialFilter.value);
    }
}

function loadAssignmentsData() {
    console.log('Loading assignments data...');
    ELC.showNotification('Loading your assignments...', 'info');
    
    // Apply initial filtering based on current dropdown value
    const assignmentFilter = document.getElementById('assignment-filter');
    if (assignmentFilter) {
        filterAssignments(assignmentFilter.value);
    }
}