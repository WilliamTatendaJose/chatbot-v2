/**
 * Test script for Enhanced Admin Dashboard
 * Tests all new interactive features and real-time capabilities
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Test data generator
function generateTestData() {
    return {
        stats: {
            totalMessages: Math.floor(Math.random() * 1000) + 500,
            pendingBookings: Math.floor(Math.random() * 20) + 5,
            activeQuotes: Math.floor(Math.random() * 15) + 8,
            avgResponseTime: (Math.random() * 3 + 0.5).toFixed(1),
            dailyMessages: Array.from({ length: 7 }, () => Math.floor(Math.random() * 100) + 20),
            weeklyBookings: Array.from({ length: 4 }, () => Math.floor(Math.random() * 30) + 10),
            monthlyRevenue: Array.from({ length: 7 }, () => Math.floor(Math.random() * 10000) + 5000)
        },
        bookings: [
            {
                id: 'BK' + Date.now(),
                customerName: 'John Smith',
                platform: 'whatsapp',
                service: 'Web Development',
                date: new Date().toISOString().split('T')[0],
                time: '10:00 AM',
                status: 'pending',
                requirements: 'E-commerce website with payment integration'
            },
            {
                id: 'BK' + (Date.now() + 1),
                customerName: 'Sarah Johnson',
                platform: 'messenger',
                service: 'Mobile App Development',
                date: new Date().toISOString().split('T')[0],
                time: '2:00 PM',
                status: 'confirmed',
                requirements: 'iOS and Android fitness app'
            }
        ],
        quotes: [
            {
                id: 'QT' + Date.now(),
                customerName: 'Emma Davis',
                platform: 'whatsapp',
                productName: 'CRM System',
                requirements: 'Customer management system',
                estimatedPrice: 2500,
                status: 'pending'
            },
            {
                id: 'QT' + (Date.now() + 1),
                customerName: 'Mike Wilson',
                platform: 'messenger',
                productName: 'E-commerce Platform',
                requirements: 'Multi-vendor marketplace',
                estimatedPrice: 4200,
                status: 'quoted'
            }
        ],
        notifications: [
            {
                id: 'N' + Date.now(),
                type: 'booking',
                title: 'New Booking Request',
                message: 'John Smith requested a consultation for Web Development',
                timestamp: new Date(),
                read: false
            },
            {
                id: 'N' + (Date.now() + 1),
                type: 'quote',
                title: 'Quote Response Needed',
                message: 'Emma Davis is waiting for CRM System quote',
                timestamp: new Date(),
                read: false
            }
        ]
    };
}

// Test API endpoints
app.get('/api/admin/stats', (req, res) => {
    const data = generateTestData();
    console.log('📊 Stats API called - returning test data');
    res.json(data.stats);
});

app.get('/api/admin/bookings', (req, res) => {
    const data = generateTestData();
    console.log('📅 Bookings API called - returning test data');
    res.json(data.bookings);
});

app.get('/api/admin/quotes', (req, res) => {
    const data = generateTestData();
    console.log('💰 Quotes API called - returning test data');
    res.json(data.quotes);
});

app.get('/api/admin/notifications', (req, res) => {
    const data = generateTestData();
    console.log('🔔 Notifications API called - returning test data');
    res.json(data.notifications);
});

app.post('/api/admin/bookings/:id/confirm', (req, res) => {
    console.log(`✅ Booking ${req.params.id} confirmed`);
    res.json({ success: true, message: 'Booking confirmed successfully' });
});

app.post('/api/admin/bookings/:id/decline', (req, res) => {
    console.log(`❌ Booking ${req.params.id} declined`);
    res.json({ success: true, message: 'Booking declined' });
});

app.post('/api/admin/quotes/:id/send', (req, res) => {
    console.log(`📧 Quote ${req.params.id} sent`);
    res.json({ success: true, message: 'Quote sent successfully' });
});

app.post('/api/admin/broadcast', (req, res) => {
    console.log('📢 Broadcast message sent:', req.body);
    res.json({ 
        success: true, 
        message: 'Broadcast sent successfully',
        recipients: Math.floor(Math.random() * 100) + 50
    });
});

app.get('/api/admin/configuration', (req, res) => {
    console.log('⚙️ Configuration API called');
    res.json({
        whatsapp: {
            token: '***1234',
            phoneNumberId: '***5678',
            enabled: true
        },
        messenger: {
            pageAccessToken: '***abcd',
            appSecret: '***efgh',
            enabled: true
        },
        general: {
            businessName: 'TechSolutions Pro',
            businessHours: '9:00 AM - 6:00 PM',
            autoResponse: true
        }
    });
});

app.get('/api/admin/analytics/:type', (req, res) => {
    const { type } = req.params;
    console.log(`📈 Analytics API called for type: ${type}`);
    
    let data = {};
    switch (type) {
        case 'messages':
            data = {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Messages',
                    data: [45, 52, 38, 65, 41, 48, 72],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)'
                }]
            };
            break;
        case 'bookings':
            data = {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Bookings',
                    data: [12, 18, 15, 22],
                    backgroundColor: '#28a745'
                }]
            };
            break;
        default:
            data = { error: 'Invalid analytics type' };
    }
    
    res.json(data);
});

// Serve enhanced dashboard
app.get('/admin-enhanced', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin-enhanced.html'));
});

app.get('/', (req, res) => {
    res.send(`
        <h1>Enhanced Admin Dashboard Test Server</h1>
        <p>🚀 Server is running successfully!</p>
        <h2>Test Links:</h2>
        <ul>
            <li><a href="/admin-enhanced">📊 Enhanced Admin Dashboard</a></li>
            <li><a href="/api/admin/stats">📈 Test Stats API</a></li>
            <li><a href="/api/admin/bookings">📅 Test Bookings API</a></li>
            <li><a href="/api/admin/quotes">💰 Test Quotes API</a></li>
            <li><a href="/api/admin/notifications">🔔 Test Notifications API</a></li>
        </ul>
        <h2>Features to Test:</h2>
        <ul>
            <li>✅ Real-time dashboard statistics</li>
            <li>✅ Interactive service and product carousels</li>
            <li>✅ Booking confirmation/decline actions</li>
            <li>✅ Quote management system</li>
            <li>✅ Live notifications</li>
            <li>✅ Analytics charts</li>
            <li>✅ Configuration management</li>
            <li>✅ Broadcast messaging</li>
        </ul>
    `);
});

// Error handling
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`
🚀 Enhanced Admin Dashboard Test Server Started!
📍 Server URL: http://localhost:${PORT}
📊 Dashboard URL: http://localhost:${PORT}/admin-enhanced

🧪 Test Features:
- Real-time statistics updates
- Interactive messaging elements  
- Booking and quote management
- Live notifications system
- Analytics and reporting
- Configuration management
- Broadcast messaging capabilities

💡 To test the enhanced features:
1. Open http://localhost:${PORT}/admin-enhanced
2. Navigate through different sections
3. Test interactive elements like confirmations
4. Check real-time updates and notifications
5. Preview service/product carousels
6. Test the analytics charts

Press Ctrl+C to stop the server
    `);
});

export default app;
