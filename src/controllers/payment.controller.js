import { info, error as _error } from '../utils/logger.js';
import paymentService from '../services/payment.service.js';
import { AppError } from '../utils/app-error.js';

// Async handler wrapper to catch errors
const catchAsync = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Initiate payment for a booking
export const initiateBookingPayment = catchAsync(async (req, res) => {
  const { bookingId, paymentMethod, phoneNumber, email } = req.body;
  
  if (!bookingId) {
    throw new AppError('Booking ID is required', 400);
  }
  
  if (!paymentMethod) {
    throw new AppError('Payment method is required', 400);
  }
  
  if (paymentMethod === 'mobile' && !phoneNumber) {
    throw new AppError('Phone number is required for mobile payments', 400);
  }

  const paymentData = await paymentService.createBookingPayment(bookingId, paymentMethod, phoneNumber, email);
  res.status(200).json(paymentData);
});

// Initiate payment for a quotation
export const initiateQuotationPayment = catchAsync(async (req, res) => {
  const { quotationId, paymentMethod, phoneNumber, email } = req.body;
  
  if (!quotationId) {
    throw new AppError('Quotation ID is required', 400);
  }
  
  if (!paymentMethod) {
    throw new AppError('Payment method is required', 400);
  }
  
  if (paymentMethod === 'mobile' && !phoneNumber) {
    throw new AppError('Phone number is required for mobile payments', 400);
  }

  const paymentData = await paymentService.createQuotationPayment(quotationId, paymentMethod, phoneNumber, email);
  res.status(200).json(paymentData);
});

// Check payment status
export const checkPaymentStatus = catchAsync(async (req, res) => {
  const { paymentReference } = req.params;
  
  if (!paymentReference) {
    throw new AppError('Payment reference is required', 400);
  }

  const status = await paymentService.checkPaymentStatus(paymentReference);
  res.status(200).json(status);
});

// Handle payment callback
export const handlePaymentCallback = catchAsync(async (req, res) => {
  info(`Paynow callback received: ${JSON.stringify(req.body, null, 2)}`);

  const result = await paymentService.handlePaymentCallback(req.body);
  
  if (result.success) {
    info(`Payment callback processed successfully: ${result.transactionId}`);
    res.status(200).json({ status: 'ok', message: 'Payment processed' });
  } else {
    throw new AppError(result.error, 400);
  }
});
