// server/models/Lesson.js
const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // Duration in minutes
        required: true
    },
    objectives: [{
        type: String
    }],
    materials: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LessonMaterial'
    }],
    activities: [{
        title: String,
        description: String,
        duration: Number // Duration in minutes
    }],
    homework: {
        type: String
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    onlineLink: {
        type: String
    },
    notes: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    attendance: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['present', 'absent', 'late', 'excused'],
            default: 'absent'
        },
        notes: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update the timestamp on update
LessonSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

module.exports = mongoose.model('Lesson', LessonSchema);