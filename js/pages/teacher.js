// Global variables and utility functions
const ELC = {
    showNotification: function(message, type = 'info') {
        // Implementation for notification system
        const notificationContainer = document.getElementById('notifications-container') || createNotificationContainer();
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Get icon based on type
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';
        if (type === 'warning') icon = 'fa-exclamation-triangle';
        
        // Set notification content
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="notification-message">${message}</div>
            <div class="notification-close">
                <i class="fas fa-times"></i>
            </div>
        `;
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Add remove event
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', function() {
            notification.remove();
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 5000);
    }
};

// Helper function to create notification container
function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notifications-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;
    document.body.appendChild(container);
    
    // Add CSS for notifications
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                padding: 15px;
                width: 320px;
                display: flex;
                align-items: center;
                transition: opacity 0.5s;
            }
            .notification-success {
                border-left: 4px solid #4CAF50;
            }
            .notification-error {
                border-left: 4px solid #F44336;
            }
            .notification-info {
                border-left: 4px solid #2196F3;
            }
            .notification-warning {
                border-left: 4px solid #FF9800;
            }
            .notification-icon {
                margin-right: 15px;
                font-size: 20px;
            }
            .notification-success .notification-icon {
                color: #4CAF50;
            }
            .notification-error .notification-icon {
                color: #F44336;
            }
            .notification-info .notification-icon {
                color: #2196F3;
            }
            .notification-warning .notification-icon {
                color: #FF9800;
            }
            .notification-message {
                flex: 1;
                font-size: 14px;
            }
            .notification-close {
                cursor: pointer;
                opacity: 0.7;
                margin-left: 15px;
            }
            .notification-close:hover {
                opacity: 1;
            }
            .notification.fade-out {
                opacity: 0;
            }
        `;
        document.head.appendChild(style);
    }
    
    return container;
}

// Main initialization function
document.addEventListener('DOMContentLoaded', function() {
    // First fix tab navigation
    setupTabNavigation();
    
  
    // Remove any existing event listeners from buttons by replacing them
    replaceAllButtons();
    
    // Setup all filtering
    setupMaterialsFiltering();
    setupStudentsFiltering();
    setupProgressReportsFiltering();
    setupAssignmentsFiltering();
    
    // Then add our event listeners to the clean buttons
    addButtonListeners();
    
    // Add required CSS styles for modals
    addModalStyles();
    
    // Add CSS for file uploads
    addFileUploadStyles();
    
    // Check if material upload form is already initialized to prevent double initialization
    const uploadMaterialForm = document.getElementById('uploadMaterialForm');
    if (uploadMaterialForm && !uploadMaterialForm.hasAttribute('data-initialized')) {
        console.log('Initializing material upload functionality');
        setupMaterialUpload();
        
        // Add our fix for the file upload display
        fixFileUploadDisplay();
    }
    
    // Material list actions (preview, delete)
    setupMaterialActions();
    
    // Setup material type selection to show/hide URL field
    setupMaterialTypeField();
    
    // Initialize report form handling
    initializeReportForm();
    
    // Log initialization complete
    console.log('Page initialization complete');
});


// Function to setup material type dropdown behavior
function setupMaterialTypeField() {
    const materialType = document.getElementById('materialType');
    const fileDiv = document.querySelector('.file-upload')?.parentNode;
    const urlField = document.createElement('div');
    urlField.className = 'form-group';
    urlField.id = 'materialUrlGroup';
    urlField.style.display = 'none';
    urlField.innerHTML = `
        <label for="materialUrl">External Link URL</label>
        <input type="url" id="materialUrl" class="form-control" placeholder="Enter URL for external resource">
    `;
    
    // Insert URL field after file upload field
    if (fileDiv && fileDiv.parentNode) {
        fileDiv.parentNode.insertBefore(urlField, fileDiv.nextSibling);
    }
    
    if (materialType) {
        materialType.addEventListener('change', function() {
            if (this.value === 'link' || (this.value === 'video' && this.value.toLowerCase().includes('link'))) {
                if (fileDiv) fileDiv.style.display = 'none';
                urlField.style.display = 'block';
                document.getElementById('materialUrl')?.setAttribute('required', 'required');
                document.getElementById('materialFile')?.removeAttribute('required');
            } else {
                if (fileDiv) fileDiv.style.display = 'block';
                urlField.style.display = 'none';
                document.getElementById('materialFile')?.setAttribute('required', 'required');
                document.getElementById('materialUrl')?.removeAttribute('required');
            }
        });
    }
}


async function loadTeacherCourses() {
    const classDropdown = document.getElementById('assignmentClass');
    if (!classDropdown) return;
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        // Show loading state
        classDropdown.innerHTML = '<option value="">Loading your courses...</option>';
        classDropdown.disabled = true;
        
        // Use the new my-courses endpoint
        const response = await fetch('/api/teachers/my-courses', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
            classDropdown.innerHTML = '<option value="">Select a course</option>';
            
            data.data.forEach(course => {
                const option = document.createElement('option');
                option.value = course._id;
                option.textContent = `${course.name} (${course.level})`;
                classDropdown.appendChild(option);
            });
        } else {
            classDropdown.innerHTML = '<option value="">No courses assigned to you</option>';
        }
        
        classDropdown.disabled = false;
    } catch (error) {
        console.error('Error loading courses:', error);
        classDropdown.innerHTML = '<option value="">Error loading courses</option>';
        classDropdown.disabled = false;
    }

}
// Function to load courses for student material selection
async function loadMaterialCourses() {
    const materialClassDropdown = document.getElementById('materialClass');
    if (!materialClassDropdown) return;

    try {
        // Show loading state
        materialClassDropdown.innerHTML = '<option value="">Loading courses...</option>';
        materialClassDropdown.disabled = true;

        // Get authentication token
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Fetch courses for material selection
        const response = await fetch('/api/students/my-courses', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Check if response is ok
        if (!response.ok) {
            // Try teacher's courses if student courses fail
            console.warn('Student courses endpoint failed, trying teacher courses');
            return loadTeacherCoursesForMaterials();
        }

        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
            // Clear previous options and add default option
            materialClassDropdown.innerHTML = '<option value="">Select a course</option>';

            // Populate dropdown with courses
            data.data.forEach(course => {
                const option = document.createElement('option');
                option.value = course._id;
                option.textContent = `${course.name} (${course.level || 'Level not specified'})`;
                materialClassDropdown.appendChild(option);
            });
        } else {
            // If no student courses, try teacher courses
            console.warn('No student courses found, trying teacher courses');
            return loadTeacherCoursesForMaterials();
        }

        materialClassDropdown.disabled = false;
    } catch (error) {
        console.error('Error loading student courses:', error);
        
        // Fallback to teacher courses on any error
        return loadTeacherCoursesForMaterials();
    }
}

// Fallback function to load teacher's courses
async function loadTeacherCoursesForMaterials() {
    const materialClassDropdown = document.getElementById('materialClass');
    if (!materialClassDropdown) return;

    try {
        // Show loading state
        materialClassDropdown.innerHTML = '<option value="">Loading courses...</option>';
        materialClassDropdown.disabled = true;

        // Get authentication token
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Fetch teacher's courses
        const response = await fetch('/api/teachers/my-courses', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
            // Clear previous options and add default option
            materialClassDropdown.innerHTML = '<option value="">Select a course</option>';

            // Populate dropdown with courses
            data.data.forEach(course => {
                const option = document.createElement('option');
                option.value = course._id;
                option.textContent = `${course.name} (${course.level || 'Level not specified'})`;
                materialClassDropdown.appendChild(option);
            });
        } else {
            materialClassDropdown.innerHTML = '<option value="">No courses found</option>';
        }

        materialClassDropdown.disabled = false;
    } catch (error) {
        console.error('Error loading teacher courses:', error);
        materialClassDropdown.innerHTML = '<option value="">Error loading courses</option>';
        materialClassDropdown.disabled = false;

        // Show notification about loading failure
        if (typeof ELC !== 'undefined' && ELC.showNotification) {
            ELC.showNotification('Failed to load courses. Please try again later.', 'error');
        } else {
            alert('Failed to load courses. Please try again later.');
        }
    }
}

// Initialize when DOM is loaded

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadMaterialCourses);

async function handleAssignmentSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    
    // Get form values
    const title = document.getElementById('assignmentTitle').value;
    const courseId = document.getElementById('assignmentClass').value;
    const dueDate = document.getElementById('assignmentDueDate').value;
    const totalPoints = document.getElementById('assignmentPoints').value;
    const instructions = document.getElementById('assignmentInstructions').value;
    const attachmentFile = document.getElementById('assignmentFile').files[0];
    
    // Validate required fields
    if (!title || !courseId || !dueDate || !instructions) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Creating assignment...';
        
        // Prepare form data
        const formData = new FormData();
        formData.append('title', title);
        formData.append('course', courseId);
        formData.append('dueDate', dueDate);
        formData.append('totalPoints', totalPoints || '100');
        formData.append('instructions', instructions);
        
        if (attachmentFile) {
            formData.append('file', attachmentFile);
        }
        
        // Log the form data for debugging
        console.log('Submitting form data:');
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }
        
        // Submit to API
        const response = await fetch('/api/assignments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
                // Don't set Content-Type header when sending FormData
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Assignment created successfully!');
            form.reset();
            
            // Reset file upload UI
            const fileUploadArea = form.querySelector('.file-upload');
            if (fileUploadArea) {
                const fileText = fileUploadArea.querySelector('p');
                const fileIcon = fileUploadArea.querySelector('i');
                
                if (fileText) {
                    fileText.textContent = 'Drag & drop files here or click to browse';
                }
                
                if (fileIcon) {
                    fileIcon.className = 'fas fa-cloud-upload-alt';
                }
                
                fileUploadArea.classList.remove('file-selected');
            }
            
            // Optional: Redirect to assignments page or refresh assignment list
            const assignmentsTab = document.querySelector('[data-section="assignments"]');
            if (assignmentsTab) {
                assignmentsTab.click();
            }
        } else {
            throw new Error(data.message || 'Failed to create assignment');
        }
    } catch (error) {
        console.error('Error creating assignment:', error);
        alert('Error creating assignment: ' + error.message);
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load teacher's courses when page loads
    loadTeacherCourses();
    
    // Add submit handler to assignment form
    const assignmentForm = document.getElementById('createAssignmentForm');
    if (assignmentForm) {
        assignmentForm.addEventListener('submit', handleAssignmentSubmission);
    }
    
    // Add file upload handling
    const fileUploadArea = document.querySelector('#createAssignmentForm .file-upload');
    const fileInput = document.getElementById('assignmentFile');
    
    if (fileUploadArea && fileInput) {
        // Handle file selection
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const fileName = this.files[0].name;
                const fileSize = (this.files[0].size / 1024 / 1024).toFixed(2); // Convert to MB
                
                // Update the upload area to show selected file
                const uploadText = fileUploadArea.querySelector('p');
                if (uploadText) {
                    uploadText.textContent = `Selected: ${fileName} (${fileSize} MB)`;
                }
                
                // Optionally change the icon
                const uploadIcon = fileUploadArea.querySelector('i');
                if (uploadIcon) {
                    uploadIcon.className = 'fas fa-file-check';
                }
            }
        });
        
        // Handle drag and drop
        fileUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.style.backgroundColor = '#f0f0f0';
        });
        
        fileUploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.style.backgroundColor = '';
        });
        
        fileUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.style.backgroundColor = '';
            
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                fileInput.files = e.dataTransfer.files;
                
                // Trigger change event to update UI
                const event = new Event('change');
                fileInput.dispatchEvent(event);
            }
        });
    }
});

// Function to setup tab navigation
function setupTabNavigation() {
    // Hide all content sections except dashboard initially
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        if (section.id === 'dashboard-section') {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
    
    // Set up menu item click events
    const menuItems = document.querySelectorAll('.menu-item[data-section]');
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetSection = this.getAttribute('data-section');
            
            // Update active menu item
            menuItems.forEach(mi => mi.classList.remove('active'));
            this.classList.add('active');
            
            // Show only the target section, hide others
            sections.forEach(section => {
                if (section.id === `${targetSection}-section`) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        });
    });
}

