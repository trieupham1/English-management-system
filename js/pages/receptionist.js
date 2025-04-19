document.addEventListener('DOMContentLoaded', function() {
    if (!ELC.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    if (!ELC.hasRole('receptionist')) {
        window.location.href = 'login.html?error=unauthorized';
        return;
    }
    
    initReceptionistDashboard();
});

function initReceptionistDashboard() {
    ELC.initUserProfile();
    ELC.initLogout();
    initTabNavigation();
    initRegistrationForm();
    initAssignmentForm();
    initStudentSearch();
    loadDashboardStats();
}

function initTabNavigation() {
    const menuItems = document.querySelectorAll('.menu-item[data-section]');
    const sections = document.querySelectorAll('.content-section');
    
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (menuItems.length > 0 && sections.length > 0) {
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
                    loadDashboardStats();
                } else if (targetSection === 'registration') {
                    // Nothing special needed, form is already initialized
                } else if (targetSection === 'students') {
                    loadStudentsData();
                } else if (targetSection === 'classes') {
                    loadClassesData();
                } else if (targetSection === 'payments') {
                    loadPaymentsData();
                }
            });
        });
    }
    
    if (tabs.length > 0 && tabContents.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }
}

function initRegistrationForm() {
    ELC.handleFormSubmit(
        'registrationForm',
        '/api/students/register',
        'POST',
        (response) => {
            ELC.showNotification('Student registered successfully!', 'success');
            document.getElementById('registrationForm').reset();
        },
        (error) => {
            ELC.showNotification('Error registering student: ' + error.message, 'error');
        }
    );
}

function initAssignmentForm() {
    ELC.handleFormSubmit(
        'assignmentForm',
        '/api/students/assign-class',
        'POST',
        (response) => {
            ELC.showNotification('Student assigned to class successfully!', 'success');
            document.getElementById('assignmentForm').reset();
        },
        (error) => {
            ELC.showNotification('Error assigning student to class: ' + error.message, 'error');
        }
    );
}

function initStudentSearch() {
    const searchInput = document.getElementById('studentSearch');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
        const searchText = e.target.value.toLowerCase();
        const studentItems = document.querySelectorAll('.student-item');
        
        studentItems.forEach(item => {
            const studentName = item.querySelector('.student-name').textContent.toLowerCase();
            const studentId = item.querySelector('.student-id').textContent.toLowerCase();
            
            if (studentName.includes(searchText) || studentId.includes(searchText)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

function loadDashboardStats() {
    ELC.apiRequest('/api/receptionist/dashboard', 'GET')
        .then(response => {
            if (response.success) {
                updateDashboardStats(response.data);
            } else {
                console.error('Error loading dashboard stats:', response.message);
            }
        })
        .catch(error => {
            console.error('Error fetching dashboard stats:', error);
        });
}

function updateDashboardStats(data) {
    if (!data) return;
    
    const statCards = document.querySelectorAll('.stat-card .stat-value');
    if (statCards.length === 4) {
        if (data.totalStudents) statCards[0].textContent = data.totalStudents;
        if (data.activeClasses) statCards[1].textContent = data.activeClasses;
        if (data.todayClasses) statCards[2].textContent = data.todayClasses;
        if (data.newRegistrations) statCards[3].textContent = data.newRegistrations;
    }
    
    if (data.user && data.user.fullName) {
        const welcomeCard = document.querySelector('.welcome-card h2');
        if (welcomeCard) {
            welcomeCard.textContent = `Welcome back, ${data.user.fullName.split(' ')[0]}!`;
        }
        
        if (data.notifications) {
            const welcomeMessage = document.querySelector('.welcome-card p');
            if (welcomeMessage) {
                welcomeMessage.textContent = `You have ${data.notifications.newRegistrations || 0} new student registrations waiting for approval and ${data.notifications.pendingAssignments || 0} class assignments pending.`;
            }
        }
    }
}

document.addEventListener('click', function(e) {
    if (e.target.matches('.action-btn, .action-btn *')) {
        const button = e.target.closest('.action-btn');
        const studentItem = button.closest('.student-item');
        
        if (!studentItem) return;
        
        const studentId = studentItem.dataset.id;
        
        if (button.querySelector('.fa-edit') || button.title === 'Edit') {
            editStudent(studentId);
        } else if (button.querySelector('.fa-check') || button.title === 'Approve') {
            approveStudent(studentId);
        } else if (button.querySelector('.fa-redo') || button.title === 'Activate') {
            activateStudent(studentId);
        } else if (button.querySelector('.fa-user-plus') || button.title === 'Assign to Class') {
            assignToClass(studentId);
        }
    }
});

function editStudent(studentId) {
    console.log(`Edit student with ID: ${studentId}`);
    alert('Edit student functionality will be implemented here');
}

function approveStudent(studentId) {
    if (confirm('Are you sure you want to approve this student?')) {
        ELC.apiRequest(`/api/students/${studentId}/approve`, 'PUT')
            .then(response => {
                if (response.success) {
                    ELC.showNotification('Student approved successfully', 'success');
                    
                    const studentItem = document.querySelector(`.student-item[data-id="${studentId}"]`);
                    if (studentItem) {
                        const statusBadge = studentItem.querySelector('.badge');
                        statusBadge.className = 'badge badge-success';
                        statusBadge.textContent = 'Active';
                        
                        const actionButtons = studentItem.querySelector('.action-buttons');
                        actionButtons.innerHTML = `
                            <button class="action-btn" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="action-btn" title="Assign to Class"><i class="fas fa-user-plus"></i></button>
                        `;
                    }
                } else {
                    ELC.showNotification('Error approving student: ' + response.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error approving student:', error);
                ELC.showNotification('Error approving student', 'error');
            });
    }
}

function activateStudent(studentId) {
    if (confirm('Are you sure you want to reactivate this student?')) {
        ELC.apiRequest(`/api/students/${studentId}/activate`, 'PUT')
            .then(response => {
                if (response.success) {
                    ELC.showNotification('Student activated successfully', 'success');
                    
                    const studentItem = document.querySelector(`.student-item[data-id="${studentId}"]`);
                    if (studentItem) {
                        const statusBadge = studentItem.querySelector('.badge');
                        statusBadge.className = 'badge badge-success';
                        statusBadge.textContent = 'Active';
                        
                        const actionButtons = studentItem.querySelector('.action-buttons');
                        actionButtons.innerHTML = `
                            <button class="action-btn" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="action-btn" title="Assign to Class"><i class="fas fa-user-plus"></i></button>
                        `;
                    }
                } else {
                    ELC.showNotification('Error activating student: ' + response.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error activating student:', error);
                ELC.showNotification('Error activating student', 'error');
            });
    }
}

function assignToClass(studentId) {
    document.querySelector('.tab[data-tab="assignment"]').click();
    
    const studentSelect = document.getElementById('studentSelect');
    if (studentSelect) {
        studentSelect.value = studentId;
    }
    
    ELC.showNotification('Please complete the class assignment form', 'info');
}

function loadStudentsData() {
    console.log('Loading students data...');
    ELC.showNotification('Loading student data...', 'info');
}

function loadClassesData() {
    console.log('Loading classes data...');
    ELC.showNotification('Loading class data...', 'info');
}

function loadPaymentsData() {
    console.log('Loading payments data...');
    ELC.showNotification('Loading payment data...', 'info');
}