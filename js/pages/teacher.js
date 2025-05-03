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
    loadCoursesIntoDropdown();
  
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

// Initialize report form handling
function initializeReportForm() {
    const reportForm = document.getElementById('writeReportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Collect form data
            const formData = {
                reportType: document.getElementById('reportType')?.value,
                selectedClass: document.getElementById('selectedClass')?.value,
                reportTitle: document.getElementById('reportTitle')?.value,
                reportDescription: document.getElementById('reportDescription')?.value,
                reportFile: document.getElementById('reportFile')?.files[0]
            };
        
            // Send to server (to be implemented)
            console.log('Report Data:', formData);
        
            // Show success notification
            ELC.showNotification('Report generated successfully!', 'success');
        });
        
        // File upload browse trigger for report file
        const reportFileUpload = reportForm.querySelector('.file-upload');
        if (reportFileUpload) {
            reportFileUpload.addEventListener('click', function() {
                document.getElementById('reportFile')?.click();
            });
            
            // Show file name when selected
            const reportFileInput = document.getElementById('reportFile');
            if (reportFileInput) {
                reportFileInput.addEventListener('change', function() {
                    if (this.files.length > 0) {
                        const fileName = this.files[0].name;
                        const fileSize = formatFileSize(this.files[0].size);
                        const fileText = reportFileUpload.querySelector('p');
                        const fileIcon = reportFileUpload.querySelector('i');
                        
                        if (fileText) {
                            fileText.innerHTML = `Selected: <strong>${fileName}</strong> (${fileSize})`;
                        }
                        
                        if (fileIcon) {
                            fileIcon.className = 'fas fa-check-circle';
                        }
                        
                        reportFileUpload.classList.add('file-selected');
                    }
                });
            }
        }
    }
}

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

