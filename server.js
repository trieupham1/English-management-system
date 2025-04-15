// server.js - Main entry point for English Learning Center Management System

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const socketIo = require('socket.io');
const http = require('http');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./server/routes/auth');
const courseRoutes = require('./server/routes/courses');
const lessonRoutes = require('./server/routes/lessons');
const chatbotRoutes = require('./server/routes/chatbot');
const settingsRoutes = require('./server/routes/settings');
const studentRoutes = require('./server/routes/students');
const teacherRoutes = require('./server/routes/teachers');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
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
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/login.html'));
});

app.get('/student', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/student.html'));
});

app.get('/teacher', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/teacher.html'));
});

app.get('/receptionist', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/receptionist.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/admin.html'));
});

app.get('/chatbot', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/chatbot.html'));
});

// Socket.io setup for real-time features (chat support and notifications)
io.on('connection', (socket) => {
    console.log('New client connected');
    
    // Chat support
    socket.on('chat message', (data) => {
        io.emit('chat message', data);
    });
    
    // Real-time notifications
    socket.on('notification', (data) => {
        io.emit('notification', data);
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});