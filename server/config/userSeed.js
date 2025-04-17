// server/seeders/userSeed.js
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://kxck:d7NWu9Ulrm6EfpTi@englishcenter.rgssonp.mongodb.net/', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Pre-hash passwords (since we're bypassing the model's pre-save middleware)
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Seed Users
const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    console.log('Previous user data cleared');

    // Create sample users with pre-hashed passwords
    const defaultPassword = await hashPassword('password123');

    const users = [
      // Manager
      {
        username: 'manager1',
        password: defaultPassword,
        fullName: 'John Manager',
        email: 'manager@example.com',
        phone: '1234567890',
        role: 'manager',
        lastLogin: new Date(),
        isActive: true
      },
      
      // Teachers
      {
        username: 'teacher1',
        password: defaultPassword,
        fullName: 'Sarah Smith',
        email: 'teacher1@example.com',
        phone: '2345678901',
        role: 'teacher',
        teacherInfo: {
          teacherId: 'T12345',
          specialization: 'general',
          qualifications: ['TEFL Certified', 'M.A. in Education'],
          schedule: [
            {
              day: 'monday',
              startTime: '09:00',
              endTime: '12:00'
            },
            {
              day: 'wednesday',
              startTime: '13:00',
              endTime: '16:00'
            }
          ]
        }
      },
      {
        username: 'teacher2',
        password: defaultPassword,
        fullName: 'Robert Johnson',
        email: 'teacher2@example.com',
        phone: '3456789012',
        role: 'teacher',
        teacherInfo: {
          teacherId: 'T23456',
          specialization: 'business',
          qualifications: ['CELTA', 'Business English Certificate'],
          schedule: [
            {
              day: 'tuesday',
              startTime: '09:00',
              endTime: '12:00'
            },
            {
              day: 'thursday',
              startTime: '13:00',
              endTime: '16:00'
            }
          ]
        }
      },
      
      // Students
      {
        username: 'student1',
        password: defaultPassword,
        fullName: 'Emma Wilson',
        email: 'student1@example.com',
        phone: '4567890123',
        role: 'student',
        studentInfo: {
          studentId: 'ST12345',
          dateOfBirth: new Date('1995-05-15'),
          enrollmentDate: new Date(),
          currentLevel: 'intermediate',
          attendance: 85,
          status: 'active',
          progress: 75
        }
      },
      {
        username: 'student2',
        password: defaultPassword,
        fullName: 'Michael Brown',
        email: 'student2@example.com',
        phone: '5678901234',
        role: 'student',
        studentInfo: {
          studentId: 'ST23456',
          dateOfBirth: new Date('1998-10-20'),
          enrollmentDate: new Date(),
          currentLevel: 'beginner',
          attendance: 90,
          status: 'active',
          progress: 50
        }
      },
      {
        username: 'student3',
        password: defaultPassword,
        fullName: 'Sophia Lee',
        email: 'student3@example.com',
        phone: '6789012345',
        role: 'student',
        studentInfo: {
          studentId: 'ST34567',
          dateOfBirth: new Date('1997-03-10'),
          enrollmentDate: new Date(),
          currentLevel: 'advanced',
          attendance: 95,
          status: 'active',
          progress: 90
        }
      },
      
      // Receptionist
      {
        username: 'reception1',
        password: defaultPassword,
        fullName: 'Linda Chen',
        email: 'reception@example.com',
        phone: '7890123456',
        role: 'receptionist',
        lastLogin: new Date(),
        isActive: true
      }
    ];

    // Insert users
    await User.insertMany(users);
    console.log(`${users.length} users seeded successfully`);

  } catch (error) {
    console.error(`Error seeding users: ${error.message}`);
  }
};

// Main function to run the seeder
const runSeeder = async () => {
  try {
    await connectDB();
    await seedUsers();
    console.log('Data seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error(`Error in seed process: ${error.message}`);
    process.exit(1);
  }
};

// Run the seeder
runSeeder();