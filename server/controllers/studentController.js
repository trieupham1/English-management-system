const Student = require('../models/Student');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');




// Get student dashboard data
exports.getStudentDashboard = async (req, res) => {
    try {
        // Get the student ID from the authenticated user
        const studentId = req.user._id;
        
        // Fetch the student with course information
        const student = await Student.findById(studentId)
            .populate('studentInfo.courses');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Get student's courses
        const courseIds = student.studentInfo.courses.map(course => course._id);
        
        // Get upcoming classes (assuming you have a Schedule or Class model)
        const upcomingClasses = await Schedule.find({
            course: { $in: courseIds },
            startTime: { $gte: new Date() }
        })
        .sort('startTime')
        .limit(5)
        .populate('course', 'name')
        .populate('teacher', 'firstName lastName');
        
        // Format classes for frontend
        const formattedClasses = upcomingClasses.map(cls => {
            const today = new Date().toDateString();
            const classDate = new Date(cls.startTime).toDateString();
            const isToday = today === classDate;
            
            return {
                name: cls.course.name,
                startTime: formatTime(cls.startTime),
                endTime: formatTime(cls.endTime),
                teacher: `${cls.teacher.firstName} ${cls.teacher.lastName}`,
                room: cls.room,
                isToday,
                dayName: isToday ? 'Today' : getDayName(cls.startTime)
            };
        });
        
        // Get next class
        const nextClass = formattedClasses.length > 0 ? {
            name: formattedClasses[0].name,
            startsIn: getTimeUntil(upcomingClasses[0].startTime)
        } : null;
        
        // Get student's assignments
        const assignments = await Assignment.find({
            course: { $in: courseIds }
        })
        .sort('dueDate')
        .limit(5);
        
        // Format assignments and determine their status
        const formattedAssignments = assignments.map(assignment => {
            let status = 'pending';
            
            // Check if assignment is completed by this student
            const studentSubmission = assignment.submissions.find(
                sub => sub.student.toString() === studentId.toString()
            );
            
            if (studentSubmission && studentSubmission.submittedAt) {
                status = 'completed';
            } else if (new Date(assignment.dueDate) < new Date()) {
                status = 'overdue';
            }
            
            return {
                title: assignment.title,
                dueDate: assignment.dueDate,
                status
            };
        });
        
        // Calculate course progress
        const courseProgress = await Promise.all(
            student.studentInfo.courses.map(async (course) => {
                const assignments = await Assignment.find({ course: course._id });
                
                const totalAssignments = assignments.length;
                const completedAssignments = assignments.filter(assignment => 
                    assignment.submissions.some(
                        sub => sub.student.toString() === studentId.toString() && sub.submittedAt
                    )
                ).length;
                
                const progress = totalAssignments > 0
                    ? Math.round((completedAssignments / totalAssignments) * 100)
                    : 0;
                
                return {
                    name: course.name,
                    progress
                };
            })
        );
        
        // Get announcements (assuming you have an Announcement model)
        const announcements = await Announcement.find()
            .sort('-date')
            .limit(3);
        
        const formattedAnnouncements = announcements.map(announcement => ({
            title: announcement.title,
            content: announcement.content,
            date: announcement.date
        }));
        
        // Return all dashboard data
        res.status(200).json({
            success: true,
            data: {
                firstName: student.firstName,
                nextClass,
                upcomingClasses: formattedClasses,
                assignments: formattedAssignments,
                courseProgress,
                announcements: formattedAnnouncements
            }
        });
        
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Helper functions
function formatTime(date) {
    return new Date(date).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
    });
}

function getDayName(date) {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
}

function getTimeUntil(futureDate) {
    const now = new Date();
    const future = new Date(futureDate);
    const diffMs = future - now;
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins} minutes`;
    } else if (diffHrs < 24) {
        return `${diffHrs} hours`;
    } else {
        const diffDays = Math.floor(diffHrs / 24);
        return `${diffDays} days`;
    }
}
// Get all students
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

// Get student's courses
exports.getStudentCourses = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate({
                path: 'studentInfo.courses',
                select: 'name description level category'
            });
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        res.status(200).json({
            success: true,
            count: student.studentInfo.courses.length,
            data: student.studentInfo.courses
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

// Get student's assignments
exports.getStudentAssignments = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Get assignments for student's courses
        const assignments = await Assignment.find({
            course: { $in: student.studentInfo.courses }
        }).populate('course', 'name');
        
        res.status(200).json({
            success: true,
            count: assignments.length,
            data: assignments
        });
    } catch (error) {
        console.error('Error fetching student assignments:', error);
        res.status(500).json({
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