// Add CSS styles for modals
function addModalStyles() {
    // Remove existing styles if they exist
    const existingStyles = document.getElementById('modal-styles');
    if (existingStyles) {
        existingStyles.remove();
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'modal-styles';
    styleElement.textContent = `
    /* Modal styles */
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
    
    .close-modal, .close {
        color: #aaa;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
    }
    
    .close-modal:hover, .close:hover {
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
    
    .submission-card {
        border: 1px solid #eee;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 20px;
    }
    
    .submission-header {
        background-color: #f9fafc;
        padding: 15px;
        border-bottom: 1px solid #eee;
    }
    
    .submission-content {
        padding: 15px;
    }
    
    .grading-form {
        background-color: #f9fafc;
        padding: 15px;
        border-top: 1px solid #eee;
    }
    
    .form-row {
        display: flex;
        gap: 15px;
    }
    
    .form-group.half-width {
        flex: 1;
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
    
    .submission-header h3,
    .submission-header h4 {
        margin: 0 0 5px 0;
        font-size: 16px;
    }
    
    .submission-header p {
        margin: 0;
        font-size: 14px;
        color: #666;
    }
    
    .submission-text {
        background-color: #f9fafc;
        padding: 10px;
        border-radius: 4px;
        margin-top: 10px;
        white-space: pre-wrap;
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

// Add CSS for file upload
function addFileUploadStyles() {
    if (!document.getElementById('file-upload-styles')) {
        const style = document.createElement('style');
        style.id = 'file-upload-styles';
        style.textContent = `
            .file-upload {
                border: 2px dashed #ccc;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .file-upload:hover, .file-upload.highlight {
                border-color: #2196F3;
                background-color: rgba(33, 150, 243, 0.05);
            }
            
            .file-upload i {
                font-size: 32px;
                color: #ccc;
                margin-bottom: 10px;
            }
            
            .file-upload.highlight i {
                color: #2196F3;
            }
            
            .file-upload p {
                color: #666;
                margin: 0;
            }
            
            .file-upload.file-selected {
                border-style: solid;
                border-color: #4CAF50;
                background-color: rgba(76, 175, 80, 0.05);
            }
            
            .file-upload.file-selected i {
                color: #4CAF50;
            }
            
            /* Preview modal styles */
            .preview-container {
                background-color: #f9fafc;
                border-radius: 8px;
                overflow: hidden;
                max-height: 70vh;
            }
        `;
        document.head.appendChild(style);
    }
}

// Replace all buttons with clones to remove any existing event listeners
function replaceAllButtons() {
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
    });
}

// Add event listeners specifically for each button type
function addButtonListeners() {
    // Add event listeners for Grade buttons
    document.querySelectorAll('button.grade-btn, button.btn-primary').forEach(button => {
        // Skip non-grade buttons
        if (!button.classList.contains('grade-btn') && 
            !button.textContent.trim().includes('Grade') && 
            !button.innerHTML.includes('fa-check-square')) {
            return;
        }
        
        // Get or create assignment ID
        let assignmentId = getAssignmentId(button);
        
        // Set data-id attribute
        button.setAttribute('data-id', assignmentId);
        button.setAttribute('data-button-type', 'grade');
        
        // Add click event
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Grade button clicked for assignment:', assignmentId);
            gradeAssignment(assignmentId);
        });
    });
    
    // Add event listeners for Edit buttons
    document.querySelectorAll('button.edit-btn, button.btn-secondary').forEach(button => {
        // Skip non-edit buttons
        if (!button.classList.contains('edit-btn') && 
            !button.textContent.trim().includes('Edit') && 
            !button.innerHTML.includes('fa-edit')) {
            return;
        }
        
        // Get or create assignment ID
        let assignmentId = getAssignmentId(button);
        
        // Set data-id attribute
        button.setAttribute('data-id', assignmentId);
        button.setAttribute('data-button-type', 'edit');
        
        // Add click event
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Edit button clicked for assignment:', assignmentId);
            editAssignment(assignmentId);
        });
    });
    
    // Add event listeners for Delete buttons
    document.querySelectorAll('button.delete-btn, button.btn-danger').forEach(button => {
        // Skip non-delete buttons
        if (!button.classList.contains('delete-btn') && 
            !button.textContent.trim().includes('Delete') && 
            !button.innerHTML.includes('fa-trash')) {
            return;
        }
        
        // Get or create assignment ID
        let assignmentId = getAssignmentId(button);
        
        // Set data-id attribute
        button.setAttribute('data-id', assignmentId);
        button.setAttribute('data-button-type', 'delete');
        
        // Add click event
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Delete button clicked for assignment:', assignmentId);
            if (confirm('Are you sure you want to delete?')) {
                deleteAssignment(assignmentId);
            }
        });
    });
    
    // Setup material preview and delete buttons
    setupMaterialButtons();
}
// Setup material preview and delete buttons
function setupMaterialButtons() {
    document.querySelectorAll('.material-actions button').forEach(button => {
        if (button.textContent.includes('Preview')) {
            const materialItem = button.closest('.material-item');
            const materialId = materialItem ? materialItem.getAttribute('data-id') : null;
            
            if (materialId) {
                button.setAttribute('data-id', materialId);
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    previewMaterial(materialId);
                });
            }
        } else if (button.textContent.includes('Delete')) {
            const materialItem = button.closest('.material-item');
            const materialId = materialItem ? materialItem.getAttribute('data-id') : null;
            
            if (materialId) {
                button.setAttribute('data-id', materialId);
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    const materialTitle = materialItem.querySelector('.material-title').textContent;
                    if (confirm(`Are you sure you want to delete "${materialTitle}"?`)) {
                        deleteMaterial(materialId, materialItem);
                    }
                });
            }
        }
    });
}

// Helper function to get or create assignment ID
function getAssignmentId(button) {
    // First try to get it from data-id attribute
    if (button.hasAttribute('data-id')) {
        return button.getAttribute('data-id');
    }
    
    // Then try to extract it from onclick attribute
    if (button.hasAttribute('onclick')) {
        const onclickValue = button.getAttribute('onclick');
        const matches = onclickValue.match(/['"]([^'"]+)['"]/);
        if (matches) {
            button.removeAttribute('onclick'); // Remove onclick to prevent it firing alongside our event
            return matches[1];
        }
    }
    
    // Try to find an ID from a nearby button in the same container
    const container = button.closest('.assignment-item, tr, div');
    if (container) {
        const otherButtons = container.querySelectorAll('button[data-id]');
        for (let otherButton of otherButtons) {
            if (otherButton !== button && otherButton.hasAttribute('data-id')) {
                return otherButton.getAttribute('data-id');
            }
        }
    }
    
    // If all else fails, create a new ID
    return 'assignment-' + Math.floor(Math.random() * 10000);
}

// UPDATED MATERIAL UPLOAD FUNCTIONALITY
function setupMaterialUpload() {
    const uploadForm = document.getElementById('uploadMaterialForm');
    const fileInput = document.getElementById('materialFile');
    const fileUploadArea = document.querySelector('.file-upload');
    const courseDropdown = document.getElementById('materialClass');
    let isSubmitting = false;
    let submissionTimeout = null;
    
    // Make sure we don't double-initialize
    if (uploadForm && uploadForm.getAttribute('data-initialized') === 'true') {
        console.log('Upload form already initialized, skipping re-initialization');
        return {
            updateFileDisplay: function(file) {
                updateFileDisplay(file);
            }
        };
    }
    
    // Mark the form as initialized
    if (uploadForm) {
        uploadForm.setAttribute('data-initialized', 'true');
    }

    /**
     * Updates the file upload display with selected file information
     */
    function updateFileDisplay(file) {
        if (!file || !fileUploadArea) return;
        
        const icon = fileUploadArea.querySelector('i');
        const text = fileUploadArea.querySelector('p');
        
        if (icon) {
            icon.className = 'fas fa-check-circle';
            icon.style.color = '#4CAF50';
        }
        
        if (text) {
            // Format file size
            let fileSize = '';
            if (file.size < 1024) fileSize = file.size + ' bytes';
            else if (file.size < 1048576) fileSize = (file.size / 1024).toFixed(1) + ' KB';
            else fileSize = (file.size / 1048576).toFixed(1) + ' MB';
            
            text.innerHTML = `Selected: <strong>${file.name}</strong> (${fileSize})`;
        }
        
        fileUploadArea.classList.add('file-selected');
    }

    /**
     * Loads course data into the dropdown
     */
    function populateCourseDropdown() {
        if (!courseDropdown) return;
        
        // Show loading state
        courseDropdown.innerHTML = '<option value="">Loading courses...</option>';
        courseDropdown.disabled = true;
        
        fetch('/api/courses/dropdown')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Clear existing options
                    courseDropdown.innerHTML = '<option value="">Select a Course</option>';
                    
                    // Add courses to dropdown
                    data.data.forEach(course => {
                        const option = document.createElement('option');
                        option.value = course._id;
                        option.textContent = `${course.name} (${course.category || course.level})`;
                        courseDropdown.appendChild(option);
                    });
                } else {
                    ELC.showNotification('Error loading courses: ' + (data.message || 'Unknown error'), 'error');
                    courseDropdown.innerHTML = '<option value="">Failed to load courses</option>';
                }
            })
            .catch(error => {
                console.error('Error fetching courses:', error);
                ELC.showNotification('Failed to load courses: ' + error.message, 'error');
                courseDropdown.innerHTML = '<option value="">Failed to load courses</option>';
            })
            .finally(() => {
                courseDropdown.disabled = false;
            });
    }

    // Call this when the page loads
    populateCourseDropdown();
    
    // Show file name when selected
    if (fileInput) {
        // Remove existing listeners if any
        const newFileInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
        
        // Add fresh listener
        newFileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                updateFileDisplay(this.files[0]);
            }
        });
    }
    
    // Setup drag and drop functionality
    setupDragAndDrop();
    
    // Handle form submission with debounce to prevent duplicates
    if (uploadForm) {
        // Remove any existing listener and add a new one
        const newForm = uploadForm.cloneNode(true);
        uploadForm.parentNode.replaceChild(newForm, uploadForm);
        newForm.setAttribute('data-initialized', 'true');
        
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Check if already in submission process
            if (isSubmitting) {
                console.log('Already submitting, preventing duplicate submission');
                return false;
            }
            
            // Set submitting flag to prevent duplicates
            isSubmitting = true;
            console.log('Starting submission process, isSubmitting =', isSubmitting);
            
            // Clear any existing timeout
            if (submissionTimeout) {
                clearTimeout(submissionTimeout);
            }
            
            // Create submission timeout to reset flag after 10 seconds
            // This is a safety measure in case the fetch promise never resolves
            submissionTimeout = setTimeout(() => {
                console.log('Submission timeout reached, resetting isSubmitting flag');
                isSubmitting = false;
            }, 10000);
            
            // Create FormData and handle upload
            handleFormSubmission(this);
        });
    }
    
    /**
     * Sets up drag and drop functionality for file uploads
     */
    function setupDragAndDrop() {
        if (!fileUploadArea) return;
        
        // Clean up any existing listeners
        const newFileUploadArea = fileUploadArea.cloneNode(true);
        fileUploadArea.parentNode.replaceChild(newFileUploadArea, fileUploadArea);
        
        // Store reference to the new upload area
        const uploadArea = newFileUploadArea;
        
        // Add event listeners for drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, function() {
                uploadArea.classList.add('highlight');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, function() {
                uploadArea.classList.remove('highlight');
            }, false);
        });
        
        // Add drop handler
        uploadArea.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            if (!dt || !dt.files || dt.files.length === 0) return;
            
            const currentFileInput = document.getElementById('materialFile');
            if (currentFileInput) {
                // For modern browsers supporting DataTransfer
                try {
                    // Create a new DataTransfer object
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(dt.files[0]);
                    currentFileInput.files = dataTransfer.files;
                    
                    // Update the display
                    updateFileDisplay(dt.files[0]);
                    
                    // Trigger change event
                    const event = new Event('change', { bubbles: true });
                    currentFileInput.dispatchEvent(event);
                } catch (err) {
                    console.error('Error setting files:', err);
                    // Fallback for older browsers
                    ELC.showNotification('Please select a file using the browse button instead.', 'warning');
                }
            }
        }, false);
        
        // Add click handler to trigger file selection
        uploadArea.addEventListener('click', function(e) {
            // Don't trigger if clicking on a child element that might have its own action
            if (e.target !== uploadArea && e.target.tagName !== 'P' && e.target.tagName !== 'I') {
                return;
            }
            
            const currentFileInput = document.getElementById('materialFile');
            if (currentFileInput) {
                currentFileInput.click();
            }
        });
    }
    
    /**
     * Prevents default behavior for drag and drop events
     */
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    /**
     * Handles the form submission process including validation and API call
     */
    function handleFormSubmission(form) {
        const formData = new FormData();
        
        // Get form values
        const courseId = document.getElementById('materialClass')?.value;
        const title = document.getElementById('materialTitle')?.value;
        const type = document.getElementById('materialType')?.value;
        const description = document.getElementById('materialDescription')?.value;
        
        // Add a unique identifier to help prevent duplicates
        const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(2, 15);
        formData.append('clientId', uniqueId);
        
        // Validation
        if (!courseId || !title || !type) {
            ELC.showNotification('Please fill in all required fields', 'error');
            resetSubmissionState();
            return;
        }
        
        // Determine if we're using a file or URL based on material type
        const isLinkType = type === 'link' || (type === 'video' && 
            document.getElementById('materialUrlGroup') && 
            document.getElementById('materialUrlGroup').style.display !== 'none');
        
        // Check if the appropriate input is provided
        if (isLinkType) {
            const urlInput = document.getElementById('materialUrl');
            if (!urlInput || !urlInput.value) {
                ELC.showNotification('Please enter a URL for the external resource', 'error');
                resetSubmissionState();
                return;
            }
            formData.append('url', urlInput.value);
            console.log('Using URL:', urlInput.value);
        } else {
            const currentFileInput = document.getElementById('materialFile');
            if (!currentFileInput || !currentFileInput.files || currentFileInput.files.length === 0) {
                ELC.showNotification('Please select a file to upload', 'error');
                resetSubmissionState();
                return;
            }
            formData.append('file', currentFileInput.files[0]);
            console.log('Using file:', currentFileInput.files[0].name);
        }
        
        // Add other form data
        formData.append('course', courseId);
        formData.append('title', title);
        formData.append('type', type);
        formData.append('description', description || '');
        
        // Add tags based on type
        const tags = [];
        if (type === 'slides') tags.push('presentation');
        if (type === 'exercise') tags.push('practice');
        if (type === 'document') tags.push('worksheet');
        if (tags.length > 0) {
            formData.append('tags', JSON.stringify(tags));
        }
        
        // Disable form inputs during submission
        const formInputs = form.querySelectorAll('input, select, textarea, button');
        formInputs.forEach(input => input.disabled = true);
        
        // Update submit button to show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Upload';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        }
        
        // Get authentication token
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        // Send upload request with custom headers to prevent duplicate submissions
        fetch('/api/materials', {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
                'X-Client-ID': uniqueId,
                'X-Request-Time': Date.now().toString()
            },
            body: formData
        })
        .then(response => {
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Server error: ' + response.status);
                });
            }
            
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            
            if (data.success) {
                // Show success message
                ELC.showNotification('Material uploaded successfully!', 'success');
                
                // Reset form
                form.reset();
                resetFileUpload();
                
                // Add material to materials list if we're on that tab
                if (data.data) {
                    addMaterialToList(data.data);
                    
                    // Switch to materials section
                    const materialsTab = document.querySelector('.menu-item[data-section="materials"]');
                    if (materialsTab) {
                        materialsTab.click();
                    }
                }
            } else {
                throw new Error(data.message || 'Unknown error occurred');
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            ELC.showNotification('Failed to upload material: ' + error.message, 'error');
        })
        .finally(() => {
            // Enable form inputs
            formInputs.forEach(input => input.disabled = false);
            
            // Reset button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
            
            // Reset submission state
            resetSubmissionState();
        });
    }
    
    /**
     * Resets the submission state to allow new submissions
     */
    function resetSubmissionState() {
        // Clear timeout if it exists
        if (submissionTimeout) {
            clearTimeout(submissionTimeout);
            submissionTimeout = null;
        }
        
        // Reset submission flag
        isSubmitting = false;
        console.log('Form submission completed or failed, isSubmitting reset to:', isSubmitting);
    }
    
    // Return the public API
    return {
        updateFileDisplay: updateFileDisplay
    };
}

/**
 * Function to reset file upload display
 */
function resetFileUpload() {
    const fileUploadArea = document.querySelector('.file-upload');
    if (!fileUploadArea) return;
    
    const icon = fileUploadArea.querySelector('i');
    const text = fileUploadArea.querySelector('p');
    
    if (icon) {
        icon.className = 'fas fa-cloud-upload-alt';
        icon.style.color = ''; // Reset color
    }
    
    if (text) {
        text.innerHTML = 'Drag & drop files here or click to browse';
    }
    
    fileUploadArea.classList.remove('file-selected', 'highlight');
    
    // Reset the file input by replacing it
    const fileInput = document.getElementById('materialFile');
    if (fileInput) {
        const newInput = document.createElement('input');
        newInput.type = 'file';
        newInput.id = fileInput.id;
        newInput.name = fileInput.name;
        newInput.className = fileInput.className;
        newInput.accept = fileInput.accept;
        
        // Replace the original
        fileInput.parentNode.replaceChild(newInput, fileInput);
        
        // Attach event listener
        newInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                const uploadModule = setupMaterialUpload();
                if (uploadModule && typeof uploadModule.updateFileDisplay === 'function') {
                    uploadModule.updateFileDisplay(this.files[0]);
                }
            }
        });
    }
}

/**
 * Fix for file upload display issues
 */
function fixFileUploadDisplay() {
    console.log("Running file upload display fix");
    
    // Get the necessary elements
    const fileInput = document.getElementById('materialFile');
    const fileUploadArea = document.querySelector('.file-upload');
    
    if (!fileInput || !fileUploadArea) {
        console.error("Could not find file input or upload area elements");
        return;
    }
    
    // Create new file input to remove existing listeners
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);
    
    // Add direct event listener
    newFileInput.addEventListener('change', function() {
        console.log("File selected:", this.files);
        
        if (this.files && this.files.length > 0) {
            const file = this.files[0];
            
            // Update the icon
            const icon = fileUploadArea.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-check-circle';
                icon.style.color = '#4CAF50';
            }
            
            // Update the text
            const text = fileUploadArea.querySelector('p');
            if (text) {
                // Format file size
                let fileSize = '';
                if (file.size < 1024) fileSize = file.size + ' bytes';
                else if (file.size < 1048576) fileSize = (file.size / 1024).toFixed(1) + ' KB';
                else fileSize = (file.size / 1048576).toFixed(1) + ' MB';
                
                text.innerHTML = `Selected: <strong>${file.name}</strong> (${fileSize})`;
            }
            
            // Add selected class
            fileUploadArea.classList.add('file-selected');
        }
    });
    
    // Make sure upload area click works
    fileUploadArea.addEventListener('click', function(e) {
        // Don't trigger if clicking on a child element that might have its own action
        if (e.target !== fileUploadArea && e.target.tagName !== 'P' && e.target.tagName !== 'I') {
            return;
        }
        
        console.log("Upload area clicked");
        const currentFileInput = document.getElementById('materialFile');
        if (currentFileInput) currentFileInput.click();
    });
    
    console.log("File upload display fix applied");
}

/**
 * Helper function to format file size into human-readable format
 */
function formatFileSize(bytes) {
    if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) {
        return '0 bytes';
    }
    
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
}

// Function to handle material actions (preview, delete)
function setupMaterialActions() {
    const materialsList = document.querySelector('.materials-list');
    
    if (materialsList) {
        materialsList.addEventListener('click', function(e) {
            // Handle preview button click
            if (e.target.closest('.btn-secondary:not(.close-btn):not(.close-modal-btn)')) {
                const btn = e.target.closest('.btn-secondary');
                if (btn.textContent.includes('Preview')) {
                    const materialId = btn.getAttribute('data-id');
                    previewMaterial(materialId);
                }
            }
            
            // Handle delete button click
            if (e.target.closest('.btn-danger')) {
                const btn = e.target.closest('.btn-danger');
                const materialItem = btn.closest('.material-item');
                const materialId = btn.getAttribute('data-id');
                const materialTitle = materialItem.querySelector('.material-title').textContent;
                
                if (confirm(`Are you sure you want to delete "${materialTitle}"?`)) {
                    deleteMaterial(materialId, materialItem);
                }
            }
        });
    }
}

// Function to add material to the list
function addMaterialToList(material) {
    const materialsList = document.querySelector('.materials-list');
    if (!materialsList) return;
    
    // Create new material item
    const materialItem = document.createElement('div');
    materialItem.className = 'material-item';
    materialItem.setAttribute('data-id', material._id);
    
    // Determine icon based on type
    const iconClass = getMaterialIcon(material.type);
    
    // Get formatted date
    const createdDate = new Date(material.createdAt).toLocaleDateString();
    
    // Get course name
    let courseName = 'Unknown Course';
    if (material.course) {
        if (typeof material.course === 'object' && material.course.name) {
            courseName = material.course.name;
        } else if (typeof material.course === 'string') {
            // If we only have the ID, try to get the name from dropdown
            const courseSelect = document.getElementById('materialClass');
            if (courseSelect) {
                const option = courseSelect.querySelector(`option[value="${material.course}"]`);
                if (option) {
                    courseName = option.textContent;
                }
            }
        }
    }
    
    // Create HTML
    materialItem.innerHTML = `
        <div class="material-icon">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="material-info">
            <div class="material-title">${material.title}</div>
            <div class="material-details">
                <div><i class="fas fa-book"></i> ${courseName}</div>
                <div><i class="fas fa-calendar"></i> ${createdDate}</div>
                <div><i class="fas fa-user"></i> Uploaded by you</div>
            </div>
        </div>
        <div class="material-actions">
            <button class="btn btn-secondary preview-btn" data-id="${material._id}"><i class="fas fa-eye"></i> Preview</button>
            <button class="btn btn-danger delete-btn" data-id="${material._id}"><i class="fas fa-trash"></i> Delete</button>
        </div>
    `;
    
    // Add to list (prepend to show newest first)
    materialsList.insertBefore(materialItem, materialsList.firstChild);
    
    // Hide empty state if it's visible
    const emptyState = document.querySelector('#materials-section .empty-state');
    if (emptyState) {
        emptyState.style.display = 'none';
    }

    // Setup buttons on the new material item
    const previewBtn = materialItem.querySelector('.preview-btn');
    const deleteBtn = materialItem.querySelector('.delete-btn');

    if (previewBtn) {
        previewBtn.addEventListener('click', function() {
            previewMaterial(material._id);
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            if (confirm(`Are you sure you want to delete "${material.title}"?`)) {
                deleteMaterial(material._id, materialItem);
            }
        });
    }
}

// Function to preview material
function previewMaterial(materialId) {
    // Show loading notification
    ELC.showNotification('Loading material preview...', 'info');

    fetch(`/api/materials/${materialId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMaterialPreviewModal(data.data);   

            } else {
                ELC.showNotification('Error loading material: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching material:', error);
            ELC.showNotification('Failed to load material preview', 'error');
        });
}

