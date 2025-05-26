/**
 * Comprehensive End-to-End Test for Enhanced Chatbot System
 * Tests the complete workflow from message processing to admin dashboard
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

class ChatbotE2ETest {
    constructor() {
        this.testResults = [];
        this.testCount = 0;
        this.passedTests = 0;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m', // Green
            error: '\x1b[31m',   // Red
            warning: '\x1b[33m', // Yellow
            reset: '\x1b[0m'     // Reset
        };
        
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    async runTest(testName, testFunction) {
        this.testCount++;
        this.log(`\n🧪 Running Test ${this.testCount}: ${testName}`, 'info');
        
        try {
            await testFunction();
            this.passedTests++;
            this.testResults.push({ name: testName, status: 'PASSED' });
            this.log(`✅ Test ${this.testCount} PASSED: ${testName}`, 'success');
        } catch (error) {
            this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
            this.log(`❌ Test ${this.testCount} FAILED: ${testName} - ${error.message}`, 'error');
        }
    }

    async testApiEndpoints() {
        // Test all enhanced dashboard API endpoints
        const endpoints = [
            { path: '/api/admin/stats', method: 'GET', expectedFields: ['totalMessages', 'pendingBookings'] },
            { path: '/api/admin/notifications', method: 'GET', expectedType: 'array' },
            { path: '/api/admin/configuration', method: 'GET', expectedFields: ['whatsapp', 'messenger'] },
            { path: '/api/admin/analytics', method: 'GET', expectedFields: ['dailyMessages', 'weeklyBookings'] },
            { path: '/api/admin/nlp/training', method: 'GET', expectedFields: ['intents'] }
        ];

        for (const endpoint of endpoints) {
            const response = await fetch(`${BASE_URL}${endpoint.path}`);
            if (!response.ok) {
                throw new Error(`${endpoint.path} returned ${response.status}`);
            }

            const data = await response.json();
            
            if (endpoint.expectedType === 'array' && !Array.isArray(data)) {
                throw new Error(`${endpoint.path} should return an array`);
            }

            if (endpoint.expectedFields) {
                for (const field of endpoint.expectedFields) {
                    if (!(field in data)) {
                        throw new Error(`${endpoint.path} missing field: ${field}`);
                    }
                }
            }
        }
    }

    async testDashboardPages() {
        // Test dashboard page accessibility
        const dashboardResponse = await fetch(`${BASE_URL}/admin-enhanced`);
        if (!dashboardResponse.ok) {
            throw new Error(`Enhanced dashboard returned ${dashboardResponse.status}`);
        }

        const dashboardHtml = await dashboardResponse.text();
        const requiredElements = [
            'Enhanced Admin Dashboard',
            'AdminDashboard',
            'chart-container',
            'notifications-container'
        ];

        for (const element of requiredElements) {
            if (!dashboardHtml.includes(element)) {
                throw new Error(`Dashboard missing required element: ${element}`);
            }
        }
    }

    async testInteractiveBooking() {
        // Test booking confirmation workflow
        const bookingData = {
            customerName: 'Test Customer',
            service: 'Web Development',
            date: '2025-05-25',
            time: '10:00 AM',
            requirements: 'E-commerce website with payment integration'
        };

        const response = await fetch(`${BASE_URL}/api/admin/bookings/TEST001/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });

        if (!response.ok) {
            throw new Error(`Booking confirmation failed: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error('Booking confirmation returned unsuccessful result');
        }
    }

    async testQuoteManagement() {
        // Test quote sending workflow
        const quoteData = {
            quotationId: 'Q001',
            amount: 2500,
            description: 'E-commerce website development',
            validUntil: '2025-06-25'
        };

        const response = await fetch(`${BASE_URL}/api/admin/quotes/Q001/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quoteData)
        });

        if (!response.ok) {
            throw new Error(`Quote sending failed: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error('Quote sending returned unsuccessful result');
        }
    }

    async testConfigurationUpdate() {
        // Test configuration management
        const configUpdates = {
            general: {
                businessHours: '9:00 AM - 5:00 PM',
                timezone: 'Africa/Harare'
            }
        };

        const response = await fetch(`${BASE_URL}/api/admin/configuration`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configUpdates)
        });

        if (!response.ok) {
            throw new Error(`Configuration update failed: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error('Configuration update returned unsuccessful result');
        }
    }

    async testNLPTraining() {
        // Test NLP training data management
        const trainingData = {
            intents: [
                {
                    tag: 'test_greeting',
                    patterns: ['hello test', 'hi test'],
                    responses: ['Hello! How can I help you today?']
                }
            ]
        };

        const response = await fetch(`${BASE_URL}/api/admin/nlp/training`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(trainingData)
        });

        if (!response.ok) {
            throw new Error(`NLP training update failed: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error('NLP training update returned unsuccessful result');
        }
    }

    async testBroadcastMessaging() {
        // Test broadcast messaging functionality
        const broadcastData = {
            message: 'System maintenance scheduled for tonight.',
            platforms: ['whatsapp', 'messenger'],
            audience: 'all'
        };

        const response = await fetch(`${BASE_URL}/api/admin/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(broadcastData)
        });

        if (!response.ok) {
            throw new Error(`Broadcast messaging failed: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error('Broadcast messaging returned unsuccessful result');
        }
    }

    async testRealTimeNotifications() {
        // Test notification system
        const notificationsResponse = await fetch(`${BASE_URL}/api/admin/notifications`);
        const notifications = await notificationsResponse.json();

        if (!Array.isArray(notifications)) {
            throw new Error('Notifications should be an array');
        }

        // Test marking notification as read
        if (notifications.length > 0) {
            const notificationId = notifications[0].id;
            const markReadResponse = await fetch(`${BASE_URL}/api/admin/notifications/${notificationId}/read`, {
                method: 'POST'
            });

            if (!markReadResponse.ok) {
                throw new Error(`Mark notification as read failed: ${markReadResponse.status}`);
            }
        }
    }

    async testErrorHandling() {
        // Test that invalid requests are handled gracefully
        const invalidEndpoints = [
            '/api/admin/invalid-endpoint',
            '/api/admin/bookings/invalid-id/confirm',
            '/api/admin/quotes/invalid-id/send'
        ];

        for (const endpoint of invalidEndpoints) {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            // Should return 404 or appropriate error, not crash
            if (response.status === 200) {
                throw new Error(`Invalid endpoint ${endpoint} should not return 200`);
            }
        }
    }

    async testPerformance() {
        // Test API response times
        const startTime = Date.now();
        const promises = [];

        // Make 5 concurrent requests to stats endpoint
        for (let i = 0; i < 5; i++) {
            promises.push(fetch(`${BASE_URL}/api/admin/stats`));
        }

        const responses = await Promise.all(promises);
        const endTime = Date.now();
        const totalTime = endTime - startTime;

        if (totalTime > 5000) { // 5 seconds
            throw new Error(`Performance test failed: ${totalTime}ms for 5 concurrent requests`);
        }

        // Verify all responses are successful
        for (const response of responses) {
            if (!response.ok) {
                throw new Error(`Performance test: response failed with ${response.status}`);
            }
        }
    }

    async runAllTests() {
        this.log('🚀 Starting Enhanced Chatbot System E2E Tests', 'info');
        this.log('================================================', 'info');

        await this.runTest('API Endpoints Test', () => this.testApiEndpoints());
        await this.runTest('Dashboard Pages Test', () => this.testDashboardPages());
        await this.runTest('Interactive Booking Test', () => this.testInteractiveBooking());
        await this.runTest('Quote Management Test', () => this.testQuoteManagement());
        await this.runTest('Configuration Update Test', () => this.testConfigurationUpdate());
        await this.runTest('NLP Training Test', () => this.testNLPTraining());
        await this.runTest('Broadcast Messaging Test', () => this.testBroadcastMessaging());
        await this.runTest('Real-time Notifications Test', () => this.testRealTimeNotifications());
        await this.runTest('Error Handling Test', () => this.testErrorHandling());
        await this.runTest('Performance Test', () => this.testPerformance());

        this.printSummary();
    }

    printSummary() {
        this.log('\n📊 TEST SUMMARY', 'info');
        this.log('===============', 'info');
        this.log(`Total Tests: ${this.testCount}`, 'info');
        this.log(`Passed: ${this.passedTests}`, 'success');
        this.log(`Failed: ${this.testCount - this.passedTests}`, this.passedTests === this.testCount ? 'success' : 'error');
        this.log(`Success Rate: ${((this.passedTests / this.testCount) * 100).toFixed(1)}%`, 
                 this.passedTests === this.testCount ? 'success' : 'warning');

        if (this.passedTests === this.testCount) {
            this.log('\n🎉 ALL TESTS PASSED! Enhanced chatbot system is working correctly.', 'success');
        } else {
            this.log('\n⚠️  Some tests failed. Please check the detailed results above.', 'warning');
        }

        this.log('\n📋 Detailed Results:', 'info');
        this.testResults.forEach((result, index) => {
            const status = result.status === 'PASSED' ? '✅' : '❌';
            this.log(`${index + 1}. ${status} ${result.name}`, result.status === 'PASSED' ? 'success' : 'error');
            if (result.error) {
                this.log(`   Error: ${result.error}`, 'error');
            }
        });
    }
}

// Run the tests
async function main() {
    const tester = new ChatbotE2ETest();
    
    try {
        await tester.runAllTests();
    } catch (error) {
        console.error('❌ Test runner failed:', error.message);
        process.exit(1);
    }
}

// Check if this is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default ChatbotE2ETest;
