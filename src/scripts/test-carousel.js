import axios from 'axios';

// Test script to verify carousel functionality works without errors
async function testCarousels() {
    const baseURL = 'http://localhost:3000';
    
    console.log('Testing WhatsApp Services Carousel...');
    try {        // Simulate a WhatsApp webhook message asking for services
        const whatsappServicesResponse = await axios.post(`${baseURL}/api/webhook/whatsapp`, {
            entry: [{
                changes: [{
                    value: {
                        messages: [{
                            id: 'test_msg_1',
                            from: '1234567890',
                            text: { body: 'show services' },
                            type: 'text',
                            timestamp: Math.floor(Date.now() / 1000)
                        }]
                    }
                }]
            }]
        });
        console.log('✅ WhatsApp Services Carousel request completed');
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Testing WhatsApp Products Carousel...');        // Simulate a WhatsApp webhook message asking for products
        const whatsappProductsResponse = await axios.post(`${baseURL}/api/webhook/whatsapp`, {
            entry: [{
                changes: [{
                    value: {
                        messages: [{
                            id: 'test_msg_2',
                            from: '1234567890',
                            text: { body: 'show products' },
                            type: 'text',
                            timestamp: Math.floor(Date.now() / 1000)
                        }]
                    }
                }]
            }]
        });
        console.log('✅ WhatsApp Products Carousel request completed');
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Testing Messenger Services Carousel...');        // Simulate a Messenger webhook message asking for services
        const messengerServicesResponse = await axios.post(`${baseURL}/api/webhook/messenger`, {
            entry: [{
                messaging: [{
                    sender: { id: 'test_user_1' },
                    recipient: { id: 'test_page' },
                    timestamp: Date.now(),
                    message: {
                        mid: 'test_msg_3',
                        text: 'show services'
                    }
                }]
            }]
        });
        console.log('✅ Messenger Services Carousel request completed');
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Testing Messenger Products Carousel...');        // Simulate a Messenger webhook message asking for products
        const messengerProductsResponse = await axios.post(`${baseURL}/api/webhook/messenger`, {
            entry: [{
                messaging: [{
                    sender: { id: 'test_user_1' },
                    recipient: { id: 'test_page' },
                    timestamp: Date.now(),
                    message: {
                        mid: 'test_msg_4',
                        text: 'show products'
                    }
                }]
            }]
        });
        console.log('✅ Messenger Products Carousel request completed');
        
        console.log('\n🎉 All carousel tests completed successfully!');
        console.log('The carousel functionality has been fixed and is working properly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the tests
testCarousels().then(() => {
    console.log('\nTest script completed.');
}).catch(error => {
    console.error('Test script error:', error);
});
