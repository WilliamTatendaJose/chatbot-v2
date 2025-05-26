import { Paynow } from 'paynow';
import { info, error } from '../utils/logger.js';
import { payment as paymentConfig } from '../config/index.js';
import { Booking, Quotation, Payment } from '../models/index.js';

class PaymentService {  constructor() {
    try {
      // Validate required configuration
      if (!paymentConfig.paynowIntegrationId || !paymentConfig.paynowIntegrationKey) {
        info('Payment service initialized in limited mode - Paynow integration not configured');
        this.paynow = null;
        return;
      }

      // Initialize Paynow
      this.paynow = new Paynow(
        paymentConfig.paynowIntegrationId,
        paymentConfig.paynowIntegrationKey
      );

      // Set return and result URLs
      this.paynow.resultUrl = paymentConfig.resultUrl;
      this.paynow.returnUrl = paymentConfig.returnUrl;

      info('Payment service initialized with Paynow integration');
    } catch (err) {
      error('Error initializing payment service:', err.message);
      this.paynow = null;
    }
  }

  /**
   * Create payment for booking
   * 
   * @param {String} bookingId - The booking ID
   * @param {String} paymentMethod - Payment method (mobile or others)
   * @param {String} phoneNumber - Customer phone number for mobile payments
   * @param {String} email - Customer email for email receipts
   * @returns {Object} - Payment information including payment URL
   */
  async createBookingPayment(bookingId, paymentMethod, phoneNumber, email) {
    try {
      // Check if Paynow is configured
      if (!this.paynow) {
        throw new Error('Payment service not configured');
      }

      // Get booking details
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      // Check if payment already exists
      const existingPayment = await Payment.findOne({
        referenceType: 'booking',
        referenceId: bookingId,
        status: { $in: ['pending', 'paid'] }
      });
      
      if (existingPayment) {
        if (existingPayment.status === 'pending') {
          // If payment is already initiated but pending, return existing payment
          return existingPayment;
        } else if (existingPayment.status === 'paid') {
          throw new Error('Payment already completed for this booking');
        }
      }
      
      // Get price based on service
      const servicePrice = this.getServiceBasePrice(booking.service);
      if (!servicePrice) {
        throw new Error('Could not determine service price');
      }
      
      // Create payment reference number (unique identifier)
      const paymentRef = this.generatePaymentReference('BK');
      
      // Create payment in Paynow
      const payment = this.paynow.createPayment(paymentRef, email || phoneNumber);
      
      // Add item to payment (service name and price)
      payment.add(booking.service, servicePrice);
      
      // Initiate transaction
      let response;
      if (paymentMethod === 'mobile') {
        // For mobile money payments
        response = await this.paynow.sendMobile(payment, phoneNumber, 'ecocash');
      } else {
        // For other payments (like card)
        response = await this.paynow.send(payment);
      }
      
      if (!response.success) {
        throw new Error(`Failed to initiate payment: ${response.error}`);
      }
      
      // Store payment information in database
      const paymentData = {
        referenceType: 'booking',
        referenceId: bookingId,
        paymentReference: paymentRef,
        amount: servicePrice,
        pollUrl: response.pollUrl,
        paymentUrl: response.redirectUrl,
        method: paymentMethod,
        customerEmail: email,
        customerPhone: phoneNumber,
        status: 'pending',
        paynowReference: response.pollUrl.split('=').pop()
      };
      
      const newPayment = new Payment(paymentData);
      await newPayment.save();
      
      // Update booking status to payment_pending
      booking.status = 'payment_pending';
      await booking.save();
      
      return paymentData;
    } catch (error) {
      logger.error(`Error creating booking payment: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Create payment for quotation
   * 
   * @param {String} quotationId - The quotation ID
   * @param {Number} amount - Amount to pay (from the quotation)
   * @param {String} paymentMethod - Payment method (mobile or others)
   * @param {String} phoneNumber - Customer phone number for mobile payments
   * @param {String} email - Customer email for email receipts
   * @returns {Object} - Payment information including payment URL
   */
  async createQuotationPayment(quotationId, amount, paymentMethod, phoneNumber, email) {
    try {
      // Check if Paynow is configured
      if (!this.paynow) {
        throw new Error('Payment service not configured');
      }

      // Get quotation details
      const quotation = await Quotation.findById(quotationId);
      if (!quotation) {
        throw new Error('Quotation not found');
      }
      
      // Check if payment already exists
      const existingPayment = await Payment.findOne({
        referenceType: 'quotation',
        referenceId: quotationId,
        status: { $in: ['pending', 'paid'] }
      });
      
      if (existingPayment) {
        if (existingPayment.status === 'pending') {
          // If payment is already initiated but pending, return existing payment
          return existingPayment;
        } else if (existingPayment.status === 'paid') {
          throw new Error('Payment already completed for this quotation');
        }
      }
      
      // If amount not provided, use quoted amount
      if (!amount && quotation.quotedAmount) {
        amount = quotation.quotedAmount;
      }
      
      if (!amount) {
        throw new Error('Payment amount not specified');
      }
      
      // Create payment reference number (unique identifier)
      const paymentRef = this.generatePaymentReference('QT');
      
      // Create payment in Paynow
      const payment = this.paynow.createPayment(paymentRef, email || phoneNumber);
      
      // Add item to payment (service name and price)
      payment.add(`${quotation.service} - ${quotation.requirements.substring(0, 30)}...`, amount);
      
      // Initiate transaction
      let response;
      if (paymentMethod === 'mobile') {
        // For mobile money payments
        response = await this.paynow.sendMobile(payment, phoneNumber, 'ecocash');
      } else {
        // For other payments (like card)
        response = await this.paynow.send(payment);
      }
      
      if (!response.success) {
        throw new Error(`Failed to initiate payment: ${response.error}`);
      }
      
      // Store payment information in database
      const paymentData = {
        referenceType: 'quotation',
        referenceId: quotationId,
        paymentReference: paymentRef,
        amount: amount,
        pollUrl: response.pollUrl,
        paymentUrl: response.redirectUrl,
        method: paymentMethod,
        customerEmail: email,
        customerPhone: phoneNumber,
        status: 'pending',
        paynowReference: response.pollUrl.split('=').pop()
      };
      
      const newPayment = new Payment(paymentData);
      await newPayment.save();
      
      // Update quotation status to payment_pending
      quotation.status = 'payment_pending';
      await quotation.save();
      
      return paymentData;
    } catch (error) {
      logger.error(`Error creating quotation payment: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Check payment status
   * 
   * @param {String} paymentReference - The payment reference number
   * @returns {Object} - Updated payment information
   */
  async checkPaymentStatus(paymentReference) {
    try {
      // Get payment from database
      const payment = await Payment.findOne({ paymentReference });
      
      if (!payment) {
        throw new Error('Payment not found');
      }
      
      if (payment.status === 'paid') {
        return payment;
      }
      
      // Check status with Paynow
      const status = await this.paynow.pollTransaction(payment.pollUrl);
      
      if (status.paid) {
        // Update payment status in DB
        payment.status = 'paid';
        payment.paidAt = new Date();
        payment.additionalInfo = {
          paynowReference: status.paynowReference,
          method: status.method,
          amount: status.amount
        };
        await payment.save();
        
        // Update the related entity (booking or quotation)
        if (payment.referenceType === 'booking') {
          await Booking.findByIdAndUpdate(
            payment.referenceId,
            { status: 'confirmed' }
          );
        } else if (payment.referenceType === 'quotation') {
          await Quotation.findByIdAndUpdate(
            payment.referenceId,
            { status: 'converted' }
          );
        }
      } else if (status.status === 'cancelled') {
        payment.status = 'cancelled';
        await payment.save();
      }
      
      return payment;
    } catch (error) {
      logger.error(`Error checking payment status: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate a unique payment reference
   */
  generatePaymentReference(prefix = '') {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${timestamp}${random}`;
  }
  
  /**
   * Get base price for service
   */
  getServiceBasePrice(serviceName) {
    // Map service names to base prices
    const priceMap = {
      'Computer Repair': 50,
      'Network Setup': 80,
      'Data Recovery': 100,
      'Virus Removal': 60,
      'System Upgrade': 120
    };
    
    return priceMap[serviceName] || 50; // Default to $50 if not found
  }
  
  /**
   * Handle callback from Paynow (webhook)
   */
  async handlePaymentCallback(data) {
    try {
      const { reference, paynowreference, status, amount, hash } = data;
      
      // Verify the hash to ensure the callback is legitimate
      // This would require implementing Paynow's hash verification
      
      // Find the payment in our database
      const payment = await Payment.findOne({ paymentReference: reference });
      
      if (!payment) {
        logger.error(`Payment not found for reference: ${reference}`);
        return false;
      }
      
      if (status.toLowerCase() === 'paid' || status.toLowerCase() === 'confirmed') {
        // Update payment status
        payment.status = 'paid';
        payment.paidAt = new Date();
        payment.additionalInfo = {
          paynowReference: paynowreference,
          amount: amount
        };
        await payment.save();
        
        // Update the related entity (booking or quotation)
        if (payment.referenceType === 'booking') {
          await Booking.findByIdAndUpdate(
            payment.referenceId,
            { status: 'confirmed' }
          );
        } else if (payment.referenceType === 'quotation') {
          await Quotation.findByIdAndUpdate(
            payment.referenceId,
            { status: 'converted' }
          );
        }
        
        return true;
      } else if (status.toLowerCase() === 'cancelled') {
        payment.status = 'cancelled';
        await payment.save();
      }
      
      return true;
    } catch (error) {
      logger.error(`Error handling payment callback: ${error.message}`);
      return false;
    }
  }
}

// Create singleton instance
const paymentService = new PaymentService();
export default paymentService;
