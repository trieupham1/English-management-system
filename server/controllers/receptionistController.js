const Receptionist = require('../models/Receptionist');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');

// Get receptionist dashboard data
exports.getDashboardData = async (req, res) => {
    try {
        // Get receptionist user data
        const receptionistId = req.user.id;
        const receptionist = await Receptionist.findById(receptionistId).select('-password');
        
        if (!receptionist) {
            return res.status(404).json({
                success: false,
                message: 'Receptionist not found'
            });
        }
        
        // Get stats for dashboard
        const totalStudents = await Student.countDocuments();
        const activeClasses = await Course.countDocuments({ status: 'active' });
        
        // Get today's classes
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayClasses = await Course.countDocuments({
            'schedule.date': {
                $gte: today,
                $lt: tomorrow
            }
        });
        
        // Get new registrations (pending students)
        const newRegistrations = await Student.countDocuments({
            'studentInfo.status': 'pending'
        });
        
        res.status(200).json({
            success: true,
            data: {
                user: receptionist,
                totalStudents,
                activeClasses,
                todayClasses,
                newRegistrations,
                notifications: {
                    newRegistrations,
                    pendingAssignments: 2 // This could be calculated based on actual data
                }
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
        const existingStudent = await Student.findOne({ email });
        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: 'Student with this email already exists'
            });
        }
        
        // Generate student ID
        const studentId = 'ST' + Math.floor(10000 + Math.random() * 90000);
        
        // Generate a temporary password
        const tempPassword = 'password123'
        
        // Prepare student data
        const studentData = {
            username: email.split('@')[0], // Generate username from email
            password: tempPassword, // Will be hashed by pre-save middleware
            fullName,
            email,
            phone,
            studentInfo: {
                studentId,
                dateOfBirth,
                currentLevel,
                status: 'pending', // New registrations are pending by default
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
        
        // Create student
        const student = new Student(studentData);
        
        await student.save();
        
        res.status(201).json({
            success: true,
            message: 'Student registered successfully',
            data: {
                student: student.toJSON(),
                studentId,
                tempPassword // Consider sending this securely or via email
            }
        });
    } catch (error) {
        console.error('Error registering student:', error);
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