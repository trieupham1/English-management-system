const Receptionist = require('../models/Receptionist');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class'); // Add this import
exports.getDashboardData = async (req, res) => {
    try {
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Total students
        const totalStudents = await Student.countDocuments();
        
        // Total active classes
        const activeClasses = await Class.countDocuments({ 
            status: 'active' 
        });
        
        // New student registrations in the last 24 hours
        const newRegistrationsToday = await Student.countDocuments({
            createdAt: {
                $gte: today,
                $lt: tomorrow
            }
        });
        
        // Classes scheduled for today
        const todayClasses = await Class.countDocuments({
            'schedule.date': {
                $gte: today,
                $lt: tomorrow
            },
            status: 'active'
        });
        
        // Optional: Fetch some additional details for the dashboard
        const recentStudents = await Student.find({
            createdAt: {
                $gte: today,
                $lt: tomorrow
            }
        }).select('fullName email studentInfo.studentId createdAt');
        
        const upcomingClasses = await Class.find({
            'schedule.date': {
                $gte: today,
                $lt: tomorrow
            },
            status: 'active'
        })
        .populate('course', 'name')
        .populate('teacher', 'fullName')
        .select('name schedule course teacher');
        
        // Prepare response
        res.status(200).json({
            success: true,
            data: {
                totalStudents,
                activeClasses,
                newRegistrationsToday,
                todayClasses,
                recentStudents,
                upcomingClasses
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving dashboard data',
            error: error.message
        });
    }
};

// Helper function to get pending assignments
async function getPendingAssignments() {
    const pendingAssignments = await Class.countDocuments({
        status: 'active',
        students: { $size: 0 }
    });
    
    return pendingAssignments;
}
exports.registerStudent = async (req, res) => {
    try {
        const { 
            fullName, 
            email, 
            phone, 
            dateOfBirth, 
            currentLevel, 
            source, 
            notes,
            guardianName,
            guardianContact,
            guardianRelationship
        } = req.body;
        
        // Check if student with this email already exists
        const existingEmailStudent = await Student.findOne({ email });
        if (existingEmailStudent) {
            return res.status(400).json({
                success: false,
                message: 'Student with this email already exists'
            });
        }
        
        // Generate base username
        const baseUsername = email.split('@')[0].toLowerCase();
        
        // Find existing usernames that start with the base username
        const existingUsernames = await Student.find({ 
            username: { $regex: `^${baseUsername}`, $options: 'i' } 
        }).select('username');
        
        // Generate unique username
        let username = baseUsername;
        let counter = 1;
        
        while (existingUsernames.some(u => u.username === username)) {
            username = `${baseUsername}${counter}`;
            counter++;
        }
        
        // Generate student ID
        const studentId = 'ST' + Math.floor(10000 + Math.random() * 90000);
        
        // Generate a secure temporary password
        const tempPassword = Math.random().toString(36).slice(-10);
        
        // Prepare student data
        const studentData = {
            username,
            password: tempPassword,
            fullName,
            email,
            phone,
            studentInfo: {
                studentId,
                dateOfBirth: new Date(dateOfBirth),
                currentLevel,
                status: 'pending',
                guardianInfo: guardianName ? {
                    name: guardianName,
                    contactNumber: guardianContact,
                    relationship: guardianRelationship
                } : undefined
            }
        };

        // Add notes if provided
        if (source || notes) {
            studentData.studentInfo.notes = source 
                ? `Source: ${source}. ${notes || ''}`.trim() 
                : notes;
        }
        
        // Create and save student
        const student = new Student(studentData);
        await student.save();
        
        // Log the registration
        console.log(`New student registered: ${student.fullName} (${student.studentId})`);
        
        res.status(201).json({
            success: true,
            message: 'Student registered successfully',
            data: {
                student: {
                    fullName: student.fullName,
                    email: student.email,
                    studentId: student.studentInfo.studentId,
                    username: student.username
                },
                studentId: student.studentInfo.studentId,
                tempPassword
            }
        });
    } catch (error) {
        console.error('Error registering student:', error);
        
        // Handle specific MongoDB duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A user with this username or email already exists',
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error registering student',
            error: error.message
        });
    }
};

// Assign student to class
exports.assignStudentToClass = async (req, res) => {
    try {
        const { studentId, courseId, classId, startDate, paymentStatus } = req.body;
        
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // Add student to course
        if (!course.students.includes(studentId)) {
            course.students.push(studentId);
            await course.save();
        }
        
        // Add course to student
        if (!student.courses.includes(courseId)) {
            student.courses.push(courseId);
            await student.save();
        }
        
        res.status(200).json({
            success: true,
            message: 'Student assigned to class successfully',
            data: {
                student,
                course
            }
        });
    } catch (error) {
        console.error('Error assigning student to class:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning student to class',
            error: error.message
        });
    }
};

