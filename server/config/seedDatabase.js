// server/config/seedDatabase.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const LessonMaterial = require('../models/LessonMaterial');
const Assignment = require('../models/Assignment');
const Settings = require('../models/Settings');
const ChatbotMessage = require('../models/ChatbotMessage');

// Connect to MongoDB
const connectDB = require('./db');

// Function to hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Seed the database with example data
const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    await LessonMaterial.deleteMany({});
    await Assignment.deleteMany({});
    await Settings.deleteMany({});
    await ChatbotMessage.deleteMany({});
    
    console.log('Database cleared, starting seed process...');
    
    // Create users
    const hashedPassword = await hashPassword('password123');
    
    // Create manager
    const manager = await User.create({
      username: 'admin',
      password: hashedPassword,
      fullName: 'Admin User',
      email: 'admin@englishcenter.com',
      phone: '+84 901 234 567',
      role: 'manager'
    });
    
    // Create receptionist
    const receptionist = await User.create({
      username: 'reception',
      password: hashedPassword,
      fullName: 'Lisa Chen',
      email: 'reception@englishcenter.com',
      phone: '+84 902 345 678',
      role: 'receptionist'
    });
    
    // Create teachers
    const teacher1 = await User.create({
      username: 'teacher1',
      password: hashedPassword,
      fullName: 'Sarah Williams',
      email: 'sarah@englishcenter.com',
      phone: '+84 903 456 789',
      role: 'teacher',
      teacherInfo: {
        teacherId: 'T10001',
        specialization: 'general',
        qualifications: ['TESOL Certified', 'MA in English Education'],
        schedule: []
      }
    });
    
    const teacher2 = await User.create({
      username: 'teacher2',
      password: hashedPassword,
      fullName: 'John Davis',
      email: 'john@englishcenter.com',
      phone: '+84 904 567 890',
      role: 'teacher',
      teacherInfo: {
        teacherId: 'T10002',
        specialization: 'ielts',
        qualifications: ['CELTA Certified', 'IELTS Examiner'],
        schedule: []
      }
    });
    
    const teacher3 = await User.create({
      username: 'teacher3',
      password: hashedPassword,
      fullName: 'Emma Wilson',
      email: 'emma@englishcenter.com',
      phone: '+84 905 678 901',
      role: 'teacher',
      teacherInfo: {
        teacherId: 'T10003',
        specialization: 'business',
        qualifications: ['TEFL Certified', 'MBA'],
        schedule: []
      }
    });
    
    // Create students
    const student1 = await User.create({
      username: 'student1',
      password: hashedPassword,
      fullName: 'Emily Parker',
      email: 'emily@example.com',
      phone: '+84 906 789 012',
      role: 'student',
      studentInfo: {
        studentId: 'ST10045',
        dateOfBirth: new Date(1998, 5, 15),
        enrollmentDate: new Date(2023, 1, 10),
        currentLevel: 'intermediate',
        status: 'active',
        courses: [],
        attendance: 92,
        progress: 65
      }
    });
    
    const student2 = await User.create({
      username: 'student2',
      password: hashedPassword,
      fullName: 'Michael Johnson',
      email: 'michael@example.com',
      phone: '+84 907 890 123',
      role: 'student',
      studentInfo: {
        studentId: 'ST10046',
        dateOfBirth: new Date(1995, 8, 22),
        enrollmentDate: new Date(2023, 2, 5),
        currentLevel: 'upper-intermediate',
        status: 'active',
        courses: [],
        attendance: 88,
        progress: 72
      }
    });
    
    const student3 = await User.create({
      username: 'student3',
      password: hashedPassword,
      fullName: 'Sarah Williams',
      email: 'sarahw@example.com',
      phone: '+84 908 901 234',
      role: 'student',
      studentInfo: {
        studentId: 'ST10047',
        dateOfBirth: new Date(2000, 3, 10),
        enrollmentDate: new Date(2023, 1, 15),
        currentLevel: 'intermediate',
        status: 'pending',
        courses: [],
        attendance: 0,
        progress: 0
      }
    });
    
    const student4 = await User.create({
      username: 'student4',
      password: hashedPassword,
      fullName: 'David Chen',
      email: 'david@example.com',
      phone: '+84 909 012 345',
      role: 'student',
      studentInfo: {
        studentId: 'ST10048',
        dateOfBirth: new Date(1997, 10, 8),
        enrollmentDate: new Date(2022, 9, 20),
        currentLevel: 'advanced',
        status: 'inactive',
        courses: [],
        attendance: 76,
        progress: 85
      }
    });
    
    const student5 = await User.create({
      username: 'student5',
      password: hashedPassword,
      fullName: 'Jessica Lee',
      email: 'jessica@example.com',
      phone: '+84 910 123 456',
      role: 'student',
      studentInfo: {
        studentId: 'ST10049',
        dateOfBirth: new Date(1999, 7, 30),
        enrollmentDate: new Date(2023, 3, 5),
        currentLevel: 'beginner',
        status: 'pending',
        courses: [],
        attendance: 0,
        progress: 0
      }
    });
    
    // Create courses
    const course1 = await Course.create({
      name: 'Conversational English',
      description: 'Improve your speaking skills in everyday situations.',
      level: 'intermediate',
      category: 'general',
      duration: {
        value: 3,
        unit: 'months'
      },
      schedule: [
        {
          day: 'monday',
          startTime: '14:00',
          endTime: '15:30',
          room: '204'
        },
        {
          day: 'wednesday',
          startTime: '14:00',
          endTime: '15:30',
          room: '204'
        },
        {
          day: 'friday',
          startTime: '14:00',
          endTime: '15:30',
          room: '204'
        }
      ],
      teacher: teacher1._id,
      price: 3000000,
      maxStudents: 20,
      status: 'active',
      startDate: new Date(2023, 3, 10),
      endDate: new Date(2023, 6, 10),
      lessons: [],
      students: [
        {
          student: student1._id,
          enrollmentDate: new Date(2023, 3, 8),
          status: 'active',
          payment: {
            status: 'paid',
            amount: 3000000
          },
          attendance: [
            {
              date: new Date(2023, 3, 10),
              status: 'present'
            },
            {
              date: new Date(2023, 3, 12),
              status: 'present'
            },
            {
              date: new Date(2023, 3, 14),
              status: 'present'
            }
          ],
          attendancePercentage: 100
        },
        {
          student: student2._id,
          enrollmentDate: new Date(2023, 3, 9),
          status: 'active',
          payment: {
            status: 'paid',
            amount: 3000000
          },
          attendance: [
            {
              date: new Date(2023, 3, 10),
              status: 'present'
            },
            {
              date: new Date(2023, 3, 12),
              status: 'absent'
            },
            {
              date: new Date(2023, 3, 14),
              status: 'present'
            }
          ],
          attendancePercentage: 67
        }
      ]
    });

    const course2 = await Course.create({
      name: 'Business English',
      description: 'Develop English skills for professional business environments.',
      level: 'upper-intermediate',
      category: 'business',
      duration: {
        value: 4,
        unit: 'months'
      },
      schedule: [
        {
          day: 'tuesday',
          startTime: '18:00',
          endTime: '19:30',
          room: '301'
        },
        {
          day: 'thursday',
          startTime: '18:00',
          endTime: '19:30',
          room: '301'
        }
      ],
      teacher: teacher3._id,
      price: 4500000,
      maxStudents: 15,
      status: 'active',
      startDate: new Date(2023, 2, 15),
      endDate: new Date(2023, 6, 15),
      lessons: [],
      students: [
        {
          student: student2._id,
          enrollmentDate: new Date(2023, 2, 10),
          status: 'active',
          payment: {
            status: 'installment',
            amount: 4500000,
            installments: [
              {
                date: new Date(2023, 2, 10),
                amount: 1500000,
                status: 'paid'
              },
              {
                date: new Date(2023, 3, 10),
                amount: 1500000,
                status: 'paid'
              },
              {
                date: new Date(2023, 4, 10),
                amount: 1500000,
                status: 'pending'
              }
            ]
          },
          attendance: [
            {
              date: new Date(2023, 2, 16),
              status: 'present'
            },
            {
              date: new Date(2023, 2, 18),
              status: 'present'
            },
            {
              date: new Date(2023, 2, 23),
              status: 'absent'
            }
          ],
          attendancePercentage: 67
        }
      ]
    });

    const course3 = await Course.create({
      name: 'IELTS Preparation',
      description: 'Comprehensive preparation for the IELTS exam.',
      level: 'advanced',
      category: 'ielts',
      duration: {
        value: 2,
        unit: 'months'
      },
      schedule: [
        {
          day: 'monday',
          startTime: '18:00',
          endTime: '20:00',
          room: '105'
        },
        {
          day: 'thursday',
          startTime: '18:00',
          endTime: '20:00',
          room: '105'
        }
      ],
      teacher: teacher2._id,
      price: 5000000,
      maxStudents: 12,
      status: 'active',
      startDate: new Date(2023, 4, 1),
      endDate: new Date(2023, 6, 1),
      lessons: [],
      students: []
    });
    
    // Update teacher classes
    teacher1.teacherInfo.classes = [course1._id];
    await teacher1.save();
    
    teacher2.teacherInfo.classes = [course3._id];
    await teacher2.save();
    
    teacher3.teacherInfo.classes = [course2._id];
    await teacher3.save();
    
    // Update student courses
    student1.studentInfo.courses = [course1._id];
    await student1.save();
    
    student2.studentInfo.courses = [course1._id, course2._id];
    await student2.save();
    
    // Create lessons for course1
    const lesson1 = await Lesson.create({
      title: 'Introduction to Conversational English',
      description: 'Getting comfortable with everyday conversations.',
      course: course1._id,
      date: new Date(2023, 3, 10),
      duration: 90,
      objectives: [
        'Introduce yourself confidently',
        'Learn common greetings and phrases',
        'Practice basic conversation flow'
      ],
      materials: [],
      activities: [
        {
          title: 'Ice Breaker',
          description: 'Students introduce themselves and share one interesting fact.',
          duration: 15
        },
        {
          title: 'Common Phrases',
          description: 'Learn and practice everyday phrases.',
          duration: 30
        },
        {
          title: 'Conversation Practice',
          description: 'Pair work to practice conversations.',
          duration: 45
        }
      ],
      homework: 'Practice introducing yourself to 3 different people.',
      status: 'completed'
    });
    
    const lesson2 = await Lesson.create({
      title: 'Small Talk Strategies',
      description: 'Learn how to engage in casual conversations.',
      course: course1._id,
      date: new Date(2023, 3, 12),
      duration: 90,
      objectives: [
        'Understand the purpose of small talk',
        'Learn topics suitable for small talk',
        'Practice maintaining casual conversation'
      ],
      materials: [],
      activities: [
        {
          title: 'Small Talk Topics',
          description: 'Discuss appropriate and inappropriate small talk topics.',
          duration: 20
        },
        {
          title: 'Question Techniques',
          description: 'Learn how to ask open-ended questions.',
          duration: 30
        },
        {
          title: 'Role Play',
          description: 'Practice small talk in different scenarios.',
          duration: 40
        }
      ],
      homework: 'Start a small talk conversation with someone you don\'t know well.',
      status: 'completed'
    });
    
    // Add lessons to course
    course1.lessons = [lesson1._id, lesson2._id];
    await course1.save();
    
    // Create lesson materials
    const material1 = await LessonMaterial.create({
      title: 'Common Greetings and Phrases',
      description: 'A handout with everyday expressions.',
      type: 'document',
      lesson: lesson1._id,
      course: course1._id,
      uploadedBy: teacher1._id,
      isPublic: true,
      tags: ['greetings', 'conversation', 'beginner']
    });
    
    const material2 = await LessonMaterial.create({
      title: 'Conversation Practice Slides',
      description: 'Presentation slides for conversation practice.',
      type: 'presentation',
      lesson: lesson1._id,
      course: course1._id,
      uploadedBy: teacher1._id,
      isPublic: true,
      tags: ['practice', 'conversation', 'slides']
    });
    
    // Add materials to lesson
    lesson1.materials = [material1._id, material2._id];
    await lesson1.save();
    
    // Create assignments
    const assignment1 = await Assignment.create({
      title: 'Conversation Recording',
      description: 'Record a 2-minute conversation with a partner on any everyday topic.',
      course: course1._id,
      lesson: lesson1._id,
      dueDate: new Date(2023, 3, 17),
      totalPoints: 20,
      allowLateSubmissions: true,
      latePenalty: 10,
      createdBy: teacher1._id,
      submissions: [
        {
          student: student1._id,
          content: 'I recorded a conversation about favorite movies with my friend.',
          submittedAt: new Date(2023, 3, 16),
          isLate: false,
          grade: 18,
          feedback: 'Good natural flow, but could use more complex expressions.',
          gradedAt: new Date(2023, 3, 18),
          gradedBy: teacher1._id
        }
      ]
    });
    
    // Create system settings
    await Settings.create({
      centerName: 'English Learning Center',
      address: '123 Education Street, City, Country',
      phone: '+84 123 456 789',
      email: 'info@englishcenter.com',
      workingHours: 'Monday-Friday: 8:00 AM - 8:00 PM, Saturday: 9:00 AM - 5:00 PM',
      currencySymbol: '₫',
      language: 'en',
      maxStudentsPerClass: 20,
      enableChatbot: true,
      enableOnlineLearning: true,
      theme: 'light',
      notificationSettings: {
        emailNotifications: true,
        smsNotifications: false,
        newRegistrationAlert: true,
        newPaymentAlert: true,
        assignmentReminderAlert: true
      },
      updatedBy: manager._id
    });
    
    // Create chatbot messages
    await ChatbotMessage.create({
      user: student1._id,
      message: 'Hi, can you tell me my class schedule?',
      isUserMessage: true,
      timestamp: new Date(2023, 3, 15, 10, 30)
    });
    
    await ChatbotMessage.create({
      user: student1._id,
      message: 'Here is your class schedule for Conversational English: Monday, Wednesday, and Friday from 14:00 to 15:30 in Room 204.',
      isUserMessage: false,
      timestamp: new Date(2023, 3, 15, 10, 30, 5)
    });
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();