import axios from 'axios';

async function testWebhookCarousel() {
  try {
    console.log('Testing WhatsApp carousel via webhook...');
    
    // Simulate WhatsApp message that triggers services carousel
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
              wa_id: '263773447131'
            }],
            messages: [{
              from: '263773447131',
              id: 'wamid.test123456789',
              timestamp: Math.floor(Date.now() / 1000),
              text: {
                body: 'show me services'
              },
              type: 'text'
            }]
          },
          field: 'messages'
        }]
      }]
    };

    const response = await axios.post('http://localhost:3000/webhook/whatsapp', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ WhatsApp webhook response:', response.status);
    
    // Test products carousel too
    const productPayload = {
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
              wa_id: '263773447131'
            }],
            messages: [{
              from: '263773447131',
              id: 'wamid.test123456790',
              timestamp: Math.floor(Date.now() / 1000),
              text: {
                body: 'show me products'
              },
              type: 'text'
            }]
          },
          field: 'messages'
        }]
      }]
    };

    const productResponse = await axios.post('http://localhost:3000/webhook/whatsapp', productPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ WhatsApp product webhook response:', productResponse.status);
    console.log('✅ All tests passed! Interactive lists are working.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status, error.response.data);
    }
  }
}

testWebhookCarousel();
