// mongo-init/init.js
db = db.getSiblingDB('elc');

// Create initial admin user
db.users.insertOne({
  username: 'admin',
  password: '$2a$10$YourHashedPasswordHere', // Properly hashed password
  role: 'admin',
  fullName: 'Admin User',
  email: 'admin@example.com',
  createdAt: new Date()
});

// Add other initial data if needed