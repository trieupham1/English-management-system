const Manager = require('../models/Manager');
const jwt = require('jsonwebtoken');

// Register new manager
exports.register = async (req, res) => {
    try {
        const { username, password, fullName, email, phone, department } = req.body;
        
        // Check if manager already exists
        const existingManager = await Manager.findOne({ $or: [{ email }, { username }] });
        
        if (existingManager) {
            return res.status(400).json({ 
                success: false, 
                message: 'Manager with this email or username already exists' 
            });
        }
        
        // Create new manager
        const manager = new Manager({
            username,
            password,
            fullName,
            email,
            phone,
            department
        });
        
        await manager.save();
        
        // Generate token
        const token = jwt.sign(
            { id: manager._id },
            process.env.JWT_SECRET || 'your_jwt_secret_key_for_english_center_app',
            { expiresIn: '1d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'Manager registered successfully',
            data: { manager: manager.toJSON(), token }
        });
        
    } catch (error) {
        console.error('Manager registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering manager',
            error: error.message
        });
    }
};

// Login manager
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find manager by username
        const manager = await Manager.findOne({ username });
        
        if (!manager) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        // Check password
        const isMatch = await manager.comparePassword(password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        // Generate token
        const token = jwt.sign(
            { id: manager._id },
            process.env.JWT_SECRET || 'your_jwt_secret_key_for_english_center_app',
            { expiresIn: '1d' }
        );
        
        // Update last login
        manager.lastLogin = new Date();
        await manager.save();
        
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { 
                manager: manager.toJSON(), 
                token 
            }
        });
        
    } catch (error) {
        console.error('Manager login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};

// Get current manager profile
exports.getCurrentManager = async (req, res) => {
    try {
        const manager = await Manager.findById(req.user.id).select('-password');
        
        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Manager not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: manager
        });
        
    } catch (error) {
        console.error('Get current manager error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving manager profile',
            error: error.message
        });
    }
};

// Update manager profile
exports.updateProfile = async (req, res) => {
    try {
        const { fullName, email, phone, department, permissions } = req.body;
        
        const manager = await Manager.findById(req.user.id);
        
        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Manager not found'
            });
        }
        
        // Update fields
        if (fullName) manager.fullName = fullName;
        if (email) manager.email = email;
        if (phone) manager.phone = phone;
        if (department) manager.department = department;
        if (permissions) manager.permissions = permissions;
        
        manager.updatedAt = new Date();
        
        await manager.save();
        
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: manager.toJSON()
        });
        
    } catch (error) {
        console.error('Update manager profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};

// Change manager password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const manager = await Manager.findById(req.user.id);
        
        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Manager not found'
            });
        }
        
        // Check if current password matches
        const isMatch = await manager.comparePassword(currentPassword);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        // Update password
        manager.password = newPassword;
        await manager.save();
        
        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
        
    } catch (error) {
        console.error('Change manager password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
};

// Logout manager
exports.logout = (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
};