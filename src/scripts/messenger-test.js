const axios = require('axios');
require('dotenv').config();

// Load environment variables
const config = {
  pageAccessToken: process.env.MESSENGER_PAGE_ACCESS_TOKEN,
  recipientId: process.argv[2] || process.env.TEST_RECIPIENT_ID, // Accept recipient ID as command line argument
};

// Verify required configuration
if (!config.pageAccessToken || !config.recipientId) {
  console.error('Missing required environment variables. Please check:');
  if (!config.pageAccessToken) console.error('- MESSENGER_PAGE_ACCESS_TOKEN');
  if (!config.recipientId) console.error('- TEST_RECIPIENT_ID (or provide as command line argument)');
  console.error('\nUsage: node messenger-test.js [recipient-id]');
  process.exit(1);
}

const apiUrl = 'https://graph.facebook.com/v18.0/me/messages';

// Function to send a test message
async function sendTestMessage() {
  try {
    const response = await axios.post(
      apiUrl,
      {
        recipient: { id: config.recipientId },
        message: { text: 'Hello from TechRehub! This is a test message from our Messenger API integration.' }
      },
      {
        params: { access_token: config.pageAccessToken }
      }
    );

    console.log('Message sent successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error sending Messenger message:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

// Function to send a test template message with buttons
async function sendTemplateMessage() {
  try {
    const response = await axios.post(
      apiUrl,
      {
        recipient: { id: config.recipientId },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'button',
              text: 'Welcome to TechRehub! How can we help you today?',
              buttons: [
                {
                  type: 'postback',
                  title: 'View Services',
                  payload: 'SERVICE_LIST'
                },
                {
                  type: 'postback',
                  title: 'Book a Service',
                  payload: 'BOOKING_START'
                },
                {
                  type: 'postback',
                  title: 'Get a Quote',
                  payload: 'QUOTATION_START'
                }
              ]
            }
          }
        }
      },
      {
        params: { access_token: config.pageAccessToken }
      }
    );

    console.log('Template message sent successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error sending Messenger template message:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

// Function to check if the webhook URL is valid
async function checkWebhook() {
  try {
    const webhookUrl = process.env.WEBHOOK_URL || 'https://your-server.com/api/webhook/messenger';
    console.log(`Checking webhook URL: ${webhookUrl}`);
    
    const response = await axios.get(webhookUrl, { 
      timeout: 5000,
      validateStatus: false // Don't throw on any status code
    });
    
    console.log(`Webhook status: ${response.status}`);
    if (response.status >= 200 && response.status < 300) {
      console.log('Webhook seems to be accessible!');
    } else {
      console.warn(`Warning: Webhook returned status ${response.status}`);
    }
  } catch (error) {
    console.error('Error checking webhook:');
    console.error(error.message);
  }
}

// Main function
async function main() {
  try {
    console.log('Facebook Messenger API Test Script');
    console.log('--------------------------------');
    console.log(`Recipient ID: ${config.recipientId}`);
    
    // Check webhook
    await checkWebhook();
    
    // Choose which test to run
    const args = process.argv.slice(2);
    if (args.includes('--template')) {
      await sendTemplateMessage();
    } else {
      await sendTestMessage();
    }
  } catch (error) {
    console.error('Test failed.');
    process.exit(1);
  }
}

// Run the main function
main();
