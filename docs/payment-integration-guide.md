# Payment Integration Guide

This document provides a comprehensive guide to the Paynow payment integration in the TechRehub chatbot.

## Overview

The TechRehub chatbot has been integrated with [Paynow Zimbabwe](https://www.paynow.co.zw/), allowing customers to make payments for services directly through the chatbot interface. The integration supports:

- Payment for bookings
- Payment for quotations
- Mobile money payments (EcoCash)
- Card payments
- Payment status tracking

## User Flow

### WhatsApp

1. **For Bookings**:

   - After a booking is confirmed, the bot automatically offers payment options
   - The user can reply with `Pay: booking, [booking_id]` to initiate payment
   - The user receives a payment link
   - After payment, the booking status is updated automatically

2. **For Quotations**:

   - Once a quotation is provided with pricing, the bot offers payment options
   - The user can reply with `Pay: quotation, [quotation_id]` to initiate payment
   - The user receives a payment link
   - After payment, the quotation status is updated automatically

3. **Payment Status**:
   - The user can check payment status by replying with `Status: [payment_reference]`

### Messenger

1. **For Bookings**:

   - After a booking is confirmed, the bot automatically offers payment options with buttons
   - The user can click the "Pay Now" button to initiate payment
   - The user receives a payment link
   - After payment, the booking status is updated automatically

2. **For Quotations**:

   - Once a quotation is provided with pricing, the bot offers payment options with buttons
   - The user can click the "Pay Now" button to initiate payment
   - The user receives a payment link
   - After payment, the quotation status is updated automatically

3. **Payment Status**:
   - The user can check payment status by typing `Status: [payment_reference]`

## Technical Implementation

### Components

The payment integration consists of the following components:

1. **Payment Service** (`payment.service.js`):

   - Core functionality for creating and tracking payments
   - Integration with Paynow API
   - Payment verification logic

2. **WhatsApp Payment Helper** (`whatsapp-payment.js`):

   - WhatsApp-specific payment message handling
   - Payment link generation for WhatsApp users

3. **Messenger Payment Helper** (`messenger-payment.js`):

   - Messenger-specific payment message handling
   - Payment button generation for Messenger users

4. **Payment Controller** (`payment.controller.js`):

   - REST API endpoints for payment operations
   - Webhook handlers for Paynow callbacks

5. **Payment Routes** (`payment.routes.js`):

   - API route definitions for payment operations

6. **Payment Model** (`models/index.js` - Payment schema):
   - Database schema for tracking payments

### API Endpoints

The following API endpoints are available for payment operations:

- `POST /api/payments/booking` - Initiate payment for a booking
- `POST /api/payments/quotation` - Initiate payment for a quotation
- `GET /api/payments/status/:paymentReference` - Check payment status
- `POST /api/payments/callback` - Webhook for Paynow callback notifications

### Paynow Integration

The integration with Paynow is handled through the `paynow` NPM package. Key features include:

- Creating payment requests
- Handling mobile money payments (EcoCash)
- Polling payment status
- Processing callback notifications

## Testing

### Manual Testing

You can test the payment integration manually by:

1. Creating a booking or quotation through the chatbot
2. Initiating payment through the chatbot interface
3. Using the Paynow test environment to simulate payments

### Automated Testing

A test script is provided to automate payment testing:

```bash
# Run all payment tests
npm run test:payment

# Test specific payment scenarios
npm run test:payment booking
npm run test:payment quotation
npm run test:payment status REF123456
npm run test:payment callback REF123456
```

## Customization

### Adding New Payment Methods

To add new payment methods, modify the payment service to support them:

```javascript
// Example for adding a new payment method
if (paymentMethod === "new_method") {
  // Handle the new payment method
  // ...
} else if (paymentMethod === "mobile") {
  // Existing mobile money logic
  response = await this.paynow.sendMobile(payment, phoneNumber, "ecocash");
} else {
  // Existing card payment logic
  response = await this.paynow.send(payment);
}
```

### Modifying Payment Messages

To customize payment messages, modify the respective helper files:

- `whatsapp-payment.js` for WhatsApp messages
- `messenger-payment.js` for Messenger messages

## Troubleshooting

### Common Issues

1. **Payment Not Initiated**:

   - Check if Paynow integration credentials are correct
   - Verify network connectivity to Paynow API

2. **Payment Status Not Updating**:

   - Ensure the callback URL is accessible from the internet
   - Check if the webhook route is correctly registered

3. **Mobile Money Payment Failed**:
   - Verify the phone number format (should include country code)
   - Check if EcoCash is enabled in your Paynow account

### Logging

The payment service includes comprehensive logging. Check the logs for detailed information about payment operations and errors:

```javascript
logger.info(`Payment initiated: ${paymentRef}`);
logger.error(`Error creating payment: ${error.message}`);
```

## Security Considerations

- All payment communication with Paynow is secured via HTTPS
- Payment reference numbers are randomly generated for security
- Callback verification is implemented to prevent fraud
- Sensitive payment details are not stored in the database

## Future Enhancements

Potential future enhancements for the payment integration include:

1. Support for additional payment methods
2. Integration with accounting software
3. Automated receipt generation
4. Payment reminders for pending payments
5. Partial payment support for large quotations
