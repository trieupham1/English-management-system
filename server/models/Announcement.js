// models/Announcement.js
const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Please add content']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetAudience: {
        type: [String],
        enum: ['all', 'students', 'teachers', 'managers'],
        default: ['all']
    },
    targetCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    importance: {
        type: String,
        enum: ['low', 'normal', 'important', 'urgent'],
        default: 'normal'
    },
    attachments: [{
        name: String,
        file: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date
    },
    views: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        viewedAt: {
            type: Date,
            default: Date.now
        }
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
AnnouncementSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

// Virtual for checking if announcement is expired
AnnouncementSchema.virtual('isExpired').get(function() {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);