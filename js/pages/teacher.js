document.addEventListener('DOMContentLoaded', function() {
    if (!ELC.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    if (!ELC.hasRole('teacher')) {
        window.location.href = 'login.html?error=unauthorized';
        return;
    }
    
    initTeacherDashboard();
});

function initTeacherDashboard() {
    ELC.initUserProfile();
    ELC.initLogout();
    initTabNavigation();
    loadTeacherDashboard();
    initUploadMaterialForm();
    initCreateAssignmentForm();
    enhanceFileUploads();
    initStudentAttendance();
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
                loadTeacherDashboard();
            } else if (targetSection === 'schedule') {
                loadScheduleData();
            } else if (targetSection === 'materials') {
                loadMaterialsData();
            } else if (targetSection === 'assignments') {
                loadAssignmentsData();
            } else if (targetSection === 'students') {
                loadStudentsData();
            } else if (targetSection === 'progress') {
                loadProgressData();
            }
        });
    });
}

function loadTeacherDashboard() {
    ELC.apiRequest('/api/teacher/dashboard', 'GET')
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
    
    const welcomeCard = document.querySelector('.welcome-card h2');
    if (welcomeCard && data.firstName) {
        welcomeCard.textContent = `Welcome back, ${data.firstName}!`;
    }
    
    const welcomeMessage = document.querySelector('.welcome-card p');
    if (welcomeMessage && data.stats) {
        welcomeMessage.textContent = `You have ${data.stats.assignmentsToGrade || 0} assignments to grade and ${data.stats.classesToday || 0} classes today. `;
        
        if (data.nextClass) {
            welcomeMessage.textContent += `Your next class "${data.nextClass.name}" starts in ${data.nextClass.startsIn}.`;
        }
    }
    
    if (data.todayClasses && data.todayClasses.length > 0) {
        const classesContainer = document.querySelector('.card:first-of-type .class-item').parentNode;
        if (classesContainer) {
            classesContainer.innerHTML = '';
            
            data.todayClasses.forEach(cls => {
                let statusClass = 'status-upcoming';
                let statusText = 'Upcoming';
                
                if (cls.status === 'completed') {
                    statusClass = 'status-completed';
                    statusText = 'Completed';
                }
                
                const classItem = document.createElement('div');
                classItem.className = 'class-item';
                classItem.innerHTML = `
                    <div class="class-info">
                        <div class="class-name">${cls.name}</div>
                        <div class="class-details">
                            <div class="class-time"><i class="fas fa-clock"></i> ${cls.startTime} - ${cls.endTime}</div>
                            <div class="class-room"><i class="fas fa-door-open"></i> ${cls.room}</div>
                            <div class="class-students"><i class="fas fa-users"></i> ${cls.studentCount} students</div>
                        </div>
                    </div>
                    <div class="class-status ${statusClass}">${statusText}</div>
                `;
                
                classesContainer.appendChild(classItem);
            });
        }
    }
    
    if (data.students && data.students.length > 0) {
        const studentList = document.querySelector('.student-list');
        const classSelector = document.querySelector('.card-header select');
        
        if (studentList && classSelector) {
            if (data.classes && data.classes.length > 0) {
                classSelector.innerHTML = '';
                data.classes.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls.id;
                    option.textContent = cls.name;
                    classSelector.appendChild(option);
                });
            }
            
            studentList.innerHTML = '';
            
            data.students.forEach(student => {
                const studentItem = document.createElement('div');
                studentItem.className = 'student-item';
                studentItem.dataset.id = student.id;
                studentItem.innerHTML = `
                    <div class="student-name">${student.name}</div>
                    <div class="student-attendance">Attendance: ${student.attendanceRate}%</div>
                    <div class="student-actions">
                        <button title="Present" data-action="present"><i class="fas fa-check text-green-500"></i></button>
                        <button title="Absent" data-action="absent"><i class="fas fa-times text-red-500"></i></button>
                        <button title="Late" data-action="late"><i class="fas fa-clock text-yellow-500"></i></button>
                    </div>
                `;
                
                studentList.appendChild(studentItem);
            });
        }
    }
    
    if (data.assignmentsToGrade && data.assignmentsToGrade.length > 0) {
        const assignmentsContainer = document.querySelector('.assignment-item').parentNode;
        if (assignmentsContainer) {
            assignmentsContainer.innerHTML = '';
            
            data.assignmentsToGrade.forEach(assignment => {
                const assignmentItem = document.createElement('div');
                assignmentItem.className = 'assignment-item';
                assignmentItem.dataset.id = assignment.id;
                assignmentItem.innerHTML = `
                    <div class="assignment-info">
                        <div class="assignment-title">${assignment.title}</div>
                        <div class="assignment-details">
                            <div class="assignment-due"><i class="fas fa-calendar"></i> Due: ${ELC.formatDate(assignment.dueDate)}</div>
                            <div class="assignment-class"><i class="fas fa-book"></i> ${assignment.className}</div>
                            <div class="assignment-submissions"><i class="fas fa-file-alt"></i> ${assignment.submissionCount}/${assignment.totalStudents} submitted</div>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="gradeAssignment('${assignment.id}')">Grade</button>
                `;
                
                assignmentsContainer.appendChild(assignmentItem);
            });
        }
    }
    
    populateClassDropdowns(data.classes);
}

