// Helper methods for handling payments via WhatsApp
const paymentService = require('./payment.service');
const { Booking, Quotation, Payment } = require('../models');
const logger = require('../utils/logger');

// Add these methods to the WhatsAppService class
async function handlePaymentRequest(to, type, id) {
  try {
    let message;
    
    if (type === 'booking') {
      const booking = await Booking.findById(id);
      if (!booking) {
        return this.sendMessage(to, "Sorry, we couldn't find that booking. Please contact our support team for assistance.");
      }
      
      message = `To pay for your *${booking.service}* booking on *${booking.dateTime.toLocaleString()}*:\n\n` +
        "1. You can pay online through Paynow (Ecocash, OneMoney, bank cards)\n" +
        "2. Reply with 'Pay: booking, " + booking._id + "' to get payment instructions\n\n" +
        "Need help? Type 'speak to a human' to connect with our team.";
    } else if (type === 'quotation') {
      const quotation = await Quotation.findById(id);
      if (!quotation) {
        return this.sendMessage(to, "Sorry, we couldn't find that quotation. Please contact our support team for assistance.");
      }
      
      if (!quotation.quotedAmount) {
        return this.sendMessage(to, "Your quotation is still being processed. We'll notify you once it's ready for payment.");
      }
      
      message = `To pay for your *${quotation.service}* quotation for *$${quotation.quotedAmount}*:\n\n` +
        "1. You can pay online through Paynow (Ecocash, OneMoney, bank cards)\n" +
        "2. Reply with 'Pay: quotation, " + quotation._id + "' to get payment instructions\n\n" +
        "Need help? Type 'speak to a human' to connect with our team.";
    } else {
      message = "To make a payment for TechRehub services:\n\n" +
        "1. For a booking, reply with 'Pay: booking, [your booking ID]'\n" +
        "2. For a quotation, reply with 'Pay: quotation, [your quotation ID]'\n\n" +
        "If you don't have a booking or quotation ID, type 'speak to a human' for assistance.";
    }
    
    return this.sendMessage(to, message);
  } catch (error) {
    logger.error(`Error handling payment request: ${error.message}`);
    return this.sendMessage(to, "Sorry, there was an error processing your payment request. Please contact our support team for assistance.");
  }
}

async function initiatePayment(to, type, id) {
  try {
    let paymentData;
    
    if (type === 'booking') {
      paymentData = await paymentService.createBookingPayment(id, 'mobile', to);
    } else if (type === 'quotation') {
      paymentData = await paymentService.createQuotationPayment(id, null, 'mobile', to);
    } else {
      return this.sendMessage(to, "Invalid payment type. Please specify either 'booking' or 'quotation'.");
    }
    
    // Send payment instructions
    const message = `Your payment link has been created!\n\n` +
      `Amount: $${paymentData.amount}\n` +
      `Reference: ${paymentData.paymentReference}\n\n` +
      `Click the link below to complete your payment:\n${paymentData.paymentUrl}\n\n` +
      `After payment, you will receive a confirmation message. If you have any issues, please type 'speak to a human' for assistance.`;
    
    return this.sendMessage(to, message);
  } catch (error) {
    logger.error(`Error initiating payment: ${error.message}`);
    return this.sendMessage(to, `Error: ${error.message}. Please contact our support team for assistance.`);
  }
}

async function checkPaymentStatus(to, reference) {
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
    
    return this.sendMessage(to, message);
  } catch (error) {
    logger.error(`Error checking payment status: ${error.message}`);
    return this.sendMessage(to, `Error: ${error.message}. Please contact our support team for assistance.`);
  }
}

// Export these methods to be added to the WhatsAppService class
module.exports = {
  handlePaymentRequest,
  initiatePayment,
  checkPaymentStatus
};
