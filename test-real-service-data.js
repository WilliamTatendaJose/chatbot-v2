import axios from 'axios';
import { whatsapp, techrehubServices } from './src/config/index.js';

async function testRealServiceData() {
  const apiUrl = `https://graph.facebook.com/v18.0/${whatsapp.phoneNumberId}/messages`;
  
  console.log('Available services:', techrehubServices);
  
  // Test the actual data structure that's causing problems
  const services = techrehubServices;
  
  const sections = [
    {
      title: "🔧 Repair Services",
      rows: services.filter(s => s.category === 'repair').map(service => ({
        id: `service_${service.id}`,
        title: service.name,
        description: `${service.price} • ${service.duration}`
      }))
    },
    {
      title: "🌐 Network & Security", 
      rows: services.filter(s => ['networking', 'security'].includes(s.category)).map(service => ({
        id: `service_${service.id}`,
        title: service.name,
        description: `${service.price} • ${service.duration}`
      }))
    },
    {
      title: "⚡ Upgrades & Development",
      rows: services.filter(s => ['upgrade', 'development'].includes(s.category)).map(service => ({
        id: `service_${service.id}`,
        title: service.name,
        description: `${service.price} • ${service.duration}`
      }))
    }
  ];

  console.log('Generated sections:', JSON.stringify(sections, null, 2));
  
  // Check for empty sections
  const nonEmptySections = sections.filter(section => section.rows.length > 0);
  console.log('Non-empty sections:', nonEmptySections.length);
  
  if (nonEmptySections.length === 0) {
    console.error('❌ All sections are empty! This would cause a 400 error.');
    return;
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: '263773447131',
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
        button: 'View Services',
        sections: nonEmptySections
      }
    }
  };

  try {
    console.log('Testing with real service data...');
    
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

testRealServiceData();
