document.addEventListener('DOMContentLoaded', function() {
    // Check if ELC is defined
    if (typeof ELC === 'undefined') {
        console.error('ELC is not defined. Make sure common.js is loaded properly.');
        return;
    }
    
    // Check authentication
    if (!ELC.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Check if user has receptionist role
    if (!ELC.hasRole('receptionist')) {
        window.location.href = 'login.html?error=unauthorized';
        return;
    }
    
    // Initialize receptionist dashboard
    initReceptionistDashboard();
});

function initReceptionistDashboard() {
    // Initialize common authenticated components
    ELC.initUserProfile();
    ELC.initLogout();
    ELC.initSidebar();
    ELC.initTabs();
    
    // Initialize specific dashboard functionality
    initTabNavigation();
    initRegistrationForm();
    initAssignmentForm();
    initStudentSearch();
    loadDashboardStats();
}

function initTabNavigation() {
    const menuItems = document.querySelectorAll('.menu-item[data-section]');
    const sections = document.querySelectorAll('.content-section');
    
    if (menuItems.length > 0 && sections.length > 0) {
        menuItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetSection = this.getAttribute('data-section');
                
                // Remove active class from all menu items
                menuItems.forEach(mi => mi.classList.remove('active'));
                this.classList.add('active');
                
                // Hide all sections
                sections.forEach(section => {
                    section.style.display = 'none';
                });
                
                // Show target section
                const targetSectionElement = document.getElementById(`${targetSection}-section`);
                if (targetSectionElement) {
                    targetSectionElement.style.display = 'block';
                }
                
                // Load section-specific data
                switch (targetSection) {
                    case 'dashboard':
                        loadDashboardStats();
                        break;
                    case 'students':
                        loadStudentsData();
                        break;
                    case 'classes':
                        loadClassesData();
                        break;
                    case 'payments':
                        loadPaymentsData();
                        break;
                }
            });
        });
    }
}

function loadDashboardStats() {
    ELC.apiRequest('/api/receptionist/dashboard', 'GET')
        .then(response => {
            if (response.success) {
                updateDashboardStats(response.data);
            } else {
                console.error('Error loading dashboard stats:', response.message);
                ELC.showNotification(response.message || 'Failed to load dashboard', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching dashboard stats:', error);
            ELC.showNotification('Error loading dashboard. Please try again.', 'error');
        });
}

function updateDashboardStats(data) {
    if (!data) return;
    
    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card .stat-value');
    if (statCards.length === 4) {
        statCards[0].textContent = data.totalStudents || 0;
        statCards[1].textContent = data.activeClasses || 0;
        statCards[2].textContent = data.todayClasses || 0;
        statCards[3].textContent = data.newRegistrations || 0;
    }
    
    // Update welcome message
    const welcomeCard = document.querySelector('.welcome-card');
    if (welcomeCard) {
        const nameElement = welcomeCard.querySelector('h2');
        const messageElement = welcomeCard.querySelector('p');
        
        if (nameElement && data.user) {
            nameElement.textContent = `Welcome back, ${data.user.fullName.split(' ')[0]}!`;
        }
        
        if (messageElement && data.notifications) {
            messageElement.textContent = `You have ${data.notifications.newRegistrations || 0} new student registrations and ${data.notifications.pendingAssignments || 0} pending class assignments.`;
        }
    }
}

function initRegistrationForm() {
    ELC.handleFormSubmit(
        'registrationForm',
        '/api/receptionist/students/register',
        'POST',
        (response) => {
            ELC.showNotification('Student registered successfully!', 'success');
            document.getElementById('registrationForm').reset();
            loadStudentsData(); // Refresh student list
        },
        (error) => {
            ELC.showNotification('Error registering student: ' + error.message, 'error');
        },
        (formData) => {
            // Transform form data to match backend expectations
            return {
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                dateOfBirth: formData.dob,
                currentLevel: formData.level,
                source: formData.source,
                notes: formData.notes
            };
        }
    );
}

function initAssignmentForm() {
    ELC.handleFormSubmit(
        'assignmentForm',
        '/api/receptionist/students/assign-class',
        'POST',
        (response) => {
            ELC.showNotification('Student assigned to class successfully!', 'success');
            document.getElementById('assignmentForm').reset();
        },
        (error) => {
            ELC.showNotification('Error assigning student to class: ' + error.message, 'error');
        },
        (formData) => {
            // Transform form data to match backend expectations
            return {
                studentId: formData.studentSelect,
                courseId: formData.courseSelect,
                classId: formData.classSelect,
                startDate: formData.startDate,
                paymentStatus: formData.paymentStatus
            };
        }
    );
}

function loadStudentsData() {
    ELC.apiRequest('/api/receptionist/students', 'GET')
        .then(response => {
            if (response.success) {
                displayStudents(response.data);
            } else {
                console.error('Error loading students:', response.message);
                ELC.showNotification(response.message || 'Failed to load students', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching students:', error);
            ELC.showNotification('Error loading students. Please try again.', 'error');
        });
}

function displayStudents(students) {
    const studentList = document.querySelector('.student-list');
    if (!studentList) return;
    
    studentList.innerHTML = '';
    
    students.forEach(student => {
        const statusClass = 
            student.studentInfo.status === 'active' ? 'badge-success' :
            student.studentInfo.status === 'pending' ? 'badge-warning' :
            'badge-danger';
        
        const actionButtons = student.studentInfo.status === 'pending' ? 
            `<button class="action-btn" data-action="approve"><i class="fas fa-check"></i> Approve</button>` :
            student.studentInfo.status === 'inactive' ?
            `<button class="action-btn" data-action="activate"><i class="fas fa-redo"></i> Activate</button>` :
            `<button class="action-btn" data-action="assign"><i class="fas fa-user-plus"></i> Assign to Class</button>`;
        
        const studentHtml = `
            <div class="student-item" data-id="${student._id}">
                <div class="student-info">
                    <div class="student-name">${student.fullName}</div>
                    <div class="student-details">
                        <div class="student-id">${student.studentInfo.studentId}</div>
                        <div class="student-email">${student.email}</div>
                        <div class="student-phone">${student.phone}</div>
                    </div>
                </div>
                <div class="student-status">
                    <span class="badge ${statusClass}">${ELC.capitalizeFirstLetter(student.studentInfo.status)}</span>
                </div>
                <div class="student-actions">
                    ${actionButtons}
                </div>
            </div>
        `;
        
        studentList.insertAdjacentHTML('beforeend', studentHtml);
    });
    
    // Add event listeners for action buttons
    addStudentActionListeners();
}

function addStudentActionListeners() {
    const actionButtons = document.querySelectorAll('.action-btn');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const studentItem = this.closest('.student-item');
            const studentId = studentItem.dataset.id;
            const action = this.dataset.action;
            
            switch (action) {
                case 'approve':
                    approveStudent(studentId);
                    break;
                case 'activate':
                    activateStudent(studentId);
                    break;
                case 'assign':
                    assignToClass(studentId);
                    break;
            }
        });
    });
}

