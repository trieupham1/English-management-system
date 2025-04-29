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
const lessonRoutes = require('./server/routes/lessons');
const settingsRoutes = require('./server/routes/settings');
const studentRoutes = require('./server/routes/students');
const teacherRoutes = require('./server/routes/teachers');

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
app.use('/api/lessons', lessonRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);

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