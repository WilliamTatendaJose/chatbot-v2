import express from 'express';
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  getAllQuotes,
  createQuote,
  updateQuote,
  deleteQuote,
  getAllSupportTickets,
  createSupportTicket,
  updateSupportTicket,
  getSupportTicket,
  getDashboardStats
} from '../controllers/admin.controller.js';
import {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAdmin
} from '../controllers/admin-user.controller.js';
import multer from 'multer';
import Service from '../models/service.model.js';
import Product from '../models/product.model.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import ChatSession from '../models/chat-session.model.js';
import whatsappService from '../services/whatsapp.service.js';
import messengerService from '../services/messenger.service.js';
import Booking from '../models/booking.model.js';
import Quotation from '../models/quotation.model.js';
import Payment from '../models/payment.model.js';
import paymentTrackingService from '../services/payment-tracking.service.js';
import {
  login,
  logout,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

// Mock data for enhanced dashboard features
let mockDashboardData = {
  stats: {
    totalMessages: 1247,
    pendingBookings: 8,
    activeQuotes: 12,
    avgResponseTime: 2.3,
    dailyMessages: [45, 52, 38, 65, 41, 48, 72],
    weeklyBookings: [12, 18, 15, 22, 16, 14, 25],
    monthlyRevenue: [8500, 12300, 9800, 15600, 11200, 13400, 16800]
  },
  notifications: [
    {
      id: 'N001',
      type: 'booking',
      title: 'New Booking Request',
      message: 'John Smith requested a consultation for Web Development',
      timestamp: new Date('2024-01-13T10:30:00Z'),
      read: false
    },
    {
      id: 'N002',
      type: 'quote',
      title: 'Quote Response Needed',
      message: 'Emma Davis is waiting for CRM System quote',
      timestamp: new Date('2024-01-13T09:15:00Z'),
      read: false
    }
  ],
  configuration: {
    whatsapp: {
      token: process.env.WHATSAPP_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      webhookUrl: process.env.WEBHOOK_URL || '',
      enabled: true
    },
    messenger: {
      pageAccessToken: process.env.MESSENGER_PAGE_ACCESS_TOKEN || '',
      appSecret: process.env.MESSENGER_APP_SECRET || '',
      verifyToken: process.env.MESSENGER_VERIFY_TOKEN || '',
      enabled: true
    },
    general: {
      businessName: 'TechSolutions Pro',
      businessHours: '9:00 AM - 6:00 PM',
      timezone: 'America/New_York',
      autoResponse: true,
      transferToHuman: true
    }
  },
  nlpTraining: {
    intents: [
      {
        name: 'booking_request',
        examples: [
          'I want to book a consultation',
          'Can I schedule a meeting',
          'Book an appointment',
          'I need to meet with someone'
        ],
        responses: [
          'I\'d be happy to help you book a consultation. What service are you interested in?'
        ]
      },
      {
        name: 'quote_request',
        examples: [
          'How much does it cost',
          'I need a quote',
          'What are your prices',
          'Give me an estimate'
        ],
        responses: [
          'I can help you get a quote. Which product or service would you like pricing for?'
        ]
      }
    ]
  }
};

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop())
  }
});

const upload = multer({ storage: storage });

// Auth routes - login doesn't need CSRF protection as it's the initial request
router.post('/login', login);
router.get('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resetToken', resetPassword);

// CSRF protection is temporarily disabled
router.get('/csrf-token', (req, res) => {
  // Return a dummy token for now
  res.json({ csrfToken: 'csrf-disabled-token' });
});

// Protect all routes after this middleware
router.use(protect);

// Admin user management routes (only accessible by super_admin)
router.route('/users')
  .get(authorize('super_admin'), getAllAdmins)
  .post(authorize('super_admin'), createAdmin);

router.route('/users/:id')
  .get(authorize('super_admin'), getAdmin)
  .put(authorize('super_admin'), updateAdmin)
  .delete(authorize('super_admin'), deleteAdmin);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);

