import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';
import Admin from '../models/admin.model.js';
import { info, error as _error } from '../utils/logger.js';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Set secure cookie with JWT
const sendTokenResponse = (admin, statusCode, res, req) => {
    const token = generateToken(admin._id);

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/'
    };

    // Remove password from response
    admin.password = undefined;

    // CSRF protection is temporarily disabled
    // Use a dummy token for now
    const csrfToken = 'csrf-disabled-token';

    res
        .status(statusCode)
        .cookie('jwt', token, options)
        .json({
            success: true,
            token,
            csrfToken,
            data: admin
        });
};

// Login admin
export const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError('Please provide email and password', 400);
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
        throw new AppError('Invalid credentials', 401);
    }

    // Check if account is locked
    if (admin.isLocked()) {
        throw new AppError('Account is locked due to too many failed attempts', 401);
    }

    // Check password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
        await admin.incrementLoginAttempts();
        throw new AppError('Invalid credentials', 401);
    }

    // Reset login attempts on successful login
    await Admin.findByIdAndUpdate(admin._id, {
        $set: { loginAttempts: 0, lastLogin: Date.now() },
        $unset: { lockUntil: 1 }
    });

    sendTokenResponse(admin, 200, res, req);
});

// Logout admin
export const logout = asyncHandler(async (req, res) => {
    res.cookie('jwt', '', {
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/'
    });

    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Get current logged in admin
export const getMe = asyncHandler(async (req, res, next) => {
    const admin = await Admin.findById(req.admin.id);
    res.status(200).json({
        success: true,
        data: admin
    });
});

// Update password
export const updatePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.admin.id);

    // Check current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
        throw new AppError('Current password is incorrect', 401);
    }

    admin.password = newPassword;
    await admin.save();

    sendTokenResponse(admin, 200, res, req);
});

// Forgot password
export const forgotPassword = asyncHandler(async (req, res, next) => {
    const admin = await Admin.findOne({ email: req.body.email });

    if (!admin) {
        throw new AppError('No admin found with that email', 404);
    }

    // Get reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and set to resetPasswordToken field
    admin.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire
    admin.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await admin.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${req.protocol}://${req.get('host')}/admin/reset-password/${resetToken}`;

    try {
        // Send email with reset URL
        // TODO: Implement email sending functionality

        res.status(200).json({
            success: true,
            message: 'Password reset email sent'
        });
    } catch (err) {
        admin.passwordResetToken = undefined;
        admin.passwordResetExpires = undefined;
        await admin.save({ validateBeforeSave: false });

        throw new AppError('Email could not be sent', 500);
    }
});

// Reset password
export const resetPassword = asyncHandler(async (req, res, next) => {
    // Get hashed token
    const passwordResetToken = crypto
        .createHash('sha256')
        .update(req.params.resetToken)
        .digest('hex');

    const admin = await Admin.findOne({
        passwordResetToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!admin) {
        throw new AppError('Invalid or expired reset token', 400);
    }

    // Set new password
    admin.password = req.body.password;
    admin.passwordResetToken = undefined;
    admin.passwordResetExpires = undefined;
    await admin.save();

    sendTokenResponse(admin, 200, res, req);
}); 