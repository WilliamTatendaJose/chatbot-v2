import axios from 'axios';
import { whatsapp } from './src/config/index.js';

async function testInteractiveList() {
  const apiUrl = `https://graph.facebook.com/v18.0/${whatsapp.phoneNumberId}/messages`;
  
  // Test payload that's causing 400 error
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: '263773447131', // Replace with test number
    type: 'interactive',
    interactive: {
      type: 'list',
      header: {
        type: 'text',
        text: '🔧 TechRehub Services'
      },
      body: {
        text: 'Choose a service category to learn more or book an appointment:'
      },
      footer: {
        text: 'Select a service for detailed information'
      },
      action: {
        button: 'Choose Service', // Ensure button text matches WhatsApp API requirements
        sections: [
          {
            title: '🔧 Repair Services',
            rows: [
              {
                id: 'service_laptop_repair',
                title: 'Laptop Repair',
                description: '$50-200 • 1-3 days'
              }
            ]
          }
        ]
      }
    }
  };

  try {
    console.log('Testing WhatsApp Interactive List...');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Authorization': `Bearer ${whatsapp.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testInteractiveList();