// Function to show material preview modal
function showMaterialPreviewModal(material) {
    // Clear any existing modals
    clearExistingModals();

    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'modal';

    // Determine preview content based on type and file/url
    let previewContent = '';

    if (material.file) {
        const fileExt = material.file.split('.').pop().toLowerCase();
        const filePath = `/uploads/materials/${material.file}`;
        
        // Create preview based on file type
        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
            // Image preview
            previewContent = `<img src="${filePath}" alt="${material.title}" style="max-width: 100%; max-height: 70vh;">`;
        } else if (['pdf'].includes(fileExt)) {
            // PDF preview
            previewContent = `<iframe src="${filePath}" style="width: 100%; height: 70vh; border: none;"></iframe>`;
        } else if (['mp4', 'webm'].includes(fileExt)) {
            // Video preview
            previewContent = `
                <video controls style="max-width: 100%; max-height: 70vh;">
                    <source src="${filePath}" type="video/${fileExt}">
                    Your browser does not support the video tag.
                </video>
            `;
        } else if (['mp3', 'ogg', 'wav'].includes(fileExt)) {
            // Audio preview
            previewContent = `
                <audio controls style="width: 100%;">
                    <source src="${filePath}" type="audio/${fileExt}">
                    Your browser does not support the audio tag.
                </audio>
            `;
        } else {
            // Generic file preview with download button
            previewContent = `
                <div style="text-align: center; padding: 30px;">
                    <i class="fas fa-file fa-5x" style="color: #ccc; margin-bottom: 20px;"></i>
                    <p>Preview not available for this file type.</p>
                    <a href="${filePath}" class="btn btn-primary" download>
                        <i class="fas fa-download"></i> Download File
                    </a>
                </div>
            `;
        }
    } else if (material.url) {
        // URL preview - if it's a video URL, try to embed it
        if (material.type === 'video' && isVideoUrl(material.url)) {
            // Try to create video embed (YouTube, Vimeo, etc.)
            const embedUrl = getVideoEmbedUrl(material.url);
            if (embedUrl) {
                previewContent = `<iframe src="${embedUrl}" style="width: 100%; height: 70vh; border: none;" allowfullscreen></iframe>`;
            } else {
                // Fall back to link if we can't embed
                previewContent = `
                    <div style="text-align: center; padding: 30px;">
                        <i class="fas fa-video fa-5x" style="color: #ccc; margin-bottom: 20px;"></i>
                        <p>Video preview not available.</p>
                        <a href="${material.url}" class="btn btn-primary" target="_blank">
                            <i class="fas fa-external-link-alt"></i> Open Video Link
                        </a>
                    </div>
                `;
            }
        } else {
            // Regular URL preview
            previewContent = `
                <div style="text-align: center; padding: 30px;">
                    <i class="fas fa-link fa-5x" style="color: #ccc; margin-bottom: 20px;"></i>
                    <p>External resource link:</p>
                    <a href="${material.url}" class="btn btn-primary" target="_blank">
                        <i class="fas fa-external-link-alt"></i> Open Link
                    </a>
                </div>
            `;
        }
    } else {
        // No content
        previewContent = `
            <div style="text-align: center; padding: 30px;">
                <i class="fas fa-exclamation-circle fa-5x" style="color: #ccc; margin-bottom: 20px;"></i>
                <p>No file or URL available for this material.</p>
            </div>
        `;
    }

    // Get course name
    let courseName = 'Unknown Course';
    if (material.course) {
        if (typeof material.course === 'object' && material.course.name) {
            courseName = material.course.name;
        }
    }

    // Format date
    const createdDate = new Date(material.createdAt).toLocaleString();

    // Create modal content
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${material.title}</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="material-info" style="margin-bottom: 20px; padding: 15px; background-color: #f9fafc; border-radius: 8px;">
                    <p><strong>Type:</strong> ${material.type.charAt(0).toUpperCase() + material.type.slice(1)}</p>
                    <p><strong>Course:</strong> ${courseName}</p>
                    <p><strong>Uploaded:</strong> ${createdDate}</p>
                    ${material.description ? `<p><strong>Description:</strong> ${material.description}</p>` : ''}
                </div>
                
                <div class="preview-container">
                    ${previewContent}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-btn">Close</button>
                ${material.file ? `
                    <a href="/api/materials/${material._id}/download" class="btn btn-primary">
                        <i class="fas fa-download"></i> Download
                    </a>
                ` : ''}
            </div>
        </div>
    `;

    // Add modal to body
    document.body.appendChild(modal);

    // Add close functionality
    const closeBtn = modal.querySelector('.close');
    const closeBtnFooter = modal.querySelector('.close-btn');

    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    closeBtnFooter.addEventListener('click', () => {
        modal.remove();
    });

    // Close when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Helper function to check if URL is a video URL
function isVideoUrl(url) {
    return url.includes('youtube.com') || 
           url.includes('youtu.be') || 
           url.includes('vimeo.com') || 
           url.includes('dailymotion.com') ||
           url.includes('wistia.com');
}

// Helper function to convert video URL to embed URL
function getVideoEmbedUrl(url) {
    // YouTube
    if (url.includes('youtube.com/watch')) {
        const videoId = url.split('v=')[1].split('&')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be')) {
        const videoId = url.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Vimeo
    if (url.includes('vimeo.com')) {
        const videoId = url.split('vimeo.com/')[1].split('?')[0];
        return `https://player.vimeo.com/video/${videoId}`;
    }
    
    // Dailymotion
    if (url.includes('dailymotion.com')) {
        const videoId = url.split('dailymotion.com/video/')[1].split('?')[0];
        return `https://www.dailymotion.com/embed/video/${videoId}`;
    }
    
    // Wistia
    if (url.includes('wistia.com')) {
        const videoId = url.split('wistia.com/medias/')[1].split('?')[0];
        return `https://fast.wistia.net/embed/iframe/${videoId}`;
    }
    
    // Return null if not a recognized video URL or can't parse it
    return null;
}

// Updated deleteMaterial function for teacher.js

function deleteMaterial(materialId, materialElement) {
    // Show loading notification
    ELC.showNotification('Deleting material...', 'info');
    
    // Get authentication token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
        ELC.showNotification('No authentication token found. Please log in again.', 'error');
        return;
    }
    
    // Send delete request
    fetch(`/api/materials/${materialId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(async response => {
        console.log('Delete response status:', response.status);
        
        // Try to parse the JSON response
        let data;
        try {
            data = await response.json();
        } catch (e) {
            // If parsing fails, create a default response
            data = { 
                success: response.ok, 
                message: response.ok ? 'Material deleted' : 'Failed to delete material' 
            };
        }
        
        // If the response is OK or if we get a 404 (material already deleted)
        if (response.ok || response.status === 404) {
            // Remove material from UI
            if (materialElement && materialElement.parentNode) {
                materialElement.remove();
            }
            
            // Show success message
            ELC.showNotification('Material deleted successfully', 'success');
            
            // Check if materials list is empty
            const materialsList = document.querySelector('.materials-list');
            if (materialsList && materialsList.children.length === 0) {
                // Show empty state
                showMaterialsEmptyState(true);
            }
        } else {
            // Handle other error responses
            if (response.status === 403) {
                ELC.showNotification('You are not authorized to delete this material', 'error');
            } else {
                ELC.showNotification('Error: ' + (data.message || 'Failed to delete material'), 'error');
            }
        }
    })
    .catch(error => {
        console.error('Delete error:', error);
        
        // Check if the material element has already been removed from the DOM
        if (!document.body.contains(materialElement)) {
            // Material was removed, likely deleted successfully
            ELC.showNotification('Material deleted successfully', 'success');
        } else {
            ELC.showNotification('Failed to delete material: ' + error.message, 'error');
        }
    });
}

// Helper function to get material icon class based on type
function getMaterialIcon(type) {
    switch (type.toLowerCase()) {
        case 'document': return 'fa-file-word';
        case 'presentation':
        case 'slides': return 'fa-file-powerpoint';
        case 'video': return 'fa-file-video';
        case 'audio': return 'fa-file-audio';
        case 'image': return 'fa-file-image';
        case 'link': return 'fa-link';
        case 'exercise': return 'fa-file-alt';
        default: return 'fa-file';
    }
}

// Clear all existing modals from the page
function clearExistingModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.remove());
}

// ===== MATERIALS SECTION FILTERING =====
// Function to setup materials filtering
function setupMaterialsFiltering() {
    // Get the filter elements
    const classFilter = document.querySelector('#materials-section select:first-child, .filter-bar select:first-child');
    const typeFilter = document.querySelector('#materials-section select:nth-child(2), .filter-bar select:nth-child(2)');
    const searchInput = document.querySelector('#materials-section .search-bar input');
    const searchButton = document.querySelector('#materials-section .search-bar button');
    const materialsList = document.querySelector('.materials-list');
    
    // Check if materials list exists
    if (!materialsList) {
        console.error('Materials list container not found');
        return;
    }
    // Load teacher's courses for the filter dropdown
    async function loadTeacherCoursesForFilter() {
        if (!classFilter) return;
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            // Show loading state
            classFilter.innerHTML = '<option value="">Loading your courses...</option>';
            classFilter.disabled = true;
            
            // Fetch teacher's courses from API
            const response = await fetch('/api/teachers/my-courses', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Teacher courses loaded for materials filter:', data);
            
            if (data.success && data.data && data.data.length > 0) {
                // Start with "All Classes" option
                classFilter.innerHTML = '<option value="">All Classes</option>';
                
                // Add each course to the filter
                data.data.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course._id;
                    option.textContent = `${course.name} (${course.level})`;
                    classFilter.appendChild(option);
                });
            } else {
                classFilter.innerHTML = '<option value="">No courses assigned to you</option>';
            }
        } catch (error) {
            console.error('Error loading teacher courses for filter:', error);
            classFilter.innerHTML = '<option value="">Error loading courses</option>';
        } finally {
            classFilter.disabled = false;
        }
    }

    // Populate type filter with material types
    if (typeFilter) {
        typeFilter.innerHTML = '<option value="">All Types</option>';
        
        const materialTypes = [
            { value: 'slides', text: 'Slides' },
            { value: 'document', text: 'Documents' },
            { value: 'video', text: 'Videos' },
            { value: 'audio', text: 'Audio' },
            { value: 'exercise', text: 'Exercises' },
            { value: 'other', text: 'Other' }
        ];
        
        materialTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.text;
            typeFilter.appendChild(option);
        });
    }

   // Function to load materials from the database - NEEDS FIXING TO FILTER BY TEACHER'S COURSES ONLY
async function loadMaterials(filters = {}) {
    // Show loading state
    materialsList.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading materials...</p>
        </div>
    `;
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        // Build query string from filters
        const queryParams = new URLSearchParams();
        
        // If class filter is specified, use just that course ID
        if (filters.class) {
            queryParams.append('courseIds', filters.class);
        } else {
            // Otherwise, fetch all teacher's courses first
            const coursesResponse = await fetch('/api/teachers/my-courses', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!coursesResponse.ok) {
                throw new Error(`HTTP error ${coursesResponse.status}`);
            }
            
            const coursesData = await coursesResponse.json();
            
            // If teacher has no courses, show empty state
            if (!coursesData.success || !coursesData.data || coursesData.data.length === 0) {
                materialsList.innerHTML = '';
                showMaterialsEmptyState(true);
                return;
            }
            
            // Add each course ID to the query
            coursesData.data.forEach(course => {
                queryParams.append('courseIds', course._id);
            });
        }
        
        // Add other filters
        if (filters.type) queryParams.append('type', filters.type);
        if (filters.search) queryParams.append('search', filters.search);
        
        console.log('Materials filter query params:', queryParams.toString());
        
        // Fetch materials for teacher's courses
        const materialsResponse = await fetch(`/api/materials?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Process response...
        if (!materialsResponse.ok) {
            throw new Error(`HTTP error ${materialsResponse.status}`);
        }
        
        const materialsData = await materialsResponse.json();
        console.log('Materials data received:', materialsData);
        
        if (materialsData.success && materialsData.data && materialsData.data.length > 0) {
            // Clear loading indicator
            materialsList.innerHTML = '';
            
            // Add each material to the list
            materialsData.data.forEach(material => {
                addMaterialToList(material);
            });
        } else {
            // Show empty state if no materials
            materialsList.innerHTML = '';
            showMaterialsEmptyState(true);
        }
        
    } catch (error) {
        console.error('Error fetching materials:', error);
        materialsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error loading materials</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}
    // Show empty state when no materials match
    function showMaterialsEmptyState(show) {
        let emptyState = document.querySelector('#materials-section .empty-state');
        
        // Create empty state if it doesn't exist
        if (!emptyState) {
            emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <i class="fas fa-file-alt"></i>
                <h3>No materials found</h3>
                <p>There are no materials matching your search criteria.</p>
                <button class="btn btn-primary add-material-btn"><i class="fas fa-plus"></i> Upload New Material</button>
            `;
            
            // Insert after materials list
            if (materialsList.parentNode) {
                materialsList.parentNode.insertBefore(emptyState, materialsList.nextSibling);
            }
            
            // Add click event to upload button
            const uploadButton = emptyState.querySelector('.add-material-btn');
            if (uploadButton) {
                uploadButton.addEventListener('click', function() {
                    // Switch to dashboard and scroll to upload form
                    const dashboardTab = document.querySelector('.menu-item[data-section="dashboard"]');
                    if (dashboardTab) {
                        dashboardTab.click();
                        setTimeout(() => {
                            const uploadForm = document.getElementById('uploadMaterialForm');
                            if (uploadForm) uploadForm.scrollIntoView({ behavior: 'smooth' });
                        }, 300);
                    }
                });
            }
        }
        
        // Show or hide empty state
        if (emptyState) {
            emptyState.style.display = show ? 'block' : 'none';
        }
    }

     // Function to handle filter changes
     function applyFilters() {
        const classValue = classFilter ? classFilter.value : '';
        const typeValue = typeFilter ? typeFilter.value : '';
        const searchValue = searchInput ? searchInput.value.trim() : '';
        
        console.log('Applying filters:', { class: classValue, type: typeValue, search: searchValue });
        
        // Load filtered materials from API
        loadMaterials({
            class: classValue,
            type: typeValue,
            search: searchValue
        });
    }

    // Add event listeners for filtering
    if (classFilter) classFilter.addEventListener('change', applyFilters);
    if (typeFilter) typeFilter.addEventListener('change', applyFilters);
    
    if (searchButton) {
        searchButton.addEventListener('click', applyFilters);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') applyFilters();
        });
    }

    // Initialize: load teacher's courses for filter and load initial materials
    loadTeacherCoursesForFilter();
    setTimeout(() => loadMaterials(), 300); // Add short delay to ensure courses load first
    
    // Return public methods
    return {
        refresh: loadMaterials,
        refreshCourses: loadTeacherCoursesForFilter
    };
}
// Function to load courses into material class dropdown
function loadCoursesIntoDropdown() {
    const courseDropdown = document.getElementById('materialClass');
    if (!courseDropdown) return;
    
    // Show loading state
    courseDropdown.innerHTML = '<option value="">Loading courses...</option>';
    courseDropdown.disabled = true;
    
    // Get authentication token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
        courseDropdown.innerHTML = '<option value="">Please login to view courses</option>';
        courseDropdown.disabled = false;
        return;
    }
    
    // Fetch teacher's courses from API
    fetch('/api/teachers/my-courses', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Courses loaded for dropdown:', data);
        
        if (data.success && data.data && data.data.length > 0) {
            // Start with placeholder option
            courseDropdown.innerHTML = '<option value="">Select a course</option>';
            
            // Add each course to the dropdown
            data.data.forEach(course => {
                const option = document.createElement('option');
                option.value = course._id;
                option.textContent = `${course.name} (${course.level})`;
                courseDropdown.appendChild(option);
            });
        } else {
            courseDropdown.innerHTML = '<option value="">No courses available</option>';
        }
    })
    .catch(error => {
        console.error('Error loading courses:', error);
        courseDropdown.innerHTML = '<option value="">Error loading courses</option>';
    })
    .finally(() => {
        courseDropdown.disabled = false;
    });
}
// Call this when the page is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize materials filtering and loading
    const materialsModule = setupMaterialsFiltering();
    
    // Add tab change handler to reload materials when switching to the tab
    const materialsTab = document.querySelector('.menu-item[data-section="materials"]');
    if (materialsTab) {
        materialsTab.addEventListener('click', function() {
            console.log('Materials tab clicked, refreshing materials');
            if (materialsModule && typeof materialsModule.refreshCourses === 'function') {
                materialsModule.refreshCourses();
                setTimeout(() => {
                    if (materialsModule && typeof materialsModule.refresh === 'function') {
                        materialsModule.refresh();
                    }
                }, 300);
            }
        });
    }
});

