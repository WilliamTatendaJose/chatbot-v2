# Testing and Debugging Guide

This document provides instructions for testing and debugging your TechRehub chatbot during development and deployment.

## Prerequisites

- Node.js and npm installed
- MongoDB running (locally or remote)
- WhatsApp Business Account and API credentials
- Facebook Developer Account and Messenger API credentials
- A way to expose your local server to the internet (for webhook testing)

## Setting Up for Testing

1. **Install dependencies**:

   ```
   npm install
   ```

2. **Set up environment variables**:
   Either manually create a `.env` file based on `.env.example`, or run the setup script:

   ```
   npm run setup
   ```

3. **Start the server in development mode**:

   ```
   npm run dev
   ```

4. **Expose your local server to the internet** (optional, for webhook testing):
   You can use services like ngrok, localtunnel, or a similar tool:
   ```
   ngrok http 3000
   ```
   Note the HTTPS URL provided, which you'll use for webhook configuration.

## Testing Tools

### API Testing Scripts

1. **Test WhatsApp API**:

   ```
   npm run test:whatsapp
   ```

   or with custom recipient:

   ```
   npm run test:whatsapp -- +1234567890
   ```

   For template messages:

   ```
   npm run test:whatsapp -- --template
   ```

2. **Test Messenger API**:

   ```
   npm run test:messenger
   ```

   or with custom recipient:

   ```
   npm run test:messenger -- 1234567890
   ```

   For template messages:

   ```
   npm run test:messenger -- --template
   ```

### Webhook Simulator

The webhook simulator allows you to test your webhook handling without actual messages from WhatsApp or Messenger.

1. **Verify webhook setup**:

   ```
   npm run simulate
   ```

2. **Simulate WhatsApp message**:

   ```
   npm run simulate -- whatsapp message "Hello, I need help"
   ```

3. **Simulate Messenger message**:

   ```
   npm run simulate -- messenger message "I want to book a service"
   ```

4. **Custom sender ID**:
   ```
   npm run simulate -- whatsapp message "Hello" +1234567890
   ```

## Debugging

### Common Issues and Solutions

1. **MongoDB Connection Issues**:

   - Check if MongoDB is running
   - Verify the connection string in `.env`
   - Look for connection errors in logs

2. **WhatsApp API Issues**:

   - Validate access token and phone number ID
   - Check WhatsApp API response in the logs
   - Verify webhook URL and verification token

3. **Messenger API Issues**:
   - Validate page access token
   - Ensure webhook subscription in Facebook developer portal
   - Check Messenger API response in the logs

### Logging

The chatbot uses Winston for logging. Log files are:

- `error.log`: Critical errors
- `combined.log`: All logs

Check these files for troubleshooting issues.

### Monitoring

For production environments, consider using monitoring tools:

- PM2 for process management
- MongoDB Atlas for database monitoring
- Application logging to a service like Papertrail or Loggly

## Testing Conversational Flows

To test the chatbot's ability to handle different intents:

1. **Service Information**:

   - Send: "What services do you offer?"
   - Expected: List of services

2. **Booking**:

   - Send: "I want to book a service"
   - Expected: Booking information request
   - Send: "Book: John Doe, May 25 at 2pm, Laptop not starting"
   - Expected: Booking confirmation

3. **Quotation**:

   - Send: "I need a quote"
   - Expected: Quotation information request
   - Send: "Quote: Jane Smith, Network Setup, Office with 5 computers"
   - Expected: Quotation request confirmation

4. **Human Transfer**:
   - Send: "I need to speak to a human"
   - Expected: Confirmation of human transfer request

## Handling State Transitions

The chatbot uses MongoDB to store conversation state. To debug state issues:

1. Connect to MongoDB
2. Examine the `sessions` collection
3. Check the `state` field for specific users

## Production Deployment Checks

Before deploying to production:

1. Test all conversational flows
2. Verify database connections with real data
3. Ensure environment variables are properly set
4. Test webhook reliability
5. Implement error handling and recovery mechanisms
