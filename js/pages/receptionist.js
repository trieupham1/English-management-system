document.addEventListener('DOMContentLoaded', function() {
    // Check if ELC is defined
    if (typeof ELC === 'undefined') {
        console.error('ELC is not defined. Make sure common.js is loaded properly.');
        return;
    }
    
    // Use ELC authentication methods
    if (!ELC.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Use ELC role checking
    if (!ELC.hasRole('receptionist')) {
        window.location.href = 'login.html?error=unauthorized';
        return;
    }
    
    initReceptionistDashboard();
});
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

function initReceptionistDashboard() {
    // Use ELC utility methods
    ELC.initUserProfile();
    ELC.initLogout();
    initTabNavigation();
    initRegistrationForm();
    initAssignmentForm();
    initStudentSearch();
    loadDashboardStats();
}
function showStudentRegistrationModal(studentData) {
    // Remove any existing modals first
    const existingModal = document.querySelector('.registration-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal';
    modalContainer.style.display = 'block';

    modalContainer.innerHTML = `
        <div class="modal-header">
            <h3>Student Registration Successful</h3>
            <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
            <form>
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" value="${studentData.fullName}" readonly>
                </div>
                <div class="form-group">
                    <label>Student ID</label>
                    <input type="text" value="${studentData.studentId}" readonly>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="text" value="${studentData.email}" readonly>
                </div>
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" value="${studentData.username}" readonly>
                </div>
                <div class="form-group">
                    <label>Temporary Password</label>
                    <input type="text" value="${studentData.tempPassword}" readonly>
                </div>
                <div class="note">
                    <i class="fas fa-exclamation-triangle"></i>
                    Please advise the student to change their password upon first login.
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="secondary modal-close">Close</button>
            <button class="primary" id="copy-credentials">Copy Credentials</button>
        </div>
    `;

    // Add to body
    document.body.appendChild(modalContainer);

    // Close modal functionality
    const closeButtons = modalContainer.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modalContainer.style.display = 'none';
            document.body.removeChild(modalContainer);
        });
    });

    // Copy credentials functionality
    const copyButton = modalContainer.querySelector('#copy-credentials');
    copyButton.addEventListener('click', () => {
        const credentials = `Username: ${studentData.username}\nTemporary Password: ${studentData.tempPassword}`;
        
        navigator.clipboard.writeText(credentials).then(() => {
            ELC.showNotification('Credentials copied to clipboard', 'success');
        }).catch(err => {
            console.error('Failed to copy credentials:', err);
            ELC.showNotification('Failed to copy credentials', 'error');
        });
    });

    // Close modal when clicking outside (optional)
    modalContainer.addEventListener('click', (event) => {
        if (event.target === modalContainer) {
            modalContainer.style.display = 'none';
            document.body.removeChild(modalContainer);
        }
    });

    // Add keyboard support (Escape key to close)
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            modalContainer.style.display = 'none';
            document.body.removeChild(modalContainer);
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}
function initRegistrationForm() {
    const registrationForm = document.getElementById('registrationForm');
    
    if (!registrationForm) {
        console.error('Registration form not found');
        return;
    }

    registrationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        const formData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            dateOfBirth: document.getElementById('dob').value,
            currentLevel: document.getElementById('level').value,
            source: document.getElementById('source').value,
            notes: document.getElementById('notes').value
        };

        const token = localStorage.getItem('token');

        fetch('/api/receptionist/students/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            submitButton.disabled = false;
            
            if (data.success) {
                // Ensure modal is shown immediately after successful registration
                showStudentRegistrationModal({
                    fullName: data.data.student.fullName,
                    studentId: data.data.studentId,
                    email: data.data.student.email,
                    username: data.data.student.username,
                    tempPassword: data.data.tempPassword
                });

                // Notification is optional now, as modal provides details
                ELC.showNotification(
                    `Student registered successfully! 
                    Student ID: ${data.data.studentId}`, 
                    'success'
                );

                registrationForm.reset();
            } else {
                // Show error notification if registration fails
                ELC.showNotification(
                    data.message || 'Failed to register student', 
                    'error'
                );
            }
        })
        .catch(error => {
            submitButton.disabled = false;
            console.error('Fetch Error:', error);
            ELC.showNotification(
                'Network error: ' + error.message, 
                'error'
            );
        });
    });
}
// Ensure the function is called when the DOM is loaded
document.addEventListener('DOMContentLoaded', initRegistrationForm);
// Optionally add form validation
function validateRegistrationForm(formData) {
    const errors = [];

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        errors.push('Invalid email address');
    }

    // Phone validation (adjust regex as needed)
    const phoneRegex = /^[+]?[\d\s()-]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
        errors.push('Invalid phone number');
    }

    // Date of birth validation (optional)
    const dob = new Date(formData.dateOfBirth);
    const age = calculateAge(dob);
    if (age < 5) {
        errors.push('Student must be at least 5 years old');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}


function initAssignmentForm() {
    ELC.handleFormSubmit('assignmentForm', '/api/receptionist/students/assign-class', {
        method: 'POST',
        onSuccess: (response) => {
            ELC.showNotification('Student assigned to class successfully!', 'success');
            document.getElementById('assignmentForm').reset();
        },
        onError: (error) => {
            ELC.showNotification('Error assigning student to class: ' + error.message, 'error');
        },
        transformData: (formData) => ({
            studentId: formData.studentSelect,
            courseId: formData.courseSelect,
            classId: formData.classSelect,
            startDate: formData.startDate,
            paymentStatus: formData.paymentStatus
        })
    });
}