// ===== STUDENTS SECTION FILTERING =====
function setupStudentsFiltering() {
    // Get filter elements
    const classFilter = document.querySelector('#students-section .filter-bar select');
    const searchInput = document.querySelector('#students-section .search-bar input');
    const searchButton = document.querySelector('#students-section .search-bar button');
    const studentsList = document.querySelector('.students-list');

    // Load teacher's courses for the filter dropdown
    async function loadTeacherCoursesForStudentsFilter() {
        if (!classFilter) return;
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            // Show loading state
            classFilter.innerHTML = '<option value="">Loading your courses...</option>';
            classFilter.disabled = true;
            
            // Fetch teacher's courses from API
            const response = await fetch('/api/teachers/my-courses', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Teacher courses loaded for students filter:', data);
            
            // Update dropdown options
            if (data.success && data.data && data.data.length > 0) {
                // Start with "Select a Class" option
                classFilter.innerHTML = '<option value="">Select a Class</option>';
                
                // Add each course to the filter
                data.data.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course._id;
                    option.textContent = `${course.name} (${course.level})`;
                    classFilter.appendChild(option);
                });
                
                // If there's only one course, select it automatically
                if (data.data.length === 1) {
                    classFilter.value = data.data[0]._id;
                    // Trigger change event to load students for this course
                    setTimeout(() => {
                        applyFilters();
                    }, 100);
                }
            } else {
                classFilter.innerHTML = '<option value="">No courses assigned to you</option>';
            }
        } catch (error) {
            console.error('Error loading teacher courses for filter:', error);
            classFilter.innerHTML = '<option value="">Error loading courses</option>';
        } finally {
            classFilter.disabled = false;
        }
    }

    // Load students with filtering - UPDATED to handle data structure
    async function loadStudents(filters = {}) {
        // Show loading indicator
        if (studentsList) {
            studentsList.innerHTML = `
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading students...</p>
                </div>
            `;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            // If no course is selected, show message and return early
            if (!filters.course) {
                showSelectCourseMessage();
                return;
            }
            
            // First, we'll try to get all the teacher's students
            const timestamp = new Date().getTime();
            let apiUrl = `/api/students/byteacher?_t=${timestamp}`;
            
            // Add search parameter if provided
            if (filters.search) {
                apiUrl += `&search=${encodeURIComponent(filters.search)}`;
            }
            
            console.log('Fetching all teacher students from:', apiUrl);
            
            // Fetch student data from API
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Students data received:', data);
            
            // Clear loading indicator
            if (studentsList) {
                studentsList.innerHTML = '';
            }
            
            if (data.success && data.data && data.data.length > 0) {
                // Manually filter students to only show those enrolled in the selected course
                const selectedCourseId = filters.course;
                const filteredStudents = data.data.filter(student => {
                    // Check if the student is enrolled in the selected course
                    if (student.studentInfo && student.studentInfo.course) {
                        // If course is a string ID
                        if (typeof student.studentInfo.course === 'string') {
                            return student.studentInfo.course === selectedCourseId;
                        }
                        // If course is an object
                        else if (typeof student.studentInfo.course === 'object' && student.studentInfo.course._id) {
                            return student.studentInfo.course._id === selectedCourseId;
                        }
                        // If course is an array
                        else if (Array.isArray(student.studentInfo.course)) {
                            return student.studentInfo.course.some(course => {
                                if (typeof course === 'string') {
                                    return course === selectedCourseId;
                                } else if (typeof course === 'object' && course._id) {
                                    return course._id === selectedCourseId;
                                }
                                return false;
                            });
                        }
                    }
                    return false;
                });
                
                console.log(`Filtered from ${data.data.length} to ${filteredStudents.length} students for course ${selectedCourseId}`);
                
                // Display the filtered students
                if (filteredStudents.length > 0) {
                    filteredStudents.forEach(student => {
                        addStudentToList(student);
                    });
                } else {
                    // No students found for this course
                    showNoStudentsForCourseMessage(selectedCourseId);
                }
            } else {
                // No students found at all
                showNoStudentsForCourseMessage(filters.course);
            }
        } catch (error) {
            console.error('Error loading students:', error);
            if (studentsList) {
                studentsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>Error loading students</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }
    }
    
    // Show message for no students in the selected course
    function showNoStudentsForCourseMessage(courseId) {
        if (!studentsList) return;
        
        // Find the course name from the dropdown
        let courseName = "this course";
        if (classFilter) {
            const selectedOption = classFilter.options[classFilter.selectedIndex];
            if (selectedOption) {
                courseName = selectedOption.textContent;
            }
        }
        
        studentsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-graduate"></i>
                <h3>No students found</h3>
                <p>There are no students enrolled in ${courseName}.</p>
            </div>
        `;
    }

    // Function to add a student to the student list display
    function addStudentToList(student) {
        // Check if student data is valid
        if (!student) return;
        
        // Get student name - handling possible undefined
        const fullName = student.fullName || 'Unnamed Student';
        
        // Get course name - with enhanced handling for course data
        let courseText = 'No course information available';
        
        // Try to get the most accurate course information
        if (student.studentInfo && student.studentInfo.course) {
            // Case 1: Course is an object with name property
            if (typeof student.studentInfo.course === 'object' && student.studentInfo.course.name) {
                courseText = `Course: ${student.studentInfo.course.name}`;
            } 
            // Case 2: Course is an array (multiple courses)
            else if (Array.isArray(student.studentInfo.course) && student.studentInfo.course.length > 0) {
                const courseNames = student.studentInfo.course.map(course => {
                    if (typeof course === 'object' && course.name) {
                        return course.name;
                    } else {
                        return course.toString();
                    }
                });
                courseText = `Courses: ${courseNames.join(', ')}`;
            }
            // Case 3: Course is a string (ID or name)
            else if (typeof student.studentInfo.course === 'string') {
                // Try to look up the course name from the dropdown
                const courseDropdown = document.querySelector('.filter-select, #class-filter');
                if (courseDropdown) {
                    const option = Array.from(courseDropdown.options).find(opt => 
                        opt.value === student.studentInfo.course
                    );
                    
                    if (option) {
                        courseText = `Course: ${option.textContent}`;
                    } else {
                        // If not found in dropdown, use the ID and fetch course info if possible
                        courseText = `Course ID: ${student.studentInfo.course}`;
                        
                        // Optionally fetch course name (async)
                        fetchCourseName(student.studentInfo.course)
                            .then(name => {
                                if (name) {
                                    const courseElement = document.querySelector(`.student-item[data-id="${student._id}"] .student-details div:first-child`);
                                    if (courseElement) {
                                        courseElement.innerHTML = `<i class="fas fa-book"></i> Course: ${name}`;
                                    }
                                }
                            })
                            .catch(err => console.warn('Failed to fetch course name:', err));
                    }
                } else {
                    courseText = `Course ID: ${student.studentInfo.course}`;
                }
            }
        }
        
        // Get enrollment date if available
        let enrollmentInfo = '';
        if (student.studentInfo && student.studentInfo.enrollmentDate) {
            const enrollDate = new Date(student.studentInfo.enrollmentDate);
            if (!isNaN(enrollDate.getTime())) {
                enrollmentInfo = `<div><i class="fas fa-calendar-alt"></i> Enrolled: ${enrollDate.toLocaleDateString()}</div>`;
            }
        }
        
        // Get student level if available
        let levelInfo = '';
        if (student.studentInfo && student.studentInfo.currentLevel) {
            levelInfo = `<div><i class="fas fa-layer-group"></i> Level: ${student.studentInfo.currentLevel}</div>`;
        }
        
        // Create student HTML with improved layout
        const studentHTML = `
            <div class="student-item" data-id="${student._id}">
                <div class="student-info">
                    <div class="student-name">${fullName}</div>
                    <div class="student-details">
                        <div><i class="fas fa-book"></i> ${courseText}</div>
                        ${enrollmentInfo}
                        ${levelInfo}
                    </div>
                </div>
                <div class="student-actions">
                    <button class="btn btn-primary view-profile-btn" data-id="${student._id}">View Profile</button>
                </div>
            </div>
        `;
        
        // Add to container
        const studentsList = document.querySelector('.students-list');
        if (studentsList) {
            studentsList.insertAdjacentHTML('beforeend', studentHTML);
        }
        
        // Add button event listeners
        setupStudentButtons(student._id);
    }

    // Helper function to fetch course name from an ID
    function fetchCourseName(courseId) {
        return new Promise((resolve, reject) => {
            // First check if we already have the name in a dropdown
            const courseDropdown = document.querySelector('.filter-select, #class-filter');
            if (courseDropdown) {
                const option = Array.from(courseDropdown.options).find(opt => opt.value === courseId);
                if (option) {
                    resolve(option.textContent);
                    return;
                }
            }
            
            // Otherwise fetch from API
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) {
                resolve(null);
                return;
            }
            
            fetch(`/api/courses/${courseId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch course');
                return response.json();
            })
            .then(data => {
                if (data.success && data.data && data.data.name) {
                    resolve(data.data.name);
                } else {
                    resolve(null);
                }
            })
            .catch(error => {
                console.warn('Error fetching course:', error);
                resolve(null);
            });
        });
    }

    // Setup student action buttons
    function setupStudentButtons(studentId) {
        const viewProfileBtn = document.querySelector(`.view-profile-btn[data-id="${studentId}"]`);
        const contactBtn = document.querySelector(`.contact-btn[data-id="${studentId}"]`);
        
        if (viewProfileBtn) {
            viewProfileBtn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                viewStudentProfile(id);
            });
        }
        
        if (contactBtn) {
            contactBtn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                ELC.showNotification('Contact functionality coming soon!', 'info');
            });
        }
    }

    // Function to view student profile
    function viewStudentProfile(studentId) {
        // Show loading notification
        ELC.showNotification('Loading student profile...', 'info');
        
        // Fetch student details from API
        fetch(`/api/students/${studentId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // We have student data, but need to get course info if it's not populated
                const student = data.data;
                
                if (student.studentInfo && student.studentInfo.course && 
                    typeof student.studentInfo.course === 'string') {
                    
                    // Use the courses dropdown for a course name lookup
                    fetchCourseName(student.studentInfo.course)
                        .then(courseName => {
                            // Create a populated course object
                            student.courseDetails = {
                                name: courseName
                            };
                            // Show modal with all data
                            showStudentProfileModal(student);
                        })
                        .catch(error => {
                            console.warn('Could not fetch course name:', error);
                            // Still show modal even if course name fetch fails
                            showStudentProfileModal(student);
                        });
                } else {
                    // Course info already populated or not present
                    showStudentProfileModal(student);
                }
            } else {
                ELC.showNotification('Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching student profile:', error);
            ELC.showNotification('Failed to load student profile. Please try again.', 'error');
        });
    }
// Function to display student profile modal - updated version
function showStudentProfileModal(student) {
    try {
        // Format dates
        const dob = student.studentInfo.dateOfBirth ? new Date(student.studentInfo.dateOfBirth).toLocaleDateString() : 'Not provided';
        
        // Get course name
        let courseName = 'Not enrolled';
        let enrollmentDate = 'Not available';
        
        // Try different properties where course info might be stored
        if (student.courseDetails && student.courseDetails.name) {
            courseName = student.courseDetails.name;
            
            // We need to fetch course details to get enrollment information
            fetchCourseDetails(student.studentInfo.course)
                .then(courseData => {
                    if (courseData) {
                        // Find this student in the course's student array
                        const studentInCourse = courseData.students.find(s => 
                            typeof s === 'object' ? s.student === student._id : s === student._id
                        );
                        
                        if (studentInCourse && studentInCourse.enrollmentDate) {
                            // Update enrollment date in the modal if found
                            const enrollmentElem = document.querySelector('#enrollment-date-display');
                            if (enrollmentElem) {
                                const formattedDate = new Date(studentInCourse.enrollmentDate).toLocaleDateString();
                                enrollmentElem.textContent = formattedDate;
                            }
                        }
                    }
                })
                .catch(err => console.warn('Could not fetch enrollment details from course:', err));
        } else if (student.studentInfo && student.studentInfo.course) {
            if (typeof student.studentInfo.course === 'object' && student.studentInfo.course.name) {
                courseName = student.studentInfo.course.name;
            } else {
                courseName = 'Enrolled in course';
                
                // Fetch course details if we only have the ID
                if (typeof student.studentInfo.course === 'string') {
                    fetchCourseDetails(student.studentInfo.course)
                        .then(courseData => {
                            if (courseData) {
                                // Update course name
                                const courseElem = document.querySelector('#course-name-display');
                                if (courseElem && courseData.name) {
                                    courseElem.textContent = courseData.name;
                                }
                                
                                // Find this student in the course's student array
                                const studentInCourse = courseData.students.find(s => 
                                    typeof s === 'object' ? s.student === student._id : s === student._id
                                );
                                
                                if (studentInCourse && studentInCourse.enrollmentDate) {
                                    // Update enrollment date in the modal if found
                                    const enrollmentElem = document.querySelector('#enrollment-date-display');
                                    if (enrollmentElem) {
                                        const formattedDate = new Date(studentInCourse.enrollmentDate).toLocaleDateString();
                                        enrollmentElem.textContent = formattedDate;
                                    }
                                }
                            }
                        })
                        .catch(err => console.warn('Could not fetch course details:', err));
                }
            }
        }
        
        // Use student's enrollment date as a fallback if available
        if (student.studentInfo && student.studentInfo.enrollmentDate) {
            enrollmentDate = new Date(student.studentInfo.enrollmentDate).toLocaleDateString();
        }
        
        // Create modal element directly
        const modal = document.createElement('div');
        modal.id = 'student-profile-modal';
        modal.className = 'modal';
        modal.style.display = 'block';
        
        // Set the modal content - without Edit button
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Student Profile: ${student.fullName}</h2>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="student-info-section">
                        <h3>Basic Information</h3>
                        <p><strong>Student ID:</strong> ${student.studentInfo.studentId}</p>
                        <p><strong>Email:</strong> ${student.email}</p>
                        <p><strong>Phone:</strong> ${student.phone}</p>
                        <p><strong>Date of Birth:</strong> ${dob}</p>
                        <p><strong>Username:</strong> ${student.username}</p>
                    </div>
                    
                    <div class="enrollment-section">
                        <h3>Enrollment Information</h3>
                        <p><strong>Current Level:</strong> ${student.studentInfo.currentLevel}</p>
                        <p><strong>Course:</strong> <span id="course-name-display">${courseName}</span></p>
                        <p><strong>Enrollment Date:</strong> <span id="enrollment-date-display">${enrollmentDate}</span></p>
                        <p><strong>Status:</strong> <span class="status-badge ${student.studentInfo.status}">${student.studentInfo.status.toUpperCase()}</span></p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-btn">Close</button>
                </div>
            </div>
        `;
        
        // First, remove any existing modals
        document.querySelectorAll('.modal').forEach(existingModal => existingModal.remove());
        
        // Add modal directly to the body
        document.body.appendChild(modal);
        
        // Add close event listeners
        const closeButtons = modal.querySelectorAll('.close, .close-btn');
        if (closeButtons.length > 0) {
            closeButtons.forEach(button => {
                button.addEventListener('click', function() {
                    modal.remove();
                });
            });
        }
        
        // Close when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        console.log('Modal created and displayed successfully');
    } catch (error) {
        console.error('Error displaying student profile modal:', error);
        ELC.showNotification('Error displaying student profile', 'error');
    }
}

