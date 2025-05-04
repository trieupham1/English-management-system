const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const http = require('http');
const dotenv = require('dotenv');
const colors = require('colors');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./server/routes/auth');
const courseRoutes = require('./server/routes/courses');
const settingsRoutes = require('./server/routes/settings');
const studentRoutes = require('./server/routes/students');
const teacherRoutes = require('./server/routes/teachers');
const assignmentRoutes = require('./server/routes/assignments'); 
const materialRoutes = require('./server/routes/materials');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'.cyan.underline.bold))
.catch(err => console.error('MongoDB connection error:'.red, err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_session_secret_for_english_center_app',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Serve static files
app.use(express.static(path.join(__dirname, '/')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/assignments', assignmentRoutes); 
app.use('/api/materials', materialRoutes); 

// Add this after your routes
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});
// Create uploads directory for file uploads
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route for the root path - redirect to login page
app.get('/', (req, res) => {
    res.redirect('/login');
});

// HTML Routes
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/login.html'));
});

app.get('/student', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/student.html'));
});

app.get('/teacher', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/teacher.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/admin.html'));
});

// Serve index.html from views directory if the route exists
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

// Mock API endpoints for development (can be removed in production)
// These endpoints will help with testing the frontend before the real API is ready
if (process.env.NODE_ENV === 'development') {
    // Mock assignment endpoints for testing
    app.get('/api/mock/assignments', (req, res) => {
        res.json({
            success: true,
            data: [
                {
                    _id: 'assignment1',
                    title: 'Writing Essay',
                    description: 'Write a 500-word essay on a topic of your choice',
                    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    course: 'course1',
                    className: 'Conversational English',
                    totalPoints: 100,
                    submissionCount: 12,
                    totalStudents: 15,
                    status: 'active'
                },
                {
                    _id: 'assignment2',
                    title: 'Grammar Quiz',
                    description: 'Complete the grammar quiz',
                    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                    course: 'course2',
                    className: 'Beginner English',
                    totalPoints: 50,
                    submissionCount: 15,
                    totalStudents: 18,
                    status: 'active'
                }
            ]
        });
    });

    // Mock assignment submission
    app.get('/api/mock/assignments/:id/submissions', (req, res) => {
        res.json({
            success: true,
            data: {
                id: req.params.id,
                title: req.params.id === 'assignment1' ? 'Writing Essay' : 'Grammar Quiz',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                totalPoints: 100,
                className: req.params.id === 'assignment1' ? 'Conversational English' : 'Beginner English',
                totalStudents: req.params.id === 'assignment1' ? 15 : 18,
                submissions: [
                    {
                        studentId: 'student1',
                        studentName: 'John Smith',
                        submittedAt: new Date().toISOString(),
                        content: 'This is my submission for the assignment.',
                        fileName: 'assignment.pdf',
                        fileUrl: '/uploads/assignment.pdf',
                        grade: null,
                        feedback: ''
                    },
                    {
                        studentId: 'student2',
                        studentName: 'Jane Doe',
                        submittedAt: new Date(Date.now() - 86400000).toISOString(),
                        content: 'Here is my completed work.',
                        fileName: 'homework.docx',
                        fileUrl: '/uploads/homework.docx',
                        grade: 85,
                        feedback: 'Good work, but could use more detail.'
                    }
                ]
            }
        });
    });
}

// Catch all other routes and redirect to login
app.get('*', (req, res) => {
    // Don't redirect API routes
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    
    // Don't redirect CSS, JS, and image requests
    const extensions = ['.css', '.js', '.jpg', '.png', '.gif', '.svg'];
    if (extensions.some(ext => req.url.endsWith(ext))) {
        return res.status(404).send('File not found');
    }
    
    // Redirect to login
    res.redirect('/login');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:'.red, err.stack);
    
    // Return JSON error for API requests
    if (req.url.startsWith('/api/')) {
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'production' ? null : err.message
        });
    }
    
    // Return HTML error for web requests
    res.status(500).send('Something went wrong. Please try again later.');
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`.yellow.bold);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`.blue);
    console.log(`Visit: http://localhost:${PORT}`.green);
});