// Middleware to handle async route handlers and catch errors
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
}; 