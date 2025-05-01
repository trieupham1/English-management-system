// Updated Assignment model to better match your JSON data

const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String
    },
    file: {
        type: String
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    isLate: {
        type: Boolean,
        default: false
    },
    grade: {
        type: Number
    },
    feedback: {
        type: String
    },
    gradedAt: {
        type: Date
    },
    gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const AssignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    instructions: {
        type: String,
        default: ''
    },
    dueDate: {
        type: Date
    },
    totalPoints: {
        type: Number,
        default: 100
    },
    isActive: {
        type: Boolean,
        default: true
    },
    attachments: {
        type: Array,
        default: []
    },
    submissions: {
        type: [SubmissionSchema],
        default: []
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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

// Middleware to update the timestamp on update
AssignmentSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

module.exports = mongoose.model('Assignment', AssignmentSchema);