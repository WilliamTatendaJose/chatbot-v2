import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';
import Admin from '../models/admin.model.js';
import { info, error as _error } from '../utils/logger.js';

// Get all admin users
export const getAllAdmins = asyncHandler(async (req, res) => {
    const admins = await Admin.find().select('-password');

    res.status(200).json({
        success: true,
        count: admins.length,
        data: admins
    });
});

// Create new admin user
export const createAdmin = asyncHandler(async (req, res) => {
    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existingAdmin) {
        throw new AppError('Admin with that email or username already exists', 400);
    }

    // Create admin
    const admin = await Admin.create({
        username,
        email,
        password,
        role: role || 'admin' // Default to regular admin if role not specified
    });

    // Remove password from response
    admin.password = undefined;

    res.status(201).json({
        success: true,
        data: admin
    });
});

// Update admin user
export const updateAdmin = asyncHandler(async (req, res) => {
    const { username, email, role, isActive } = req.body;
    const adminId = req.params.id;

    // Don't allow password updates through this route
    if (req.body.password) {
        throw new AppError('Please use /updatepassword route to change password', 400);
    }

    // Find and update admin
    const admin = await Admin.findByIdAndUpdate(
        adminId,
        { username, email, role, isActive },
        { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
        throw new AppError('Admin not found', 404);
    }

    res.status(200).json({
        success: true,
        data: admin
    });
});

// Delete admin user
export const deleteAdmin = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
        throw new AppError('Admin not found', 404);
    }

    // Prevent deletion of last super_admin
    if (admin.role === 'super_admin') {
        const superAdminCount = await Admin.countDocuments({ role: 'super_admin' });
        if (superAdminCount <= 1) {
            throw new AppError('Cannot delete the last super admin', 400);
        }
    }

    await admin.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Admin user deleted successfully'
    });
});

// Get single admin user
export const getAdmin = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.params.id).select('-password');

    if (!admin) {
        throw new AppError('Admin not found', 404);
    }

    res.status(200).json({
        success: true,
        data: admin
    });
}); 