const mongoose = require('mongoose');
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
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Pre-hash passwords 
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Seed data directly using MongoDB driver
const seedData = async (conn) => {
  try {
    const db = conn.connection.db;
    
    // Drop existing collections to start fresh
    const collections = ['students', 'teachers', 'managers', 'receptionists'];
    for (const collection of collections) {
      try {
        await db.dropCollection(collection);
        console.log(`Dropped collection: ${collection}`);
      } catch (error) {
        console.log(`No collection ${collection} to drop or other issue`);
      }
    }
    
    // Check for existing indexes and drop them
    const teachersCollection = db.collection('teachers');
    try {
      const indexes = await teachersCollection.indexes();
      console.log('Current indexes:', indexes);
      
      // Drop any teacherId index if it exists
      for (const index of indexes) {
        if (index.name === 'teacherId_1' || index.key?.teacherId) {
          await teachersCollection.dropIndex(index.name);
          console.log(`Dropped index: ${index.name}`);
        }
      }
    } catch (error) {
      console.log('Error checking/dropping indexes:', error.message);
    }
    
    // Hash password
    const defaultPassword = await hashPassword('password123');
    
    // Insert managers
    await db.collection('managers').insertOne({
      username: 'manager1',
      password: defaultPassword,
      fullName: 'John Manager',
      email: 'manager@example.com',
      phone: '1234567890',
      department: 'Administration',
      lastLogin: new Date(),
      isActive: true
    });
    console.log('Manager seeded');
    
    // Insert teacher with explicit schema structure
    await db.collection('teachers').insertOne({
      username: 'teacher1',
      password: defaultPassword,
      fullName: 'Sarah Smith',
      email: 'teacher1@example.com',
      phone: '2345678901',
      teacherInfo: {
        teacherId: 'T12345',
        specialization: 'general',
        qualifications: ['TEFL Certified', 'M.A. in Education'],
        certifications: ['Cambridge TKT']
      },
      // Add at top level too if there's an index on it
      teacherId: 'T12345',
      classes: [],
      schedule: [
        {
          day: 'monday',
          startTime: '09:00',
          endTime: '12:00'
        }
      ],
      salary: 3000,
      hireDate: new Date('2023-01-15'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Teacher seeded');
    
    // Insert student
    await db.collection('students').insertOne({
      username: 'student1',
      password: defaultPassword,
      fullName: 'Emma Wilson',
      email: 'student1@example.com',
      phone: '4567890123',
      studentInfo: {
        studentId: 'ST12345',
        dateOfBirth: new Date('1995-05-15'),
        enrollmentDate: new Date(),
        currentLevel: 'intermediate',
        attendance: 85,
        status: 'active',
        progress: 75
      }
    });
    console.log('Student seeded');
    
    // Insert receptionist
    await db.collection('receptionists').insertOne({
      username: 'reception1',
      password: defaultPassword,
      fullName: 'Linda Chen',
      email: 'reception@example.com',
      phone: '7890123456',
      employeeId: 'RC12345',
      shift: 'morning',
      responsibilities: ['student registration', 'course inquiries'],
      lastLogin: new Date(),
      isActive: true
    });
    console.log('Receptionist seeded');
    
    console.log('All data seeded successfully');
    
  } catch (error) {
    console.error(`Error seeding data: ${error.message}`);
  }
};

// Main function to run the seeder
const runSeeder = async () => {
  try {
    const conn = await connectDB();
    await seedData(conn);
    console.log('Data seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error(`Error in seed process: ${error.message}`);
    process.exit(1);
  }
};

// Run the seeder
runSeeder();