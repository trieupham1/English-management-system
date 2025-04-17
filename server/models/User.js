// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
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
    role: {
        type: String,
        enum: ['student', 'teacher', 'receptionist', 'manager'],
        required: true
    },
    // Fields specific to students
    studentInfo: {
        studentId: {
            type: String,
            sparse: true
        },
        dateOfBirth: Date,
        enrollmentDate: {
            type: Date,
            default: Date.now
        },
        currentLevel: {
            type: String,
            enum: ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced', 'proficient']
        },
        courses: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }],
        attendance: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'pending'],
            default: 'pending'
        },
        progress: {
            type: Number,
            default: 0
        }
    },
    // Fields specific to teachers
    teacherInfo: {
        teacherId: {
            type: String,
            sparse: true
        },
        specialization: {
            type: String,
            enum: ['general', 'business', 'ielts', 'toefl', 'children', 'conversation']
        },
        qualifications: [String],
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
        }]
    },
    avatar: {
        type: String,
        default: 'default-avatar.png'
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
UserSchema.pre('save', async function(next) {
    // Only hash the password if it's modified (or new)
    if (!this.isModified('password')) return next();
    
    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        // Hash the password along with the new salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});
/// In server/models/User.js
UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        console.log('Detailed Password Debugging:');
        console.log('Username:', this.username);
        console.log('Candidate Password (raw):', candidatePassword);
        console.log('Stored Hashed Password:', this.password);

        // Log the type of inputs
        console.log('Candidate Password Type:', typeof candidatePassword);
        console.log('Stored Hash Type:', typeof this.password);

        // Perform comparison using synchronous method for more control
        const isMatch = bcrypt.compareSync(candidatePassword, this.password);
        
        console.log('Synchronous Comparison Result:', isMatch);

        // Additional manual checks
        console.log('Bcrypt Compare Details:', {
            candidateLength: candidatePassword.length,
            storedHashLength: this.password.length,
            firstChar: candidatePassword[0],
            storedFirstChar: this.password[0]
        });

        return isMatch;
    } catch (error) {
        console.error('Comprehensive Password Comparison Error:', {
            username: this.username,
            error: error.message,
            stack: error.stack
        });
        return false;
    }
};
// Method to return user info without sensitive data
UserSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', UserSchema);