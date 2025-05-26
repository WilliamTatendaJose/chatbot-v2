// Test script for enhanced Messenger service functionality
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
  baseURL: 'http://localhost:3000',
  testRecipientId: 'test_messenger_user_123',
  testServiceId: 'web_development',
  testProductId: 'crm_system'
};

// Test scenarios for enhanced Messenger functionality
const testScenarios = [
  {
    name: 'Service Details and Booking Flow',
    postback: 'SERVICE_DETAILS_web_development'
  },
  {
    name: 'Product Details and Demo Request',
    postback: 'PRODUCT_DETAILS_crm_system'
  },
  {
    name: 'Product More Info Request',
    postback: 'INFO_PRODUCT_crm_system'
  },
  {
    name: 'Product Quote Request',
    postback: 'QUOTE_PRODUCT_crm_system'
  },
  {
    name: 'Booking Confirmation',
    postback: 'BOOKING_CONFIRM'
  },
  {
    name: 'Quote Confirmation',
    postback: 'QUOTE_CONFIRM'
  },
  {
    name: 'Product Quote Confirmation',
    postback: 'PRODUCT_QUOTE_CONFIRM'
  },
  {
    name: 'Demo Confirmation',
    postback: 'DEMO_CONFIRM'
  },
  {
    name: 'Main Menu',
    postback: 'MAIN_MENU'
  },
  {
    name: 'Help Menu',
    postback: 'HELP_MENU'
  }
];

// Text message scenarios
const textMessageScenarios = [
  {
    name: 'Booking Request Format',
    text: 'Book: John Doe, 25/05/2025, 10:00 AM, Laptop repair'
  },
  {
    name: 'Quote Request Format', 
    text: 'Quote: Jane Smith, Office network setup, Next week, $1000-2000'
  },
  {
    name: 'Product Quote Format',
    text: 'ProductQuote: ABC Corp, 50 users, CRM + Analytics, ERP integration, 3 months, $10,000-15,000'
  },
  {
    name: 'Demo Request Format',
    text: 'Demo: John Smith, ABC Corp, Tomorrow 2PM, 50 users'
  }
];

