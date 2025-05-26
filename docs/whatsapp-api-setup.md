# WhatsApp Cloud API Setup Guide

This guide explains how to set up and integrate the WhatsApp Cloud API with your TechRehub chatbot.

## Prerequisites

- A Meta for Developers account
- A business phone number (not your personal number)
- A server with a public HTTPS endpoint (for webhooks)

## Step 1: Create a Meta for Developers Account

1. Go to https://developers.facebook.com/ and sign up or log in
2. Create a new app by clicking "Create App"
3. Select "Business" as the app type
4. Enter your app name (e.g., "TechRehub Chatbot") and contact email

## Step 2: Set Up the WhatsApp API

1. From your app dashboard, click "Add Products"
2. Find and add "WhatsApp" to your app
3. You'll be taken to the WhatsApp setup page

## Step 3: Create a Business Profile

1. Set up Meta Business Manager if you don't already have one
2. Connect your business to WhatsApp
3. Register a phone number to use with WhatsApp Business (new or existing)
4. Verify your business and phone number through the Meta verification process

## Step 4: Configure the WhatsApp Business Profile

1. Set a business name, description, address, etc.
2. Upload your business logo
3. Set your business hours
4. Add a welcome message

## Step 5: Get API Credentials

1. From the WhatsApp dashboard in your Meta app, locate:

   - Phone Number ID
   - WhatsApp Business Account ID
   - Temporary Access Token (you'll create a permanent one later)

2. Create a System User in your Business Manager:
   - Go to Business Settings > Users > System Users
   - Create a new System User with "Admin" role
   - Generate a permanent access token with the "WhatsApp Business Management" permission

## Step 6: Configure Webhooks

1. In the WhatsApp settings, locate the "Webhooks" section
2. Click "Configure Webhooks"
3. Enter your webhook URL: `https://your-server.com/api/webhook/whatsapp`
4. Enter your custom verification token (this should match `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in your .env file)
5. Subscribe to the following webhook fields:
   - messages
   - message_status
   - messaging_referrals

## Step 7: Test Your Integration

1. Use the "Test Number" in the WhatsApp dashboard to test your integration
2. Send a message to your WhatsApp Business number
3. Make sure your server receives and processes the message correctly
4. Check that your chatbot responds appropriately

## Step 8: Set Up Message Templates (Optional but Recommended)

For sending proactive notifications (like booking confirmations):

1. Go to the "Message Templates" section
2. Create templates for different notification types:
   - Booking confirmation
   - Quotation responses
   - Appointment reminders

## Step 9: Move to Production

Once testing is complete:

1. Apply for production access (Meta's review process)
2. Complete any compliance requirements
3. Once approved, you can use your WhatsApp API with real users

## Troubleshooting

- Check webhook logs for any errors
- Verify that your webhook URL is publicly accessible
- Ensure your access token is valid and has the correct permissions
- Test with the WhatsApp Business API testing tools in the Meta dashboard

## Resources

- [WhatsApp Business Platform Documentation](https://developers.facebook.com/docs/whatsapp)
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/api)
- [WhatsApp Business Management API](https://developers.facebook.com/docs/whatsapp/business-management-api)
