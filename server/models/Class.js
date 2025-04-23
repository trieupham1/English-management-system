const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        ref: 'Teacher',
        required: true
    },
    schedule: {
        day: {
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            required: true
        },
        startTime: {
            type: String,
            required: true
        },
        endTime: {
            type: String,
            required: true
        },
        room: {
            type: String,
            required: true
        },
        date: {
            type: Date
        }
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    maxStudents: {
        type: Number,
        default: 20
    },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'completed', 'cancelled'],
        default: 'active'
    },
    materials: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LessonMaterial'
    }],
    isOnline: {
        type: Boolean,
        default: false
    },
    onlineLink: {
        type: String,
        default: null
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

// Virtual for checking if class is full
ClassSchema.virtual('isFull').get(function() {
    return this.students.length >= this.maxStudents;
});

// Virtual for current number of students
ClassSchema.virtual('currentStudents').get(function() {
    return this.students.length;
});

// Middleware to update the timestamp on update
ClassSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

module.exports = mongoose.model('Class', ClassSchema);