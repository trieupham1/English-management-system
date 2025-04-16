// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'receptionist', 'manager'],
        required: true
    },
    // Fields specific to students
    studentInfo: {
        studentId: {
            type: String,
            sparse: true
        },
        dateOfBirth: Date,
        enrollmentDate: {
            type: Date,
            default: Date.now
        },
        currentLevel: {
            type: String,
            enum: ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced', 'proficient']
        },
        courses: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }],
        attendance: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'pending'],
            default: 'pending'
        },
        progress: {
            type: Number,
            default: 0
        }
    },
    // Fields specific to teachers
    teacherInfo: {
        teacherId: {
            type: String,
            sparse: true
        },
        specialization: {
            type: String,
            enum: ['general', 'business', 'ielts', 'toefl', 'children', 'conversation']
        },
        qualifications: [String],
        classes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }],
        schedule: [{
            day: {
                type: String,
                enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            },
            startTime: String,
            endTime: String,
            course: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course'
            }
        }]
    },
    avatar: {
        type: String,
        default: 'default-avatar.png'
    },
    lastLogin: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
    // Only hash the password if it's modified (or new)
    if (!this.isModified('password')) return next();
    
    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        // Hash the password along with the new salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        console.log('Candidate password:', candidatePassword);
        console.log('Stored hashed password:', this.password);
        const result = await bcrypt.compare(candidatePassword, this.password);
        console.log('Comparison result:', result);
        return result;
    } catch (error) {
        console.error('Error comparing passwords:', error);
        return false;
    }
};
// Method to return user info without sensitive data
UserSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', UserSchema);