const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const StudentSchema = new mongoose.Schema({
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
    avatar: {
        type: String,
        default: 'default-student-avatar.png'
    },
    studentInfo: {
        studentId: {
            type: String,
            unique: true,
            required: true
        },
        dateOfBirth: Date,
        enrollmentDate: {
            type: Date,
            default: Date.now
        },
        currentLevel: {
            type: String,
            enum: ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced', 'proficient'],
            required: true
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
        },
        guardianInfo: {
            name: String,
            contactNumber: String,
            relationship: String
        }
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
StudentSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
StudentSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to return user info without sensitive data
StudentSchema.methods.toJSON = function() {
    const student = this.toObject();
    delete student.password;
    return student;
};

module.exports = mongoose.model('Student', StudentSchema);