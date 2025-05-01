// Add this code to your teacher.js file to implement the Grade and Edit buttons

// When the page loads, attach our event handlers to the buttons
document.addEventListener('DOMContentLoaded', function() {
    // Set up event handlers for assignment actions
    setupAssignmentButtons();
});

// Set up event handlers for assignment actions
function setupAssignmentButtons() {
    // Grade buttons
    const gradeButtons = document.querySelectorAll('.grade-btn, button:contains("Grade")');
    gradeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const assignmentId = this.getAttribute('data-id');
            if (assignmentId) {
                gradeAssignment(assignmentId);
            }
        });
    });

    // Edit buttons
    const editButtons = document.querySelectorAll('.edit-btn, button:contains("Edit")');
    editButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const assignmentId = this.getAttribute('data-id');
            if (assignmentId) {
                editAssignment(assignmentId);
            }
        });
    });

    // Delete buttons
    const deleteButtons = document.querySelectorAll('.delete-btn, button:contains("Delete")');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const assignmentId = this.getAttribute('data-id');
            if (assignmentId && confirm('Are you sure you want to delete this assignment?')) {
                deleteAssignment(assignmentId);
            }
        });
    });
}

// Function to handle grading an assignment
function gradeAssignment(assignmentId) {
    // Show loading notification
    ELC.showNotification('Loading submissions...', 'info');
    
    // Fetch assignment submissions from API
    fetch(`/api/assignments/${assignmentId}/submissions`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayGradingModal(data.data);
            } else {
                ELC.showNotification('Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching submissions:', error);
            ELC.showNotification('Failed to load submissions. Please try again.', 'error');
        });
}

