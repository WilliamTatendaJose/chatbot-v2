const axios = require('axios');
const mongoose = require('mongoose');
const { Booking, Quotation, Payment } = require('../models');
const paymentService = require('../services/payment.service');
const config = require('../config');
const logger = require('../utils/logger');
require('dotenv').config();

// Configuration
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(config.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('Connected to MongoDB');
    return true;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    return false;
  }
}

// Test creating a test booking
async function createTestBooking() {
  try {
    const booking = new Booking({
      name: 'Test User',
      phoneNumber: '+263712345678',
      service: 'Computer Repair',
      dateTime: new Date(),
      description: 'Test booking for payment integration',
      platform: 'whatsapp',
      status: 'pending'
    });
    
    await booking.save();
    logger.info(`Test booking created with ID: ${booking._id}`);
    return booking;
  } catch (error) {
    logger.error(`Error creating test booking: ${error.message}`);
    throw error;
  }
}

// Test creating a payment for a booking
async function testBookingPayment(bookingId) {
  try {
    const response = await axios.post(`${baseUrl}/api/payments/booking`, {
      bookingId,
      paymentMethod: 'mobile',
      phoneNumber: '+263712345678'
    });
    
    logger.info('Booking payment initiated successfully');
    logger.info(`Payment URL: ${response.data.data.paymentUrl}`);
    logger.info(`Payment Reference: ${response.data.data.paymentReference}`);
    
    return response.data.data;
  } catch (error) {
    logger.error('Error initiating booking payment:');
    if (error.response) {
      logger.error(`Status: ${error.response.status}`);
      logger.error(`Response: ${JSON.stringify(error.response.data)}`);
    } else {
      logger.error(error.message);
    }
    throw error;
  }
}

// Test checking payment status
async function checkPaymentStatus(paymentReference) {
  try {
    const response = await axios.get(`${baseUrl}/api/payments/status/${paymentReference}`);
    
    logger.info(`Payment status: ${response.data.data.status}`);
    return response.data.data;
  } catch (error) {
    logger.error('Error checking payment status:');
    if (error.response) {
      logger.error(`Status: ${error.response.status}`);
      logger.error(`Response: ${JSON.stringify(error.response.data)}`);
    } else {
      logger.error(error.message);
    }
    throw error;
  }
}

// Create a test quotation
async function createTestQuotation() {
  try {
    const quotation = new Quotation({
      name: 'Test User',
      phoneNumber: '+263712345678',
      service: 'Network Setup',
      requirements: 'Test quotation for payment integration',
      platform: 'whatsapp',
      status: 'quoted',
      quotedAmount: 150
    });
    
    await quotation.save();
    logger.info(`Test quotation created with ID: ${quotation._id}`);
    return quotation;
  } catch (error) {
    logger.error(`Error creating test quotation: ${error.message}`);
    throw error;
  }
}

// Test creating a payment for a quotation
async function testQuotationPayment(quotationId) {
  try {
    const response = await axios.post(`${baseUrl}/api/payments/quotation`, {
      quotationId,
      amount: 150,
      paymentMethod: 'mobile',
      phoneNumber: '+263712345678'
    });
    
    logger.info('Quotation payment initiated successfully');
    logger.info(`Payment URL: ${response.data.data.paymentUrl}`);
    logger.info(`Payment Reference: ${response.data.data.paymentReference}`);
    
    return response.data.data;
  } catch (error) {
    logger.error('Error initiating quotation payment:');
    if (error.response) {
      logger.error(`Status: ${error.response.status}`);
      logger.error(`Response: ${JSON.stringify(error.response.data)}`);
    } else {
      logger.error(error.message);
    }
    throw error;
  }
}

// Test simulating a payment callback
async function simulatePaymentCallback(paymentReference) {
  try {
    // In a real scenario, Paynow would send this
    const callbackData = {
      reference: paymentReference,
      paynowreference: `P${Math.floor(Math.random() * 1000000)}`,
      amount: "150.00",
      status: "Paid",
      pollurl: `https://www.paynow.co.zw/Interface/CheckPayment/${Math.floor(Math.random() * 1000000)}`,
      hash: "mockHashValue" // In reality, this would be a proper hash
    };
    
    const response = await axios.post(`${baseUrl}/api/payments/callback`, callbackData);
    
    logger.info(`Callback simulation response: ${response.status}`);
    return response.status === 200;
  } catch (error) {
    logger.error('Error simulating payment callback:');
    if (error.response) {
      logger.error(`Status: ${error.response.status}`);
      logger.error(`Response: ${JSON.stringify(error.response.data)}`);
    } else {
      logger.error(error.message);
    }
    throw error;
  }
}

// Direct test using the payment service
async function testPaymentServiceDirectly() {
  try {
    // Create a test booking
    const booking = await createTestBooking();
    
    // Create payment using the service directly
    const paymentData = await paymentService.createBookingPayment(
      booking._id.toString(),
      'mobile',
      '+263712345678',
      'test@example.com'
    );
    
    logger.info('Payment created directly with service:');
    logger.info(`Payment Reference: ${paymentData.paymentReference}`);
    logger.info(`Payment URL: ${paymentData.paymentUrl}`);
    
    // Check status (which would normally be pending)
    const paymentStatus = await paymentService.checkPaymentStatus(paymentData.paymentReference);
    logger.info(`Payment status: ${paymentStatus.status}`);
    
    return paymentData;
  } catch (error) {
    logger.error(`Error testing payment service directly: ${error.message}`);
    throw error;
  }
}

// Main test function
async function runTests() {
  try {
    const connected = await connectToDatabase();
    if (!connected) {
      logger.error('Could not connect to database. Exiting...');
      process.exit(1);
    }
    
    // Command line arguments
    const args = process.argv.slice(2);
    const testType = args[0] || 'all';
    
    if (testType === 'booking' || testType === 'all') {
      logger.info('=== Testing Booking Payment ===');
      const booking = await createTestBooking();
      await testBookingPayment(booking._id);
    }
    
    if (testType === 'quotation' || testType === 'all') {
      logger.info('=== Testing Quotation Payment ===');
      const quotation = await createTestQuotation();
      await testQuotationPayment(quotation._id);
    }
    
    if (testType === 'status' && args[1]) {
      logger.info('=== Testing Payment Status Check ===');
      await checkPaymentStatus(args[1]);
    }
    
    if (testType === 'callback' && args[1]) {
      logger.info('=== Testing Payment Callback ===');
      await simulatePaymentCallback(args[1]);
    }
    
    if (testType === 'direct') {
      logger.info('=== Testing Payment Service Directly ===');
      await testPaymentServiceDirectly();
    }
    
    logger.info('Tests completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error(`Test failed: ${error.message}`);
    process.exit(1);
  }
}

// Show usage information
function showUsage() {
  console.log(`
  Usage: node payment-test.js [test-type] [payment-reference]
  
  test-type: 
    all - Run all tests (default)
    booking - Test booking payment
    quotation - Test quotation payment
    status - Check status of a payment (requires payment-reference)
    callback - Simulate a payment callback (requires payment-reference)
    direct - Test payment service directly
  
  Examples:
    node payment-test.js                      # Run all tests
    node payment-test.js booking              # Test booking payment
    node payment-test.js status BK1621234567  # Check payment status
  `);
}

// Check if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage();
} else {
  runTests().catch(console.error);
}
