import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import csrf from 'csurf';
import { errorHandler } from './src/middlewares/error.middleware.js';
import adminRoutes from './src/routes/admin.routes.js';
import webhookRoutes from './src/routes/webhook.routes.js';
import paymentWebhookRoutes from './src/routes/payment-webhook.routes.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));
app.use(mongoSanitize());
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'super-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// CORS - must be before CSRF
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
}));

// For now, we'll disable CSRF protection to fix the immediate issue
// We can re-implement it properly later if needed
// This will allow the admin dashboard to work without the browser refreshing

// Logging
app.use(morgan('dev'));

// Static files
app.use(express.static(join(__dirname, 'public')));

// Database connection with improved options
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot', {
  //serverSelectionTimeoutMS: 5000, // Reduce the timeout for faster failure detection
  //socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  //family: 4 // Use IPv4, skip trying IPv6
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  // Don't crash the server on connection error, but log it clearly
  console.error('Please check that MongoDB is running and the connection string is correct');
});

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/payment-webhook', paymentWebhookRoutes);

// Admin dashboard routes
app.get('/admin/login', (req, res) => {
  // Check if user is already logged in
  if (req.cookies.jwt) {
    return res.redirect('/admin');
  }
  res.sendFile(join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin', (req, res) => {
  // Check if user is logged in
  if (!req.cookies.jwt) {
    return res.redirect('/admin/login');
  }
  res.sendFile(join(__dirname, 'public', 'admin-dashboard.html'));
});

// Root route
app.get('/', (req, res) => {
  res.send('TechRehub Chatbot Server is running!');
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});