// Function to display grading modal
function displayGradingModal(assignmentData) {
    // Create modal HTML
    let modalHTML = `
        <div id="grading-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Grade: ${assignmentData.title}</h2>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="assignment-info">
                        <p><strong>Class:</strong> ${assignmentData.className}</p>
                        <p><strong>Due Date:</strong> ${new Date(assignmentData.dueDate).toLocaleDateString()}</p>
                        <p><strong>Total Points:</strong> ${assignmentData.totalPoints}</p>
                        <p><strong>Submissions:</strong> ${assignmentData.submissions.length}/${assignmentData.totalStudents}</p>
                    </div>
                    <div class="submissions-list">
    `;
    
    // Add submissions to modal
    if (assignmentData.submissions.length === 0) {
        modalHTML += `<p class="empty-state">No submissions yet.</p>`;
    } else {
        assignmentData.submissions.forEach(submission => {
            modalHTML += `
                <div class="submission-card">
                    <div class="submission-header">
                        <h3>${submission.studentName}</h3>
                        <p>Submitted: ${new Date(submission.submittedAt).toLocaleString()}</p>
                    </div>
                    <div class="submission-content">
                        ${submission.fileUrl ? 
                            `<p><a href="${submission.fileUrl}" target="_blank"><i class="fas fa-file"></i> ${submission.fileName}</a></p>` : ''}
                        <div class="submission-text">
                            ${submission.content || 'No text content submitted.'}
                        </div>
                    </div>
                    <div class="grading-form">
                        <div class="form-group">
                            <label for="grade-${submission.studentId}">Grade (out of ${assignmentData.totalPoints})</label>
                            <input type="number" id="grade-${submission.studentId}" class="form-control" 
                                min="0" max="${assignmentData.totalPoints}" value="${submission.grade || ''}">
                        </div>
                        <div class="form-group">
                            <label for="feedback-${submission.studentId}">Feedback</label>
                            <textarea id="feedback-${submission.studentId}" class="form-control" rows="3">${submission.feedback || ''}</textarea>
                        </div>
                        <button type="button" class="btn btn-primary save-grade-btn" 
                                data-student-id="${submission.studentId}" 
                                data-assignment-id="${assignmentData.id}">
                            Save Grade
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    // Close modal HTML
    modalHTML += `
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal-btn">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to the page
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstChild);
    
    // Get modal element
    const modal = document.getElementById('grading-modal');
    
    // Add modal styles if not already added
    if (!document.getElementById('modal-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'modal-styles';
        styleElement.textContent = `
            .modal {
                display: block;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                overflow: auto;
                background-color: rgba(0, 0, 0, 0.5);
            }
            
            .modal-content {
                background-color: white;
                margin: 5% auto;
                padding: 0;
                width: 80%;
                max-width: 800px;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            
            .modal-header {
                padding: 15px 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-header h2 {
                margin: 0;
                font-size: 20px;
            }
            
            .close {
                color: #aaa;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
            }
            
            .close:hover {
                color: #333;
            }
            
            .modal-body {
                padding: 20px;
                max-height: 70vh;
                overflow-y: auto;
            }
            
            .modal-footer {
                padding: 15px 20px;
                border-top: 1px solid #eee;
                text-align: right;
            }
            
            .assignment-info {
                background-color: #f9fafc;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            
            .assignment-info p {
                margin: 8px 0;
            }
            
            .submissions-list {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            .submission-card {
                border: 1px solid #eee;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .submission-header {
                background-color: #f9fafc;
                padding: 15px;
                border-bottom: 1px solid #eee;
            }
            
            .submission-header h3 {
                margin: 0 0 5px 0;
                font-size: 16px;
            }
            
            .submission-header p {
                margin: 0;
                font-size: 14px;
                color: #666;
            }
            
            .submission-content {
                padding: 15px;
                border-bottom: 1px solid #eee;
            }
            
            .submission-text {
                background-color: #f9fafc;
                padding: 10px;
                border-radius: 4px;
                margin-top: 10px;
                white-space: pre-wrap;
            }
            
            .grading-form {
                padding: 15px;
            }
            
            .empty-state {
                text-align: center;
                padding: 30px;
                background-color: #f9fafc;
                border-radius: 8px;
                color: #666;
            }
        `;
        document.head.appendChild(styleElement);
    }
    
    // Set up close button event
    const closeButtons = modal.querySelectorAll('.close, .close-modal-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            modal.remove();
        });
    });
    
    // Set up save grade button events
    const saveButtons = modal.querySelectorAll('.save-grade-btn');
    saveButtons.forEach(button => {
        button.addEventListener('click', function() {
            const studentId = this.getAttribute('data-student-id');
            const assignmentId = this.getAttribute('data-assignment-id');
            const grade = document.getElementById(`grade-${studentId}`).value;
            const feedback = document.getElementById(`feedback-${studentId}`).value;
            
            saveGrade(assignmentId, studentId, grade, feedback, this);
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    });
}

// Function to save grade
function saveGrade(assignmentId, studentId, grade, feedback, button) {
    // Show loading state
    button.disabled = true;
    button.innerHTML = 'Saving...';
    
    // Prepare data
    const data = {
        grade: grade,
        feedback: feedback
    };
    
    // Send to API
    fetch(`/api/assignments/${assignmentId}/grade/${studentId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        // Reset button
        button.disabled = false;
        button.innerHTML = 'Save Grade';
        
        if (data.success) {
            // Show success notification
            ELC.showNotification('Grade saved successfully!', 'success');
        } else {
            // Show error notification
            ELC.showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        // Reset button
        button.disabled = false;
        button.innerHTML = 'Save Grade';
        
        console.error('Error saving grade:', error);
        ELC.showNotification('Failed to save grade. Please try again.', 'error');
    });
}

// Function to handle editing an assignment
function editAssignment(assignmentId) {
    // Show loading notification
    ELC.showNotification('Loading assignment details...', 'info');
    
    // Fetch assignment details from API
    fetch(`/api/assignments/${assignmentId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayEditModal(data.data);
            } else {
                ELC.showNotification('Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching assignment details:', error);
            ELC.showNotification('Failed to load assignment details. Please try again.', 'error');
        });
}

// Function to display edit modal
function displayEditModal(assignment) {
    // Format date for input (YYYY-MM-DD)
    const dueDate = new Date(assignment.dueDate);
    const formattedDate = dueDate.toISOString().split('T')[0];
    
    // Create modal HTML
    let modalHTML = `
        <div id="edit-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Assignment</h2>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="edit-assignment-form">
                        <div class="form-group">
                            <label for="edit-title">Title</label>
                            <input type="text" id="edit-title" class="form-control" value="${assignment.title}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-description">Description</label>
                            <textarea id="edit-description" class="form-control" rows="4" required>${assignment.description}</textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group half-width">
                                <label for="edit-due-date">Due Date</label>
                                <input type="date" id="edit-due-date" class="form-control" value="${formattedDate}" required>
                            </div>
                            
                            <div class="form-group half-width">
                                <label for="edit-points">Total Points</label>
                                <input type="number" id="edit-points" class="form-control" min="1" max="100" value="${assignment.totalPoints || 100}" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-course">Course</label>
                            <select id="edit-course" class="form-control" required>
                                <option value="">Select a course</option>
                                <!-- Courses will be loaded dynamically -->
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal-btn">Cancel</button>
                    <button class="btn btn-primary" id="save-edit-btn" data-id="${assignment._id}">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to the page
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstChild);
    
    // Get modal element
    const modal = document.getElementById('edit-modal');
    
    // Load courses into dropdown
    loadCoursesForDropdown(assignment.course);
    
    // Set up close button event
    const closeButtons = modal.querySelectorAll('.close, .close-modal-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            modal.remove();
        });
    });
    
    // Set up save button event
    const saveButton = document.getElementById('save-edit-btn');
    saveButton.addEventListener('click', function() {
        const assignmentId = this.getAttribute('data-id');
        const title = document.getElementById('edit-title').value;
        const description = document.getElementById('edit-description').value;
        const dueDate = document.getElementById('edit-due-date').value;
        const totalPoints = document.getElementById('edit-points').value;
        const courseId = document.getElementById('edit-course').value;
        
        if (!title || !description || !dueDate || !totalPoints || !courseId) {
            ELC.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        updateAssignment(assignmentId, {
            title,
            description,
            dueDate,
            totalPoints,
            course: courseId
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    });
}

// Function to load courses for dropdown
function loadCoursesForDropdown(selectedCourseId) {
    // Fetch courses from API
    fetch('/api/courses')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const dropdown = document.getElementById('edit-course');
                
                // Add each course to dropdown
                data.data.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course._id;
                    option.textContent = course.name;
                    option.selected = course._id === selectedCourseId;
                    dropdown.appendChild(option);
                });
            } else {
                console.error('Error loading courses:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching courses:', error);
        });
}

// Function to update assignment
function updateAssignment(assignmentId, data) {
    // Show loading notification
    ELC.showNotification('Updating assignment...', 'info');
    
    // Send to API
    fetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Show success notification
            ELC.showNotification('Assignment updated successfully!', 'success');
            
            // Close modal
            const modal = document.getElementById('edit-modal');
            if (modal) modal.remove();
            
            // Reload assignments to show updated data
            loadAssignmentsData();
        } else {
            // Show error notification
            ELC.showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error updating assignment:', error);
        ELC.showNotification('Failed to update assignment. Please try again.', 'error');
    });
}

// Function to delete assignment
function deleteAssignment(assignmentId) {
    // Show loading notification
    ELC.showNotification('Deleting assignment...', 'info');
    
    // Send to API
    fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Show success notification
            ELC.showNotification('Assignment deleted successfully!', 'success');
            
            // Reload assignments to refresh the list
            loadAssignmentsData();
        } else {
            // Show error notification
            ELC.showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting assignment:', error);
        ELC.showNotification('Failed to delete assignment. Please try again.', 'error');
    });
}