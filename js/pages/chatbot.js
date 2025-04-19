/**
 * Student Learning Assistant Chatbot
 * This script manages the student-specific chatbot functionality
 */

// Global function to initialize the chatbot
function initStudentChatbot() {
    StudentChatbot.init();
}

// Student Chatbot Module
const StudentChatbot = (function() {
    // DOM Elements
    const chatbotContainer = document.getElementById('student-chatbot');
    const chatbotLauncher = document.getElementById('chatbot-launcher');
    const closeChatbot = document.getElementById('close-chatbot');
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-message');
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');
    
    // Student data cache
    let studentData = {
        courses: [],
        assignments: [],
        schedule: [],
        progress: {}
    };
    
    // Initialize the chatbot
    function init() {
        // Set up event listeners
        setupEventListeners();
        
        // Load student data
        loadStudentData();
        
        // Load chat history
        loadChatHistory();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Toggle chatbot visibility
        if (chatbotLauncher) {
            chatbotLauncher.addEventListener('click', toggleChatbot);
        }
        
        if (chatbotToggle) {
            chatbotToggle.addEventListener('click', toggleChatbot);
        }
        
        // Close chatbot
        if (closeChatbot) {
            closeChatbot.addEventListener('click', toggleChatbot);
        }
        
        // Send message button
        if (sendButton) {
            sendButton.addEventListener('click', sendMessage);
        }
        
        // Send message on Enter key
        if (messageInput) {
            messageInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }
        
        // Suggestion buttons
        suggestionButtons.forEach(button => {
            button.addEventListener('click', function() {
                const message = this.getAttribute('data-message');
                if (messageInput) {
                    messageInput.value = message;
                }
                sendMessage();
            });
        });
    }
    
    // Toggle chatbot visibility
    function toggleChatbot() {
        if (chatbotContainer) {
            chatbotContainer.classList.toggle('open');
            
            // Focus input when opened
            if (chatbotContainer.classList.contains('open') && messageInput) {
                messageInput.focus();
            }
        }
    }
    
    // Load student data from API
    async function loadStudentData() {
        try {
            // Check if ELC API utility is available
            if (typeof ELC === 'undefined' || !ELC.apiRequest) {
                console.error('ELC API utility not available');
                return;
            }
            
            const user = ELC.getCurrentUser();
            if (!user || user.role !== 'student') {
                console.error('No student user found');
                return;
            }
            
            // Load courses
            const coursesResponse = await ELC.apiRequest('/student/courses');
            if (coursesResponse.success) {
                studentData.courses = coursesResponse.data;
            }
            
            // Load assignments
            const assignmentsResponse = await ELC.apiRequest('/student/assignments');
            if (assignmentsResponse.success) {
                studentData.assignments = assignmentsResponse.data;
            }
            
            // Load schedule
            const scheduleResponse = await ELC.apiRequest('/student/schedule');
            if (scheduleResponse.success) {
                studentData.schedule = scheduleResponse.data;
            }
            
            // Load progress
            const progressResponse = await ELC.apiRequest('/student/progress');
            if (progressResponse.success) {
                studentData.progress = progressResponse.data;
            }
            
            console.log('Student data loaded successfully', studentData);
        } catch (error) {
            console.error('Error loading student data:', error);
            
            // For demo/development, use sample data
            useSampleData();
        }
    }
    
    // Use sample data for development/demo purposes
    function useSampleData() {
        studentData = {
            courses: [
                { id: 1, name: 'Conversational English', level: 'Intermediate', teacher: 'Sarah Williams' },
                { id: 2, name: 'IELTS Preparation', level: 'Advanced', teacher: 'John Davis' }
            ],
            assignments: [
                { id: 1, title: 'Writing Essay', dueDate: 'Apr 18, 2025', status: 'pending', course: 'Conversational English' },
                { id: 2, title: 'Grammar Quiz', dueDate: 'Apr 20, 2025', status: 'completed', course: 'Conversational English' },
                { id: 3, title: 'Vocabulary Test', dueDate: 'Apr 10, 2025', status: 'overdue', course: 'IELTS Preparation' }
            ],
            schedule: [
                { course: 'Conversational English', day: 'Monday', startTime: '14:00', endTime: '15:30', room: '204' },
                { course: 'IELTS Preparation', day: 'Tuesday', startTime: '16:00', endTime: '17:30', room: '103' },
                { course: 'Conversational English', day: 'Thursday', startTime: '14:00', endTime: '15:30', room: '204' },
                { course: 'IELTS Preparation', day: 'Friday', startTime: '16:00', endTime: '17:30', room: '103' }
            ],
            progress: {
                'Conversational English': 75,
                'IELTS Preparation': 40
            }
        };
        
        console.log('Using sample student data');
    }
    
    // Scroll to bottom of messages container
    function scrollToBottom() {
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    // Load chat history
    async function loadChatHistory() {
        try {
            // Check if ELC API utility is available
            if (typeof ELC === 'undefined' || !ELC.apiRequest) {
                console.error('ELC API utility not available');
                return;
            }
            
            const user = ELC.getCurrentUser();
            if (!user) {
                console.error('No user found');
                return;
            }
            
            const response = await ELC.apiRequest(`/chatbot/history/${user._id}`);
            
            if (response.success && messagesContainer) {
                // Clear existing messages except the welcome message
                while (messagesContainer.childNodes.length > 1) {
                    messagesContainer.removeChild(messagesContainer.lastChild);
                }
                
                // Add messages from history
                if (response.data.length > 0) {
                    response.data.forEach(msg => {
                        addMessageToUI(msg.message, msg.isUserMessage);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }
    
    // Send message
    function sendMessage() {
        if (!messageInput) return;
        
        const message = messageInput.value.trim();
        if (!message) return;
        
        // Add user message to UI
        addMessageToUI(message, true);
        
        // Clear input
        messageInput.value = '';
        
        // Process message
        processMessage(message);
    }
    
    // Add message to UI
    function addMessageToUI(message, isUser = false) {
        if (!messagesContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isUser ? 'message-user' : 'message-bot'}`;
        messageElement.textContent = message;
        messagesContainer.appendChild(messageElement);
        
        // Save message to API if available
        saveMessageToAPI(message, isUser);
        
        // Scroll to bottom
        scrollToBottom();
    }
    
    // Save message to API
    async function saveMessageToAPI(message, isUserMessage) {
        try {
            // Check if ELC API utility is available
            if (typeof ELC === 'undefined' || !ELC.apiRequest) {
                console.error('ELC API utility not available');
                return;
            }
            
            const user = ELC.getCurrentUser();
            if (!user) {
                console.error('No user found');
                return;
            }
            
            await ELC.apiRequest(`/chatbot/message/${user._id}`, 'POST', {
                message,
                isUserMessage
            });
        } catch (error) {
            console.error('Error saving message:', error);
        }
    }
    
    // Process message and generate response
    async function processMessage(message) {
        try {
            // Show typing indicator
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'message message-bot typing-indicator';
            typingIndicator.innerHTML = '<span></span><span></span><span></span>';
            messagesContainer.appendChild(typingIndicator);
            scrollToBottom();
            
            // Try to use API if available
            let response = '';
            
            if (typeof ELC !== 'undefined' && ELC.apiRequest) {
                const user = ELC.getCurrentUser();
                if (user) {
                    try {
                        const apiResponse = await ELC.apiRequest(`/chatbot/process/${user._id}`, 'POST', { message });
                        if (apiResponse.success) {
                            response = apiResponse.data.message;
                        }
                    } catch (error) {
                        console.error('API Error processing message:', error);
                        // Fallback to local processing
                        response = processMessageLocally(message);
                    }
                }
            } else {
                // Local processing if API not available
                response = processMessageLocally(message);
            }
            
            // Remove typing indicator
            if (messagesContainer.contains(typingIndicator)) {
                messagesContainer.removeChild(typingIndicator);
            }
            
            // If still no response, use fallback
            if (!response) {
                response = "I'm sorry, I couldn't process your request. Please try again or contact support for assistance.";
            }
            
            // Add bot response to UI
            addMessageToUI(response);
            
        } catch (error) {
            console.error('Error processing message:', error);
            
            // Remove typing indicator
            const typingIndicator = document.querySelector('.typing-indicator');
            if (typingIndicator && messagesContainer.contains(typingIndicator)) {
                messagesContainer.removeChild(typingIndicator);
            }
            
            // Add error message
            addMessageToUI("I'm having trouble responding right now. Please try again later.");
        }
    }
    
    // Process message locally (fallback when API is unavailable)
    function processMessageLocally(message) {
        const lowerMessage = message.toLowerCase();
        let response = '';
        
        // Check for schedule related queries
        if (lowerMessage.includes('schedule') || lowerMessage.includes('class') || 
            lowerMessage.includes('time') || lowerMessage.includes('when')) {
            
            if (studentData.schedule && studentData.schedule.length > 0) {
                response = "Here's your class schedule:\n\n";
                
                // Group by days
                const scheduleByDay = {};
                studentData.schedule.forEach(sch => {
                    if (!scheduleByDay[sch.day]) {
                        scheduleByDay[sch.day] = [];
                    }
                    scheduleByDay[sch.day].push(sch);
                });
                
                // Format schedule by day
                for (const day in scheduleByDay) {
                    response += `${day}:\n`;
                    scheduleByDay[day].forEach(sch => {
                        response += `- ${sch.course}: ${sch.startTime} - ${sch.endTime}, Room ${sch.room}\n`;
                    });
                    response += '\n';
                }
            } else {
                response = "I don't have your schedule information. Please visit the Schedule section or contact your teacher.";
            }
        } 
        // Check for assignment related queries
        else if (lowerMessage.includes('assignment') || lowerMessage.includes('homework') || 
                lowerMessage.includes('due') || lowerMessage.includes('deadline')) {
            
            if (studentData.assignments && studentData.assignments.length > 0) {
                // Find pending or upcoming assignments
                const pendingAssignments = studentData.assignments.filter(
                    a => a.status === 'pending' || a.status === 'overdue'
                );
                
                if (pendingAssignments.length > 0) {
                    response = "Here are your pending assignments:\n\n";
                    pendingAssignments.forEach(assignment => {
                        const status = assignment.status === 'overdue' ? '(OVERDUE)' : '';
                        response += `- ${assignment.title} ${status} for ${assignment.course}: Due on ${assignment.dueDate}\n`;
                    });
                } else {
                    response = "Good news! You don't have any pending assignments right now.";
                }
            } else {
                response = "I don't have information about your assignments. Please check the Assignments section.";
            }
        } 
        // Check for course related queries
        else if (lowerMessage.includes('course') || lowerMessage.includes('enroll') || 
                lowerMessage.includes('class') || lowerMessage.includes('subject')) {
            
            if (studentData.courses && studentData.courses.length > 0) {
                response = "You are currently enrolled in these courses:\n\n";
                studentData.courses.forEach(course => {
                    response += `- ${course.name} (${course.level}) with ${course.teacher}\n`;
                });
            } else {
                response = "I don't have information about your enrolled courses. Please check the Courses section.";
            }
        } 
        // Check for progress related queries
        else if (lowerMessage.includes('progress') || lowerMessage.includes('grade') || 
                lowerMessage.includes('score') || lowerMessage.includes('performance')) {
            
            if (studentData.progress && Object.keys(studentData.progress).length > 0) {
                response = "Here's your current progress in your courses:\n\n";
                
                for (const course in studentData.progress) {
                    const progressPercent = studentData.progress[course];
                    response += `- ${course}: ${progressPercent}% complete\n`;
                }
            } else {
                response = "I don't have information about your progress. Please check the Progress section in your dashboard.";
            }
        }
        // Check for tips/improvement advice
        else if (lowerMessage.includes('improve') || lowerMessage.includes('tip') || 
                lowerMessage.includes('advice') || lowerMessage.includes('help me')) {
            
            response = "Here are some tips to improve your English learning:\n\n" +
                "1. Practice consistently for at least 15-30 minutes every day\n" +
                "2. Use the online resources in your course materials section\n" +
                "3. Join conversation practice sessions with classmates\n" +
                "4. Complete all assignments on time\n" +
                "5. Watch English videos and listen to podcasts to improve comprehension\n\n" +
                "Would you like specific tips for any of your courses?";
        }
        // Check for teacher contact information
        else if (lowerMessage.includes('teacher') || lowerMessage.includes('contact') || 
                lowerMessage.includes('instructor') || lowerMessage.includes('professor')) {
            
            if (studentData.courses && studentData.courses.length > 0) {
                response = "Here's how to contact your teachers:\n\n";
                
                const uniqueTeachers = new Set();
                studentData.courses.forEach(course => {
                    uniqueTeachers.add(`${course.teacher} (${course.name}): via the Messages section or during office hours`);
                });
                
                uniqueTeachers.forEach(teacher => {
                    response += `- ${teacher}\n`;
                });
                
                response += "\nYou can also contact any teacher through the Messages section in your dashboard.";
            } else {
                response = "To contact your teachers, please use the Messages section in your dashboard.";
            }
        }
        // General greeting
        else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || 
                lowerMessage.includes('hey') || lowerMessage.includes('greetings')) {
            
            response = "Hello! I'm your Student Learning Assistant. I can help you with information about your classes, assignments, schedule, and learning tips. What would you like to know?";
        }
        // Help/options
        else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do') || 
                lowerMessage.includes('options') || lowerMessage.includes('functions')) {
            
            response = "I can help you with:\n\n" +
                "- Information about your courses and schedule\n" +
                "- Updates on your pending assignments\n" +
                "- Checking your progress in courses\n" +
                "- Providing learning tips and resources\n" +
                "- How to contact your teachers\n\n" +
                "What would you like to know about?";
        }
        // Fallback response
        else {
            response = "I'm not sure I understand your question. I can help with information about your courses, assignments, schedule, or provide learning tips. Could you please try asking in a different way?";
        }
        
        return response;
    }
    
    // Return public methods
    return {
        init: init,
        toggleChatbot: toggleChatbot,
        sendMessage: sendMessage
    };
})();