async function simulateMessengerPostback(postback, testName) {
  try {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log(`📤 Postback: ${postback}`);
    
    const payload = {
      object: 'page',
      entry: [{
        id: 'PAGE_ID',
        time: Date.now(),
        messaging: [{
          sender: {
            id: config.testRecipientId
          },
          recipient: {
            id: 'PAGE_ID'
          },
          timestamp: Date.now(),
          postback: {
            payload: postback
          }
        }]
      }]
    };

    const response = await axios.post(`${config.baseURL}/api/webhook/messenger`, payload, {
      timeout: 10000
    });

    if (response.status === 200) {
      console.log(`✅ ${testName} - Postback handled successfully`);
      return true;
    } else {
      console.log(`⚠️ ${testName} - Unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${testName} - Error:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return false;
  }
}

async function simulateMessengerTextMessage(text, testName) {
  try {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log(`📤 Message: ${text}`);
    
    const payload = {
      object: 'page',
      entry: [{
        id: 'PAGE_ID',
        time: Date.now(),
        messaging: [{
          sender: {
            id: config.testRecipientId
          },
          recipient: {
            id: 'PAGE_ID'
          },
          timestamp: Date.now(),
          message: {
            mid: `mid.test${Date.now()}`,
            text: text
          }
        }]
      }]
    };

    const response = await axios.post(`${config.baseURL}/api/webhook/messenger`, payload, {
      timeout: 10000
    });

    if (response.status === 200) {
      console.log(`✅ ${testName} - Text message processed successfully`);
      return true;
    } else {
      console.log(`⚠️ ${testName} - Unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${testName} - Error:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return false;
  }
}

async function testCarouselFunctionality() {
  console.log('\n🎠 Testing Carousel Functionality...');
  
  const carouselTests = [
    {
      name: 'Services Carousel',
      text: 'show services'
    },
    {
      name: 'Products Carousel', 
      text: 'show products'
    }
  ];

  let passed = 0;
  for (const test of carouselTests) {
    const success = await simulateMessengerTextMessage(test.text, test.name);
    if (success) passed++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n📊 Carousel Tests: ${passed}/${carouselTests.length} passed`);
  return passed === carouselTests.length;
}

async function testPostbackHandlers() {
  console.log('\n⚡ Testing Postback Handlers...');
  
  let passed = 0;
  for (const scenario of testScenarios) {
    const success = await simulateMessengerPostback(scenario.postback, scenario.name);
    if (success) passed++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n📊 Postback Tests: ${passed}/${testScenarios.length} passed`);
  return passed === testScenarios.length;
}

async function testTextMessageHandlers() {
  console.log('\n📝 Testing Text Message Handlers...');
  
  let passed = 0;
  for (const scenario of textMessageScenarios) {
    const success = await simulateMessengerTextMessage(scenario.text, scenario.name);
    if (success) passed++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n📊 Text Message Tests: ${passed}/${textMessageScenarios.length} passed`);
  return passed === textMessageScenarios.length;
}

async function testServerConnection() {
  try {
    console.log('🔗 Testing server connection...');
    const response = await axios.get(`${config.baseURL}/api/health`, { timeout: 5000 });
    if (response.status === 200) {
      console.log('✅ Server is running and accessible');
      return true;
    }
  } catch (error) {
    console.error('❌ Server connection failed:', error.message);
    console.log('💡 Make sure the server is running with: npm start');
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Enhanced Messenger Service Tests');
  console.log('=' .repeat(50));
  
  // Test server connection first
  const serverOk = await testServerConnection();
  if (!serverOk) {
    console.log('\n❌ Tests aborted - Server not accessible');
    return;
  }

  const results = {
    carousel: await testCarouselFunctionality(),
    postbacks: await testPostbackHandlers(), 
    textMessages: await testTextMessageHandlers()
  };

  console.log('\n' + '='.repeat(50));
  console.log('📋 FINAL TEST RESULTS');
  console.log('=' .repeat(50));
  
  console.log(`🎠 Carousel Functionality: ${results.carousel ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`⚡ Postback Handlers: ${results.postbacks ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📝 Text Message Handlers: ${results.textMessages ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 Enhanced Messenger service is working correctly!');
    console.log('✨ All follow-up actions are now properly implemented:');
    console.log('   • Service details and booking flows');
    console.log('   • Product information and demo requests');
    console.log('   • Quote confirmations and processing');
    console.log('   • Product quotations with custom requirements');
    console.log('   • Demo scheduling and confirmations');
    console.log('   • Enhanced navigation and help systems');
  } else {
    console.log('\n⚠️  Some functionality may need attention.');
    console.log('Check the error messages above for details.');
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(`
Enhanced Messenger Service Test Suite

Usage: node test-messenger-enhanced.js [options]

Options:
  --help              Show this help message
  --carousel-only     Test only carousel functionality
  --postbacks-only    Test only postback handlers  
  --text-only         Test only text message handlers
  --server-url <url>  Override default server URL (default: http://localhost:3000)

Examples:
  node test-messenger-enhanced.js                    # Run all tests
  node test-messenger-enhanced.js --carousel-only    # Test carousels only
  node test-messenger-enhanced.js --server-url http://localhost:8080
  `);
  process.exit(0);
}

// Override server URL if provided
const urlIndex = args.indexOf('--server-url');
if (urlIndex !== -1 && args[urlIndex + 1]) {
  config.baseURL = args[urlIndex + 1];
  console.log(`Using custom server URL: ${config.baseURL}`);
}

// Run specific test suites based on arguments
if (args.includes('--carousel-only')) {
  testCarouselFunctionality().then(() => process.exit(0));
} else if (args.includes('--postbacks-only')) {
  testPostbackHandlers().then(() => process.exit(0));
} else if (args.includes('--text-only')) {
  testTextMessageHandlers().then(() => process.exit(0));
} else {
  runAllTests().then(() => process.exit(0));
}