// Get all pending registrations
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
            message: 'Error retrieving pending registrations',
            error: error.message
        });
    }
};

// Approve student registration
exports.approveStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Update student status
        student.studentInfo.status = 'active';
        await student.save();
        
        res.status(200).json({
            success: true,
            message: 'Student registration approved',
            data: student
        });
    } catch (error) {
        console.error('Error approving student registration:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving student registration',
            error: error.message
        });
    }
};

// Activate student
exports.activateStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Update student status
        student.studentInfo.status = 'active';
        await student.save();
        
        res.status(200).json({
            success: true,
            message: 'Student activated successfully',
            data: student
        });
    } catch (error) {
        console.error('Error activating student:', error);
        res.status(500).json({
            success: false,
            message: 'Error activating student',
            error: error.message
        });
    }
};

// Get all students
exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find()
            .select('-password')
            .populate('courses', 'name level startDate');
        
        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving students',
            error: error.message
        });
    }
};

// Get classes schedule
exports.getClassesSchedule = async (req, res) => {
    try {
        const { filter = 'today' } = req.query;
        let query = {};
        
        if (filter === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            query['schedule.date'] = {
                $gte: today,
                $lt: tomorrow
            };
        }
        
        const courses = await Course.find(query)
            .populate('teacher', 'fullName')
            .populate('students', 'fullName')
            .sort({ 'schedule.startTime': 1 });
        
        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        console.error('Error fetching class schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving class schedule',
            error: error.message
        });
    }
};

// Get all receptionists
exports.getAllReceptionists = async (req, res) => {
    try {
        const receptionists = await Receptionist.find()
            .select('-password')
            .select('-__v');
        
        res.status(200).json({
            success: true,
            count: receptionists.length,
            data: receptionists
        });
    } catch (error) {
        console.error('Error fetching receptionists:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving receptionists',
            error: error.message
        });
    }
};

// Get a single receptionist by ID
exports.getReceptionistById = async (req, res) => {
    try {
        const receptionist = await Receptionist.findById(req.params.id)
            .select('-password')
            .select('-__v');
        
        if (!receptionist) {
            return res.status(404).json({
                success: false,
                message: 'Receptionist not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: receptionist
        });
    } catch (error) {
        console.error('Error fetching receptionist:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving receptionist',
            error: error.message
        });
    }
};

// Create a new receptionist
exports.createReceptionist = async (req, res) => {
    try {
        // Check if receptionist with this email or username already exists
        const existingReceptionist = await Receptionist.findOne({ 
            $or: [
                { email: req.body.email },
                { username: req.body.username }
            ]
        });

        if (existingReceptionist) {
            return res.status(400).json({
                success: false,
                message: 'Receptionist with this email or username already exists'
            });
        }
        
        // Generate unique employee ID
        const employeeId = 'RC' + Math.floor(10000 + Math.random() * 90000);
        
        // Create receptionist
        const receptionistData = {
            ...req.body,
            employeeId: employeeId,
            isActive: true
        };

        const receptionist = await Receptionist.create(receptionistData);
        
        res.status(201).json({
            success: true,
            message: 'Receptionist registered successfully',
            data: {
                receptionist: receptionist.toJSON(),
                employeeId: employeeId
            }
        });
    } catch (error) {
        console.error('Error creating receptionist:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering receptionist',
            error: error.message
        });
    }
};

// Update receptionist profile
exports.updateReceptionist = async (req, res) => {
    try {
        const { responsibilities, shift, ...updateData } = req.body;
        
        const receptionist = await Receptionist.findByIdAndUpdate(
            req.params.id,
            {
                ...updateData,
                responsibilities,
                shift,
                updatedAt: new Date()
            },
            { 
                new: true, 
                runValidators: true 
            }
        ).select('-password');
        
        if (!receptionist) {
            return res.status(404).json({
                success: false,
                message: 'Receptionist not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Receptionist profile updated successfully',
            data: receptionist
        });
    } catch (error) {
        console.error('Error updating receptionist:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating receptionist profile',
            error: error.message
        });
    }
};

// Delete receptionist account
exports.deleteReceptionist = async (req, res) => {
    try {
        const receptionist = await Receptionist.findByIdAndDelete(req.params.id);
        
        if (!receptionist) {
            return res.status(404).json({
                success: false,
                message: 'Receptionist not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Receptionist account deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting receptionist:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting receptionist account',
            error: error.message
        });
    }
};