import whatsappService from './src/services/whatsapp.service.js';

async function testFixedWhatsAppService() {
  console.log('Testing WhatsApp service with validation fix...');
  
  try {
    // Test sending service carousel with the fixed validation
    await whatsappService.sendServiceCarousel('263773447131');
    
    console.log('✅ Service carousel sent successfully!');
    
    // Test sending product carousel too
    await whatsappService.sendProductCarousel('263773447131');
    
    console.log('✅ Product carousel sent successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFixedWhatsAppService();
