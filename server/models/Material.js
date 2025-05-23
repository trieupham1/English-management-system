// models/Material.js
const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
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
        enum: ['document', 'presentation', 'slides', 'video', 'audio', 'image', 'link', 'exercise', 'other'],
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    file: {
        type: String,
    },
    url: {
        type: String,
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher', // Changed from 'User' to 'Teacher'
        required: true
    },
    tags: [{
        type: String
    }],
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
MaterialSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

// Virtual for file URL
MaterialSchema.virtual('fileUrl').get(function() {
    if (this.file) {
        return `/uploads/materials/${this.file}`;
    }
    return null;
});

// Configure toJSON and toObject to include virtuals
MaterialSchema.set('toJSON', { virtuals: true });
MaterialSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Material', MaterialSchema);