function populateClassDropdowns(classes) {
    if (!classes || classes.length === 0) return;
    
    const materialClassSelect = document.getElementById('materialClass');
    const assignmentClassSelect = document.getElementById('assignmentClass');
    
    if (materialClassSelect) {
        const firstOption = materialClassSelect.options[0];
        materialClassSelect.innerHTML = '';
        materialClassSelect.appendChild(firstOption);
        
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = cls.name;
            materialClassSelect.appendChild(option);
        });
    }
    
    if (assignmentClassSelect) {
        const firstOption = assignmentClassSelect.options[0];
        assignmentClassSelect.innerHTML = '';
        assignmentClassSelect.appendChild(firstOption);
        
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = cls.name;
            assignmentClassSelect.appendChild(option);
        });
    }
}

function initStudentAttendance() {
    document.addEventListener('click', function(e) {
        const button = e.target.closest('button[data-action]');
        if (!button) return;
        
        const studentItem = button.closest('.student-item');
        if (!studentItem) return;
        
        const studentId = studentItem.dataset.id;
        const action = button.dataset.action;
        
        if (studentId && action) {
            markStudentAttendance(studentId, action);
        }
    });
    
    const classSelector = document.querySelector('.card-header select');
    if (classSelector) {
        classSelector.addEventListener('change', function() {
            const classId = this.value;
            if (classId) {
                loadStudentsForClass(classId);
            }
        });
    }
    
    const tabs = document.querySelectorAll('.tabs .tab');
    if (tabs) {
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }
}