// Helper function to fetch course details including enrollment info
function fetchCourseDetails(courseId) {
    return new Promise((resolve, reject) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            reject(new Error('No authentication token found'));
            return;
        }
        
        fetch(`/api/courses/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.success && data.data) {
                resolve(data.data);
            } else {
                reject(new Error('Course data not found'));
            }
        })
        .catch(error => {
            console.error('Error fetching course details:', error);
            reject(error);
        });
    });
}
    // Function to show a message asking user to select a course
    function showSelectCourseMessage() {
        const studentsList = document.querySelector('.students-list');
        if (!studentsList) return;
        
        studentsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>Select a course to view students</h3>
                <p>Please select a course from the dropdown to see enrolled students.</p>
            </div>
        `;
    }

    // Add a refresh button to the students section header
    const studentsHeader = document.querySelector('#students-section .header-with-actions');
    if (studentsHeader && !studentsHeader.querySelector('.refresh-btn')) {
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'btn btn-sm btn-outline-primary refresh-btn';
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        refreshBtn.addEventListener('click', function() {
            applyFilters();
        });
        studentsHeader.appendChild(refreshBtn);
    }
    
    // Also refresh whenever the students tab is clicked
    const studentsTab = document.querySelector('.menu-item[data-section="students"]');
    if (studentsTab) {
        studentsTab.addEventListener('click', function() {
            // Only refresh if a course is selected
            if (classFilter && classFilter.value) {
                setTimeout(function() { 
                    applyFilters(); 
                }, 100); // Short delay to ensure tab is fully loaded
            }
        });
    }

    // Function to apply filters and load students
    function applyFilters() {
        const courseValue = classFilter ? classFilter.value : '';
        const searchValue = searchInput ? searchInput.value.trim() : '';
        
        console.log('Applying student filters:', { course: courseValue, search: searchValue });
        
        // Load filtered students
        loadStudents({
            course: courseValue,
            search: searchValue
        });
    }

    // Add event listeners for filtering
    if (classFilter) {
        classFilter.addEventListener('change', applyFilters);
    }

    if (searchButton) {
        searchButton.addEventListener('click', applyFilters);
    }

    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') applyFilters();
        });
    }

    // Initialize: load teacher's courses for filter first
    loadTeacherCoursesForStudentsFilter();

    // Instead of loading all students immediately, wait for user to select a course
    showSelectCourseMessage();

    // Return public methods for external use
    return {
        refresh: applyFilters,
        refreshCourses: loadTeacherCoursesForStudentsFilter
    };
}

// ===== ASSIGNMENTS SECTION FILTERING =====
function setupAssignmentsFiltering() {
    // More specific selector for the dropdown that's visible in the screenshot
    const classFilter = document.querySelector('#assignments-section select:first-child');
    const statusFilter = document.querySelector('#assignments-section select:nth-child(2)');
    const searchInput = document.querySelector('#assignments-section .search-bar input');
    const searchButton = document.querySelector('#assignments-section .search-bar button');
    const assignmentsList = document.querySelector('.assignments-list');

    // Check if assignments list exists
    if (!assignmentsList) {
        console.error('Assignments list container not found');
        return;
    }

    // Load teacher's courses for the filter dropdown - modified for better error handling
    async function loadTeacherCoursesForFilter() {
        if (!classFilter) {
            console.error('Class filter dropdown not found');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            // Show loading state
            classFilter.innerHTML = '<option value="">Loading your courses...</option>';
            classFilter.disabled = true;
            
            // Fetch teacher's courses from API
            const response = await fetch('/api/teachers/my-courses', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.data && data.data.length > 0) {
                // Start with "All Classes" option
                classFilter.innerHTML = '<option value="">All Classes</option>';
                
                // Add each course to the filter
                data.data.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course._id;
                    option.textContent = `${course.name} (${course.level})`;
                    classFilter.appendChild(option);
                });
            } else {
                classFilter.innerHTML = '<option value="">No courses assigned to you</option>';
            }
        } catch (error) {
            console.error('Error loading teacher courses for filter:', error);
            classFilter.innerHTML = '<option value="">Error loading courses</option>';
        } finally {
            classFilter.disabled = false;
        }
    }

    // Populate status filter with options
    if (statusFilter) {
        statusFilter.innerHTML = `
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="closed">Closed</option>
        `;
    }

    // Function to load assignments from database - only for teacher's courses
    async function loadAssignments(filters = {}) {
        // Show loading state
        assignmentsList.innerHTML = `
            <div class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading assignments...</p>
            </div>
        `;
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            // First, fetch teacher's courses if not filtered by a specific course
            let courseIds = [];
            if (!filters.class) {
                // Get teacher's courses
                const coursesResponse = await fetch('/api/teachers/my-courses', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!coursesResponse.ok) {
                    throw new Error(`HTTP error ${coursesResponse.status}`);
                }
                
                const coursesData = await coursesResponse.json();
                
                // If teacher has no courses, show empty state
                if (!coursesData.success || !coursesData.data || coursesData.data.length === 0) {
                    assignmentsList.innerHTML = '';
                    showAssignmentsEmptyState(true);
                    return;
                }
                
                // Extract course IDs
                courseIds = coursesData.data.map(course => course._id);
                console.log('Teacher courses for assignment filtering:', courseIds);
            } else {
                // If filtering by a specific course, use that ID
                courseIds = [filters.class];
            }
            
            // Build query string from filters
            const queryParams = new URLSearchParams();
            
            // Add course IDs to query
            courseIds.forEach(id => queryParams.append('courseIds', id));
            
            // Add other filters
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.search) queryParams.append('search', filters.search);
            
            console.log('Assignment filter query params:', queryParams.toString());
            
            // Fetch assignments for teacher's courses
            const response = await fetch(`/api/assignments?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Assignments loaded:', data);
            
            // Clear loading indicator
            assignmentsList.innerHTML = '';
            
            if (data.success && data.data && data.data.length > 0) {
                // Add each assignment to the list
                data.data.forEach(assignment => {
                    addAssignmentToList(assignment);
                });
            } else {
                // Show empty state if no assignments found
                showAssignmentsEmptyState(true);
            }
        } catch (error) {
            console.error('Error loading assignments:', error);
            assignmentsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error loading assignments</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    // Function to add assignment to the list
    function addAssignmentToList(assignment) {
        // Format date
        const dueDate = new Date(assignment.dueDate).toLocaleDateString();
        
        // Determine status based on active state and due date
        let status = assignment.isActive ? 'active' : 'closed';
        if (assignment.isActive && new Date(assignment.dueDate) > new Date()) {
            status = 'upcoming';
        }
        
        // Determine status badge class
        let statusClass = 'badge-success'; // active
        if (status === 'upcoming') statusClass = 'badge-primary';
        if (status === 'closed') statusClass = 'badge-secondary';
        
        // Create assignment HTML
        const assignmentHTML = `
            <div class="assignment-item" data-id="${assignment._id}">
                <div class="assignment-header">
                    <div class="assignment-title">${assignment.title}</div>
                    <span class="badge ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                </div>
                <div class="assignment-details">
                    <div><i class="fas fa-book"></i> ${assignment.course && assignment.course.name ? assignment.course.name : 'Unknown'}</div>
                    <div><i class="fas fa-calendar"></i> Due: ${dueDate}</div>
                    <div><i class="fas fa-file-alt"></i> ${assignment.submissions ? assignment.submissions.length : 0}/${assignment.totalStudents || '?'} submitted</div>
                </div>
                <div class="assignment-actions">
                    <button class="btn btn-primary grade-btn" data-id="${assignment._id}"><i class="fas fa-check-square"></i> Grade</button>
                    <button class="btn btn-secondary edit-btn" data-id="${assignment._id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-danger delete-btn" data-id="${assignment._id}"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        `;
        
        // Add to container
        assignmentsList.innerHTML += assignmentHTML;
        
        // Set up button event listeners
        setupAssignmentButtons();
    }

    // Show empty state when no assignments match
    function showAssignmentsEmptyState(show) {
        let emptyState = document.querySelector('#assignments-section .empty-state');
        
        // Create empty state if it doesn't exist
        if (!emptyState) {
            emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <i class="fas fa-tasks"></i>
                <h3>No assignments found</h3>
                <p>There are no assignments matching your search criteria.</p>
                <button class="btn btn-primary create-assignment-btn"><i class="fas fa-plus"></i> Create New Assignment</button>
            `;
            
            // Insert after assignments list
            if (assignmentsList.parentNode) {
                assignmentsList.parentNode.insertBefore(emptyState, assignmentsList.nextSibling);
            }
            
            // Add click event to create button
            const createButton = emptyState.querySelector('.create-assignment-btn');
            if (createButton) {
                createButton.addEventListener('click', function() {
                    // Switch to dashboard and scroll to assignment form
                    const dashboardTab = document.querySelector('.menu-item[data-section="dashboard"]');
                    if (dashboardTab) {
                        dashboardTab.click();
                        setTimeout(() => {
                            const assignmentForm = document.getElementById('createAssignmentForm');
                            if (assignmentForm) assignmentForm.scrollIntoView({ behavior: 'smooth' });
                        }, 300);
                    }
                });
            }
        }
        
        // Show or hide empty state
        if (emptyState) {
            emptyState.style.display = show ? 'block' : 'none';
        }
    }

    // Function to handle filter changes
    function applyFilters() {
        const classValue = classFilter ? classFilter.value : '';
        const statusValue = statusFilter ? statusFilter.value : '';
        const searchValue = searchInput ? searchInput.value.trim() : '';
        
        console.log('Applying assignment filters:', { class: classValue, status: statusValue, search: searchValue });
        
        // Load filtered assignments from API
        loadAssignments({
            class: classValue,
            status: statusValue,
            search: searchValue
        });
    }

    // Add event listeners for filtering
    if (classFilter) classFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    
    if (searchButton) {
        searchButton.addEventListener('click', applyFilters);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') applyFilters();
        });
    }

    // Initialize: load teacher's courses for filter and load initial assignments
    loadTeacherCoursesForFilter(); // Make sure this runs first
    setTimeout(() => loadAssignments(), 500); // Add a delay to ensure courses are loaded first
    
    // Return public methods
    return {
        refresh: loadAssignments,
        refreshCourses: loadTeacherCoursesForFilter // Add this method so it can be called externally
    };
}

// Call this when the page is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize assignments filtering and loading
    const assignmentsModule = setupAssignmentsFiltering();
    
    // Add tab change handler to reload assignments when switching to the tab
    const assignmentsTab = document.querySelector('.menu-item[data-section="assignments"]');
    if (assignmentsTab) {
        assignmentsTab.addEventListener('click', function() {
            console.log('Assignments tab clicked, refreshing assignments');
            if (assignmentsModule && typeof assignmentsModule.refreshCourses === 'function') {
                assignmentsModule.refreshCourses(); // Refresh courses first
                setTimeout(() => {
                    if (assignmentsModule && typeof assignmentsModule.refresh === 'function') {
                        assignmentsModule.refresh(); // Then refresh assignments after a delay
                    }
                }, 500);
            }
        });
    }
});


