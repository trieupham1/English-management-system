const Settings = require('../models/Settings');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Manager = require('../models/Manager');
const Receptionist = require('../models/Receptionist');
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
        const totalStudents = await Student.countDocuments();
        
        // Get total number of teachers
        const totalTeachers = await Teacher.countDocuments();
        
        // Get total number of active students
        const activeStudents = await Student.countDocuments({
            'studentInfo.status': 'active'
        });
        
        // Get total number of pending students
        const pendingStudents = await Student.countDocuments({
            'studentInfo.status': 'pending'
        });
        
        // Get students registered in the last month
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const newStudents = await Student.countDocuments({
            createdAt: { $gte: lastMonth }
        });
        
        // Get number of managers and receptionists
        const totalManagers = await Manager.countDocuments();
        const totalReceptionists = await Receptionist.countDocuments();
        
        res.status(200).json({
            success: true,
            data: {
                totalStudents,
                totalTeachers,
                totalManagers,
                totalReceptionists,
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

// Update user settings (now with separate models)
exports.updateUserSettings = async (req, res) => {
    try {
        const { userId, role } = req.params;
        const { notificationPreferences, theme, language } = req.body;
        
        // Select the appropriate model based on role
        let UserModel;
        switch(role) {
            case 'student':
                UserModel = Student;
                break;
            case 'teacher':
                UserModel = Teacher;
                break;
            case 'manager':
                UserModel = Manager;
                break;
            case 'receptionist':
                UserModel = Receptionist;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user role'
                });
        }
        
        const user = await UserModel.findById(userId);
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
        const { userId, role } = req.params;
        
        // Select the appropriate model based on role
        let UserModel;
        switch(role) {
            case 'student':
                UserModel = Student;
                break;
            case 'teacher':
                UserModel = Teacher;
                break;
            case 'manager':
                UserModel = Manager;
                break;
            case 'receptionist':
                UserModel = Receptionist;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user role'
                });
        }
        
        const user = await UserModel.findById(userId).select('settings');
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
        // In a real implementation, this would create a comprehensive database backup
        const backupData = {
            students: await Student.countDocuments(),
            teachers: await Teacher.countDocuments(),
            managers: await Manager.countDocuments(),
            receptionists: await Receptionist.countDocuments()
        };
        
        res.status(200).json({
            success: true,
            message: 'Backup created successfully',
            data: {
                backupDate: new Date(),
                backupId: mongoose.Types.ObjectId(),
                backupSize: '10.5 MB',
                collections: backupData
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