// The rest of the script remains largely the same
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
    const token = localStorage.getItem('token');
    
    fetch('/api/receptionist/dashboard', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(response => {
        if (response.success) {
            updateDashboardStats(response.data);
        } else {
            ELC.showNotification(response.message || 'Failed to load dashboard', 'error');
        }
    })
    .catch(error => {
        ELC.showNotification('Error loading dashboard. Please try again.', 'error');
    });
}
function updateDashboardStats(data) {
    if (!data) return;
    
    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card .stat-value');
    if (statCards.length === 4) {
        if (data.totalStudents !== undefined) statCards[0].textContent = data.totalStudents;
        if (data.activeClasses !== undefined) statCards[1].textContent = data.activeClasses;
        if (data.newRegistrationsToday !== undefined) statCards[2].textContent = data.newRegistrationsToday;
        if (data.todayClasses !== undefined) statCards[3].textContent = data.todayClasses;
    }
    
    // Update recent registrations section
    if (data.recentStudents && data.recentStudents.length > 0) {
        updateRecentRegistrations(data.recentStudents);
    }
    
    // Update upcoming classes section
    if (data.upcomingClasses && data.upcomingClasses.length > 0) {
        updateUpcomingClasses(data.upcomingClasses);
    }
}

function updateRecentRegistrations(registrations) {
    const container = document.querySelector('.recent-registrations-list');
    if (!container) return;
    
    container.innerHTML = ''; // Clear existing content
    
    registrations.forEach(student => {
        const registrationItem = `
            <div class="registration-item">
                <div class="student-name">${student.fullName}</div>
                <div class="student-email">${student.email}</div>
                <div class="student-id">ID: ${student.studentInfo.studentId}</div>
                <div class="registration-time">${new Date(student.createdAt).toLocaleString()}</div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', registrationItem);
    });
}

function updateUpcomingClasses(classes) {
    const container = document.querySelector('.upcoming-classes-list');
    if (!container) return;
    
    container.innerHTML = ''; // Clear existing content
    
    classes.forEach(classItem => {
        const classDetails = `
            <div class="class-item">
                <div class="class-name">${classItem.name}</div>
                <div class="class-details">
                    <div class="class-time">
                        ${classItem.schedule.startTime} - ${classItem.schedule.endTime}
                    </div>
                    <div class="class-course">${classItem.course?.name || 'N/A'}</div>
                    <div class="class-teacher">${classItem.teacher?.fullName || 'N/A'}</div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', classDetails);
    });
}
function editStudent(studentId) {
    console.log(`Edit student with ID: ${studentId}`);
    alert('Edit student functionality will be implemented here');
}

function approveStudent(studentId) {
    if (confirm('Are you sure you want to approve this student?')) {
        ELC.apiRequest(`/api/receptionist/students/${studentId}/approve`, 'PUT')
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
        ELC.apiRequest(`/api/receptionist/students/${studentId}/activate`, 'PUT')
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
    ELC.apiRequest('/api/receptionist/students', 'GET')
        .then(response => {
            if (response.success) {
                displayStudents(response.data);
            } else {
                console.error('Error loading students:', response.message);
            }
        })
        .catch(error => {
            console.error('Error fetching students:', error);
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
            `<button class="action-btn" title="Edit"><i class="fas fa-edit"></i></button>
             <button class="action-btn" title="Approve"><i class="fas fa-check"></i></button>` :
            student.studentInfo.status === 'inactive' ?
            `<button class="action-btn" title="Edit"><i class="fas fa-edit"></i></button>
             <button class="action-btn" title="Activate"><i class="fas fa-redo"></i></button>` :
            `<button class="action-btn" title="Edit"><i class="fas fa-edit"></i></button>
             <button class="action-btn" title="Assign to Class"><i class="fas fa-user-plus"></i></button>`;
        
        const studentHtml = `
            <div class="student-item" data-id="${student._id}">
                <div class="student-info">
                    <div class="student-name">${student.fullName}</div>
                    <div class="student-details">
                        <div class="student-id"><i class="fas fa-id-card"></i> ${student.studentInfo.studentId}</div>
                        <div class="student-email"><i class="fas fa-envelope"></i> ${student.email}</div>
                        <div class="student-phone"><i class="fas fa-phone"></i> ${student.phone}</div>
                    </div>
                </div>
                <div class="student-status">
                    <span class="badge ${statusClass}">${ELC.capitalizeFirstLetter(student.studentInfo.status)}</span>
                </div>
                <div class="action-buttons">
                    ${actionButtons}
                </div>
            </div>
        `;
        
        studentList.insertAdjacentHTML('beforeend', studentHtml);
    });
}

function loadClassesData() {
    ELC.apiRequest('/api/receptionist/classes/schedule', 'GET')
        .then(response => {
            if (response.success) {
                displayClasses(response.data);
            } else {
                console.error('Error loading classes:', response.message);
            }
        })
        .catch(error => {
            console.error('Error fetching classes:', error);
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
                    <div class="class-time"><i class="fas fa-clock"></i> ${course.schedule.startTime} - ${course.schedule.endTime}</div>
                    <div class="class-room"><i class="fas fa-door-open"></i> ${course.schedule.room || 'N/A'}</div>
                    <div class="class-teacher"><i class="fas fa-user"></i> ${course.teacher?.fullName || 'N/A'}</div>
                    <div class="class-students"><i class="fas fa-users"></i> ${course.students?.length || 0}/${course.maxStudents || 20} Students</div>
                </div>
            </div>
        `;
        
        classList.insertAdjacentHTML('beforeend', classHtml);
    });
}

function loadPaymentsData() {
    console.log('Loading payments data...');
    ELC.showNotification('Loading payment data...', 'info');
}