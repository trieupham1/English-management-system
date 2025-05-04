const Student = require('../models/Student');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Material = require('../models/Material');
const Announcement = require('../models/Announcement');
exports.getStudentDashboard = async (req, res) => {
    try {
        // Get the student ID from the authenticated user
        const studentId = req.user._id;
        
        // Fetch the student
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        console.log('Student found:', student._id);
        
        // Get all courses where this student is enrolled
        const courses = await Course.find({
            students: studentId.toString()
        });
        
        console.log('Student\'s courses:', courses.length);
        
        // Get assignments
        let assignments = [];
        try {
            // Simply get all assignments
            assignments = await Assignment.find().limit(3);
            console.log('Found assignments:', assignments.length);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        }
        
        // Format assignments with statuses
        const formattedAssignments = assignments.length > 0 ? 
            assignments.map((assignment, index) => {
                // Assign statuses in rotation for visual demonstration
                const status = ['pending', 'completed', 'overdue'][index % 3];
                
                return {
                    title: assignment.title,
                    dueDate: assignment.dueDate || new Date(),
                    status: status
                };
            }) : 
            // Default assignments if none found
            [
                {
                    title: "Writing Essay",
                    dueDate: new Date('2025-04-18'),
                    status: 'pending'
                },
                {
                    title: "Grammar Quiz", 
                    dueDate: new Date('2025-04-20'),
                    status: 'completed'
                },
                {
                    title: "Vocabulary Test",
                    dueDate: new Date('2025-04-10'),
                    status: 'overdue'
                }
            ];
        
        // Get announcements
        const announcements = await Announcement.find()
            .sort('-date')
            .limit(3);
        
        // Format announcements
        const formattedAnnouncements = announcements.map(announcement => ({
            title: announcement.title,
            content: announcement.content,
            date: announcement.date
        }));
        
        // Return dashboard data
        return res.status(200).json({
            success: true,
            data: {
                firstName: student.fullName ? student.fullName.split(' ')[0] : 'Student',
                nextClass: {
                    name: courses.length > 0 ? courses[0].name : 'English Class',
                    startsIn: '2 hours'
                },
                assignments: formattedAssignments,
                announcements: formattedAnnouncements
            }
        });
        
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
// In studentController.js
exports.getCoursesForDropdown = async (req, res) => {
    try {
        const Course = require('../models/Course');
        
        // Get active courses for dropdown
        const courses = await Course.find({ status: 'Active' })
            .select('_id name level category')
            .lean();
        
        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        console.error('Error fetching courses for dropdown:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
// In studentController.js
exports.getMaterialsByCourse = async (req, res) => {
    try {
        const Material = require('../models/Material');
        const courseId = req.params.courseId;
        
        // Fetch materials for the specific course
        let materials;
        if (courseId === 'all') {
            // If 'all' is selected, get all materials
            materials = await Material.find()
                .sort({ createdAt: -1 })
                .lean();
        } else {
            // Get materials for specific course
            materials = await Material.find({ course: courseId })
                .sort({ createdAt: -1 })
                .lean();
        }
        
        res.status(200).json({
            success: true,
            count: materials.length,
            data: materials
        });
    } catch (error) {
        console.error('Error fetching materials by course:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find()
            .select('-password')
            .select('-__v');
        
        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get a single student
exports.getStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .select('-password')
            .select('-__v');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Create a new student
exports.createStudent = async (req, res) => {
    try {
        // Check if student with this email already exists
        const existingStudent = await Student.findOne({ 
            $or: [
                { email: req.body.email },
                { username: req.body.username }
            ]
        });
        
        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: 'Student with this email or username already exists'
            });
        }
        
        // Generate student ID
        const studentId = 'ST' + Math.floor(10000 + Math.random() * 90000);
        
        // Create student
        const student = new Student({
            ...req.body,
            studentInfo: {
                ...req.body.studentInfo,
                studentId,
                status: 'pending',
                enrollmentDate: new Date()
            }
        });
        
        await student.save();
        
        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            data: student
        });
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Update a student
exports.updateStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(
            req.params.id,
            req.body,
            { 
                new: true, 
                runValidators: true 
            }
        );
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Student updated successfully',
            data: student
        });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Delete a student
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Remove student from courses
        await Course.updateMany(
            { 'students.student': req.params.id },
            { $pull: { students: { student: req.params.id } } }
        );
        
        res.status(200).json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
// In studentController.js, update the getStudentCourses function
exports.getStudentCourses = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Find the student and populate the course and teacher information
        const student = await Student.findOne({ _id: userId })
            .populate({
                path: 'studentInfo.course',
                populate: {
                    path: 'teacher',
                    select: 'fullName email teacherInfo.teacherId'
                }
            });
        
        if (!student || !student.studentInfo.course) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: []
            });
        }
        
        // Return single course as an array for compatibility with frontend
        const courses = [student.studentInfo.course];
        
        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        console.error('Error fetching student courses:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
// Update course enrollment function
exports.enrollInCourse = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const courseId = req.body.courseId;
        
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Check if student already has a course
        if (student.studentInfo.course) {
            return res.status(400).json({
                success: false,
                message: 'Student is already enrolled in a course. Please unenroll first.'
            });
        }
        
        // Update student with new course
        student.studentInfo.course = courseId;
        await student.save();
        
        // Also update course with student
        const course = await Course.findById(courseId);
        if (course) {
            course.students.push(studentId);
            await course.save();
        }
        
        res.status(200).json({
            success: true,
            message: 'Student enrolled successfully',
            data: student
        });
    } catch (error) {
        console.error('Error enrolling student:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Add function to unenroll from course
exports.unenrollFromCourse = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        if (!student.studentInfo.course) {
            return res.status(400).json({
                success: false,
                message: 'Student is not enrolled in any course'
            });
        }
        
        // Remove student from course
        const courseId = student.studentInfo.course;
        const course = await Course.findById(courseId);
        
        if (course) {
            course.students = course.students.filter(id => id.toString() !== studentId);
            await course.save();
        }
        
        // Remove course from student
        student.studentInfo.course = null;
        await student.save();
        
        res.status(200).json({
            success: true,
            message: 'Student unenrolled successfully',
            data: student
        });
    } catch (error) {
        console.error('Error unenrolling student:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
// Update your getStudentAssignments function in studentController.js

exports.getStudentAssignments = async (req, res) => {
    try {
        // Get the current user's ID
        const studentId = req.params.id || req.user._id;
        
        // Get student data
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Get all assignments
        let assignments = await Assignment.find()
            .limit(10)
            .populate('course', 'name');
        
        if (assignments.length === 0) {
            // If no assignments found, provide default data
            assignments = [
                {
                    _id: "assignment1",
                    title: "Writing Essay",
                    description: "Write a 300-word essay on the topic \"The Importance of Learning English in Today's World\".",
                    dueDate: new Date('2025-04-18'),
                    course: { _id: "course1", name: "Conversational English" },
                    status: 'pending'
                },
                {
                    _id: "assignment2",
                    title: "Grammar Quiz",
                    description: "Online quiz covering present perfect and present perfect continuous tenses.",
                    dueDate: new Date('2025-04-20'),
                    course: { _id: "course1", name: "Conversational English" },
                    status: 'completed'
                },
                {
                    _id: "assignment3",
                    title: "Vocabulary Test",
                    description: "Complete the vocabulary test on academic words for IELTS.",
                    dueDate: new Date('2025-04-10'),
                    course: { _id: "course2", name: "IELTS Preparation" },
                    status: 'overdue'
                }
            ];
        } else {
            // Format real assignments with status
            assignments = assignments.map((assignment, index) => {
                // Assign statuses in a predictable way for visual demonstration
                let status;
                if (index % 3 === 0) status = 'pending';
                else if (index % 3 === 1) status = 'completed';
                else status = 'overdue';
                
                return {
                    ...assignment.toObject(),
                    status: status
                };
            });
        }
        
        return res.status(200).json({
            success: true,
            count: assignments.length,
            data: assignments
        });
    } catch (error) {
        console.error('Error fetching student assignments:', error);
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
// Get course materials for current student
exports.getCourseMaterials = async (req, res) => {
    try {
        // Get student ID
        const studentId = req.user._id;
        
        // Get student data
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Get student's courses
        const courseIds = student.studentInfo.courses;
        
        // Get materials for these courses
        const materials = await Material.find({
            course: { $in: courseIds }
        })
        .populate('course', 'name')
        .sort('-createdAt');
        
        return res.status(200).json({
            success: true,
            count: materials.length,
            data: materials
        });
    } catch (error) {
        console.error('Error fetching course materials:', error);
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get student's progress
exports.getStudentProgress = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('studentInfo.courses');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Calculate progress for each course
        const courseProgress = await Promise.all(
            student.studentInfo.courses.map(async (course) => {
                const assignments = await Assignment.find({ course: course._id });
                
                const totalAssignments = assignments.length;
                const completedAssignments = assignments.filter(assignment => 
                    assignment.submissions.some(
                        sub => sub.student.toString() === student._id.toString() && sub.grade
                    )
                ).length;
                
                const progressPercentage = totalAssignments > 0
                    ? Math.round((completedAssignments / totalAssignments) * 100)
                    : 0;
                
                return {
                    courseId: course._id,
                    courseName: course.name,
                    totalAssignments,
                    completedAssignments,
                    progressPercentage
                };
            })
        );
        
        res.status(200).json({
            success: true,
            data: courseProgress
        });
    } catch (error) {
        console.error('Error fetching student progress:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Update student attendance
exports.updateAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { courseId, date, status } = req.body;
        
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Find the course
        const course = await Course.findById(courseId);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // Find student's enrollment in the course
        const studentEnrollment = course.students.find(
            s => s.student.toString() === studentId
        );
        
        if (!studentEnrollment) {
            return res.status(404).json({
                success: false,
                message: 'Student not enrolled in this course'
            });
        }
        
        // Update or add attendance record
        const attendanceIndex = studentEnrollment.attendance.findIndex(
            a => new Date(a.date).toDateString() === new Date(date).toDateString()
        );
        
        if (attendanceIndex !== -1) {
            // Update existing record
            studentEnrollment.attendance[attendanceIndex].status = status;
        } else {
            // Add new record
            studentEnrollment.attendance.push({ date, status });
        }
        
        // Calculate attendance percentage
        const totalClasses = studentEnrollment.attendance.length;
        const presentClasses = studentEnrollment.attendance.filter(
            a => a.status === 'present'
        ).length;
        
        studentEnrollment.attendancePercentage = totalClasses > 0
            ? Math.round((presentClasses / totalClasses) * 100)
            : 0;
        
        await course.save();
        
        res.status(200).json({
            success: true,
            message: 'Attendance updated successfully',
            data: studentEnrollment
        });
    } catch (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get pending student registrations
exports.getPendingRegistrations = async (req, res) => {
    try {
        const pendingStudents = await Student.find({
            'studentInfo.status': 'pending'
        }).select('-password');
        
        res.status(200).json({
            success: true,
            count: pendingStudents.length,
            data: pendingStudents
        });
    } catch (error) {
        console.error('Error fetching pending registrations:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Approve student registration
exports.approveRegistration = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        student.studentInfo.status = 'active';
        await student.save();
        
        res.status(200).json({
            success: true,
            message: 'Student registration approved',
            data: student
        });
    } catch (error) {
        console.error('Error approving registration:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};