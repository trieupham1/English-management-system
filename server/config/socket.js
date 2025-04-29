const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Manager = require('../models/Manager');
const Receptionist = require('../models/Receptionist');

/**
 * Socket.io configuration for real-time features
 * This includes chat support, notifications, and live updates
 */

let io;

// Utility function to get model based on role
const getUserModel = (role) => {
  switch(role) {
    case 'student': return Student;
    case 'teacher': return Teacher;
    case 'manager': return Manager;
    default: throw new Error('Invalid role');
  }
};

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? 'https://yourdomain.com' 
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      // Verify token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'your_jwt_secret_key_for_english_center_app'
      );
      
      if (!decoded.role || !decoded.id) {
        return next(new Error('Authentication error: Invalid token payload'));
      }
      
      // Get appropriate model based on role
      const UserModel = getUserModel(decoded.role);
      
      // Get user from database
      const user = await UserModel.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket with role information
      socket.user = {
        ...user.toJSON(),
        role: decoded.role
      };
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });
  
  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user._id} (${socket.user.fullName}, ${socket.user.role})`);
    
    // Join user to their own room for private messages
    socket.join(socket.user._id.toString());
    
    // Join role-based rooms
    socket.join(`role:${socket.user.role}`);
    
    // Join appropriate rooms based on user role
    if (socket.user.role === 'student' && socket.user.studentInfo) {
      // If courses field exists, join those course rooms
      if (socket.user.courses && Array.isArray(socket.user.courses)) {
        socket.user.courses.forEach(courseId => {
          socket.join(`course:${courseId}`);
        });
      }
    }
    
    if (socket.user.role === 'teacher' && socket.user.classes) {
      // Join course rooms for classes they teach
      socket.user.classes.forEach(courseId => {
        socket.join(`course:${courseId}`);
      });
    }
    
    // Chat message handling
    socket.on('chat message', async (data) => {
      try {
        const { recipients, message, type = 'text' } = data;
        
        // Create message object
        const messageObject = {
          sender: {
            id: socket.user._id,
            name: socket.user.fullName,
            role: socket.user.role
          },
          message,
          type,
          timestamp: new Date()
        };
        
        // If recipients is provided, send to specific recipients
        if (recipients && recipients.length > 0) {
          recipients.forEach(recipientId => {
            io.to(recipientId).emit('chat message', messageObject);
          });
        } 
        // Otherwise broadcast to course room if courseId is provided
        else if (data.courseId) {
          io.to(`course:${data.courseId}`).emit('chat message', messageObject);
        }
        
        // Send confirmation to sender
        socket.emit('message sent', { success: true, timestamp: messageObject.timestamp });
      } catch (error) {
        console.error('Error sending chat message:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });
    
    // Notification handling
    socket.on('notification', (data) => {
      try {
        const { recipients, title, message, type = 'info' } = data;
        
        // Create notification object
        const notificationObject = {
          sender: {
            id: socket.user._id,
            name: socket.user.fullName,
            role: socket.user.role
          },
          title,
          message,
          type,
          timestamp: new Date()
        };
        
        // If recipients is provided, send to specific recipients
        if (recipients && recipients.length > 0) {
          recipients.forEach(recipientId => {
            io.to(recipientId).emit('notification', notificationObject);
          });
        } 
        // Send to all users with the same role
        else if (data.role) {
          io.to(`role:${data.role}`).emit('notification', notificationObject);
        }
        // Send to course room if courseId is provided
        else if (data.courseId) {
          io.to(`course:${data.courseId}`).emit('notification', notificationObject);
        }
        
        // Send confirmation to sender
        socket.emit('notification sent', { success: true });
      } catch (error) {
        console.error('Error sending notification:', error);
        socket.emit('error', { message: 'Error sending notification' });
      }
    });
    
    // Online status
    socket.on('set status', (status) => {
      // Update user's online status in memory
      socket.user.isOnline = status === 'online';
      
      // Notify relevant users about status change based on role
      if (socket.user.role === 'student' && socket.user.courses) {
        // Notify teachers of student's courses
        socket.user.courses.forEach(courseId => {
          socket.to(`course:${courseId}`).emit('user status', {
            userId: socket.user._id,
            name: socket.user.fullName,
            role: socket.user.role,
            status: status
          });
        });
      } else if (socket.user.role === 'teacher' && socket.user.classes) {
        // Notify students in teacher's courses
        socket.user.classes.forEach(courseId => {
          socket.to(`course:${courseId}`).emit('user status', {
            userId: socket.user._id,
            name: socket.user.fullName,
            role: socket.user.role,
            status: status
          });
        });
      } else {
        // For managers and receptionists, notify all staff
        socket.to('role:manager').to('role:teacher').emit('user status', {
          userId: socket.user._id,
          name: socket.user.fullName,
          role: socket.user.role,
          status: status
        });
      }
    });
    
    // Handle typing indicators for chat
    socket.on('typing', (data) => {
      const { recipients, courseId, isTyping } = data;
      
      const typingData = {
        userId: socket.user._id,
        name: socket.user.fullName,
        isTyping
      };
      
      // Send typing indicator to specific recipients
      if (recipients && recipients.length > 0) {
        recipients.forEach(recipientId => {
          socket.to(recipientId).emit('user typing', typingData);
        });
      } 
      // Send to course room
      else if (courseId) {
        socket.to(`course:${courseId}`).emit('user typing', typingData);
      }
    });
    
    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user._id} (${socket.user.fullName}, ${socket.user.role})`);
      
      // Notify about disconnection based on role
      if (socket.user.role === 'student' && socket.user.courses) {
        socket.user.courses.forEach(courseId => {
          socket.to(`course:${courseId}`).emit('user status', {
            userId: socket.user._id,
            name: socket.user.fullName,
            role: socket.user.role,
            status: 'offline'
          });
        });
      } else if (socket.user.role === 'teacher' && socket.user.classes) {
        socket.user.classes.forEach(courseId => {
          socket.to(`course:${courseId}`).emit('user status', {
            userId: socket.user._id,
            name: socket.user.fullName,
            role: socket.user.role,
            status: 'offline'
          });
        });
      } else {
        // For managers and receptionists, notify all staff
        socket.to('role:manager').to('role:teacher').emit('user status', {
          userId: socket.user._id,
          name: socket.user.fullName,
          role: socket.user.role,
          status: 'offline'
        });
      }
    });
  });
  
  return io;
};

// Function to get the io instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO
};