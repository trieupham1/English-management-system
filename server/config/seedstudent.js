// seed-update-students.js
const mongoose = require('mongoose');
const Student = require('../models/Student');
require('dotenv').config();

const students = [
  {
    "_id": "681333f473460c095068d899",
    "username": "student1",
    "password": "$2b$10$wws/C/ekdUyHdbWAnppVD.iLU6jQY5n0HhZ0daP87U77GddYvQWMa",
    "fullName": "John Smith",
    "email": "john.smith@example.com",
    "phone": "123-456-7890",
    "avatar": "default-student-avatar.png",
    "studentInfo": {
      "studentId": "ST10001",
      "dateOfBirth": "1998-05-15T00:00:00.000Z",
      "currentLevel": "intermediate",
      "status": "active",
      "enrollmentDate": "2025-05-01T08:42:28.771Z",
      "course": "681324ee882466c61f8985ef",  // TOEFL Speaking and Writing
      "attendance": 0,
      "progress": 0
    },
    "lastLogin": "2025-05-02T13:40:40.871Z",
    "isActive": true,
    "createdAt": "2025-05-01T08:42:28.771Z",
    "updatedAt": "2025-05-01T08:42:28.771Z",
    "__v": 0
  },
  {
    "_id": "681333f473460c095068d89b",
    "username": "student3",
    "password": "$2b$10$MA7lDPVFMfbloiiMQhnCPuAf0/Tq.RouxP0LbhFNeTVAcM8/lefOm",
    "fullName": "Michael Chen",
    "email": "michael.chen@example.com",
    "phone": "345-678-9012",
    "avatar": "default-student-avatar.png",
    "studentInfo": {
      "studentId": "ST10003",
      "dateOfBirth": "1995-11-08T00:00:00.000Z",
      "currentLevel": "advanced",
      "status": "active",
      "enrollmentDate": "2025-05-01T08:42:28.773Z",
      "course": "681324ee882466c61f8985ed",  // Business Communication
      "attendance": 0,
      "progress": 0
    },
    "lastLogin": null,
    "isActive": true,
    "createdAt": "2025-05-01T08:42:28.773Z",
    "updatedAt": "2025-05-01T08:42:28.773Z",
    "__v": 0
  },
  {
    "_id": "681333f473460c095068d89a",
    "username": "student2",
    "password": "$2b$10$v.JnO.ji58X4OfzimBLzQOsCSBQvBnsBVS5ApmgosSCB6SsSlWYJO",
    "fullName": "Emily Johnson",
    "email": "emily.johnson@example.com",
    "phone": "234-567-8901",
    "avatar": "default-student-avatar.png",
    "studentInfo": {
      "studentId": "ST10002",
      "dateOfBirth": "2000-03-22T00:00:00.000Z",
      "currentLevel": "beginner",
      "status": "active",
      "enrollmentDate": "2025-05-01T08:42:28.772Z",
      "course": "681324ee882466c61f8985ec",  // Conversational English 101
      "attendance": 0,
      "progress": 0
    },
    "lastLogin": null,
    "isActive": true,
    "createdAt": "2025-05-01T08:42:28.772Z",
    "updatedAt": "2025-05-01T08:42:28.772Z",
    "__v": 0
  }
];

async function updateStudents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://kxck:d7NWu9Ulrm6EfpTi@englishcenter.rgssonp.mongodb.net/');
    console.log('Connected to MongoDB');

    // Update or insert students
    for (const student of students) {
      await Student.findOneAndUpdate(
        { _id: student._id },
        student,
        { 
          upsert: true, // Create if doesn't exist
          new: true,
          setDefaultsOnInsert: true
        }
      );
      console.log(`Updated/Created student: ${student.fullName}`);
    }

    console.log('Successfully updated students data');
    process.exit(0);
  } catch (error) {
    console.error('Error updating database:', error);
    process.exit(1);
  }
}

updateStudents();