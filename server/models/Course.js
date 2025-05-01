// models/Course.js
const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''  // Optional since your data doesn't have it
    },
    level: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    students: [String],  // Simple array of strings/IDs
    maxStudents: {
        type: Number,
        default: 20
    },
    status: {
        type: String,
        default: 'Active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    __v: Number  // Include version key to match your data
});

// Virtual for checking if course is full
CourseSchema.virtual('isFull').get(function() {
    return this.students.length >= this.maxStudents;
});

// Virtual for current number of students
CourseSchema.virtual('currentStudents').get(function() {
    return this.students.length;
});

module.exports = mongoose.model('Course', CourseSchema);