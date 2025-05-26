import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';
import Service from '../models/service.model.js';
import Product from '../models/product.model.js';
import Booking from '../models/booking.model.js';
import Quotation from '../models/quotation.model.js';
import SupportTicket from '../models/support-ticket.model.js';
import Payment from '../models/payment.model.js';
import ChatSession from '../models/chat-session.model.js';
import { info, error as _error } from '../utils/logger.js';

// Dashboard Statistics
export const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get today's bookings
  const todayBookings = await Booking.countDocuments({
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }
  });

  // Get today's revenue
  const todayRevenue = await Payment.aggregate([
    {
      $match: {
        createdAt: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  // Get pending quotes
  const pendingQuotes = await Quotation.countDocuments({ status: 'pending' });

  // Get active chat sessions
  const activeChats = await ChatSession.countDocuments({
    status: 'active',
    updatedAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Active in last 30 minutes
  });

  // Get recent bookings
  const recentBookings = await Booking.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('service', 'name');

  // Get recent payments
  const recentPayments = await Payment.find()
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    todayBookings,
    todayRevenue: todayRevenue[0]?.total || 0,
    pendingQuotes,
    activeChats,
    recentBookings,
    recentPayments
  });
});

// Service Controllers
export const getAllServices = asyncHandler(async (req, res) => {
  const services = await Service.find().sort({ createdAt: -1 });
  res.json(services);
});

export const createService = asyncHandler(async (req, res) => {
  const service = await Service.create(req.body);
  res.status(201).json(service);
});

export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!service) {
    throw new AppError('Service not found', 404);
  }
  res.json(service);
});

export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) {
    throw new AppError('Service not found', 404);
  }
  res.json({ message: 'Service deleted successfully' });
});

// Product Controllers
export const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  res.json({ message: 'Product deleted successfully' });
});

// Booking Controllers
export const getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find().sort({ createdAt: -1 });
  res.json(bookings);
});

export const createBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.create(req.body);
  res.status(201).json(booking);
});

export const updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }
  res.json(booking);
});

export const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByIdAndDelete(req.params.id);
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }
  res.json({ message: 'Booking deleted successfully' });
});

// Quote Controllers
export const getAllQuotes = asyncHandler(async (req, res) => {
  const quotes = await Quotation.find().sort({ createdAt: -1 });
  res.json(quotes);
});

export const createQuote = asyncHandler(async (req, res) => {
  const quote = await Quotation.create(req.body);
  res.status(201).json(quote);
});

export const updateQuote = asyncHandler(async (req, res) => {
  const quote = await Quotation.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!quote) {
    throw new AppError('Quote not found', 404);
  }
  res.json(quote);
});

export const deleteQuote = asyncHandler(async (req, res) => {
  const quote = await Quotation.findByIdAndDelete(req.params.id);
  if (!quote) {
    throw new AppError('Quote not found', 404);
  }
  res.json({ message: 'Quote deleted successfully' });
});

// Support Ticket Controllers
export const getAllSupportTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find().sort({ createdAt: -1 });
  res.json(tickets);
});

export const createSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.create(req.body);
  res.status(201).json(ticket);
});

export const updateSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!ticket) {
    throw new AppError('Support ticket not found', 404);
  }
  res.json(ticket);
});

export const getSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) {
    throw new AppError('Support ticket not found', 404);
  }
  res.json(ticket);
});
