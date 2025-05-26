const axios = require('axios');
require('dotenv').config();

// Configuration
const config = {
  whatsappWebhookUrl: process.env.LOCAL_WEBHOOK_URL || 'http://localhost:3000/api/webhook/whatsapp',
  messengerWebhookUrl: process.env.LOCAL_WEBHOOK_URL || 'http://localhost:3000/api/webhook/messenger',
  whatsappVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'your_webhook_verify_token',
  messengerVerifyToken: process.env.MESSENGER_VERIFY_TOKEN || 'your_messenger_verify_token'
};

// Simulate WhatsApp verification request
async function simulateWhatsAppVerification() {
  try {
    console.log('Simulating WhatsApp webhook verification...');
    
    const response = await axios.get(config.whatsappWebhookUrl, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': config.whatsappVerifyToken,
        'hub.challenge': '12345'
      }
    });
    
    if (response.status === 200 && response.data === '12345') {
      console.log('WhatsApp verification successful! ✅');
    } else {
      console.error('WhatsApp verification failed. Check your verify token.');
    }
  } catch (error) {
    console.error('Error simulating WhatsApp verification:');
    console.error(`Status: ${error.response?.status || 'Unknown'}`);
    console.error(`Message: ${error.message}`);
  }
}

// Simulate Messenger verification request
async function simulateMessengerVerification() {
  try {
    console.log('Simulating Messenger webhook verification...');
    
    const response = await axios.get(config.messengerWebhookUrl, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': config.messengerVerifyToken,
        'hub.challenge': '67890'
      }
    });
    
    if (response.status === 200 && response.data === '67890') {
      console.log('Messenger verification successful! ✅');
    } else {
      console.error('Messenger verification failed. Check your verify token.');
    }
  } catch (error) {
    console.error('Error simulating Messenger verification:');
    console.error(`Status: ${error.response?.status || 'Unknown'}`);
    console.error(`Message: ${error.message}`);
  }
}

// Simulate WhatsApp message webhook
async function simulateWhatsAppMessage(text = 'Hello', from = '1234567890') {
  try {
    console.log(`Simulating WhatsApp message: "${text}" from ${from}`);
    
    // Format WhatsApp webhook payload
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: 'BUSINESS_PHONE_NUMBER',
              phone_number_id: 'PHONE_NUMBER_ID'
            },
            contacts: [{
              profile: {
                name: 'Test User'
              },
              wa_id: from
            }],
            messages: [{
              from: from,
              id: 'wamid.test123456789',
              timestamp: Math.floor(Date.now() / 1000),
              text: {
                body: text
              },
              type: 'text'
            }]
          },
          field: 'messages'
        }]
      }]
    };
    
    const response = await axios.post(config.whatsappWebhookUrl, payload);
    
    if (response.status === 200) {
      console.log('WhatsApp message webhook simulated successfully! ✅');
    } else {
      console.warn(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error simulating WhatsApp message webhook:');
    console.error(`Status: ${error.response?.status || 'Unknown'}`);
    console.error(`Message: ${error.message}`);
  }
}

// Simulate Messenger message webhook
async function simulateMessengerMessage(text = 'Hello', senderId = '1234567890') {
  try {
    console.log(`Simulating Messenger message: "${text}" from ${senderId}`);
    
    // Format Messenger webhook payload
    const payload = {
      object: 'page',
      entry: [{
        id: 'PAGE_ID',
        time: Date.now(),
        messaging: [{
          sender: {
            id: senderId
          },
          recipient: {
            id: 'PAGE_ID'
          },
          timestamp: Date.now(),
          message: {
            mid: 'mid.test123456789',
            text: text
          }
        }]
      }]
    };
    
    const response = await axios.post(config.messengerWebhookUrl, payload);
    
    if (response.status === 200) {
      console.log('Messenger message webhook simulated successfully! ✅');
    } else {
      console.warn(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error simulating Messenger message webhook:');
    console.error(`Status: ${error.response?.status || 'Unknown'}`);
    console.error(`Message: ${error.message}`);
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const platform = args[0]?.toLowerCase() || 'all';
  const action = args[1]?.toLowerCase() || 'verify';
  
  console.log('Webhook Simulator');
  console.log('----------------');
  
  if (platform === 'whatsapp' || platform === 'all') {
    if (action === 'verify') {
      await simulateWhatsAppVerification();
    } else {
      const message = args[2] || 'Hello, this is a test message';
      const from = args[3] || '1234567890';
      await simulateWhatsAppMessage(message, from);
    }
  }
  
  if (platform === 'messenger' || platform === 'all') {
    if (action === 'verify') {
      await simulateMessengerVerification();
    } else {
      const message = args[2] || 'Hello, this is a test message';
      const senderId = args[3] || '1234567890';
      await simulateMessengerMessage(message, senderId);
    }
  }
}

// Show usage information
function showUsage() {
  console.log(`
  Usage: node webhook-simulator.js [platform] [action] [message] [sender]
  
  platform: whatsapp | messenger | all (default: all)
  action: verify | message (default: verify)
  message: The message text (default: "Hello, this is a test message")
  sender: Sender ID or phone number (default: "1234567890")
  
  Examples:
    node webhook-simulator.js                        # Verify both platforms
    node webhook-simulator.js whatsapp               # Verify WhatsApp only
    node webhook-simulator.js messenger message      # Send test message to Messenger
    node webhook-simulator.js whatsapp message "Hi"  # Send "Hi" message to WhatsApp
  `);
}

// Check if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage();
} else {
  main().catch(console.error);
}