// ===== ASSIGNMENT FUNCTIONS =====
// Update gradeAssignment to pass assignment ID
function gradeAssignment(assignmentId) {
    console.group('Grade Assignment Debug');
    console.log('Assignment ID:', assignmentId);

    if (!assignmentId) {
        console.error('Invalid assignment ID');
        console.groupEnd();
        ELC.showNotification('Invalid assignment ID', 'error');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authentication token');
        console.groupEnd();
        ELC.showNotification('Authentication required', 'error');
        return;
    }

    ELC.showNotification('Loading submissions...', 'info');

    fetch(`/api/assignments/${assignmentId}/submissions`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            return response.text().then(text => {
                console.error('Error response body:', text);
                throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Received data:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            // Ensure assignment ID is passed to the modal
            const modalData = {
                ...data.data,
                id: assignmentId
            };
            displayGradingModal(modalData);
        } else {
            throw new Error(data.message || 'Failed to load submissions');
        }
        console.groupEnd();
    })
    .catch(error => {
        console.error('Error in gradeAssignment:', error);
        console.groupEnd();
        
        ELC.showNotification(`Failed to load submissions: ${error.message}`, 'error');
    });
}
// Function to load materials from database for teacher's courses only
async function loadMaterialsFromDatabase() {
    const materialsList = document.querySelector('.materials-list');
    if (!materialsList) return;
    
    try {
        // Show loading state
        materialsList.innerHTML = `
            <div class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading materials...</p>
            </div>
        `;
        
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        // First, fetch teacher's courses
        const coursesResponse = await fetch('/api/teachers/my-courses', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!coursesResponse.ok) {
            throw new Error(`HTTP error ${coursesResponse.status}`);
        }
        
        const coursesData = await coursesResponse.json();
        
        // If teacher has no courses, show empty state
        if (!coursesData.success || !coursesData.data || coursesData.data.length === 0) {
            materialsList.innerHTML = '';
            showMaterialsEmptyState(true);
            return;
        }
        
        // Extract course IDs
        const courseIds = coursesData.data.map(course => course._id);
        
        // Now fetch materials, filtered by teacher's courses
        const queryParams = new URLSearchParams();
        courseIds.forEach(id => queryParams.append('courseIds[]', id));
        
        const materialsResponse = await fetch(`/api/materials?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!materialsResponse.ok) {
            throw new Error(`HTTP error ${materialsResponse.status}`);
        }
        
        const materialsData = await materialsResponse.json();
        console.log('Materials data received:', materialsData);
        
        if (materialsData.success && materialsData.data && materialsData.data.length > 0) {
            // Clear loading indicator
            materialsList.innerHTML = '';
            
            // Add each material to the list
            materialsData.data.forEach(material => {
                addMaterialToList(material);
            });
        } else {
            // Show empty state if no materials
            materialsList.innerHTML = '';
            showMaterialsEmptyState(true);
        }
        
    } catch (error) {
        console.error('Error fetching materials:', error);
        materialsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error loading materials</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}
// Function to load assignments from database - only for teacher's courses
async function loadAssignments(filters = {}) {
    // Show loading state
    assignmentsList.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading assignments...</p>
        </div>
    `;
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        // First, fetch teacher's courses if not filtered by a specific course
        let courseIds = [];
        if (!filters.class) {
            // Get teacher's courses
            const coursesResponse = await fetch('/api/teachers/my-courses', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!coursesResponse.ok) {
                throw new Error(`HTTP error ${coursesResponse.status}`);
            }
            
            const coursesData = await coursesResponse.json();
            
            // If teacher has no courses, show empty state
            if (!coursesData.success || !coursesData.data || coursesData.data.length === 0) {
                assignmentsList.innerHTML = '';
                showAssignmentsEmptyState(true);
                return;
            }
            
            // Extract course IDs
            courseIds = coursesData.data.map(course => course._id);
            console.log('Teacher courses for assignment filtering:', courseIds);
        } else {
            // If filtering by a specific course, use that ID
            courseIds = [filters.class];
        }
        
        // Build query string from filters
        const queryParams = new URLSearchParams();
        
        // Add course IDs to query - use courseIds (not courseIds[])
        courseIds.forEach(id => queryParams.append('courseIds', id));
        
        // Add other filters
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.search) queryParams.append('search', filters.search);
        
        console.log('Assignment filter query params:', queryParams.toString());
        
        // Fetch assignments for teacher's courses
        const response = await fetch(`/api/assignments?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Assignments loaded:', data);
        
        // Clear loading indicator
        assignmentsList.innerHTML = '';
        
        if (data.success && data.data && data.data.length > 0) {
            // Add each assignment to the list
            data.data.forEach(assignment => {
                addAssignmentToList(assignment);
            });
        } else {
            // Show empty state if no assignments found
            showAssignmentsEmptyState(true);
        }
    } catch (error) {
        console.error('Error loading assignments:', error);
        assignmentsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error loading assignments</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Function to add assignment to the list
function addAssignmentToList(assignment) {
    // Format date
    const dueDate = new Date(assignment.dueDate).toLocaleDateString();
    
    // Determine status based on active state and due date
    let status = assignment.isActive ? 'active' : 'closed';
    if (assignment.isActive && new Date(assignment.dueDate) > new Date()) {
        status = 'upcoming';
    }
    
    // Determine status badge class
    let statusClass = 'badge-success';
    
    // Create assignment HTML
    const assignmentHTML = `
        <div class="assignment-item" data-id="${assignment._id}">
            <div class="assignment-header">
                <div class="assignment-title">${assignment.title}</div>
                <span class="badge ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </div>
            <div class="assignment-details">
                <div><i class="fas fa-book"></i> ${assignment.course && assignment.course.name ? assignment.course.name : 'Unknown'}</div>
                <div><i class="fas fa-calendar"></i> Due: ${dueDate}</div>
                <div><i class="fas fa-file-alt"></i> ${assignment.submissions ? assignment.submissions.length : 0}/${assignment.totalStudents || '?'} submitted</div>
            </div>
            <div class="assignment-actions">
                <button class="btn btn-primary grade-btn" data-id="${assignment._id}"><i class="fas fa-check-square"></i> Grade</button>
                <button class="btn btn-secondary edit-btn" data-id="${assignment._id}"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn btn-danger delete-btn" data-id="${assignment._id}"><i class="fas fa-trash"></i> Delete</button>
            </div>
        </div>
    `;
    
    // Add to container
    assignmentsList.innerHTML += assignmentHTML;
    
    // Set up button event listeners
    setupAssignmentButtons();
}

// Initialize the page when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    setupTabNavigation();
    
    // Remove any existing event listeners from buttons
    replaceAllButtons();
    
    // Setup filtering for all sections
    const materialsModule = setupMaterialsFiltering();
    const assignmentsModule = setupAssignmentsFiltering();
    setupStudentsFiltering();
    setupProgressReportsFiltering();
    
    // Add button event listeners
    addButtonListeners();
    
    // Add required CSS styles
    addModalStyles();
    addFileUploadStyles();
    
    // Initialize material upload functionality
    const uploadMaterialForm = document.getElementById('uploadMaterialForm');
    if (uploadMaterialForm && !uploadMaterialForm.hasAttribute('data-initialized')) {
        console.log('Initializing material upload functionality');
        setupMaterialUpload();
        fixFileUploadDisplay();
    }
    
    // Setup material actions
    setupMaterialActions();
    
    // Setup material type field selection
    setupMaterialTypeField();
    
    // Initialize report form
    initializeReportForm();
    
    // Add tab change handlers to refresh content when tabs are clicked
    const materialsTab = document.querySelector('.menu-item[data-section="materials"]');
    if (materialsTab) {
        materialsTab.addEventListener('click', function() {
            console.log('Materials tab clicked, refreshing materials');
            if (materialsModule && typeof materialsModule.refresh === 'function') {
                materialsModule.refresh();
            }
        });
    }
    
    const assignmentsTab = document.querySelector('.menu-item[data-section="assignments"]');
    if (assignmentsTab) {
        assignmentsTab.addEventListener('click', function() {
            console.log('Assignments tab clicked, refreshing assignments');
            if (assignmentsModule && typeof assignmentsModule.refresh === 'function') {
                assignmentsModule.refresh();
            }
        });
    }
    
    // Log initialization complete
    console.log('Page initialization complete');
});
function displayGradingModal(assignmentData) {
    console.group('Display Grading Modal Debug');
    
    // Remove any existing modal
    const existingModal = document.getElementById('grading-modal');
    if (existingModal) {
        existingModal.remove();
    }

    try {
        // Ensure submissions is an array
        const submissions = Array.isArray(assignmentData.submissions) 
            ? assignmentData.submissions 
            : [];

        // Create a full div element instead of using innerHTML
        const modal = document.createElement('div');
        modal.id = 'grading-modal';
        modal.className = 'modal';

        // Create modal content
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Grade: ${assignmentData.title || 'Untitled Assignment'}</h2>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="assignment-info">
                        <p><strong>Class:</strong> ${assignmentData.className || 'Unknown'}</p>
                        <p><strong>Due Date:</strong> ${assignmentData.dueDate ? new Date(assignmentData.dueDate).toLocaleDateString() : 'Not specified'}</p>
                        <p><strong>Total Points:</strong> ${assignmentData.totalPoints || 100}</p>
                        <p><strong>Submissions:</strong> ${submissions.length}/${assignmentData.totalStudents || 0}</p>
                    </div>
                    <div class="submissions-list">
                        ${submissions.length === 0 
                            ? '<p class="empty-state">No submissions yet.</p>' 
                            : submissions.map(submission => `
                                <div class="submission-card">
                                    <div class="submission-header">
                                        <h3>${submission.studentName || 'Unknown Student'}</h3>
                                        <p>Submitted: ${submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A'}</p>
                                    </div>
                                    <div class="submission-content">
                                        ${submission.fileUrl ? 
                                            `<p><a href="${submission.fileUrl}" target="_blank"><i class="fas fa-file"></i> ${submission.fileName || 'Submitted File'}</a></p>` : ''}
                                        <div class="submission-text">
                                            ${submission.content || 'No text content submitted.'}
                                        </div>
                                    </div>
                                    <div class="grading-form">
                                        <div class="form-group">
                                            <label for="grade-${submission.studentId}">Grade (out of ${assignmentData.totalPoints || 100})</label>
                                            <input type="number" id="grade-${submission.studentId}" class="form-control" 
                                                min="0" max="${assignmentData.totalPoints || 100}" value="${submission.grade || ''}">
                                        </div>
                                        <div class="form-group">
                                            <label for="feedback-${submission.studentId}">Feedback</label>
                                            <textarea id="feedback-${submission.studentId}" class="form-control" rows="3">${submission.feedback || ''}</textarea>
                                        </div>
                                        <button type="button" class="btn btn-primary save-grade-btn" 
                                                data-student-id="${submission.studentId}" 
                                                data-assignment-id="${assignmentData.id || assignmentData._id || ''}">
                                            Save Grade
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal-btn">Close</button>
                </div>
            </div>
        `;

        // Add event listeners
        const closeButton = modal.querySelector('.close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        }

        const closeModalBtn = modal.querySelector('.close-modal-btn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        }

        // Set up save grade buttons
        const saveButtons = modal.querySelectorAll('.save-grade-btn');
        saveButtons.forEach(button => {
            button.addEventListener('click', function() {
                const studentId = this.getAttribute('data-student-id');
                const assignmentId = this.getAttribute('data-assignment-id');
                
                const gradeInput = document.getElementById(`grade-${studentId}`);
                const feedbackInput = document.getElementById(`feedback-${studentId}`);
                
                const grade = gradeInput ? gradeInput.value : '';
                const feedback = feedbackInput ? feedbackInput.value : '';
                
                if (studentId && assignmentId) {
                    saveGrade(assignmentId, studentId, grade, feedback, this);
                } else {
                    console.error('Missing studentId or assignmentId');
                    ELC.showNotification('Error: Invalid student or assignment', 'error');
                }
            });
        });

        // Append to body
        document.body.appendChild(modal);

        console.log('Modal successfully created');
        console.groupEnd();

    } catch (error) {
        console.error('Error creating modal:', error);
        console.groupEnd();
        ELC.showNotification(`Failed to create grading modal: ${error.message}`, 'error');
    }
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
// Update editAssignment function
function editAssignment(assignmentId) {
    console.group('Edit Assignment Debug');
    console.log('Assignment ID:', assignmentId);

    // Validate assignmentId
    if (!assignmentId) {
        console.error('Invalid assignment ID');
        console.groupEnd();
        ELC.showNotification('Invalid assignment ID', 'error');
        return;
    }

    // Show loading notification
    ELC.showNotification('Loading assignment details...', 'info');
    
    // Get authentication token
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authentication token');
        console.groupEnd();
        ELC.showNotification('Authentication required', 'error');
        return;
    }

    // Fetch assignment details from API
    fetch(`/api/assignments/${assignmentId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            return response.text().then(text => {
                console.error('Error response body:', text);
                throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Received data:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            displayEditModal(data.data);
        } else {
            throw new Error(data.message || 'Failed to load assignment details');
        }
        console.groupEnd();
    })
    .catch(error => {
        console.error('Error fetching assignment details:', error);
        console.groupEnd();
        ELC.showNotification('Failed to load assignment details. Please try again.', 'error');
    });
}
function displayEditModal(assignment) {
    // Comprehensive logging
    console.group('Display Edit Modal Debug');
    console.log('Assignment Data:', assignment);

    // Remove any existing modal
    const existingModal = document.getElementById('edit-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Safely handle date conversion
    let formattedDate = '';
    try {
        const dueDate = assignment.dueDate 
            ? new Date(assignment.dueDate) 
            : null;
        
        if (dueDate && !isNaN(dueDate.getTime())) {
            formattedDate = dueDate.toISOString().split('T')[0];
        } else {
            const today = new Date();
            formattedDate = today.toISOString().split('T')[0];
            console.warn('Invalid due date, using current date');
        }
    } catch (error) {
        console.error('Error formatting date:', error);
        const today = new Date();
        formattedDate = today.toISOString().split('T')[0];
    }

    // Create modal element
    const modal = document.createElement('div');
    modal.id = 'edit-modal';
    modal.className = 'modal';

    // Escape HTML utility
    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // Create modal content
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Assignment</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="edit-assignment-form">
                    <div class="form-group">
                        <label for="edit-title">Title</label>
                        <input type="text" id="edit-title" class="form-control" 
                            value="${assignment.title ? escapeHtml(assignment.title) : ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-instructions">Instructions</label>
                        <textarea id="edit-instructions" class="form-control" rows="4" required>
                            ${assignment.instructions ? escapeHtml(assignment.instructions) : ''}
                        </textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group half-width">
                            <label for="edit-due-date">Due Date</label>
                            <input type="date" id="edit-due-date" class="form-control" 
                                value="${formattedDate}" required>
                        </div>
                        
                        <div class="form-group half-width">
                            <label for="edit-points">Total Points</label>
                            <input type="number" id="edit-points" class="form-control" 
                                min="1" max="100" 
                                value="${assignment.totalPoints || 100}" required>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal-btn">Cancel</button>
                <button class="btn btn-primary" id="save-edit-btn" 
                        data-id="${assignment._id}">Save Changes</button>
            </div>
        </div>
    `;

    // Append to body
    document.body.appendChild(modal);

    // Track changes to form fields in real-time
    const formFields = {
        title: document.getElementById('edit-title'),
        instructions: document.getElementById('edit-instructions'),
        dueDate: document.getElementById('edit-due-date'),
        totalPoints: document.getElementById('edit-points')
    };

    // Create an updatedAssignment object that will store changes
    const updatedAssignment = { ...assignment };

    // Add event listeners to track changes on each field
    Object.keys(formFields).forEach(field => {
        if (formFields[field]) {
            formFields[field].addEventListener('change', function() {
                let value = this.value;
                
                // Convert values to appropriate types
                if (field === 'totalPoints') {
                    value = parseInt(value, 10);
                } else if (field === 'dueDate') {
                    value = new Date(value);
                }
                
                // Update our tracking object
                updatedAssignment[field] = value;
                console.log(`Field ${field} updated to:`, value);
            });
        }
    });

    // Safely add event listeners
    try {
        // Close button
        const closeButton = modal.querySelector('.close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        } else {
            console.warn('Close button not found');
        }

        // Close modal button
        const closeModalBtn = modal.querySelector('.close-modal-btn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        } else {
            console.warn('Close modal button not found');
        }

        // Save button
        const saveButton = modal.querySelector('#save-edit-btn');
        if (saveButton) {
            saveButton.addEventListener('click', function() {
                const assignmentId = this.getAttribute('data-id');
                
                // Get final values from form
                const title = document.getElementById('edit-title').value.trim();
                const instructions = document.getElementById('edit-instructions').value.trim();
                const dueDate = document.getElementById('edit-due-date').value;
                const totalPoints = parseInt(document.getElementById('edit-points').value, 10);
                
                // Validate required fields
                if (!title || !instructions || !dueDate || isNaN(totalPoints)) {
                    ELC.showNotification('Please fill in all required fields', 'error');
                    return;
                }
                
                // Create update data object following the model structure
                const updateData = {
                    title,
                    instructions,
                    dueDate,
                    totalPoints,
                    isActive: assignment.isActive, // Keep the original active status
                    course: assignment.course, // Keep the original course
                    // Keep existing data that wasn't edited
                    submissions: assignment.submissions || [],
                    attachments: assignment.attachments || [],
                    createdBy: assignment.createdBy,
                    updatedAt: new Date()
                };
                
                // Show loading state
                saveButton.disabled = true;
                saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                
                // Call the update function
                updateAssignment(assignmentId, updateData);
            });
        } else {
            console.warn('Save button not found');
        }

    } catch (error) {
        console.error('Error setting up modal event listeners:', error);
        ELC.showNotification('Failed to set up modal. Please try again.', 'error');
    }

    // Close modal when clicking outside
    const outsideClickHandler = (event) => {
        if (event.target === modal) {
            document.body.removeChild(modal);
            // Remove the event listener to prevent memory leaks
            window.removeEventListener('click', outsideClickHandler);
        }
    };
    window.addEventListener('click', outsideClickHandler);

    console.groupEnd();
}

// Utility function to escape HTML to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function updateAssignment(assignmentId, data) {
    // Show loading notification
    ELC.showNotification('Updating assignment...', 'info');
    
    // Get token for authentication
    const token = localStorage.getItem('token');
    if (!token) {
        ELC.showNotification('Authentication required', 'error');
        return;
    }
    
    // Send to API
    fetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Show success notification
            ELC.showNotification('Assignment updated successfully!', 'success');
            
            // Close modal
            const modal = document.getElementById('edit-modal');
            if (modal) modal.remove();
            
            // Update UI to reflect changes
            updateAssignmentInUI(assignmentId, data.data || data);
            
            // Optional: Reload assignments list
            if (typeof loadAssignments === 'function') {
                loadAssignments();
            }
        } else {
            // Show error notification
            ELC.showNotification('Error: ' + (data.message || 'Failed to update assignment'), 'error');
        }
    })
    .catch(error => {
        console.error('Error updating assignment:', error);
        ELC.showNotification('Failed to update assignment: ' + error.message, 'error');
    });
}

// Function to update assignment item in the UI
function updateAssignmentInUI(assignmentId, data) {
    const assignmentItem = document.querySelector(`.assignment-item[data-id="${assignmentId}"]`);
    if (!assignmentItem) return;
    
    // Update title
    const titleElement = assignmentItem.querySelector('.assignment-title');
    if (titleElement) titleElement.textContent = data.title;
    
    // Update due date
    const dueDateElement = assignmentItem.querySelector('.assignment-details div:nth-child(2)');
    if (dueDateElement) {
        const formattedDate = new Date(data.dueDate).toLocaleDateString();
        dueDateElement.innerHTML = `<i class="fas fa-calendar"></i> Due: ${formattedDate}`;
    }
    
    // Update status badge
    const statusBadge = assignmentItem.querySelector('.badge');
    if (statusBadge) {
        // Determine status text and class
        let status = data.isActive ? 'active' : 'closed';
        if (data.isActive && new Date(data.dueDate) > new Date()) {
            status = 'upcoming';
        }
        
        // Update badge class
        statusBadge.className = 'badge';
        if (status === 'active') statusBadge.classList.add('badge-success');
        else if (status === 'upcoming') statusBadge.classList.add('badge-primary');
        else statusBadge.classList.add('badge-secondary');
        
        // Update badge text
        statusBadge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
}
// Function to load assignments data
function loadAssignmentsData() {
    // Show loading indicator
    const assignmentsContainer = document.querySelector('.assignments-list');
    if (assignmentsContainer) {
        assignmentsContainer.innerHTML = `
            <div class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading assignments...</p>
            </div>
        `;
    }
    
    // Fetch assignments from API
    fetch('/api/assignments')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayAssignments(data.data);
            } else {
                ELC.showNotification('Error: ' + data.message, 'error');
                
                if (assignmentsContainer) {
                    assignmentsContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-exclamation-circle"></i>
                            <h3>Error loading assignments</h3>
                            <p>${data.message}</p>
                        </div>
                    `;
                }
            }
        })
        .catch(error => {
            console.error('Error fetching assignments:', error);
            ELC.showNotification('Failed to load assignments. Please try again.', 'error');
            
            if (assignmentsContainer) {
                assignmentsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>Error loading assignments</h3>
                        <p>Failed to load assignments. Please try again.</p>
                    </div>
                `;
            }
        });
}

// Function to display assignments
function displayAssignments(assignments) {
    const assignmentsContainer = document.querySelector('.assignments-list');
    if (!assignmentsContainer) return;
    
    // Clear container
    assignmentsContainer.innerHTML = '';
    
    // If no assignments, show empty state
    if (assignments.length === 0) {
        assignmentsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>No assignments found</h3>
                <p>There are no assignments created yet.</p>
                <button class="btn btn-primary create-assignment-btn"><i class="fas fa-plus"></i> Create New Assignment</button>
            </div>
        `;
        
        // Add click event to create assignment button
        const createAssignmentBtn = assignmentsContainer.querySelector('.create-assignment-btn');
        if (createAssignmentBtn) {
            createAssignmentBtn.addEventListener('click', function() {
                // Switch to dashboard and scroll to assignment form
                const dashboardTab = document.querySelector('.menu-item[data-section="dashboard"]');
                if (dashboardTab) {
                    dashboardTab.click();
                    setTimeout(() => {
                        const assignmentForm = document.getElementById('createAssignmentForm');
                        if (assignmentForm) assignmentForm.scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                }
            });
        }
        
        return;
    }
    
    // Add each assignment to the container
    assignments.forEach(assignment => {
        // Format date
        const dueDate = new Date(assignment.dueDate).toLocaleDateString();
        
        // Determine status badge class
        let statusClass = 'badge-success';
        if (assignment.status === 'upcoming') statusClass = 'badge-primary';
        if (assignment.status === 'closed') statusClass = 'badge-secondary';
        
        // Create assignment HTML
        const assignmentHTML = `
            <div class="assignment-item" data-id="${assignment._id}">
                <div class="assignment-header">
                    <div class="assignment-title">${assignment.title}</div>
                    <span class="badge ${statusClass}">${assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}</span>
                </div>
                <div class="assignment-details">
                    <div><i class="fas fa-book"></i> ${assignment.className}</div>
                    <div><i class="fas fa-calendar"></i> Due: ${dueDate}</div>
                    <div><i class="fas fa-file-alt"></i> ${assignment.submissionCount}/${assignment.totalStudents} submitted</div>
                </div>
                <div class="assignment-actions">
                    <button class="btn btn-primary" data-id="${assignment._id}"><i class="fas fa-check-square"></i> Grade</button>
                    <button class="btn btn-secondary" data-id="${assignment._id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-danger" data-id="${assignment._id}"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        `;
        
        // Add to container
        assignmentsContainer.innerHTML += assignmentHTML;
    });
    
    // Setup buttons
    setupAssignmentButtons();
}

// Function to setup assignment buttons
function setupAssignmentButtons() {
    // Grade buttons
    document.querySelectorAll('.assignments-list .btn-primary').forEach(button => {
        button.addEventListener('click', function() {
            const assignmentId = this.getAttribute('data-id');
            gradeAssignment(assignmentId);
        });
    });
    
    // Edit buttons
    document.querySelectorAll('.assignments-list .btn-secondary').forEach(button => {
        button.addEventListener('click', function() {
            const assignmentId = this.getAttribute('data-id');
            editAssignment(assignmentId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.assignments-list .btn-danger').forEach(button => {
        button.addEventListener('click', function() {
            const assignmentId = this.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this assignment?')) {
                deleteAssignment(assignmentId);
            }
        });
    });
}
// Function to delete assignment
function deleteAssignment(assignmentId) {
    // Show loading notification
    ELC.showNotification('Deleting assignment...', 'info');
    
    // Get token for authentication
    const token = localStorage.getItem('token');
    if (!token) {
        ELC.showNotification('Authentication required', 'error');
        return;
    }
    
    // Send to API
    fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Show success notification
            ELC.showNotification('Assignment deleted successfully!', 'success');
            
            // Remove the assignment from the UI
            const assignmentElement = document.querySelector(`.assignment-item[data-id="${assignmentId}"]`);
            if (assignmentElement) {
                assignmentElement.remove();
            }
            
            // Check if assignments list is empty
            const assignmentItems = document.querySelectorAll('.assignment-item');
            if (assignmentItems.length === 0) {
                // Reload to show empty state
                if (typeof loadAssignmentsData === 'function') {
                    loadAssignmentsData();
                } else if (typeof loadAssignments === 'function') {
                    loadAssignments();
                }
            }
        } else {
            // Show error notification
            ELC.showNotification('Error: ' + (data.message || 'Failed to delete assignment'), 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting assignment:', error);
        ELC.showNotification('Failed to delete assignment: ' + error.message, 'error');
    });
}
// Function to setup progress reports filtering and displaying
function setupProgressReportsFiltering() {
    // Get the filter elements
    const classFilter = document.querySelector('#progress-section select:first-child, #class-filter');
    const typeFilter = document.querySelector('#progress-section select:nth-child(2), #type-filter');
    const reportsContainer = document.querySelector('.reports-list') || document.getElementById('reports-container');
    const emptyStateContainer = document.querySelector('.empty-state') || document.querySelector('#progress-section .empty-state');
    
    // Check if reports container exists
    if (!reportsContainer) {
        console.error('Reports list container not found');
        return;
    }

    // Load teacher's courses for the filter dropdown
    async function loadTeacherCoursesForFilter() {
        if (!classFilter) return;
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            // Show loading state
            classFilter.innerHTML = '<option value="">Loading your courses...</option>';
            classFilter.disabled = true;
            
            // Fetch teacher's courses from API
            const response = await fetch('/api/teachers/my-courses', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Teacher courses loaded for reports filter:', data);
            
            if (data.success && data.data && data.data.length > 0) {
                // Start with "All Classes" option
                classFilter.innerHTML = '<option value="">All Classes</option>';
                
                // Add each course to the filter
                data.data.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course._id;
                    option.textContent = `${course.name} (${course.level})`;
                    classFilter.appendChild(option);
                });
            } else {
                classFilter.innerHTML = '<option value="">No courses assigned to you</option>';
            }
        } catch (error) {
            console.error('Error loading teacher courses for filter:', error);
            classFilter.innerHTML = '<option value="">Error loading courses</option>';
        } finally {
            classFilter.disabled = false;
        }
    }

    // Populate type filter with report types
    if (typeFilter) {
        typeFilter.innerHTML = `
            <option value="">All Report Types</option>
            <option value="individual">Individual Reports</option>
            <option value="class">Class Reports</option>
        `;
    }

    // Function to load reports with filtering
    async function loadReports(filters = {}) {
        // Show loading indicator
        reportsContainer.innerHTML = `
            <div class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading reports...</p>
            </div>
        `;
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            // Build query string from filters
            const queryParams = new URLSearchParams();
            
            // Add course filter if specified
            if (filters.class) {
                queryParams.append('courseIds', filters.class);
            }
            
            // Add type filter if specified
            if (filters.type) {
                queryParams.append('type', filters.type);
            }
            
            console.log('Reports filter query params:', queryParams.toString());
            
            // Use the teacher's reports API endpoint with filters
            const apiUrl = `/api/reports/teacher${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            console.log('Fetching reports from:', apiUrl);
            
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Reports data received:', data);
            
            // Clear loading indicator
            reportsContainer.innerHTML = '';
            
            if (data.success && data.data && data.data.length > 0) {
                // Hide empty state if visible
                if (emptyStateContainer) {
                    emptyStateContainer.style.display = 'none';
                }
                
                // Add each report to the list
                data.data.forEach(report => {
                    addReportToList(report);
                });
            } else {
                // Show empty state if no reports found
                showEmptyState(true);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            reportsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error loading reports</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    // Function to add a report to the list
    function addReportToList(report) {
        // Format date
        const createdDate = new Date(report.createdAt).toLocaleDateString();
        
        // Get course name
        let courseName = 'Unknown Course';
        if (report.course) {
            if (typeof report.course === 'object' && report.course.name) {
                courseName = report.course.name;
            } else if (typeof report.course === 'string') {
                // Try to find course name from dropdown
                const courseOption = classFilter.querySelector(`option[value="${report.course}"]`);
                if (courseOption) {
                    courseName = courseOption.textContent;
                }
            }
        }
        
        // Create report item element
        const reportItem = document.createElement('div');
        reportItem.className = 'report-item';
        reportItem.setAttribute('data-id', report._id);
        
        // Set icon based on report type
        const typeIcon = report.type === 'individual' ? 'fa-user' : 'fa-users';
        const typeText = report.type === 'individual' ? 'Individual Report' : 'Class Report';
        
        // Build HTML content
        reportItem.innerHTML = `
            <div class="report-info">
                <div class="report-title">${report.title}</div>
                <div class="report-details">
                    <div><i class="fas fa-book"></i> ${courseName}</div>
                    <div><i class="fas fa-calendar"></i> Generated: ${createdDate}</div>
                    <div><i class="fas ${typeIcon}"></i> ${typeText}</div>
                </div>
            </div>
            <div class="report-actions">
                <button class="btn btn-primary view-report-btn" data-id="${report._id}">
                    <i class="fas fa-eye"></i> View Report
                </button>
                <button class="btn btn-secondary download-pdf-btn" data-id="${report._id}">
                    <i class="fas fa-download"></i> Download PDF
                </button>
            </div>
        `;
        
        // Add to container
        reportsContainer.appendChild(reportItem);
        
        // Add button event listeners
        setupReportButtons(reportItem);
    }

    // Function to setup report action buttons
    function setupReportButtons(reportItem) {
        if (!reportItem) return;
        
        const viewBtn = reportItem.querySelector('.view-report-btn');
        const downloadBtn = reportItem.querySelector('.download-pdf-btn');
        
        if (viewBtn) {
            viewBtn.addEventListener('click', function() {
                const reportId = this.getAttribute('data-id');
                viewReport(reportId);
            });
        }
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                const reportId = this.getAttribute('data-id');
                downloadReport(reportId);
            });
        }
    }
// Function to view a report
function viewReport(reportId) {
    if (!reportId) return;
    
    // Check if user is authenticated
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
        ELC.showNotification('Authentication required. Please log in again.', 'error');
        return;
    }
    
    // Show loading notification
    ELC.showNotification('Loading report...', 'info');
    
    // Fetch report details with authentication token
    fetch(`/api/reports/${reportId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        // Check if response indicates authentication issues
        if (response.status === 401 || response.status === 403) {
            throw new Error('Authentication failed. Please log in again.');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Show report in modal
            showReportModal(data.data);
        } else {
            ELC.showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error fetching report:', error);
        
        // Check if error is authentication related
        if (error.message.includes('Authentication')) {
            ELC.showNotification(error.message, 'error');
        } else {
            ELC.showNotification('Failed to load report: ' + error.message, 'error');
        }
    });
}
// Function to show a report modal
function showReportModal(report) {
    // Check if report exists
    if (!report) {
        console.error('No report data provided to showReportModal');
        ELC.showNotification('Error loading report data', 'error');
        return;
    }

    try {
        // Clear any existing modals
        const existingModals = document.querySelectorAll('.modal');
        existingModals.forEach(modal => modal.remove());
        
        // Format date
        const createdDate = new Date(report.createdAt).toLocaleString();
        
        // Get course name
        let courseName = 'Unknown Course';
        if (report.course) {
            if (typeof report.course === 'object' && report.course.name) {
                courseName = report.course.name;
            }
        }
        
        // Create a new modal element directly (instead of using innerHTML)
        const modal = document.createElement('div');
        modal.id = 'report-modal';
        modal.className = 'modal';
        modal.style.display = 'block'; // Ensure it's visible
        
        // Set the modal content directly
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${report.title || 'Report Details'}</h2>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="report-info" style="margin-bottom: 20px; padding: 15px; background-color: #f9fafc; border-radius: 8px;">
                        <p><strong>Type:</strong> ${report.type === 'individual' ? 'Individual Report' : 'Class Report'}</p>
                        <p><strong>Course:</strong> ${courseName}</p>
                        <p><strong>Generated:</strong> ${createdDate}</p>
                    </div>
                    
                    <div class="report-content">
                        ${report.description || 'No description provided.'}
                    </div>
                    
                    ${report.file ? `
                        <div class="report-attachment" style="margin-top: 20px; padding: 15px; background-color: #f9fafc; border-radius: 8px;">
                            <p><strong>Attachment:</strong></p>
                            <a href="/api/reports/${report._id}/file" class="btn btn-secondary" target="_blank">
                                <i class="fas fa-download"></i> Download Attachment
                            </a>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-btn">Close</button>
                    <a href="/api/reports/${report._id}/pdf" class="btn btn-primary" target="_blank">
                        <i class="fas fa-download"></i> Download PDF
                    </a>
                </div>
            </div>
        `;
        
        // Append the modal to body
        document.body.appendChild(modal);
        
        console.log('Modal appended to DOM with ID:', modal.id);
        
        // Double-check that the modal exists in the DOM
        const modalCheck = document.getElementById('report-modal');
        if (!modalCheck) {
            throw new Error('Modal not found in DOM after direct append');
        }
        
        // Add close event listeners
        const closeButtons = modal.querySelectorAll('.close, .close-btn');
        if (closeButtons.length > 0) {
            closeButtons.forEach(button => {
                button.addEventListener('click', function() {
                    modal.remove();
                });
            });
        } else {
            console.warn('No close buttons found in modal');
        }
        
        // Close when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        console.log('Modal created and displayed successfully');
    } catch (error) {
        console.error('Error creating modal:', error);
        ELC.showNotification('Could not display report. Please try again.', 'error');
    }
}
// Similarly for downloadReport
function downloadReport(reportId) {
    // Get token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
        ELC.showNotification('Authentication required. Please login again.', 'error');
        return;
    }
    
    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = `/api/reports/${reportId}/pdf?token=${token}`;
    downloadLink.target = '_blank';
    
    // Append to body, click, and remove
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    ELC.showNotification('Downloading report...', 'success');
}

    // Function to show/hide empty state - revised with prioritized hiding
function showEmptyState(show) {
    const emptyStateContainer = document.querySelector('#progress-section .empty-state');
    const reportsContainer = document.querySelector('.reports-list') || document.getElementById('reports-container');
    
    // First, check if there are any visible reports
    const visibleReports = reportsContainer.querySelectorAll('.report-item');
    
    // If we have visible reports, always hide the empty state regardless of the 'show' parameter
    if (visibleReports && visibleReports.length > 0) {
        if (emptyStateContainer) {
            emptyStateContainer.style.display = 'none';
        }
        return;
    }
    
    // If we get here, there are no visible reports, so handle the empty state
    if (emptyStateContainer) {
        emptyStateContainer.style.display = show ? 'block' : 'none';
        return;
    }
    
    // Create empty state if it doesn't exist and we need to show it
    if (show) {
        const emptyStateHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h3>No reports available</h3>
                <p>There are no progress reports matching your filter criteria.</p>
                <button class="btn btn-primary create-report-btn">
                    <i class="fas fa-plus"></i> Create New Report
                </button>
            </div>
        `;
        
        // Add the empty state after the reports container
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = emptyStateHTML;
        
        // Try to append after reports container
        if (reportsContainer.parentNode) {
            reportsContainer.parentNode.insertBefore(emptyState, reportsContainer.nextSibling);
        } else {
            // Fallback: append to reports container
            reportsContainer.appendChild(emptyState);
        }
        
        // Add create report button event
        const createReportBtn = emptyState.querySelector('.create-report-btn');
        if (createReportBtn) {
            createReportBtn.addEventListener('click', function() {
                // Switch to dashboard tab to create report
                const dashboardTab = document.querySelector('.menu-item[data-section="dashboard"]');
                if (dashboardTab) {
                    dashboardTab.click();
                    
                    // Scroll to report form after tab switch
                    setTimeout(() => {
                        const reportForm = document.getElementById('writeReportForm');
                        if (reportForm) {
                            reportForm.scrollIntoView({ behavior: 'smooth' });
                        }
                    }, 300);
                }
            });
        }
    }
}
    // Function to apply filters
    function applyFilters() {
        const classValue = classFilter ? classFilter.value : '';
        const typeValue = typeFilter ? typeFilter.value : '';
        
        console.log('Applying report filters:', { class: classValue, type: typeValue });
        
        // Load filtered reports
        loadReports({
            class: classValue,
            type: typeValue
        });
    }

    // Add event listeners for filtering
    if (classFilter) {
        classFilter.addEventListener('change', applyFilters);
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', applyFilters);
    }

    // Initialize: load teacher's courses for filter and initial reports
    loadTeacherCoursesForFilter();
    setTimeout(() => loadReports(), 500); // Slight delay to ensure courses load first
    
    // Return public methods
    return {
        refresh: loadReports,
        refreshCourses: loadTeacherCoursesForFilter
    };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const progressReportsModule = setupProgressReportsFiltering();
    
    // Add tab change handler to reload when switching to progress tab
    const progressTab = document.querySelector('.menu-item[data-section="progress"]');
    if (progressTab) {
        progressTab.addEventListener('click', function() {
            console.log('Progress tab clicked, refreshing reports');
            if (progressReportsModule && typeof progressReportsModule.refresh === 'function') {
                progressReportsModule.refresh();
            }
        });
    }
});
// Initialize report form handling with robust duplicate submission prevention
function initializeReportForm() {
    const reportForm = document.getElementById('writeReportForm');
    const classDropdown = document.getElementById('selectedClass');
    let isSubmitting = false; // Flag to track submission state
    let submissionTimeout = null; // Timeout reference for resetting the flag
    let formSubmitted = false; // Flag to track if form has been successfully submitted
    
    // Load teacher's courses for the class dropdown
    loadTeacherCoursesForReport();
    
    if (reportForm) {
        // Create a clean clone of the form to remove any existing event listeners
        const newForm = reportForm.cloneNode(true);
        reportForm.parentNode.replaceChild(newForm, reportForm);
        
        // Update the reference to the new form
        const cleanReportForm = document.getElementById('writeReportForm');
        
        cleanReportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Absolutely prevent duplicate submissions
            if (isSubmitting || formSubmitted) {
                console.log('Preventing duplicate submission. isSubmitting:', isSubmitting, 'formSubmitted:', formSubmitted);
                return false;
            }
            
            // Set submitting flag immediately
            isSubmitting = true;
            
            // Set a timeout to reset the flag after 10 seconds (failsafe)
            submissionTimeout = setTimeout(() => {
                console.log('Submission timeout reached, resetting submission state');
                isSubmitting = false;
            }, 10000);
            
            // Show loading state on button
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            
            // Get form values
            const reportType = document.getElementById('reportType').value;
            const courseId = document.getElementById('selectedClass').value;
            const title = document.getElementById('reportTitle').value;
            const description = document.getElementById('reportDescription').value;
            
            // Validate required fields
            if (!reportType || !courseId || !title) {
                ELC.showNotification('Please fill in all required fields', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                
                // Reset submission state
                clearTimeout(submissionTimeout);
                isSubmitting = false;
                return;
            }
            
            // Generate a unique ID for this submission
            const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(2, 15);
            
            // Collect form data
            const formData = new FormData();
            formData.append('type', reportType);
            formData.append('course', courseId);
            formData.append('title', title);
            formData.append('description', description);
            formData.append('clientId', uniqueId); // Add unique ID to form data
            
            const reportFile = document.getElementById('reportFile').files[0];
            if (reportFile) {
                formData.append('file', reportFile);
            }
            
            // Get authentication token
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) {
                ELC.showNotification('Authentication required. Please login again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                
                // Reset submission state
                clearTimeout(submissionTimeout);
                isSubmitting = false;
                return;
            }
            
            // Log what we're sending
            console.log('Sending report data with unique ID:', uniqueId);
            
            // Send to API with robust duplicate prevention headers
            fetch('/api/reports', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Client-ID': uniqueId,
                    'X-Request-Time': Date.now().toString()
                },
                body: formData
            })
            .then(response => {
                console.log('Response status:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('Response data:', data);
                
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                
                // Clear timeout and handle submission state
                clearTimeout(submissionTimeout);
                isSubmitting = false;
                formSubmitted = true; // Mark form as successfully submitted
                
                // Disable the form to prevent resubmission
                cleanReportForm.querySelectorAll('input, select, textarea, button').forEach(element => {
                    element.disabled = true;
                });
                
                if (data.success) {
                    // Show success notification
                    ELC.showNotification('Report generated successfully!', 'success');
                    
                    // Optional: Switch to reports tab to see the new report
                    setTimeout(() => {
                        const reportsTab = document.querySelector('.menu-item[data-section="progress"]');
                        if (reportsTab) {
                            // Reset form before switching tabs
                            cleanReportForm.reset();
                            resetReportFileUpload();
                            
                            // Re-enable form elements for future submissions
                            cleanReportForm.querySelectorAll('input, select, textarea, button').forEach(element => {
                                element.disabled = false;
                            });
                            
                            // Reset form submitted flag for new submissions
                            formSubmitted = false;
                            
                            // Switch tab
                            reportsTab.click();
                        }
                    }, 1000); // Delay switching to ensure notification is seen
                } else {
                    // Show error notification
                    ELC.showNotification('Error: ' + (data.message || 'Failed to generate report'), 'error');
                    
                    // Re-enable form elements for retry
                    cleanReportForm.querySelectorAll('input, select, textarea, button').forEach(element => {
                        element.disabled = false;
                    });
                    
                    // Reset form submitted flag for retry
                    formSubmitted = false;
                }
            })
            .catch(error => {
                console.error('Error generating report:', error);
                
                // Reset form state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                
                // Clear timeout and reset submission state
                clearTimeout(submissionTimeout);
                isSubmitting = false;
                
                // Show error notification
                ELC.showNotification('Failed to generate report: ' + error.message, 'error');
                
                // Re-enable form elements for retry
                cleanReportForm.querySelectorAll('input, select, textarea, button').forEach(element => {
                    element.disabled = false;
                });
            });
        });
        
        // Rest of your file upload handling code...
        
        // File upload browse trigger for report file
        const reportFileUpload = cleanReportForm.querySelector('.file-upload');
        if (reportFileUpload) {
            reportFileUpload.addEventListener('click', function(e) {
                // Don't trigger if clicking on a child element
                if (e.target !== reportFileUpload && e.target.tagName !== 'P' && e.target.tagName !== 'I') {
                    return;
                }
                
                document.getElementById('reportFile').click();
            });
            
            // Setup drag and drop functionality
            setupReportFileDragAndDrop(reportFileUpload);
            
            // Show file name when selected
            const reportFileInput = document.getElementById('reportFile');
            if (reportFileInput) {
                reportFileInput.addEventListener('change', function() {
                    if (this.files.length > 0) {
                        updateReportFileDisplay(this.files[0]);
                    }
                });
            }
        }
    }
}
// Function to load teacher's courses for report dropdown
async function loadTeacherCoursesForReport() {
    const classDropdown = document.getElementById('selectedClass');
    if (!classDropdown) return;
    
    try {
        // Show loading state
        classDropdown.innerHTML = '<option value="">Loading your courses...</option>';
        classDropdown.disabled = true;
        
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        // Fetch teacher's courses from API
        const response = await fetch('/api/teachers/my-courses', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Courses loaded:', data);
        
        if (data.success && data.data && data.data.length > 0) {
            // Start with placeholder option
            classDropdown.innerHTML = '<option value="">Choose a class</option>';
            
            // Add each course to the dropdown
            data.data.forEach(course => {
                const option = document.createElement('option');
                option.value = course._id;
                option.textContent = `${course.name} (${course.level})`;
                classDropdown.appendChild(option);
            });
        } else {
            classDropdown.innerHTML = '<option value="">No courses assigned to you</option>';
        }
    } catch (error) {
        console.error('Error loading courses for report:', error);
        classDropdown.innerHTML = '<option value="">Error loading courses</option>';
    } finally {
        // Make sure to re-enable the dropdown regardless of outcome
        classDropdown.disabled = false;
    }
}

// Setup drag and drop functionality for report file upload
function setupReportFileDragAndDrop(fileUploadArea) {
    if (!fileUploadArea) return;
    
    // Add event listeners for drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, function() {
            fileUploadArea.classList.add('highlight');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, function() {
            fileUploadArea.classList.remove('highlight');
        }, false);
    });
    
    // Add drop handler
    fileUploadArea.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        if (!dt || !dt.files || dt.files.length === 0) return;
        
        const currentFileInput = document.getElementById('reportFile');
        if (currentFileInput) {
            // For modern browsers supporting DataTransfer
            try {
                // Create a new DataTransfer object
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(dt.files[0]);
                currentFileInput.files = dataTransfer.files;
                
                // Update the display
                updateReportFileDisplay(dt.files[0]);
                
                // Trigger change event
                const event = new Event('change', { bubbles: true });
                currentFileInput.dispatchEvent(event);
            } catch (err) {
                console.error('Error setting files:', err);
                // Fallback for older browsers
                ELC.showNotification('Please select a file using the browse button instead.', 'warning');
            }
        }
    }, false);
}

// Prevents default behavior for drag and drop events
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Update file display when a file is selected
function updateReportFileDisplay(file) {
    const fileUploadArea = document.querySelector('#writeReportForm .file-upload');
    if (!fileUploadArea) return;
    
    const icon = fileUploadArea.querySelector('i');
    const text = fileUploadArea.querySelector('p');
    
    if (icon) {
        icon.className = 'fas fa-check-circle';
        icon.style.color = '#4CAF50';
    }
    
    if (text) {
        // Format file size
        let fileSize = formatFileSize(file.size);
        text.innerHTML = `Selected: <strong>${file.name}</strong> (${fileSize})`;
    }
    
    fileUploadArea.classList.add('file-selected');
}

// Reset file upload display for report form
function resetReportFileUpload() {
    const fileUploadArea = document.querySelector('#writeReportForm .file-upload');
    if (!fileUploadArea) return;
    
    const icon = fileUploadArea.querySelector('i');
    const text = fileUploadArea.querySelector('p');
    
    if (icon) {
        icon.className = 'fas fa-cloud-upload-alt';
        icon.style.color = ''; // Reset color
    }
    
    if (text) {
        text.innerHTML = 'Drag & drop files here or click to browse';
    }
    
    fileUploadArea.classList.remove('file-selected', 'highlight');
    
    // Reset the file input by replacing it
    const fileInput = document.getElementById('reportFile');
    if (fileInput) {
        const newInput = document.createElement('input');
        newInput.type = 'file';
        newInput.id = fileInput.id;
        newInput.name = fileInput.name;
        newInput.className = fileInput.className;
        newInput.style.display = 'none';
        
        // Replace the original
        fileInput.parentNode.replaceChild(newInput, fileInput);
        
        // Attach event listener
        newInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                updateReportFileDisplay(this.files[0]);
            }
        });
    }
}

// Filter progress reports based on selected criteria
function filterProgressReports() {
    const classFilter = document.querySelector('#progress-section select:first-child');
    const typeFilter = document.querySelector('#progress-section select:nth-child(2)');
    
    const classValue = classFilter ? classFilter.value.toLowerCase() : '';
    const typeValue = typeFilter ? typeFilter.value.toLowerCase() : '';
    
    // Get all report items
    const reportItems = document.querySelectorAll('.report-item');
    let visibleCount = 0;
    
    reportItems.forEach(item => {
        // Get report details
        const reportTitle = item.querySelector('.report-title')?.textContent.toLowerCase() || '';
        
        // Determine report type (class or individual)
        const isClassReport = reportTitle.includes('class');
        const reportType = isClassReport ? 'class' : 'individual';
        
        // Check if report matches filters
        const matchesClass = !classValue || reportTitle.includes(classValue);
        const matchesType = !typeValue || reportType === typeValue;
        
        // Show or hide based on filters
        if (matchesClass && matchesType) {
            item.style.display = '';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Show empty state if no results
    const emptyState = document.querySelector('#progress-section .empty-state');
    if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}

// Add to the existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // Initialize report form handling
    initializeReportForm();

    loadTeacherCoursesForReport();

    
    // Set up filtering for progress reports section
    const classFilter = document.querySelector('#progress-section select:first-child');
    const typeFilter = document.querySelector('#progress-section select:nth-child(2)');
    
    if (classFilter) classFilter.addEventListener('change', filterProgressReports);
    if (typeFilter) typeFilter.addEventListener('change', filterProgressReports);
    
    // Add progress tab change handler to load reports
    const progressTab = document.querySelector('.menu-item[data-section="progress"]');
    if (progressTab) {
        progressTab.addEventListener('click', function() {
            loadProgressReports();
        });
    }
});
// Function to load and display progress reports with client-side filtering
async function loadProgressReports() {
    const reportsContainer = document.querySelector('.reports-list') || document.getElementById('reports-container');
    const emptyStateContainer = document.querySelector('.empty-state') || document.getElementById('empty-state-container');
    
    if (!reportsContainer) {
        console.error('Reports container element not found');
        return;
    }
    
    try {
        // Show loading state
        reportsContainer.innerHTML = `
            <div class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading reports...</p>
            </div>
        `;
        
        // Get filter values
        const classFilter = document.querySelector('#progress-section select:first-child, #class-filter');
        const typeFilter = document.querySelector('#progress-section select:nth-child(2), #type-filter');
        
        const classValue = classFilter ? classFilter.value : '';
        const typeValue = typeFilter ? typeFilter.value.toLowerCase() : '';
        
        console.log('Filtering reports - Class:', classValue, 'Type:', typeValue);
        
        // Get authentication token
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        // Build query parameters
        let apiUrl = '/api/reports/teacher';
        const queryParams = new URLSearchParams();
        
        if (classValue) {
            queryParams.append('courseIds', classValue);
        }
        
        if (typeValue && typeValue !== 'all report types') {
            const normalizedType = typeValue === 'individual reports' ? 'individual' : 
                                   typeValue === 'class reports' ? 'class' : typeValue;
            queryParams.append('type', normalizedType);
        }
        
        // Add query parameters if any exist
        if (queryParams.toString()) {
            apiUrl += '?' + queryParams.toString();
        }
        
        console.log('Fetching reports from:', apiUrl);
        
        // Fetch filtered reports from API
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Reports data received:', data);
        
        // Clear loading indicator
        reportsContainer.innerHTML = '';
        
        if (data.success && data.data && data.data.length > 0) {
            // Hide empty state
            if (emptyStateContainer) {
                emptyStateContainer.style.display = 'none';
            }
            
            // Add each report to the list
            data.data.forEach(report => {
                addReportToList(report, reportsContainer);
            });
        } else {
            // Show empty state
            reportsContainer.innerHTML = '';
            
            // If we have an existing empty state container, show it
            if (emptyStateContainer) {
                emptyStateContainer.style.display = 'block';
            } else {
                // Create empty state if it doesn't exist
                reportsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <h3>No reports available</h3>
                        <p>There are no progress reports matching your filter criteria.</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading progress reports:', error);
        
        // Show error state
        reportsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h3>Error loading reports</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Function to properly display each report in the list
function addReportToList(report, container) {
    // Create report element
    const reportElement = document.createElement('div');
    reportElement.className = 'report-item';
    reportElement.setAttribute('data-id', report._id);
    
    // Format date
    const createdDate = new Date(report.createdAt).toLocaleDateString();
    
    // Get course name
    let courseName = 'Unknown Course';
    if (report.course) {
        if (typeof report.course === 'object') {
            courseName = report.course.name;
        } else if (typeof report.course === 'string') {
            // Try to find course name from dropdown
            const courseDropdown = document.querySelector('#progress-section select:first-child, #class-filter');
            if (courseDropdown) {
                const option = courseDropdown.querySelector(`option[value="${report.course}"]`);
                if (option) {
                    courseName = option.textContent;
                }
            }
        }
    }
    
    // Set icon based on report type
    const typeIcon = report.type === 'individual' ? 'fa-user' : 'fa-users';
    const typeText = report.type === 'individual' ? 'Individual Report' : 'Class Report';
    
    // Build HTML content
    reportElement.innerHTML = `
        <div class="report-info">
            <div class="report-title">${report.title}</div>
            <div class="report-details">
                <div><i class="fas fa-book"></i> ${courseName}</div>
                <div><i class="fas fa-calendar"></i> Generated: ${createdDate}</div>
                <div><i class="fas ${typeIcon}"></i> ${typeText}</div>
            </div>
        </div>
        <div class="report-actions">
            <button class="btn btn-primary view-report-btn" data-id="${report._id}">
                <i class="fas fa-eye"></i> View Report
            </button>
            <button class="btn btn-secondary download-pdf-btn" data-id="${report._id}">
                <i class="fas fa-download"></i> Download PDF
            </button>
        </div>
    `;
    
    // Add to container
    container.appendChild(reportElement);
    
    // When adding event listeners to your view/download buttons
    const viewBtn = reportElement.querySelector('.view-report-btn');
    const downloadBtn = reportElement.querySelector('.download-pdf-btn');

    if (viewBtn) {
        viewBtn.addEventListener('click', function() {
            const reportId = this.getAttribute('data-id');
            // Call the viewReport function directly without window prefix
            viewReport(reportId);
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            const reportId = this.getAttribute('data-id');
            // Call the downloadReport function directly without window prefix
            downloadReport(reportId);
        });
    }
}
// Function to load teacher's courses for report filter dropdown - matches Create Report form
async function loadTeacherCoursesForReportFilter() {
    const classFilter = document.querySelector('#progress-section select:first-child, #class-filter');
    if (!classFilter) {
        console.error('Class filter dropdown not found');
        return;
    }
    
    try {
        // Show loading state
        classFilter.innerHTML = '<option value="">Loading your courses...</option>';
        classFilter.disabled = true;
        
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        // Fetch teacher's courses from API - same endpoint as used in the Create Report form
        const response = await fetch('/api/teachers/my-courses', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Teacher courses loaded for report filter:', data);
        
        // Update dropdown options in the same format as the Create Report form
        if (data.success && data.data && data.data.length > 0) {
            // Start with "All Classes" option for the filter (slightly different than Create form)
            classFilter.innerHTML = '<option value="">All Classes</option>';
            
            // Add each course to the filter - same format as Create Report form
            data.data.forEach(course => {
                const option = document.createElement('option');
                option.value = course._id;
                option.textContent = `${course.name} (${course.level})`;
                classFilter.appendChild(option);
            });
        } else {
            classFilter.innerHTML = '<option value="">No courses assigned to you</option>';
        }
    } catch (error) {
        console.error('Error loading teacher courses for filter:', error);
        classFilter.innerHTML = '<option value="">Error loading courses</option>';
    } finally {
        classFilter.disabled = false;
    }
}

// Keep the type filter dropdown simple with fixed options
function setupTypeFilterDropdown() {
    const typeFilter = document.querySelector('#progress-section select:nth-child(2), #type-filter');
    if (!typeFilter) {
        console.error('Type filter dropdown not found');
        return;
    }
    
    // Set fixed options for report type
    typeFilter.innerHTML = `
        <option value="">All Report Types</option>
        <option value="individual">Individual Reports</option>
        <option value="class">Class Reports</option>
    `;
}


// Function to download a report as PDF
function downloadReport(reportId) {
    // Get token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
        alert('Authentication required. Please login again.');
        return;
    }
    
    // Open download URL in new tab
    window.open(`/api/reports/${reportId}/pdf?token=${token}`, '_blank');
}

// Setup filter handlers
function setupProgressReportFilters() {
    const classFilter = document.querySelector('#progress-section select:first-child, .filter-bar select:first-child, #class-filter');
    const typeFilter = document.querySelector('#progress-section select:nth-child(2), .filter-bar select:nth-child(2), #type-filter');
    
    if (classFilter) {
        classFilter.addEventListener('change', function() {
            console.log('Class filter changed to:', this.value);
            loadProgressReports();
        });
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', function() {
            console.log('Type filter changed to:', this.value);
            loadProgressReports();
        });
    }
}

// Updated initialization function
function initializeProgressReportsPage() {
    console.log('Initializing progress reports page');
    
    // Load courses into filter dropdown - same as Create Report form
    loadTeacherCoursesForReportFilter();
    
    // Setup type filter dropdown
    setupTypeFilterDropdown();
    
    // Setup filter event handlers
    setupProgressReportFilters();
    
    // Load reports with initial filters
    loadProgressReports();
}

// Call this when the page loads or when the progress tab is clicked
document.addEventListener('DOMContentLoaded', function() {
    // Initialize page when progress tab is clicked
    const progressTab = document.querySelector('.menu-item[data-section="progress"]');
    if (progressTab) {
        progressTab.addEventListener('click', function() {
            console.log('Progress tab clicked, initializing page');
            initializeProgressReportsPage();
        });
    }
    
    // Check if we're already on the progress page
    const currentPath = window.location.pathname;
    if (currentPath.includes('/progress') || currentPath.includes('/reports')) {
        console.log('Already on progress page, initializing');
        initializeProgressReportsPage();
    }
});
