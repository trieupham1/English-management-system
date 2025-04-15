const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register new user
exports.register = async (req, res) => {
    try {
        const { username, password, fullName, email, phone, role } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User with this email or username already exists' 
            });
        }
        
        // Create new user
        const user = new User({
            username,
            password,
            fullName,
            email,
            phone,
            role
        });
        
        // Add additional fields based on role
        if (role === 'student') {
            const { dateOfBirth, currentLevel } = req.body;
            user.studentInfo = {
                dateOfBirth,
                currentLevel,
                studentId: 'ST' + Math.floor(10000 + Math.random() * 90000) // Generate random student ID
            };
        } else if (role === 'teacher') {
            const { specialization, qualifications } = req.body;
            user.teacherInfo = {
                specialization,
                qualifications,
                teacherId: 'T' + Math.floor(10000 + Math.random() * 90000) // Generate random teacher ID
            };
        }
        
        await user.save();
        
        // Return success response without password
        const userResponse = user.toJSON();
        
        // Generate token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { user: userResponse, token }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user by username
        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        // Check if password matches
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        // Update last login time
        user.lastLogin = Date.now();
        await user.save();
        
        // Generate token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        // Return user data and token
        const userResponse = user.toJSON();
        
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { user: userResponse, token }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password');
            
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: user
        });
        
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving user',
            error: error.message
        });
    }
};

// Logout user
exports.logout = (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Find user
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Check if current password matches
        const isMatch = await user.comparePassword(currentPassword);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
        
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
};

// Forgot password - generates reset token
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User with this email does not exist'
            });
        }
        
        // Generate reset token
        const resetToken = jwt.sign(
            { id: user._id },
            process.env.JWT_RESET_SECRET,
            { expiresIn: '15m' }
        );
        
        // In a real application, you would send an email with the reset link
        // For now, just return the token
        
        res.status(200).json({
            success: true,
            message: 'Password reset token generated',
            resetToken
        });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing request',
            error: error.message
        });
    }
};

// Reset password using token
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
        
        // Find user
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
        
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
};