// Function to delete material
function deleteMaterial(materialId, materialElement) {
    // Show loading notification
    ELC.showNotification('Deleting material...', 'info');

    fetch(`/api/materials/${materialId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Remove material from UI
            materialElement.remove();
            
            // Show success message
            ELC.showNotification('Material deleted successfully', 'success');
            
            // Check if materials list is empty
            const materialsList = document.querySelector('.materials-list');
            if (materialsList && materialsList.children.length === 0) {
                // Show empty state
                const emptyState = document.querySelector('#materials-section .empty-state');
                if (emptyState) {
                    emptyState.style.display = 'block';
                }
            }
        } else {
            ELC.showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Delete error:', error);
        ELC.showNotification('Failed to delete material. Please try again.', 'error');
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
function setupMaterialsFiltering() {
    // Get the filter elements
    const classFilter = document.querySelector('#materials-section select:first-child, .filter-bar select:first-child');
    const typeFilter = document.querySelector('#materials-section select:nth-child(2), .filter-bar select:nth-child(2)');
    const searchInput = document.querySelector('#materials-section .search-bar input');
    const searchButton = document.querySelector('#materials-section .search-bar button');
    const materialsList = document.querySelector('.materials-list'); // Added this line
    
    // Check if materials list exists
    if (!materialsList) {
        console.error('Materials list container not found');
        return;
    }

    // Load actual courses from the database for the filter dropdown
    function loadActualCoursesForFilter() {
        if (!classFilter) return;
        
        // Show loading state
        classFilter.innerHTML = '<option value="">Loading courses...</option>';
        classFilter.disabled = true;
        
        // Fetch courses from API
        fetch('/api/courses/dropdown')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log('Courses loaded for filter:', data);
                
                if (data.success && data.data && data.data.length > 0) {
                    // Start with "All Classes" option
                    classFilter.innerHTML = '<option value="">All Classes</option>';
                    
                    // Add each course with its category in parentheses
                    data.data.forEach(course => {
                        const option = document.createElement('option');
                        option.value = course._id;
                        
                        // Format like "Course Name (Category)" similar to your upload dropdown
                        let displayText = course.name;
                        if (course.category) {
                            displayText += ` (${course.category})`;
                        } else if (course.level) {
                            displayText += ` (${course.level})`;
                        }
                        
                        option.textContent = displayText;
                        classFilter.appendChild(option);
                    });
                } else {
                    // Fallback to default if no courses found
                    setDefaultClassOptions();
                }
            })
            .catch(error => {
                console.error('Error loading courses for filter:', error);
                // Fallback to default options on error
                setDefaultClassOptions();
            })
            .finally(() => {
                classFilter.disabled = false;
            });
    }
    
    // Fallback function to set default options if API call fails
    function setDefaultClassOptions() {
        if (!classFilter) return;
        
        classFilter.innerHTML = '<option value="">All Classes</option>';
        
        const defaultClasses = [
            { value: 'conversational', text: 'Conversational English' },
            { value: 'business', text: 'Business English' },
            { value: 'beginner', text: 'Beginner English' },
            { value: 'ielts', text: 'IELTS Preparation' }
        ];
        
        defaultClasses.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.value;
            option.textContent = cls.text;
            classFilter.appendChild(option);
        });
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

    // Function to load materials from the database
    function loadMaterials(filters = {}) {
        // Show loading state
        materialsList.innerHTML = `
            <div class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading materials...</p>
            </div>
        `;
        
        // Build query string from filters
        const queryParams = new URLSearchParams();
        if (filters.class) queryParams.append('course', filters.class);
        if (filters.type) queryParams.append('type', filters.type);
        if (filters.search) queryParams.append('search', filters.search);
        
        // Fetch materials from API
        fetch(`/api/materials?${queryParams.toString()}`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log('Materials loaded:', data);
                
                // Clear loading indicator
                materialsList.innerHTML = '';
                
                if (data.success && data.data && data.data.length > 0) {
                    // Add each material to the list
                    data.data.forEach(material => {
                        addMaterialToList(material);
                    });
                } else {
                    // Show empty state if no materials found
                    showMaterialsEmptyState(true);
                }
            })
            .catch(error => {
                console.error('Error loading materials:', error);
                materialsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>Error loading materials</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            });
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
            
            // Get materials section
            const materialsSection = document.getElementById('materials-section');
            if (materialsSection) {
                // Insert empty state after materials list if it exists
                if (materialsList && materialsList.parentNode) {
                    materialsList.parentNode.insertBefore(emptyState, materialsList.nextSibling);
                } else {
                    // Append to section if materials list not found
                    materialsSection.appendChild(emptyState);
                }
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

    // Initialize: load courses for filter and load initial materials
    loadActualCoursesForFilter();
    loadMaterials();
    
    // Return public methods
    return {
        refresh: loadMaterials
    };
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
            if (materialsModule && typeof materialsModule.refresh === 'function') {
                materialsModule.refresh();
            }
        });
    }
});
// ===== STUDENTS SECTION FILTERING =====
function setupStudentsFiltering() {
    // Get filter elements
    const classFilter = document.querySelector('#students-section select, .filter-bar select');
    const searchInput = document.querySelector('#students-section .search-bar input');
    const searchButton = document.querySelector('#students-section .search-bar button');

    // Populate class filter with the 4 default classes
    if (classFilter) {
        // Start with "All Classes" option
        classFilter.innerHTML = '<option value="">All Classes</option>';
        
        // Add default classes
        const defaultClasses = [
            { value: 'conversational', text: 'Conversational English' },
            { value: 'business', text: 'Business English' },
            { value: 'beginner', text: 'Beginner English' },
            { value: 'ielts', text: 'IELTS Preparation' }
        ];
        
        defaultClasses.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.value;
            option.textContent = cls.text;
            classFilter.appendChild(option);
        });
    }

    // Filter students function
    function filterStudents() {
        const classValue = classFilter ? classFilter.value.toLowerCase() : '';
        const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        // Get all student items
        const studentItems = document.querySelectorAll('.student-item');
        let visibleCount = 0;
        
        // If no students, show empty state
        if (studentItems.length === 0) {
            showStudentsEmptyState(true);
            return;
        }
        
        studentItems.forEach(item => {
            // Get student details
            const studentClasses = item.querySelector('.student-details div:first-child')?.textContent.toLowerCase() || '';
            const studentName = item.querySelector('.student-name')?.textContent.toLowerCase() || '';
            
            // Check if student matches filters
            const matchesClass = !classValue || studentClasses.includes(classValue);
            const matchesSearch = !searchValue || studentName.includes(searchValue);
            
            // Show or hide based on filters
            if (matchesClass && matchesSearch) {
                item.style.display = '';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });
        
        // Show empty state if no results
        showStudentsEmptyState(visibleCount === 0);
    }

    // Show empty state when no students match
    function showStudentsEmptyState(show) {
        let emptyState = document.querySelector('#students-section .empty-state');
        
        // Create empty state if it doesn't exist
        if (!emptyState) {
            emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <i class="fas fa-users"></i>
                <h3>No students found</h3>
                <p>There are no students matching your search criteria.</p>
            `;
            
            // Insert after students list
            const studentsContainer = document.querySelector('.students-list');
            if (studentsContainer) {
                studentsContainer.parentNode.insertBefore(emptyState, studentsContainer.nextSibling);
            } else {
                // Or append to section
                const section = document.querySelector('#students-section');
                if (section) section.appendChild(emptyState);
            }
        }
        
        // Show or hide empty state
        emptyState.style.display = show ? 'block' : 'none';
    }

    // Add event listeners
    if (classFilter) classFilter.addEventListener('change', filterStudents);

    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') filterStudents();
        });
    }

    if (searchButton) searchButton.addEventListener('click', filterStudents);

    // Initial filtering
    filterStudents();
}

