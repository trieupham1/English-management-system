// models/Assignment.js
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
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    totalPoints: {
        type: Number,
        required: true,
        default: 100
    },
    isActive: {
        type: Boolean,
        default: true
    },
    attachments: [{
        title: String,
        file: String
    }],
    submissions: [SubmissionSchema],
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

// Virtual for submission count
AssignmentSchema.virtual('submissionCount').get(function() {
    return this.submissions.length;
});

// Virtual for average grade
AssignmentSchema.virtual('averageGrade').get(function() {
    if (this.submissions.length === 0) return 0;
    
    const validGrades = this.submissions.filter(sub => sub.grade !== undefined);
    if (validGrades.length === 0) return 0;
    
    const totalGrade = validGrades.reduce((sum, sub) => sum + sub.grade, 0);
    return totalGrade / validGrades.length;
});

// Virtual for graded count
AssignmentSchema.virtual('gradedCount').get(function() {
    return this.submissions.filter(sub => sub.grade !== undefined).length;
});

module.exports = mongoose.model('Assignment', AssignmentSchema);