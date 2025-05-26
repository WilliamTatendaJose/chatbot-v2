import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/admin.model.js';
import { info, error as _error } from '../utils/logger.js';

dotenv.config();

const createSuperAdmin = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot');
        info('Connected to MongoDB');

        // Check if any super admin exists
        const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
        if (existingSuperAdmin) {
            info('Super admin already exists');
            process.exit(0);
        }

        // Create super admin
        const superAdmin = await Admin.create({
            username: process.env.SUPER_ADMIN_USERNAME || 'superadmin',
            email: process.env.SUPER_ADMIN_EMAIL || 'admin@techrehub.com',
            password: process.env.SUPER_ADMIN_PASSWORD || 'Admin@123',
            role: 'super_admin',
            isActive: true
        });

        info(`Super admin created successfully: ${superAdmin.email}`);
        process.exit(0);
    } catch (err) {
        _error(`Error creating super admin: ${err.message}`);
        process.exit(1);
    }
};

createSuperAdmin(); 