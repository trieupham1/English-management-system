const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    level: {
        type: String,
        enum: ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced', 'proficient'],
        required: true
    },
    category: {
        type: String,
        enum: ['general', 'business', 'ielts', 'toefl', 'children', 'conversation'],
        required: true
    },
    duration: {
        value: {
            type: Number,
            required: true
        },
        unit: {
            type: String,
            enum: ['weeks', 'months'],
            default: 'months'
        }
    },
    lessons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
    }],
    schedule: [{
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
        }
    }],
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    students: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        enrollmentDate: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['active', 'completed', 'dropped'],
            default: 'active'
        },
        payment: {
            status: {
                type: String,
                enum: ['paid', 'pending', 'installment'],
                default: 'pending'
            },
            amount: {
                type: Number,
                default: 0
            },
            installments: [{
                date: Date,
                amount: Number,
                status: {
                    type: String,
                    enum: ['paid', 'pending'],
                    default: 'pending'
                }
            }]
        }
    }],
    price: {
        type: Number,
        required: true
    },
    maxStudents: {
        type: Number,
        default: 20
    },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
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

// Virtual for checking if course is full
CourseSchema.virtual('isFull').get(function() {
    return this.students.length >= this.maxStudents;
});

// Virtual for current number of students
CourseSchema.virtual('currentStudents').get(function() {
    return this.students.length;
});

// Middleware to update the timestamp on update
CourseSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

module.exports = mongoose.model('Course', CourseSchema);