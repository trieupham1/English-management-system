const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const TeacherSchema = new mongoose.Schema({
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
        default: 'default-teacher-avatar.png'
    },
    teacherInfo: {
        teacherId: {
            type: String,
            unique: true,
            required: true
        },
        specialization: {
            type: String,
            enum: ['general', 'business', 'ielts', 'toefl', 'children', 'conversation'],
            required: true
        },
        qualifications: [String],
        certifications: [String]
    },
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
    }],
    salary: {
        type: Number,
        default: 0
    },
    hireDate: {
        type: Date,
        default: Date.now
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
TeacherSchema.pre('save', async function(next) {
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
TeacherSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to return user info without sensitive data
TeacherSchema.methods.toJSON = function() {
    const teacher = this.toObject();
    delete teacher.password;
    return teacher;
};

module.exports = mongoose.model('Teacher', TeacherSchema);