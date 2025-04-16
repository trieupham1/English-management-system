// server/controllers/settingsController.js
const Settings = require('../models/Settings');
const User = require('../models/User');
const mongoose = require('mongoose');

// Get all settings
exports.getAllSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne();
        
        if (!settings) {
            // If no settings exist, create default settings
            const defaultSettings = await Settings.create({
                centerName: 'English Learning Center',
                address: '123 Education Street, City, Country',
                phone: '+1234567890',
                email: 'info@englishcenter.com',
                workingHours: 'Monday-Friday: 8:00 AM - 8:00 PM, Saturday: 9:00 AM - 5:00 PM',
                logoUrl: '/images/logo.png',
                currencySymbol: '$',
                language: 'en',
                maxStudentsPerClass: 20,
                enableChatbot: true,
                enableOnlineLearning: true,
                theme: 'light',
                notificationSettings: {
                    emailNotifications: true,
                    smsNotifications: false,
                    newRegistrationAlert: true,
                    newPaymentAlert: true,
                    assignmentReminderAlert: true
                }
            });
            
            return res.status(200).json({
                success: true,
                data: defaultSettings
            });
        }
        
        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Update settings
exports.updateSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne();
        
        if (!settings) {
            // If no settings exist, create with provided data
            const newSettings = await Settings.create(req.body);
            
            return res.status(201).json({
                success: true,
                data: newSettings
            });
        }
        
        // Update existing settings
        const updatedSettings = await Settings.findByIdAndUpdate(
            settings._id,
            req.body,
            { new: true, runValidators: true }
        );
        
        res.status(200).json({
            success: true,
            data: updatedSettings
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get system statistics
exports.getSystemStats = async (req, res) => {
    try {
        // Get total number of students
        const totalStudents = await User.countDocuments({ role: 'student' });
        
        // Get total number of teachers
        const totalTeachers = await User.countDocuments({ role: 'teacher' });
        
        // Get total number of active students
        const activeStudents = await User.countDocuments({
            role: 'student',
            'studentInfo.status': 'active'
        });
        
        // Get total number of pending students
        const pendingStudents = await User.countDocuments({
            role: 'student',
            'studentInfo.status': 'pending'
        });
        
        // Get students registered in the last month
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const newStudents = await User.countDocuments({
            role: 'student',
            createdAt: { $gte: lastMonth }
        });
        
        res.status(200).json({
            success: true,
            data: {
                totalStudents,
                totalTeachers,
                activeStudents,
                pendingStudents,
                newStudents
            }
        });
    } catch (error) {
        console.error('Error fetching system stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Update user settings
exports.updateUserSettings = async (req, res) => {
    try {
        const { userId } = req.params;
        const { notificationPreferences, theme, language } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Initialize settings if they don't exist
        if (!user.settings) {
            user.settings = {};
        }
        
        // Update user settings
        if (notificationPreferences) {
            user.settings.notificationPreferences = notificationPreferences;
        }
        
        if (theme) {
            user.settings.theme = theme;
        }
        
        if (language) {
            user.settings.language = language;
        }
        
        await user.save();
        
        res.status(200).json({
            success: true,
            data: user.settings
        });
    } catch (error) {
        console.error('Error updating user settings:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get user settings
exports.getUserSettings = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId).select('settings');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: user.settings || {}
        });
    } catch (error) {
        console.error('Error fetching user settings:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Backup system data (admin only)
exports.backupData = async (req, res) => {
    try {
        // In a real implementation, this would create a database backup
        // Here, we'll just simulate a successful backup
        
        res.status(200).json({
            success: true,
            message: 'Backup created successfully',
            data: {
                backupDate: new Date(),
                backupId: mongoose.Types.ObjectId(),
                backupSize: '10.5 MB'
            }
        });
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get system logs (admin only)
exports.getSystemLogs = async (req, res) => {
    try {
        // In a real implementation, this would fetch logs from a logging system
        // Here, we'll return some simulated log entries
        
        const logs = [
            {
                timestamp: new Date(),
                level: 'INFO',
                message: 'System startup complete',
                source: 'server.js'
            },
            {
                timestamp: new Date(Date.now() - 60000),
                level: 'INFO',
                message: 'New user registered',
                source: 'authController.js'
            },
            {
                timestamp: new Date(Date.now() - 120000),
                level: 'WARNING',
                message: 'Failed login attempt',
                source: 'authController.js'
            },
            {
                timestamp: new Date(Date.now() - 180000),
                level: 'ERROR',
                message: 'Database connection temporarily lost',
                source: 'db.js'
            },
            {
                timestamp: new Date(Date.now() - 240000),
                level: 'INFO',
                message: 'Database connection restored',
                source: 'db.js'
            }
        ];
        
        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        console.error('Error fetching system logs:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

module.exports = exports;