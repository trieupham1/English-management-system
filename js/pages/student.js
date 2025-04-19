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
    
    if (typeof initStudentChatbot === 'function') {
        initStudentChatbot();
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
            } else if (targetSection === 'schedule') {
                loadScheduleData();
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
    ELC.apiRequest('/api/student/dashboard', 'GET')
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
    
    if (data.upcomingClasses && data.upcomingClasses.length > 0) {
        const classesContainer = document.querySelector('.card:nth-child(1) .class-item').parentNode;
        if (classesContainer) {
            classesContainer.innerHTML = '';
            
            data.upcomingClasses.forEach(cls => {
                const statusClass = cls.isToday ? 'status-upcoming' : 'status-upcoming';
                const statusText = cls.isToday ? 'Today' : cls.dayName;
                
                const classItem = document.createElement('div');
                classItem.className = 'class-item';
                classItem.innerHTML = `
                    <div class="class-info">
                        <div class="class-name">${cls.name}</div>
                        <div class="class-details">
                            <div class="class-time"><i class="fas fa-clock"></i> ${cls.startTime} - ${cls.endTime}</div>
                            <div class="class-teacher"><i class="fas fa-user"></i> ${cls.teacher}</div>
                            <div class="class-room"><i class="fas fa-door-open"></i> ${cls.room}</div>
                        </div>
                    </div>
                    <div class="class-status ${statusClass}">${statusText}</div>
                `;
                
                classesContainer.appendChild(classItem);
            });
        }
    }
    
    if (data.assignments && data.assignments.length > 0) {
        const assignmentsContainer = document.querySelector('.card:nth-child(2) .assignment-item').parentNode;
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
    
    if (data.courseProgress && data.courseProgress.length > 0) {
        const progressSection = document.querySelector('.progress-section');
        if (progressSection) {
            progressSection.innerHTML = '';
            
            data.courseProgress.forEach(course => {
                const progressItem = document.createElement('div');
                progressItem.className = 'progress-item';
                progressItem.innerHTML = `
                    <div class="progress-header">
                        <div>${course.name}</div>
                        <div>${course.progress}%</div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${course.progress}%;"></div>
                    </div>
                `;
                
                progressSection.appendChild(progressItem);
            });
        }
    }
    
    if (data.announcements && data.announcements.length > 0) {
        const announcementsContainer = document.querySelector('.card:last-child .announcement-item').parentNode;
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

function loadScheduleData() {
    console.log('Loading schedule data...');
    ELC.showNotification('Loading your schedule...', 'info');
}

function loadCoursesData() {
    console.log('Loading courses data...');
    ELC.showNotification('Loading your courses...', 'info');
}

function loadMaterialsData() {
    console.log('Loading materials data...');
    ELC.showNotification('Loading course materials...', 'info');
}

function loadAssignmentsData() {
    console.log('Loading assignments data...');
    ELC.showNotification('Loading your assignments...', 'info');
}

function toggleChatbot() {
    const chatbotContainer = document.getElementById('student-chatbot');
    const chatbotLauncher = document.getElementById('chatbot-launcher');
    
    if (chatbotContainer) {
        chatbotContainer.classList.toggle('active');
        
        if (chatbotContainer.classList.contains('active')) {
            const messageInput = document.getElementById('message-input');
            if (messageInput) {
                messageInput.focus();
            }
            
            if (chatbotLauncher) {
                chatbotLauncher.style.display = 'none';
            }
        } else {
            if (chatbotLauncher) {
                chatbotLauncher.style.display = 'flex';
            }
        }
    }
}

function initStudentChatbot() {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotLauncher = document.getElementById('chatbot-launcher');
    const chatbotContainer = document.getElementById('student-chatbot');
    const closeButton = document.getElementById('close-chatbot');
    const chatMessages = document.getElementById('chatbot-messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-message');
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');
    
    if (chatbotToggle) {
        chatbotToggle.addEventListener('click', function(e) {
            e.preventDefault();
            toggleChatbot();
        });
    }
    
    if (chatbotLauncher) {
        chatbotLauncher.addEventListener('click', function() {
            toggleChatbot();
        });
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            closeChatbot();
        });
    }
    
    if (sendButton && messageInput) {
        sendButton.addEventListener('click', function() {
            sendChatMessage();
        });
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    if (suggestionButtons) {
        suggestionButtons.forEach(button => {
            button.addEventListener('click', function() {
                const message = this.dataset.message;
                if (message) {
                    addChatMessage(message, 'user');
                    
                    setTimeout(() => {
                        processChatbotQuery(message);
                    }, 500);
                }
            });
        });
    }
    
    function closeChatbot() {
        if (chatbotContainer) {
            chatbotContainer.classList.remove('active');
            
            if (chatbotLauncher) {
                chatbotLauncher.style.display = 'flex';
            }
        }
    }
    
    function sendChatMessage() {
        if (!messageInput || !messageInput.value.trim()) return;
        
        const message = messageInput.value.trim();
        
        addChatMessage(message, 'user');
        
        messageInput.value = '';
        
        setTimeout(() => {
            processChatbotQuery(message);
        }, 500);
    }
    
    function addChatMessage(message, type = 'bot') {
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        chatMessages.appendChild(messageDiv);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function processChatbotQuery(query) {
        addChatMessage('...', 'bot typing');
        
        setTimeout(() => {
            const typingIndicator = chatMessages.querySelector('.message-bot.typing');
            if (typingIndicator) {
                chatMessages.removeChild(typingIndicator);
            }
            
            let response = "I'm sorry, I don't understand that question. Can you try phrasing it differently?";
            
            const lowerQuery = query.toLowerCase();
            
            if (lowerQuery.includes('schedule') || lowerQuery.includes('class') || lowerQuery.includes('timetable')) {
                response = "Your next class is Conversational English at 2:00 PM today in Room 204. You have IELTS Preparation tomorrow at 4:00 PM.";
            } else if (lowerQuery.includes('assignment') || lowerQuery.includes('homework') || lowerQuery.includes('due')) {
                response = "You have a Writing Essay due on April 18th. Your Grammar Quiz has been completed, and you have an overdue Vocabulary Test from April 10th.";
            } else if (lowerQuery.includes('course') || lowerQuery.includes('enrolled')) {
                response = "You are currently enrolled in two courses: Conversational English (75% complete) and IELTS Preparation (40% complete).";
            } else if (lowerQuery.includes('study') || lowerQuery.includes('improve') || lowerQuery.includes('progress') || lowerQuery.includes('tips')) {
                response = "To improve your progress, try: 1) Completing all assignments on time, 2) Participating actively in class discussions, 3) Using the practice materials in your student portal, and 4) Joining the conversation club on Fridays.";
            } else if (lowerQuery.includes('help') || lowerQuery.includes('assist')) {
                response = "I can help you with your schedule, assignments, course information, and study tips. Just ask me what you need!";
            } else if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey')) {
                response = "Hello! How can I help you today?";
            } else if (lowerQuery.includes('thank')) {
                response = "You're welcome! Is there anything else I can help you with?";
            }
            
            addChatMessage(response, 'bot');
        }, 1500);
    }
}

window.initStudentChatbot = initStudentChatbot;