// Service routes
router.route('/services')
  .get(getAllServices)
  .post(authorize('super_admin'), createService);

router.route('/services/:id')
  .put(authorize('super_admin'), updateService)
  .delete(authorize('super_admin'), deleteService);

// Product routes
router.route('/products')
  .get(getAllProducts)
  .post(authorize('super_admin'), createProduct);

router.route('/products/:id')
  .put(authorize('super_admin'), updateProduct)
  .delete(authorize('super_admin'), deleteProduct);

// Booking routes
router.route('/bookings')
  .get(getAllBookings)
  .post(createBooking);

router.route('/bookings/:id')
  .put(updateBooking)
  .delete(authorize('super_admin'), deleteBooking);

// Quote routes
router.route('/quotes')
  .get(getAllQuotes)
  .post(createQuote);

router.route('/quotes/:id')
  .put(updateQuote)
  .delete(authorize('super_admin'), deleteQuote);

// Support ticket routes
router.route('/support-tickets')
  .get(getAllSupportTickets)
  .post(createSupportTicket);

router.route('/support-tickets/:id')
  .get(getSupportTicket)
  .put(updateSupportTicket);

// Payment routes
router.route('/payments')
  .get(async (req, res) => {
    try {
      const payments = await Payment.find().sort({ createdAt: -1 });
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
  .post(async (req, res) => {
    try {
      const payment = await Payment.create(req.body);
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

// Enhanced Dashboard API Routes

// Dashboard statistics
router.get('/stats', (req, res) => {
  try {
    // Add some real-time variation to simulate live data
    const stats = { ...mockDashboardData.stats };
    stats.totalMessages += Math.floor(Math.random() * 5);
    stats.avgResponseTime = (Math.random() * 2 + 1).toFixed(1);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// General analytics overview
router.get('/analytics', (req, res) => {
  try {
    const analyticsData = {
      summary: {
        totalConversations: mockDashboardData.stats.totalMessages,
        activeUsers: 156,
        completedBookings: 89,
        pendingQuotes: mockDashboardData.stats.activeQuotes,
        averageResponseTime: mockDashboardData.stats.avgResponseTime + 's',
        customerSatisfaction: '94%'
      },
      trends: {
        messagesGrowth: '+12%',
        bookingsGrowth: '+8%',
        revenueGrowth: '+15%',
        responseTimeImprovement: '-5%'
      },
      topServices: [
        { name: 'Web Development', requests: 45 },
        { name: 'Mobile App Development', requests: 32 },
        { name: 'Digital Marketing', requests: 28 },
        { name: 'SEO Services', requests: 21 }
      ],
      channelStats: {
        whatsapp: { messages: Math.floor(mockDashboardData.stats.totalMessages * 0.6), users: 94 },
        messenger: { messages: Math.floor(mockDashboardData.stats.totalMessages * 0.4), users: 62 }
      }
    };

    res.json(analyticsData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// API Failures and Fallback Messages endpoint
router.get('/api-failures', (req, res) => {
  try {
    // In production, this would come from database
    const mockFailures = [
      {
        id: 'F001',
        platform: 'whatsapp',
        userId: '263773447131',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        error: 'WhatsApp API authentication failed',
        originalMessage: 'Hi',
        intendedResponse: 'Hello! Welcome to TechRehub. How can I assist you today?',
        status: 'pending_manual_send'
      },
      {
        id: 'F002',
        platform: 'messenger',
        userId: '7966704550056709',
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        error: 'Messenger signature verification failed',
        originalMessage: 'Hello',
        intendedResponse: 'Hi there! I\'m here to help you with TechRehub services.',
        status: 'pending_manual_send'
      }
    ];

    res.json(mockFailures);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch API failures' });
  }
});

// Manual message send endpoint for failed messages
router.post('/send-manual-message', (req, res) => {
  try {
    const { failureId, customMessage } = req.body;

    // In production, implement actual manual sending logic
    info(`Manual message send requested for failure ${failureId}: ${customMessage}`);

    // Add success notification
    mockDashboardData.notifications.unshift({
      id: `N${Date.now()}`,
      type: 'system',
      title: 'Manual Message Sent',
      message: `Failed message ${failureId} has been manually sent`,
      timestamp: new Date(),
      read: false
    });

    res.json({
      success: true,
      message: 'Message sent manually successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send manual message' });
  }
});

// Enhanced bookings endpoints
router.post('/bookings/:id/confirm', asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  booking.status = 'confirmed';
  booking.confirmedAt = new Date();
  await booking.save();

  // Add notification
  mockDashboardData.notifications.unshift({
    id: `N${Date.now()}`,
    type: 'booking',
    title: 'Booking Confirmed',
    message: `Booking ${booking._id} has been confirmed`,
    timestamp: new Date(),
    read: false
  });

  // Send confirmation message to user
  const message = `✅ Your booking has been confirmed!\n\n` +
    `Service: ${booking.service}\n` +
    `Date: ${booking.date}\n` +
    `Time: ${booking.time}\n\n` +
    `Reference: ${booking._id}\n\n` +
    `We look forward to serving you! 🚀`;

  if (booking.platform === 'whatsapp') {
    await whatsappService.sendMessage(booking.userId, message);
  } else if (booking.platform === 'messenger') {
    await messengerService.sendMessage(booking.userId, message);
  }

  res.json({ success: true, booking });
}));

router.post('/bookings/:id/decline', (req, res) => {
  try {
    const bookingId = req.params.id;

    // Add notification
    mockDashboardData.notifications.unshift({
      id: `N${Date.now()}`,
      type: 'booking',
      title: 'Booking Declined',
      message: `Booking ${bookingId} has been declined`,
      timestamp: new Date(),
      read: false
    });

    res.json({ success: true, message: 'Booking declined' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to decline booking' });
  }
});

// Enhanced quotes endpoints
router.post('/quotes/:id/respond', asyncHandler(async (req, res) => {
  const { amount, notes } = req.body;
  const quote = await Quote.findById(req.params.id);

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  quote.quotedAmount = amount;
  quote.notes = notes;
  quote.respondedAt = new Date();
  quote.status = 'quoted';
  await quote.save();

  // Add notification
  mockDashboardData.notifications.unshift({
    id: `N${Date.now()}`,
    type: 'quote',
    title: 'Quote Sent',
    message: `Quote ${quote._id} has been sent to customer`,
    timestamp: new Date(),
    read: false
  });

  // Send quote to user
  const message = `📝 Your quotation is ready!\n\n` +
    `Service: ${quote.service}\n` +
    `Amount: $${amount}\n\n` +
    `Notes: ${notes}\n\n` +
    `Reference: ${quote._id}\n\n` +
    `To proceed with booking, reply with "accept quote".\n` +
    `For any questions, type "speak to human".`;

  if (quote.platform === 'whatsapp') {
    await whatsappService.sendMessage(quote.userId, message);
  } else if (quote.platform === 'messenger') {
    await messengerService.sendMessage(quote.userId, message);
  }

  res.json({ success: true, quote });
}));

// Notifications
router.get('/notifications', (req, res) => {
  try {
    // Return recent notifications (last 10)
    const notifications = mockDashboardData.notifications
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.post('/notifications/:id/read', (req, res) => {
  try {
    const notification = mockDashboardData.notifications.find(n => n.id === req.params.id);
    if (notification) {
      notification.read = true;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Configuration management
router.get('/configuration', (req, res) => {
  try {
    // Don't expose sensitive tokens in full
    const config = { ...mockDashboardData.configuration };
    if (config.whatsapp.token) {
      config.whatsapp.token = '***' + config.whatsapp.token.slice(-4);
    }
    if (config.messenger.pageAccessToken) {
      config.messenger.pageAccessToken = '***' + config.messenger.pageAccessToken.slice(-4);
    }
    if (config.messenger.appSecret) {
      config.messenger.appSecret = '***' + config.messenger.appSecret.slice(-4);
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Update configuration
router.post('/configuration', (req, res) => {
  try {
    const updates = req.body;

    // Update configuration (in production, validate and sanitize input)
    if (updates.whatsapp) {
      Object.assign(mockDashboardData.configuration.whatsapp, updates.whatsapp);
    }
    if (updates.messenger) {
      Object.assign(mockDashboardData.configuration.messenger, updates.messenger);
    }
    if (updates.general) {
      Object.assign(mockDashboardData.configuration.general, updates.general);
    }

    // Add notification
    mockDashboardData.notifications.unshift({
      id: `N${Date.now()}`,
      type: 'system',
      title: 'Configuration Updated',
      message: 'Chatbot configuration has been updated successfully',
      timestamp: new Date(),
      read: false
    });

    res.json({ success: true, message: 'Configuration updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// NLP Training data
router.get('/nlp-training', (req, res) => {
  try {
    res.json(mockDashboardData.nlpTraining);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch NLP training data' });
  }
});

// NLP Training data (alternative path for compatibility)
router.get('/nlp/training', (req, res) => {
  try {
    const trainingStatus = {
      status: 'completed',
      lastUpdated: '2024-01-13T10:00:00Z',
      accuracy: '94.2%',
      totalIntents: mockDashboardData.nlpTraining.intents.length,
      totalExamples: mockDashboardData.nlpTraining.intents.reduce((total, intent) => total + intent.examples.length, 0),
      modelVersion: '1.2.3',
      trainingTime: '2.5 minutes'
    };

    res.json(trainingStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch NLP training status' });
  }
});

// Update NLP Training
router.post('/nlp-training', (req, res) => {
  try {
    const { intents } = req.body;

    if (intents) {
      mockDashboardData.nlpTraining.intents = intents;
    }

    // Add notification
    mockDashboardData.notifications.unshift({
      id: `N${Date.now()}`,
      type: 'system',
      title: 'NLP Training Updated',
      message: 'NLP training data has been updated and model will be retrained',
      timestamp: new Date(),
      read: false
    });

    res.json({ success: true, message: 'NLP training data updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update NLP training data' });
  }
});

// Broadcast message
router.post('/broadcast', (req, res) => {
  try {
    const { message, audience, channels } = req.body;

    // In production, implement actual broadcast logic
    console.log('Broadcasting message:', {
      message,
      audience: audience || 'all',
      channels: channels || ['whatsapp', 'messenger']
    });

    // Add notification
    mockDashboardData.notifications.unshift({
      id: `N${Date.now()}`,
      type: 'broadcast',
      title: 'Broadcast Message Sent',
      message: `Message sent to ${audience || 'all customers'} via ${(channels || ['whatsapp', 'messenger']).join(', ')}`,
      timestamp: new Date(),
      read: false
    });

    res.json({
      success: true,
      message: 'Broadcast message sent successfully',
      recipients: Math.floor(Math.random() * 100) + 50 // Mock recipient count
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send broadcast message' });
  }
});

// Analytics data
router.get('/analytics/:type', (req, res) => {
  try {
    const { type } = req.params;
    let data = {};

    switch (type) {
      case 'messages':
        data = {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Messages',
            data: mockDashboardData.stats.dailyMessages,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)'
          }]
        };
        break;

      case 'bookings':
        data = {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [{
            label: 'Bookings',
            data: mockDashboardData.stats.weeklyBookings.slice(-4),
            backgroundColor: '#28a745'
          }]
        };
        break;

      case 'revenue':
        data = {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
          datasets: [{
            label: 'Revenue ($)',
            data: mockDashboardData.stats.monthlyRevenue,
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.1)'
          }]
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid analytics type' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Export data
router.get('/export/:type', (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query;

    let filename = `${type}-${new Date().toISOString().split('T')[0]}`;

    // Mock export data
    const exportData = {
      bookings: [
        { id: 'BK001', customer: 'John Smith', service: 'Web Development', status: 'pending' }
      ],
      quotes: [
        { id: 'QT001', customer: 'Emma Davis', product: 'CRM System', price: 2500, status: 'pending' }
      ]
    };

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send('id,customer,item,status\nBK001,John Smith,Web Development,pending');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json(exportData[type] || exportData);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Live Chat Session Routes
router.get('/chat-sessions', asyncHandler(async (req, res) => {
  const { status, platform } = req.query;
  const query = {};

  if (status) query.status = status;
  if (platform) query.platform = platform;

  const sessions = await ChatSession.find(query)
    .sort({ createdAt: -1 })
    .limit(100);

  res.json(sessions);
}));

router.get('/chat-sessions/:id', asyncHandler(async (req, res) => {
  const session = await ChatSession.findById(req.params.id);
  if (!session) {
    throw new AppError('Chat session not found', 404);
  }
  res.json(session);
}));

router.patch('/chat-sessions/:id/assign', asyncHandler(async (req, res) => {
  const { agentId } = req.body;
  const session = await ChatSession.findById(req.params.id);

  if (!session) {
    throw new AppError('Chat session not found', 404);
  }

  session.assignAgent(agentId);
  await session.save();

  res.json(session);
}));

router.patch('/chat-sessions/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  const session = await ChatSession.findById(req.params.id);

  if (!session) {
    throw new AppError('Chat session not found', 404);
  }

  if (status === 'resolved') {
    session.resolve();
  } else if (status === 'closed') {
    session.close();
  } else {
    session.status = status;
  }

  await session.save();
  res.json(session);
}));

// Dashboard Overview
router.get('/dashboard/overview', asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalBookings,
    todayBookings,
    totalQuotations,
    pendingQuotations,
    activeChats,
    completedPayments
  ] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({
      dateTime: { $gte: today }
    }),
    Quotation.countDocuments(),
    Quotation.countDocuments({ status: 'pending' }),
    ChatSession.countDocuments({ status: 'active' }),
    Payment.find({
      status: 'completed',
      createdAt: { $gte: today }
    }).select('amount')
  ]);

  const todayRevenue = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);

  res.json({
    totalBookings,
    todayBookings,
    totalQuotations,
    pendingQuotations,
    activeChats,
    todayRevenue,
    lastUpdated: new Date()
  });
}));

// Payment Routes
router.post('/payments', asyncHandler(async (req, res) => {
  await paymentTrackingService.validatePayment(req.body);
  const payment = await paymentTrackingService.createPayment(req.body);
  res.status(201).json(payment);
}));

router.get('/payments', asyncHandler(async (req, res) => {
  const { status, startDate, endDate, customerId } = req.query;
  const query = {};

  if (status) query.status = status;
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  if (customerId) query['customer.phone'] = customerId;

  const payments = await Payment.find(query)
    .sort({ createdAt: -1 })
    .populate('bookingId')
    .populate('quotationId');

  res.json(payments);
}));

router.get('/payments/:id', asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('bookingId')
    .populate('quotationId');

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  res.json(payment);
}));

router.patch('/payments/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  const payment = await paymentTrackingService.updatePaymentStatus(
    req.params.id,
    status,
    req.body.metadata
  );
  res.json(payment);
}));

router.post('/payments/:id/refund', asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  const payment = await paymentTrackingService.processRefund(
    req.params.id,
    amount,
    reason
  );
  res.json(payment);
}));

// Payment Statistics
router.get('/payments/stats/daily', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    throw new AppError('Start date and end date are required', 400);
  }

  const stats = await paymentTrackingService.getPaymentStats(
    new Date(startDate),
    new Date(endDate)
  );
  res.json(stats);
}));

export default router;
