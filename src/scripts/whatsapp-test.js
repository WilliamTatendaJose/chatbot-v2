import axios from 'axios';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const config = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  recipientNumber: process.env.TEST_RECIPIENT_NUMBER, // Default from environment variable
};

// Verify required configuration
if (!config.accessToken || !config.phoneNumberId || !config.recipientNumber) {
  console.error('Missing required environment variables. Please check:');
  if (!config.accessToken) console.error('- WHATSAPP_ACCESS_TOKEN');
  if (!config.phoneNumberId) console.error('- WHATSAPP_PHONE_NUMBER_ID');
  if (!config.recipientNumber) console.error('- TEST_RECIPIENT_NUMBER (or provide as command line argument)');
  console.error('\nUsage: node whatsapp-test.js [recipient-number]');
  process.exit(1);
}

const apiUrl = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`;

// Function to send a test message
async function sendTestMessage() {
  try {
    // Format the recipient number (ensure it has a + prefix if missing)
    let formattedNumber = config.recipientNumber.trim();
    if (!formattedNumber.startsWith('+')) {
      formattedNumber = '+' + formattedNumber;
    }

    const response = await axios.post(
      apiUrl,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedNumber,
        type: 'text',
        text: { 
          body: 'Hello from TechRehub! This is a test message from our WhatsApp API integration.' 
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Message sent successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error sending message:');
    if (error.response) {
      console.error('Response error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// Function to send a test interactive message
async function sendInteractiveMessage() {
  try {
    // Format the recipient number
    let formattedNumber = config.recipientNumber.trim();
    if (!formattedNumber.startsWith('+')) {
      formattedNumber = '+' + formattedNumber;
    }

    const response = await axios.post(
      apiUrl,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedNumber,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: 'Would you like to schedule a consultation?'
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: 'schedule_yes',
                  title: 'Yes, please!'
                }
              },
              {
                type: 'reply',
                reply: {
                  id: 'schedule_no',
                  title: 'Not now'
                }
              }
            ]
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Interactive message sent successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error sending interactive message:');
    if (error.response) {
      console.error('Response error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// Main execution
console.log('Starting WhatsApp API test...');
console.log('Configuration:', {
  phoneNumberId: config.phoneNumberId,
  recipientNumber: config.recipientNumber
});

// Send both types of messages
(async () => {
  try {
    console.log('\nSending test message...');
    await sendTestMessage();

    console.log('\nWaiting 2 seconds before sending interactive message...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\nSending interactive message...');
    await sendInteractiveMessage();

    console.log('\nAll tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\nTest failed:', error.message);
    process.exit(1);
  }
})();