// ===== PROGRESS REPORTS SECTION FILTERING =====
function setupProgressReportsFiltering() {
    // Get filter elements
    const classFilter = document.querySelector('#progress-section select:first-child, .filter-bar select:first-child');
    const typeFilter = document.querySelector('#progress-section select:nth-child(2), .filter-bar select:nth-child(2)');

    // Populate class filter with the 4 default classes
    if (classFilter) {
        // Start with "All Classes" option
        classFilter.innerHTML = '<option value="">All Classes</option>';
        
        // Add default classes
        const defaultClasses = [
            { value: 'conversational', text: 'Conversational English' },
            { value: 'business', text: 'Business English' },
            { value: 'beginner', text: 'Beginner English' },
            { value: 'ielts', text: 'IELTS Preparation' }
        ];
        
        defaultClasses.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.value;
            option.textContent = cls.text;
            classFilter.appendChild(option);
        });
    }

    // Ensure type filter has options
    if (typeFilter && typeFilter.options.length === 0) {
        typeFilter.innerHTML = `
            <option value="individual">Individual Reports</option>
            <option value="class">Class Reports</option>
        `;
    }

    // Filter reports function
    function filterReports() {
        const classValue = classFilter ? classFilter.value.toLowerCase() : '';
        const typeValue = typeFilter ? typeFilter.value.toLowerCase() : '';
        
        // Get all report items
        const reportItems = document.querySelectorAll('.report-item');
        let visibleCount = 0;
        
        // If no reports, show empty state
        if (reportItems.length === 0) {
            showReportsEmptyState(true);
            return;
        }
        
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
        showReportsEmptyState(visibleCount === 0);
    }

    // Show empty state when no reports match
    function showReportsEmptyState(show) {
        let emptyState = document.querySelector('#progress-section .empty-state');
        
        // Create empty state if it doesn't exist
        if (!emptyState) {
            emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <i class="fas fa-chart-line"></i>
                <h3>No reports available</h3>
                <p>There are no progress reports matching your search criteria.</p>
                <button class="btn btn-primary create-report-btn"><i class="fas fa-plus"></i> Create New Report</button>
            `;
            
            // Insert after reports list
            const reportsContainer = document.querySelector('.reports-list');
            if (reportsContainer) {
                reportsContainer.parentNode.insertBefore(emptyState, reportsContainer.nextSibling);
            } else {
                // Or append to section
                const section = document.querySelector('#progress-section');
                if (section) section.appendChild(emptyState);
            }
            
            // Add click event to create report button
            const createReportBtn = emptyState.querySelector('.create-report-btn');
            if (createReportBtn) {
                createReportBtn.addEventListener('click', function() {
                    // Switch to dashboard and scroll to report form
                    const dashboardTab = document.querySelector('.menu-item[data-section="dashboard"]');
                    if (dashboardTab) {
                        dashboardTab.click();
                        setTimeout(() => {
                            const reportForm = document.getElementById('writeReportForm');
                            if (reportForm) reportForm.scrollIntoView({ behavior: 'smooth' });
                        }, 300);
                    }
                });
            }
        }
        
        // Show or hide empty state
        emptyState.style.display = show ? 'block' : 'none';
    }

    // Add event listeners
    if (classFilter) classFilter.addEventListener('change', filterReports);
    if (typeFilter) typeFilter.addEventListener('change', filterReports);

    // Initial filtering
    filterReports();
}

// ===== ASSIGNMENTS SECTION FILTERING =====
function setupAssignmentsFiltering() {
    // Get filter elements
    const classFilter = document.querySelector('#assignments-section select:nth-child(1)');
    const statusFilter = document.querySelector('#assignments-section select:nth-child(2)');
    const searchInput = document.querySelector('#assignments-section input[type="text"]');
    const searchButton = document.querySelector('#assignments-section .search-bar button');

    // Get the assignments list container
    const assignmentsContainer = document.querySelector('.assignments-list');

    // If any elements are missing, exit function
    if (!classFilter || !statusFilter || !searchInput || !assignmentsContainer) {
        console.error('Could not find filtering elements or assignments container');
        return;
    }

    // Function to filter assignments
    function filterAssignments() {
        const classValue = classFilter.value.toLowerCase();
        const statusValue = statusFilter.value.toLowerCase();
        const searchValue = searchInput.value.toLowerCase().trim();
        
        // Get all assignment items
        const assignmentItems = document.querySelectorAll('.assignment-item');
        let visibleCount = 0;
        
        assignmentItems.forEach(item => {
            // Get the assignment's class
            const assignmentClass = item.querySelector('.assignment-details div:first-child')?.textContent.toLowerCase() || '';
            
            // Get the assignment's status
            const assignmentStatus = item.querySelector('.badge')?.textContent.toLowerCase() || '';
            
            // Get the assignment's title
            const assignmentTitle = item.querySelector('.assignment-title')?.textContent.toLowerCase() || '';
            
            // Check if the assignment matches all filters
            const matchesClass = classValue === '' || assignmentClass.includes(classValue);
            const matchesStatus = statusValue === '' || assignmentStatus.includes(statusValue);
            const matchesSearch = searchValue === '' || assignmentTitle.includes(searchValue);
            
            // Show or hide based on filter matches
            if (matchesClass && matchesStatus && matchesSearch) {
                item.style.display = 'block';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });
        
        // Show empty state if no results
        showAssignmentsEmptyState(visibleCount === 0);
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
            assignmentsContainer.parentNode.insertBefore(emptyState, assignmentsContainer.nextSibling);
            
            // Add click event to create assignment button
            const createAssignmentBtn = emptyState.querySelector('.create-assignment-btn');
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
        }
        
        // Show or hide empty state
        emptyState.style.display = show ? 'block' : 'none';
    }
    
    // Add event listeners
    if (classFilter) classFilter.addEventListener('change', filterAssignments);
    if (statusFilter) statusFilter.addEventListener('change', filterAssignments);
    
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                filterAssignments();
            }
        });
    }
    
    if (searchButton) {
        searchButton.addEventListener('click', filterAssignments);
    }
    
    // Initial filtering
    filterAssignments();
}

// ===== ASSIGNMENT FUNCTIONS =====
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
// Function to load materials from database
function loadMaterialsFromDatabase() {
    const materialsList = document.querySelector('.materials-list');
    if (!materialsList) return;
    
    // Show loading state
    materialsList.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading materials...</p>
        </div>
    `;
    
    // Fetch materials from API
    fetch('/api/materials')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Materials data received:', data);
            
            if (data.success && data.data && data.data.length > 0) {
                // Clear loading indicator
                materialsList.innerHTML = '';
                
                // Add each material to the list
                data.data.forEach(material => {
                    addMaterialToList(material);
                });
            } else {
                // Show empty state if no materials
                materialsList.innerHTML = '';
                showMaterialsEmptyState(true);
            }
        })
        .catch(error => {
            console.error('Error fetching materials:', error);
            materialsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error loading materials</h3>
                    <p>${error.message}</p>
                </div>
            `;
        });
}
// Call this function when the page loads or when navigating to materials tab
document.addEventListener('DOMContentLoaded', function() {
    // Add tab change handler to load materials when tab is clicked
    const materialsTab = document.querySelector('.menu-item[data-section="materials"]');
    if (materialsTab) {
        materialsTab.addEventListener('click', function() {
            // Load materials when tab is clicked
            loadMaterialsFromDatabase();
        });
    }
    
    // If materials section is visible on page load, load materials
    const materialsSection = document.getElementById('materials-section');
    if (materialsSection && window.getComputedStyle(materialsSection).display !== 'none') {
        loadMaterialsFromDatabase();
    }
});
// Function to display grading modal
function displayGradingModal(assignmentData) {
    // Clear any existing modals
    clearExistingModals();
    
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
    // Clear any existing modals
    clearExistingModals();
    
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
function loadCoursesIntoDropdown() {
    const courseDropdown = document.getElementById('materialClass');
    if (!courseDropdown) {
        console.error('Could not find the course dropdown element');
        return;
    }
    
    // Show loading state
    courseDropdown.innerHTML = '<option value="">Loading courses...</option>';
    courseDropdown.disabled = true;
    
    // Debug log
    console.log('Fetching courses from API...');
    
    // Fetch courses
    fetch('/api/courses/dropdown')
        .then(response => {
            console.log('API response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Courses data received:', data);
            if (data.success) {
                // Clear loading option
                courseDropdown.innerHTML = '<option value="">Select a Course</option>';
                
                // Add each course to dropdown
                data.data.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course._id;
                    option.textContent = `${course.name} (${course.category || course.level})`;
                    courseDropdown.appendChild(option);
                });
                
                // If no courses found
                if (data.data.length === 0) {
                    courseDropdown.innerHTML = '<option value="">No courses available</option>';
                }
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

// Make sure to call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded, calling loadCoursesIntoDropdown');
    loadCoursesIntoDropdown();
});

// Function to load courses for edit assignment dropdown
function loadCoursesForDropdown(selectedCourseId) {
    const courseDropdown = document.getElementById('edit-course');
    if (!courseDropdown) return;
    
    // Show loading state
    courseDropdown.innerHTML = '<option value="">Loading courses...</option>';
    
    // Fetch courses
    fetch('/api/courses/dropdown')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Clear loading option
                courseDropdown.innerHTML = '<option value="">Select a course</option>';
                
                // Add each course to dropdown
                data.data.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course._id;
                    
                    // Format option text
                    let displayText = course.name;
                    if (course.category) {
                        displayText += ` (${course.category})`;
                    }
                    
                    option.textContent = displayText;
                    
                    // Select current course
                    if (course._id === selectedCourseId) {
                        option.selected = true;
                    }
                    
                    courseDropdown.appendChild(option);
                });
            } else {
                courseDropdown.innerHTML = '<option value="">Error loading courses</option>';
                console.error('Failed to load courses:', data.message);
            }
        })
        .catch(error => {
            courseDropdown.innerHTML = '<option value="">Error loading courses</option>';
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
    
    // Send to API
    fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
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
                loadAssignmentsData();
            }
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