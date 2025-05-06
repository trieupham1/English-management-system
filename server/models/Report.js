// models/Report.js
const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true
    },
    description: {
        type: String
    },
    type: {
        type: String,
        enum: ['individual', 'class'],
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        // Required only for individual reports
    },
    file: {
        type: String,
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    academicPeriod: {
        type: String,
        enum: ['weekly', 'monthly', 'quarterly', 'semester', 'annual'],
        default: 'monthly'
    },
    studentCount: {
        type: Number,
        default: 0
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
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
ReportSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

// Virtual for file URL
ReportSchema.virtual('fileUrl').get(function() {
    if (this.file) {
        return `/uploads/reports/${this.file}`;
    }
    return null;
});

// Configure toJSON and toObject to include virtuals
ReportSchema.set('toJSON', { virtuals: true });
ReportSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Report', ReportSchema);