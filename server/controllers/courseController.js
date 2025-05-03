const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const mongoose = require('mongoose');

// Get all courses
exports.getAllCourses = async (req, res) => {
    try {
        // Get courses without using populate
        const courses = await Course.find().select('-students');
        
        // Manually get teacher data if needed
        const coursesWithTeachers = await Promise.all(courses.map(async (course) => {
            const courseObj = course.toObject();
            
            try {
                // Get teacher data if teacher ID exists
                if (course.teacher) {
                    const Teacher = require('../models/Teacher');
                    const teacher = await Teacher.findById(course.teacher)
                        .select('fullName email')
                        .lean();
                    
                    if (teacher) {
                        courseObj.teacher = {
                            _id: teacher._id,
                            fullName: teacher.fullName,
                            email: teacher.email
                        };
                    }
                }
            } catch (err) {
                console.error('Error fetching teacher for course:', err);
                // Continue even if teacher data can't be fetched
            }
            
            return courseObj;
        }));
        
        res.status(200).json({
            success: true,
            count: coursesWithTeachers.length,
            data: coursesWithTeachers
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get courses available for materials
exports.getTeacherAvailableCourses = async (req, res) => {
    try {
        // Find active courses
        const courses = await Course.find({
            status: 'Active'
        }).select('_id name category level');
        
        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        console.error('Error fetching available courses:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get a single course
exports.getCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('teacher', 'fullName email')
            .populate({
                path: 'students.student',
                select: 'fullName email studentInfo.studentId'
            })
            .populate('lessons');
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Create a new course
exports.createCourse = async (req, res) => {
    try {
        // Check if teacher exists 
        const teacher = await Teacher.findById(req.body.teacher);
        if (!teacher) {
            return res.status(400).json({
                success: false,
                message: 'Invalid teacher'
            });
        }
        
        const course = await Course.create(req.body);
        
        // Add course to teacher's classes
        teacher.classes.push(course._id);
        await teacher.save();
        
        res.status(201).json({
            success: true,
            data: course
        });
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Update a course
exports.updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // If teacher is being changed, update teacher references
        if (req.body.teacher && req.body.teacher !== course.teacher.toString()) {
            // Remove course from old teacher's classes
            const oldTeacher = await Teacher.findById(course.teacher);
            if (oldTeacher) {
                oldTeacher.classes = oldTeacher.classes.filter(
                    id => id.toString() !== course._id.toString()
                );
                await oldTeacher.save();
            }
            
            // Add course to new teacher's classes
            const newTeacher = await Teacher.findById(req.body.teacher);
            if (newTeacher) {
                newTeacher.classes.push(course._id);
                await newTeacher.save();
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid teacher'
                });
            }
        }
        
        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('teacher', 'fullName email');
        
        res.status(200).json({
            success: true,
            data: updatedCourse
        });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
// In courseController.js, add this new method
exports.getCoursesForDropdown = async (req, res) => {
    try {
        // Simple query that doesn't use populate
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


// Delete a course
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // Remove course from teacher's classes
        const teacher = await Teacher.findById(course.teacher);
        if (teacher) {
            teacher.classes = teacher.classes.filter(
                id => id.toString() !== course._id.toString()
            );
            await teacher.save();
        }
        
        // Remove course from all enrolled students
        for (const studentObj of course.students) {
            const student = await Student.findById(studentObj.student);
            if (student) {
                student.studentInfo.courses = student.studentInfo.courses.filter(
                    id => id.toString() !== course._id.toString()
                );
                await student.save();
            }
        }
        
        await course.remove();
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Enroll a student in a course
exports.enrollStudent = async (req, res) => {
    try {
        const { studentId, paymentStatus } = req.body;
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // Check if course is full
        if (course.students.length >= course.maxStudents) {
            return res.status(400).json({
                success: false,
                message: 'Course is full'
            });
        }
        
        // Check if student exists
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(400).json({
                success: false,
                message: 'Invalid student'
            });
        }
        
        // Check if student is already enrolled
        const isEnrolled = course.students.some(
            s => s.student.toString() === studentId
        );
        
        if (isEnrolled) {
            return res.status(400).json({
                success: false,
                message: 'Student already enrolled in this course'
            });
        }
        
        // Enroll student in course
        course.students.push({
            student: studentId,
            enrollmentDate: Date.now(),
            status: 'active',
            payment: {
                status: paymentStatus || 'pending',
                amount: course.price
            }
        });
        
        await course.save();
        
        // Add course to student's courses
        student.studentInfo.courses.push(course._id);
        await student.save();
        
        res.status(200).json({
            success: true,
            data: course
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

// Remove a student from a course
exports.removeStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // Check if student is enrolled
        const studentIndex = course.students.findIndex(
            s => s.student.toString() === studentId
        );
        
        if (studentIndex === -1) {
            return res.status(400).json({
                success: false,
                message: 'Student not enrolled in this course'
            });
        }
        
        // Remove student from course
        course.students.splice(studentIndex, 1);
        await course.save();
        
        // Remove course from student's courses
        const student = await Student.findById(studentId);
        if (student) {
            student.studentInfo.courses = student.studentInfo.courses.filter(
                id => id.toString() !== course._id.toString()
            );
            await student.save();
        }
        
        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        console.error('Error removing student:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Update student payment status
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { paymentStatus, amount, installments } = req.body;
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // Find student in course
        const studentIndex = course.students.findIndex(
            s => s.student.toString() === studentId
        );
        
        if (studentIndex === -1) {
            return res.status(400).json({
                success: false,
                message: 'Student not enrolled in this course'
            });
        }
        
        // Update payment status
        course.students[studentIndex].payment.status = paymentStatus || course.students[studentIndex].payment.status;
        
        if (amount) {
            course.students[studentIndex].payment.amount = amount;
        }
        
        if (installments) {
            course.students[studentIndex].payment.installments = installments;
        }
        
        await course.save();
        
        res.status(200).json({
            success: true,
            data: course.students[studentIndex]
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get all courses for a specific teacher
exports.getTeacherCourses = async (req, res) => {
    try {
        const courses = await Course.find({ teacher: req.params.teacherId })
            .populate('teacher', 'fullName email')
            .select('-students');
        
        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        console.error('Error fetching teacher courses:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get all students enrolled in a specific course
exports.getCourseStudents = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .select('students')
            .populate({
                path: 'students.student',
                select: 'fullName email phone studentInfo.studentId'
            });
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        res.status(200).json({
            success: true,
            count: course.students.length,
            data: course.students
        });
    } catch (error) {
        console.error('Error fetching course students:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};