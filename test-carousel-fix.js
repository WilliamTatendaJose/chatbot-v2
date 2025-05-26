// Direct test for carousel fix without webhook authentication
import messengerService from './src/services/messenger.service.js';

async function testCarouselFix() {
    console.log('🔧 Testing Carousel Fix (Direct Method Calls)');
    console.log('==================================================');
      try {
        // Test 1: Service Details Lookup
        console.log('🧪 Test 1: Service Details Lookup');
        console.log('Testing serviceId: computer-repair');
        
        try {
            // This should not throw an error now that we fixed the config references
            const result = await messengerService.sendServiceDetails('test-recipient', 'computer-repair');
            console.log('✅ Service details lookup successful');
        } catch (error) {
            console.log('❌ Service details lookup failed:', error.message);
        }
        
        // Test 2: Booking Request
        console.log('\n🧪 Test 2: Booking Request');
        console.log('Testing serviceId: network-setup');
        
        try {
            const result = await messengerService.handleBookingRequest('test-recipient', 'network-setup');
            console.log('✅ Booking request handling successful');
        } catch (error) {
            console.log('❌ Booking request handling failed:', error.message);
        }
        
        // Test 3: Quote Request
        console.log('\n🧪 Test 3: Quote Request');
        console.log('Testing serviceId: data-recovery');
        
        try {
            const result = await messengerService.requestQuotation('test-recipient', 'data-recovery');
            console.log('✅ Quote request handling successful');
        } catch (error) {
            console.log('❌ Quote request handling failed:', error.message);
        }
        
        // Test 4: Product Details
        console.log('\n🧪 Test 4: Product Details');
        console.log('Testing productId: crm-system');
        
        try {
            const result = await messengerService.sendProductDetails('test-recipient', 'crm-system');
            console.log('✅ Product details lookup successful');
        } catch (error) {
            console.log('❌ Product details lookup failed:', error.message);
        }
        
        // Test 5: Postback Processing
        console.log('\n🧪 Test 5: Postback Processing');
        console.log('Testing postback: SERVICE_DETAILS_computer-repair');
        
        try {
            const result = await messengerService.handlePostback('test-recipient', 'SERVICE_DETAILS_computer-repair');
            console.log('✅ Postback processing successful');
        } catch (error) {
            console.log('❌ Postback processing failed:', error.message);
        }
        
        console.log('\n==================================================');
        console.log('🎯 All direct method tests completed!');
        console.log('If all tests show ✅, the carousel fix is working correctly.');
        
    } catch (error) {
        console.error('💥 Test setup failed:', error);
    }
}

// Run the test
testCarouselFix().catch(console.error);
