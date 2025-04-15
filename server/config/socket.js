const socketIO = require('socket.io');
const axios = require('axios'); // You'll need to install axios if not already installed
const ConnectionLog = require('../models/ConnectionLog'); // Import the model directly

let io = null;

// Helper function to log connections directly to the database
async function logConnection(clientId, type, room = null) {
  try {
    // Create and save log entry directly using the model
    const log = new ConnectionLog({
      clientId,
      type,
      room
    });
    
    await log.save();
  } catch (error) {
    console.error('Error logging connection:', error);
  }
}

module.exports = {
  init: (server) => {
    if (io) {
      return io; // Return existing instance if already initialized
    }
    
    io = socketIO(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    
    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);
      
      // Log connection event
      logConnection(socket.id, 'connect');
      
      // Join kitchen room for kitchen staff
      socket.on('joinKitchen', () => {
        socket.join('kitchen');
        console.log(`${socket.id} joined kitchen room`);
        logConnection(socket.id, 'join', 'kitchen');
      });
      
      // Join staff room for waitstaff
      socket.on('joinStaff', () => {
        socket.join('staff');
        console.log(`${socket.id} joined staff room`);
        logConnection(socket.id, 'join', 'staff');
      });
      
      // Join admin room for admins
      socket.on('joinAdmin', () => {
        socket.join('admin');
        console.log(`${socket.id} joined admin room`);
        logConnection(socket.id, 'join', 'admin');
      });
      
      // Join customer room for specific table
      socket.on('joinTable', (tableNumber) => {
        socket.join(`table-${tableNumber}`);
        console.log(`${socket.id} joined table-${tableNumber} room`);
        // We don't log table joins to avoid cluttering the logs
      });
      
      // Generic join room functionality
      socket.on('join', (data) => {
        const role = data.role || 'customer';
        socket.join(role);
        console.log(`Client joined ${role} room`);
        
        // Only log standard roles to avoid cluttering logs
        if (['admin', 'staff', 'kitchen'].includes(role)) {
          logConnection(socket.id, 'join', role);
        }
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        logConnection(socket.id, 'disconnect');
      });
    });
    
    return io;
  },
  
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};