function markStudentAttendance(studentId, attendanceStatus) {
    const today = new Date().toISOString().split('T')[0];
    
    const data = {
        studentId,
        status: attendanceStatus,
        date: today
    };
    
    ELC.apiRequest('/api/attendance', 'POST', data)
        .then(response => {
            if (response.success) {
                const studentItem = document.querySelector(`.student-item[data-id="${studentId}"]`);
                if (studentItem) {
                    const buttons = studentItem.querySelectorAll('.student-actions button');
                    buttons.forEach(btn => btn.classList.remove('active'));
                    
                    const selectedButton = studentItem.querySelector(`button[data-action="${attendanceStatus}"]`);
                    if (selectedButton) {
                        selectedButton.classList.add('active');
                    }
                }
                
                ELC.showNotification(`Attendance marked as "${attendanceStatus}" for student`, 'success');
            } else {
                ELC.showNotification('Error recording attendance: ' + response.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error marking attendance:', error);
            ELC.showNotification('Error recording attendance', 'error');
        });
}

function loadStudentsForClass(classId) {
    ELC.apiRequest(`/api/classes/${classId}/students`, 'GET')
        .then(response => {
            if (response.success) {
                updateStudentList(response.data);
            } else {
                ELC.showNotification('Error loading students: ' + response.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error loading students:', error);
            ELC.showNotification('Error loading students for class', 'error');
        });
}

function updateStudentList(students) {
    if (!students || students.length === 0) return;
    
    const studentList = document.querySelector('.student-list');
    if (!studentList) return;
    
    studentList.innerHTML = '';
    
    students.forEach(student => {
        const studentItem = document.createElement('div');
        studentItem.className = 'student-item';
        studentItem.dataset.id = student.id;
        studentItem.innerHTML = `
            <div class="student-name">${student.name}</div>
            <div class="student-attendance">Attendance: ${student.attendanceRate}%</div>
            <div class="student-actions">
                <button title="Present" data-action="present"><i class="fas fa-check text-green-500"></i></button>
                <button title="Absent" data-action="absent"><i class="fas fa-times text-red-500"></i></button>
                <button title="Late" data-action="late"><i class="fas fa-clock text-yellow-500"></i></button>
            </div>
        `;
        
        studentList.appendChild(studentItem);
    });
}

function initUploadMaterialForm() {
    ELC.handleFormSubmit(
        'uploadMaterialForm',
        '/api/materials',
        'POST',
        (response) => {
            ELC.showNotification('Course material uploaded successfully!', 'success');
            document.getElementById('uploadMaterialForm').reset();
            
            const fileUpload = document.querySelector('#uploadMaterialForm .file-upload p');
            if (fileUpload) {
                fileUpload.textContent = 'Drag & drop files here or click to browse';
            }
        },
        (error) => {
            ELC.showNotification('Error uploading material: ' + error.message, 'error');
        }
    );
}

function initCreateAssignmentForm() {
    ELC.handleFormSubmit(
        'createAssignmentForm',
        '/api/assignments',
        'POST',
        (response) => {
            ELC.showNotification('Assignment created successfully!', 'success');
            document.getElementById('createAssignmentForm').reset();
            
            const fileUpload = document.querySelector('#createAssignmentForm .file-upload p');
            if (fileUpload) {
                fileUpload.textContent = 'Drag & drop files here or click to browse';
            }
        },
        (error) => {
            ELC.showNotification('Error creating assignment: ' + error.message, 'error');
        }
    );
}

function enhanceFileUploads() {
    document.querySelectorAll('.file-upload').forEach(upload => {
        const fileInput = upload.querySelector('input[type="file"]');
        
        if (!fileInput) return;
        
        upload.addEventListener('click', () => {
            fileInput.click();
        });
        
        upload.addEventListener('dragover', e => {
            e.preventDefault();
            upload.classList.add('dragover');
        });
        
        upload.addEventListener('dragleave', () => {
            upload.classList.remove('dragover');
        });
        
        upload.addEventListener('drop', e => {
            e.preventDefault();
            upload.classList.remove('dragover');
            
            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                const fileName = e.dataTransfer.files[0].name;
                upload.querySelector('p').textContent = fileName;
            }
        });
        
        fileInput.addEventListener('change', e => {
            if (e.target.files.length > 0) {
                const fileName = e.target.files[0].name;
                upload.querySelector('p').textContent = fileName;
            }
        });
    });
}

function loadScheduleData() {
    console.log('Loading schedule data...');
    ELC.showNotification('Loading class schedule...', 'info');
}

function loadMaterialsData() {
    console.log('Loading materials data...');
    ELC.showNotification('Loading course materials...', 'info');
}

function loadAssignmentsData() {
    console.log('Loading assignments data...');
    ELC.showNotification('Loading assignments...', 'info');
}

function loadStudentsData() {
    console.log('Loading students data...');
    ELC.showNotification('Loading student list...', 'info');
}

function loadProgressData() {
    console.log('Loading progress reports...');
    ELC.showNotification('Loading progress reports...', 'info');
}

function gradeAssignment(assignmentId) {
    ELC.showNotification(`Loading grading interface for assignment ID: ${assignmentId}`, 'info');
    
    ELC.apiRequest(`/api/assignments/${assignmentId}/submissions`, 'GET')
        .then(response => {
            if (response.success) {
                alert(`In a complete implementation, this would open the grading interface for ${response.data.title} with ${response.data.submissions.length} submissions.`);
            } else {
                ELC.showNotification('Error loading assignment submissions: ' + response.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error loading assignment submissions:', error);
            ELC.showNotification('Error loading assignment submissions', 'error');
        });
}

window.gradeAssignment = gradeAssignment;