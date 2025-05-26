# TechRehub Chatbot

A WhatsApp and Facebook Messenger chatbot for TechRehub (www.techrehub.co.zw) that allows customers to:

- Get information about services
- Book services
- Request quotations
- Talk to a human agent for complex inquiries

## Technologies Used

- Node.js
- Express.js
- MongoDB (for storing bookings, quotations, and conversation state)
- WhatsApp Cloud API (Meta's official WhatsApp Business API)
- Facebook Messenger API
- NLP.js (for natural language processing)

## Features

- **Multi-channel Support**: Works on both WhatsApp and Facebook Messenger
- **Service Information**: Provides details about TechRehub's services
- **Service Booking**: Allows customers to book services by providing their details
- **Quotation Requests**: Customers can request quotes for custom services
- **Payment Integration**: Integrates with Paynow Zimbabwe for processing payments
- **Human Handoff**: Transfers complex conversations to human agents
- **Persistent Conversations**: Maintains conversation context across sessions

## Setup Instructions

### Prerequisites

- Node.js (v14 or newer)
- MongoDB (local or Atlas)
- Meta Developer Account (for WhatsApp Cloud API and Messenger)

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd chatbot
```

2. Install dependencies

```bash
npm install
```

3. Run the interactive setup script

```bash
npm run setup
```

This script will guide you through setting up all required environment variables.

### Documentation

For detailed instructions, refer to our documentation:

- [WhatsApp API Setup Guide](docs/whatsapp-api-setup.md)
- [Testing Guide](docs/testing-guide.md)
- [Deployment Guide](docs/deployment-guide.md)

### WhatsApp Setup (via WhatsApp Cloud API)

1. Create a Meta for Developers account at https://developers.facebook.com/
2. Set up a Meta App and add the WhatsApp product
3. Set up a Business Manager and connect a phone number to your WhatsApp Business Account
4. Configure webhook events to point to your server's `/api/webhook/whatsapp` endpoint
5. Update the `.env` file with your WhatsApp credentials:
   - `WHATSAPP_ACCESS_TOKEN` - The permanent access token from the Meta app
   - `WHATSAPP_PHONE_NUMBER_ID` - The phone number ID from the WhatsApp settings
   - `WHATSAPP_BUSINESS_ACCOUNT_ID` - Your WhatsApp Business Account ID
   - `WHATSAPP_WEBHOOK_VERIFY_TOKEN` - A custom token you create for webhook verification

### Facebook Messenger Setup

1. Create a Facebook Page for your business
2. Create a Facebook App at https://developers.facebook.com/
3. Set up the Messenger product in your Facebook App
4. Configure the webhook URL to point to your server's `/api/webhook/messenger` endpoint
5. Generate a Page Access Token and update the `.env` file: - `MESSENGER_PAGE_ACCESS_TOKEN`
   - `MESSENGER_VERIFY_TOKEN` (a random string you choose)
   - `MESSENGER_APP_SECRET`

### Paynow Payment Integration Setup

1. Register for a Paynow merchant account at https://www.paynow.co.zw/
2. Obtain your Integration ID and Integration Key from the Paynow merchant dashboard
3. Update the `.env` file with your Paynow credentials:
   - `PAYNOW_INTEGRATION_ID` - Your Paynow Integration ID
   - `PAYNOW_INTEGRATION_KEY` - Your Paynow Integration Key
   - `PAYNOW_RESULT_URL` - Callback URL for payment notifications (should point to your server's `/api/payments/callback` endpoint)
   - `PAYNOW_RETURN_URL` - URL to redirect customers after payment (typically your website's payment confirmation page)

### Admin Setup

1. Update the `ADMIN_PHONE_NUMBERS` variable in the `.env` file with a comma-separated list of WhatsApp numbers that should receive human handoff messages

### Testing

You can test different components of the application using the following commands:

```bash
# Test WhatsApp messaging
npm run test:whatsapp

# Test Messenger messaging
npm run test:messenger

# Test payment integration
npm run test:payment

# Simulate incoming webhooks
npm run simulate
```

For payment testing, you can run various test scenarios:

```bash
# Test all payment flows
npm run test:payment

# Test only booking payment
npm run test:payment booking

# Test only quotation payment
npm run test:payment quotation

# Check status of a specific payment
npm run test:payment status PAYMENT_REFERENCE_ID

# Simulate a payment callback
npm run test:payment callback PAYMENT_REFERENCE_ID
```

### Running the Application

#### Development Mode

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

## Deployment

For production deployment, consider using:

- Heroku
- AWS Elastic Beanstalk
- Digital Ocean
- Azure App Service

Make sure your server has a public HTTPS URL, as both Twilio and Facebook require secure webhook endpoints.

You can use services like ngrok for development testing:

```bash
ngrok http 3000
```

## Customization

### Adding New Services

Update the `techrehubServices` array in the `config/index.js` file to add new services.

### Enhancing NLP

To improve natural language understanding, add more training phrases to the various intents in the `chatbotService.js` file.

## License

[MIT](LICENSE)
