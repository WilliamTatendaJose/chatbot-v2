// Helper methods for handling payments via Messenger
const paymentService = require('./payment.service');
const { Booking, Quotation, Payment } = require('../models');
const logger = require('../utils/logger');

// Add these methods to the MessengerService class
async function handlePaymentRequest(recipientId, type, id) {
  try {
    let message;
    
    if (type === 'booking') {
      const booking = await Booking.findById(id);
      if (!booking) {
        return this.sendMessage(recipientId, "Sorry, we couldn't find that booking. Please contact our support team for assistance.");
      }
      
      message = `To pay for your ${booking.service} booking on ${booking.dateTime.toLocaleString()}:\n\n` +
        "1. You can pay online through Paynow (Ecocash, OneMoney, bank cards)\n" +
        "2. Click on the button below to make a payment\n\n" +
        "Need help? Type 'speak to a human' to connect with our team.";
        
      // In a real implementation, you would send a button template here
      return this.sendMessage(recipientId, message);
    } else if (type === 'quotation') {
      const quotation = await Quotation.findById(id);
      if (!quotation) {
        return this.sendMessage(recipientId, "Sorry, we couldn't find that quotation. Please contact our support team for assistance.");
      }
      
      if (!quotation.quotedAmount) {
        return this.sendMessage(recipientId, "Your quotation is still being processed. We'll notify you once it's ready for payment.");
      }
      
      message = `To pay for your ${quotation.service} quotation for $${quotation.quotedAmount}:\n\n` +
        "1. You can pay online through Paynow (Ecocash, OneMoney, bank cards)\n" +
        "2. Click on the button below to make a payment\n\n" +
        "Need help? Type 'speak to a human' to connect with our team.";
        
      // In a real implementation, you would send a button template here
      return this.sendMessage(recipientId, message);
    } else {
      message = "To make a payment for TechRehub services:\n\n" +
        "1. If you have a booking or quotation, please type 'My bookings' or 'My quotations' to see your pending items\n" +
        "2. For new services, please browse our services first\n\n" +
        "Need help? Type 'speak to a human' for assistance.";
      
      return this.sendMessage(recipientId, message);
    }
  } catch (error) {
    logger.error(`Error handling payment request via Messenger: ${error.message}`);
    return this.sendMessage(recipientId, "Sorry, there was an error processing your payment request. Please contact our support team for assistance.");
  }
}

async function initiatePayment(recipientId, type, id) {
  try {
    // For Messenger users, we would need to get their email or phone
    // Here we're using a placeholder, but in a real app, you would have collected this
    // information during the conversation or have it in your user database
    const userPhoneNumber = 'messenger_' + recipientId;
    const userEmail = recipientId + '@messenger.example.com'; // placeholder
    
    let paymentData;
    
    if (type === 'booking') {
      paymentData = await paymentService.createBookingPayment(id, 'card', userPhoneNumber, userEmail);
    } else if (type === 'quotation') {
      paymentData = await paymentService.createQuotationPayment(id, null, 'card', userPhoneNumber, userEmail);
    } else {
      return this.sendMessage(recipientId, "Invalid payment type. Please specify either 'booking' or 'quotation'.");
    }
    
    // Send payment instructions
    const message = `Your payment link has been created!\n\n` +
      `Amount: $${paymentData.amount}\n` +
      `Reference: ${paymentData.paymentReference}\n\n` +
      `Click the link below to complete your payment:\n${paymentData.paymentUrl}\n\n` +
      `After payment, you will receive a confirmation message. If you have any issues, please type 'speak to a human' for assistance.`;
    
    return this.sendMessage(recipientId, message);
  } catch (error) {
    logger.error(`Error initiating payment via Messenger: ${error.message}`);
    return this.sendMessage(recipientId, `Error: ${error.message}. Please contact our support team for assistance.`);
  }
}

async function checkPaymentStatus(recipientId, reference) {
  try {
    const payment = await paymentService.checkPaymentStatus(reference);
    
    let message;
    if (payment.status === 'paid') {
      message = `Your payment (reference: ${payment.paymentReference}) has been successfully processed and confirmed.\n\n` +
        `Amount: $${payment.amount}\n` +
        `Date: ${payment.paidAt ? new Date(payment.paidAt).toLocaleString() : 'N/A'}\n\n` +
        `Thank you for your payment!`;
    } else if (payment.status === 'pending') {
      message = `Your payment (reference: ${payment.paymentReference}) is still pending.\n\n` +
        `Amount: $${payment.amount}\n\n` +
        `Please complete your payment using this link:\n${payment.paymentUrl}`;
    } else {
      message = `Your payment (reference: ${payment.paymentReference}) has a status of '${payment.status}'.\n\n` +
        `If you believe this is an error, please contact our support team for assistance.`;
    }
    
    return this.sendMessage(recipientId, message);
  } catch (error) {
    logger.error(`Error checking payment status via Messenger: ${error.message}`);
    return this.sendMessage(recipientId, `Error: ${error.message}. Please contact our support team for assistance.`);
  }
}

// Export these methods to be added to the MessengerService class
module.exports = {
  handlePaymentRequest,
  initiatePayment,
  checkPaymentStatus
};
