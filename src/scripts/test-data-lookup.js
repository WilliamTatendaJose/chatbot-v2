// Test just the data lookup functionality without API calls
import { techrehubServices, techrehubProducts } from './src/config/index.js';

function testServiceLookups() {
    console.log('🔍 Testing Service/Product Data Lookups');
    console.log('==================================================');
    
    // Test service IDs that are used in carousel buttons
    const testServiceIds = ['computer-repair', 'network-setup', 'data-recovery', 'virus-removal', 'system-upgrade', 'chatbot-development'];
    
    console.log('🧪 Testing Service Lookups:');
    testServiceIds.forEach(serviceId => {
        const service = techrehubServices.find(s => s.id === serviceId);
        if (service) {
            console.log(`✅ ${serviceId} -> Found: "${service.name}"`);
        } else {
            console.log(`❌ ${serviceId} -> NOT FOUND`);
        }
    });
      console.log('\n🧪 Testing Product Lookups:');
    const testProductIds = ['customer-service-ai', 'multi-channel-platform', 'analytics-dashboard'];
    
    testProductIds.forEach(productId => {
        const product = techrehubProducts.find(p => p.id === productId);
        if (product) {
            console.log(`✅ ${productId} -> Found: "${product.name}"`);
        } else {
            console.log(`❌ ${productId} -> NOT FOUND`);
        }
    });
    
    console.log('\n==================================================');
    console.log('🎯 Data Lookup Test Summary:');
    
    const foundServices = testServiceIds.filter(id => techrehubServices.find(s => s.id === id)).length;
    const foundProducts = testProductIds.filter(id => techrehubProducts.find(p => p.id === id)).length;
    
    console.log(`📊 Services: ${foundServices}/${testServiceIds.length} found`);
    console.log(`📊 Products: ${foundProducts}/${testProductIds.length} found`);
    
    if (foundServices === testServiceIds.length && foundProducts === testProductIds.length) {
        console.log('✅ All data lookups successful! Carousel fix is working.');
    } else {
        console.log('❌ Some data lookups failed. Check config data.');
    }
}

testServiceLookups();
