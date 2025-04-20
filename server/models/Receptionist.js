const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ReceptionistSchema = new mongoose.Schema({
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
    avatar: {
        type: String,
        default: 'default-receptionist-avatar.png'
    },
    employeeId: {
        type: String,
        unique: true,
        required: true
    },
    shift: {
        type: String,
        enum: ['morning', 'afternoon', 'evening', 'night'],
        required: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    responsibilities: [{
        type: String
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

// Pre-save middleware to hash password
ReceptionistSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
ReceptionistSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to return user info without sensitive data
ReceptionistSchema.methods.toJSON = function() {
    const receptionist = this.toObject();
    delete receptionist.password;
    return receptionist;
};

module.exports = mongoose.model('Receptionist', ReceptionistSchema);