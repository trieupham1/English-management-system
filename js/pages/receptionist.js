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

// Most of the existing functions remain the same
// Just update API requests to use ELC.apiRequest instead of fetch directly

function loadDashboardStats() {
    // Simplified using ELC.apiRequest
    ELC.apiRequest('/api/receptionist/dashboard')
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
function showStudentRegistrationModal(studentData) {
    // Remove any existing modals first
    const existingModal = document.querySelector('.registration-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'registration-modal-overlay';
    
    // Ensure it's added directly to the body and positioned correctly
    document.body.appendChild(modalContainer);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';

    modalContainer.innerHTML = `
        <div class="registration-modal">
            <div class="modal-header">
                <h2>Student Registration Successful</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-content">
                <div class="registration-details">
                    <h3>Student Account Created</h3>
                    <div class="detail-item">
                        <strong>Name:</strong> 
                        <span>${studentData.fullName}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Student ID:</strong> 
                        <span>${studentData.studentId}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Login Username:</strong> 
                        <span>${studentData.username}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Temporary Password:</strong> 
                        <span class="temp-password">${studentData.tempPassword}</span>
                    </div>
                    <div class="modal-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Please advise the student to change their password upon first login.</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary copy-credentials">Copy Credentials</button>
                <button class="btn btn-secondary modal-close">Close</button>
            </div>
        </div>
    `;

    // Add to body
    document.body.appendChild(modalContainer);

    // Close modal functionality
    const closeModal = () => {
        document.body.removeChild(modalContainer);
        document.body.style.overflow = 'auto'; // Restore scrolling
    };
    // Add event listeners to close buttons
    const closeButtons = modalContainer.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Copy credentials functionality
    const copyButton = modalContainer.querySelector('.copy-credentials');
    copyButton.addEventListener('click', () => {
        const username = modalContainer.querySelector('.detail-item:nth-child(3) span').textContent;
        const password = modalContainer.querySelector('.temp-password').textContent;
        
        const credentials = `Username: ${username}\nTemporary Password: ${password}`;
        
        navigator.clipboard.writeText(credentials).then(() => {
            ELC.showNotification('Credentials copied to clipboard', 'success');
        }).catch(err => {
            console.error('Failed to copy credentials:', err);
            ELC.showNotification('Failed to copy credentials', 'error');
        });
    });

    // Close modal when clicking outside
    modalContainer.addEventListener('click', (event) => {
        if (event.target === modalContainer) {
            closeModal();
        }
    });

    // Add keyboard support (Escape key to close)
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
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
                // Show registration modal
                showStudentRegistrationModal({
                    fullName: data.data.student.fullName,
                    studentId: data.data.studentId,
                    username: data.data.student.username,
                    tempPassword: data.data.tempPassword
                });

                ELC.showNotification(
                    `Student registered successfully! 
                    Student ID: ${data.data.studentId}`, 
                    'success'
                );

                registrationForm.reset();
            } else {
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
    async function getDashboardData() {
        try {
            // Get token from localStorage
            const token = localStorage.getItem('token');
            
            // Ensure token is included in request
            const response = await fetch('/api/receptionist/dashboard', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                console.error('Error details:', data);
                throw new Error(data.message || 'Failed to fetch dashboard');
            }
            
            return data;
        } catch (error) {
            console.error('Dashboard fetch error:', error);
            throw error;
        }
    }

    getDashboardData()
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