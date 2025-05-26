import { AppError } from './app-error.js';

export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((err) => {
            if (err instanceof AppError) {
                return next(err);
            }
            // If it's not an AppError, create a new one with 500 status
            next(new AppError(err.message || 'Internal Server Error', err.status || 500));
        });
    };
}; 