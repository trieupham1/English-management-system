// seed-update-courses-and-teachers.js
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
require('dotenv').config();

const courses = [
  {
    "_id": "681324ee882466c61f8985ed",
    "name": "Business Communication",
    "level": "5.5-6.5",  // Changed to IELTS band
    "category": "Business English",
    "teacher": "681333f573460c095068d8a7",  // David Brown (business specialization)
    "maxStudents": 12,
    "status": "Active",
    "students": ["681333f473460c095068d89b"],  // Michael Chen
    "createdAt": "2025-05-01T07:38:22.520Z",
    "__v": 0
  },
  {
    "_id": "681324ee882466c61f8985ef",
    "name": "TOEFL Speaking and Writing",
    "level": "5.5-6.5",  // Changed to IELTS band
    "category": "TOEFL Preparation",
    "teacher": "681333f573460c095068d8a6",  // Sarah Wilson (IELTS specialization)
    "maxStudents": 8,
    "status": "Active",
    "students": ["681333f473460c095068d899"],  // John Smith
    "createdAt": "2025-05-01T07:38:22.521Z",
    "__v": 0
  },
  {
    "_id": "681324ee882466c61f8985ec",
    "name": "Conversational English 101",
    "level": "0-3",  // Changed to IELTS band
    "category": "General English",
    "teacher": "681333f573460c095068d8a7",  // David Brown
    "maxStudents": 15,
    "status": "Active",
    "students": ["681333f473460c095068d89a"],  // Emily Johnson
    "createdAt": "2025-05-01T07:38:22.520Z",
    "__v": 0
  },
  {
    "_id": "681324ee882466c61f8985ee",
    "name": "IELTS Academic Preparation",
    "level": "6.5+",  // Changed to IELTS band
    "category": "IELTS Preparation",
    "teacher": "681333f573460c095068d8a6",  // Sarah Wilson (IELTS specialization)
    "maxStudents": 10,
    "status": "Active",
    "students": [],
    "createdAt": "2025-05-01T07:38:22.521Z",
    "__v": 0
  }
];

async function updateCoursesAndTeachers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://kxck:d7NWu9Ulrm6EfpTi@englishcenter.rgssonp.mongodb.net/');
    console.log('Connected to MongoDB');

    // First, update courses
    for (const course of courses) {
      await Course.findOneAndUpdate(
        { _id: course._id },
        course,
        { 
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );
      console.log(`Updated/Created course: ${course.name}`);
    }

    // Then, update teachers with their assigned classes
    // Sarah Wilson teaches IELTS and TOEFL courses
    await Teacher.findOneAndUpdate(
      { _id: "681333f573460c095068d8a6" },
      { 
        $set: { 
          classes: [
            "681324ee882466c61f8985ef", // TOEFL Speaking and Writing
            "681324ee882466c61f8985ee"  // IELTS Academic Preparation
          ]
        }
      }
    );
    console.log("Updated Sarah Wilson's classes");

    // David Brown teaches Business and Conversational courses
    await Teacher.findOneAndUpdate(
      { _id: "681333f573460c095068d8a7" },
      { 
        $set: { 
          classes: [
            "681324ee882466c61f8985ed", // Business Communication
            "681324ee882466c61f8985ec"  // Conversational English 101
          ]
        }
      }
    );
    console.log("Updated David Brown's classes");

    // Laura Martinez has no assigned courses yet
    await Teacher.findOneAndUpdate(
      { _id: "681333f573460c095068d8a8" },
      { 
        $set: { 
          classes: []
        }
      }
    );
    console.log("Updated Laura Martinez's classes");

    console.log('Successfully updated courses and teachers');
    process.exit(0);
  } catch (error) {
    console.error('Error updating database:', error);
    process.exit(1);
  }
}

updateCoursesAndTeachers();