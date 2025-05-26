import jwt from 'jsonwebtoken';
import { AppError } from '../utils/app-error.js';
import Admin from '../models/admin.model.js';
import { asyncHandler } from '../utils/async-handler.js';

export const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Get token from header or cookies
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        throw new AppError('Not authorized to access this route', 401);
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if admin still exists
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            throw new AppError('User no longer exists', 401);
        }

        // Check if admin is active
        if (!admin.isActive) {
            throw new AppError('User account has been deactivated', 401);
        }

        // Check if password was changed after token was issued
        if (admin.passwordChangedAt && decoded.iat < admin.passwordChangedAt.getTime() / 1000) {
            throw new AppError('Password recently changed. Please log in again', 401);
        }

        // Grant access to protected route
        req.admin = admin;
        next();
    } catch (error) {
        throw new AppError('Not authorized to access this route', 401);
    }
});

// Role authorization
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.admin.role)) {
            throw new AppError('Not authorized to perform this action', 403);
        }
        next();
    };
};

// CSRF Protection - temporarily disabled
export const csrfProtection = (req, res, next) => {
    // CSRF protection is disabled, just pass through
    next();
};