function approveStudent(studentId) {
    if (confirm('Are you sure you want to approve this student?')) {
        ELC.apiRequest(`/api/receptionist/students/${studentId}/approve`, 'PUT')
            .then(response => {
                if (response.success) {
                    ELC.showNotification('Student approved successfully', 'success');
                    loadStudentsData(); // Refresh student list
                } else {
                    ELC.showNotification(response.message || 'Error approving student', 'error');
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
        ELC.apiRequest(`/api/receptionist/students/${studentId}/activate`, 'PUT')
            .then(response => {
                if (response.success) {
                    ELC.showNotification('Student activated successfully', 'success');
                    loadStudentsData(); // Refresh student list
                } else {
                    ELC.showNotification(response.message || 'Error activating student', 'error');
                }
            })
            .catch(error => {
                console.error('Error activating student:', error);
                ELC.showNotification('Error activating student', 'error');
            });
    }
}

function assignToClass(studentId) {
    // Switch to assignment tab
    const assignmentTab = document.querySelector('.tab[data-tab="assignment"]');
    if (assignmentTab) {
        assignmentTab.click();
    }
    
    // Preselect student in assignment form
    const studentSelect = document.getElementById('studentSelect');
    if (studentSelect) {
        studentSelect.value = studentId;
    }
    
    ELC.showNotification('Please complete the class assignment form', 'info');
}

function loadClassesData() {
    ELC.apiRequest('/api/receptionist/classes/schedule', 'GET')
        .then(response => {
            if (response.success) {
                displayClasses(response.data);
            } else {
                console.error('Error loading classes:', response.message);
                ELC.showNotification(response.message || 'Failed to load classes', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching classes:', error);
            ELC.showNotification('Error loading classes. Please try again.', 'error');
        });
}

function displayClasses(classes) {
    const classList = document.querySelector('.class-list');
    if (!classList) return;
    
    classList.innerHTML = '';
    
    classes.forEach(course => {
        const classHtml = `
            <div class="class-item">
                <div class="class-name">${course.name}</div>
                <div class="class-details">
                    <div class="class-time">${course.schedule.startTime} - ${course.schedule.endTime}</div>
                    <div class="class-room">${course.schedule.room || 'N/A'}</div>
                    <div class="class-teacher">${course.teacher?.fullName || 'N/A'}</div>
                    <div class="class-students">${course.students?.length || 0}/${course.maxStudents || 20} Students</div>
                </div>
            </div>
        `;
        
        classList.insertAdjacentHTML('beforeend', classHtml);
    });
}

function loadPaymentsData() {
    ELC.apiRequest('/api/receptionist/payments', 'GET')
        .then(response => {
            if (response.success) {
                displayPayments(response.data);
            } else {
                console.error('Error loading payments:', response.message);
                ELC.showNotification(response.message || 'Failed to load payments', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching payments:', error);
            ELC.showNotification('Error loading payments. Please try again.', 'error');
        });
}

function displayPayments(payments) {
    const paymentsList = document.querySelector('.payments-list');
    if (!paymentsList) return;
    
    paymentsList.innerHTML = '';
    
    payments.forEach(payment => {
        const paymentHtml = `
            <div class="payment-item">
                <div class="payment-student">${payment.student.fullName}</div>
                <div class="payment-details">
                    <div class="payment-course">${payment.course.name}</div>
                    <div class="payment-amount">${payment.amount}</div>
                    <div class="payment-status">${payment.status}</div>
                    <div class="payment-date">${ELC.formatDate(payment.date)}</div>
                </div>
            </div>
        `;
        
        paymentsList.insertAdjacentHTML('beforeend', paymentHtml);
    });
}