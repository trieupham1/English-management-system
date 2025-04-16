const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    centerName: {
        type: String,
        default: 'English Learning Center'
    },
    address: {
        type: String,
        default: '123 Education Street, City, Country'
    },
    phone: {
        type: String,
        default: '+1234567890'
    },
    email: {
        type: String,
        default: 'info@englishcenter.com'
    },
    workingHours: {
        type: String,
        default: 'Monday-Friday: 8:00 AM - 8:00 PM, Saturday: 9:00 AM - 5:00 PM'
    },
    logoUrl: {
        type: String,
        default: '/images/logo.png'
    },
    currencySymbol: {
        type: String,
        default: '$'
    },
    language: {
        type: String,
        enum: ['en', 'vi', 'other'],
        default: 'en'
    },
    maxStudentsPerClass: {
        type: Number,
        default: 20
    },
    enableChatbot: {
        type: Boolean,
        default: true
    },
    enableOnlineLearning: {
        type: Boolean,
        default: true
    },
    theme: {
        type: String,
        enum: ['light', 'dark', 'blue'],
        default: 'light'
    },
    notificationSettings: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        smsNotifications: {
            type: Boolean,
            default: false
        },
        newRegistrationAlert: {
            type: Boolean,
            default: true
        },
        newPaymentAlert: {
            type: Boolean,
            default: true
        },
        assignmentReminderAlert: {
            type: Boolean,
            default: true
        }
    },
    socialMedia: {
        facebook: String,
        twitter: String,
        instagram: String,
        youtube: String,
        linkedin: String
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    maintenanceMessage: {
        type: String,
        default: 'The system is currently under maintenance. Please check back later.'
    },
    backupSettings: {
        enableAutoBackup: {
            type: Boolean,
            default: true
        },
        backupFrequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly'],
            default: 'weekly'
        },
        maxBackups: {
            type: Number,
            default: 5
        }
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Middleware to update the timestamp on update
SettingsSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

module.exports = mongoose.model('Settings', SettingsSchema);