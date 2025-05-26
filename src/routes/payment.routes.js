import { Router } from 'express';
import { 
  initiateBookingPayment, 
  initiateQuotationPayment, 
  checkPaymentStatus, 
  handlePaymentCallback 
} from '../controllers/payment.controller.js';

const router = Router();

// Route to initiate payment for a booking
router.post('/booking', initiateBookingPayment);

// Route to initiate payment for a quotation
router.post('/quotation', initiateQuotationPayment);

// Route to check payment status
router.get('/status/:paymentReference', checkPaymentStatus);

// Callback route for Paynow webhooks
router.post('/callback', handlePaymentCallback);

export default router;
