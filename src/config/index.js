import dotenv from 'dotenv';

// Configure dotenv
dotenv.config();

export const port = process.env.PORT || 3001;

export const mongodb = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/techrehub-chatbot'
};

export const whatsapp = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
  appSecret: process.env.WHATSAPP_APP_SECRET
};

export const messenger = {
  pageAccessToken: process.env.MESSENGER_PAGE_ACCESS_TOKEN,
  verifyToken: process.env.MESSENGER_VERIFY_TOKEN,
  appSecret: process.env.MESSENGER_APP_SECRET
};

export const payment = {
  paynowIntegrationId: process.env.PAYNOW_INTEGRATION_ID,
  paynowIntegrationKey: process.env.PAYNOW_INTEGRATION_KEY,
  returnUrl: process.env.PAYNOW_RETURN_URL || 'http://localhost:3000/api/payments/return',
  resultUrl: process.env.PAYNOW_RESULT_URL || 'http://localhost:3000/api/payments/callback',
  mode: process.env.PAYMENT_MODE || 'test'
};

export const techrehubServices = [
  {
    id: 'computer-repair',
    name: 'Computer Repair',
    description: 'Hardware and software repair for laptops and desktops',
    price: 'From $50',
    duration: '2-4 hours',
    category: 'repair',
    features: [
      'Hardware diagnosis and repair',
      'Software troubleshooting',
      'Performance optimization',
      '30-day warranty'
    ],
    image: 'https://example.com/computer-repair.jpg'
  },
  {
    id: 'network-setup',
    name: 'Network Setup & Troubleshooting',
    description: 'Installation and configuration of home and office networks',
    price: 'From $80',
    duration: '1-3 hours',
    category: 'networking',
    features: [
      'WiFi setup and optimization',
      'Router configuration',
      'Network security setup',
      'Speed optimization'
    ],
    image: 'https://example.com/network-setup.jpg'
  },
  {
    id: 'data-recovery',
    name: 'Data Recovery',
    description: 'Recovery of lost data from various storage devices',
    price: 'From $100',
    duration: '4-24 hours',
    category: 'recovery',
    features: [
      'Hard drive recovery',
      'SSD data recovery',
      'USB/SD card recovery',
      'No recovery, no fee'
    ],
    image: 'https://example.com/data-recovery.jpg'
  },
  {
    id: 'virus-removal',
    name: 'Virus & Malware Removal',
    description: 'Detection and removal of viruses, malware, and other threats',
    price: 'From $60',
    duration: '1-2 hours',
    category: 'security',
    features: [
      'Complete system scan',
      'Malware removal',
      'Security software installation',
      'Prevention tips'
    ],
    image: 'https://example.com/virus-removal.jpg'
  },
  {
    id: 'system-upgrade',
    name: 'System Upgrades',
    description: 'Hardware and software upgrades to improve performance',
    price: 'Custom quote',
    duration: '2-6 hours',
    category: 'upgrade',
    features: [
      'RAM upgrades',
      'SSD installation',
      'Graphics card upgrades',
      'OS upgrades'
    ],
    image: 'https://example.com/system-upgrade.jpg'
  },
  {
    id: 'chatbot-development',
    name: 'Custom Chatbot Development',
    description: 'AI-powered chatbots for businesses',
    price: 'From $999',
    duration: '1-2 weeks',
    category: 'development',
    features: [
      'Multi-platform support',
      'NLP integration',
      'Custom workflows',
      'Analytics dashboard'
    ],
    image: 'https://example.com/chatbot-dev.jpg'
  }
];

export const techrehubProducts = [
  {
    id: 'customer-service-ai',
    name: 'Customer Service AI',
    description: '24/7 AI-powered customer support solution',
    price: '$799/month',
    category: 'software',
    features: [
      'Multi-language support',
      'Integration with existing systems',
      'Real-time analytics',
      '99.9% uptime guarantee'
    ],
    image: 'https://example.com/customer-ai.jpg'
  },
  {
    id: 'multi-channel-platform',
    name: 'Multi-Channel Chat Platform',
    description: 'Unified messaging across all platforms',
    price: '$599/month',
    category: 'software',
    features: [
      'WhatsApp, Messenger, Telegram',
      'Unified inbox',
      'Team collaboration',
      'Advanced routing'
    ],
    image: 'https://example.com/multi-channel.jpg'
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Comprehensive chat analytics and insights',
    price: '$299/month',
    category: 'software',
    features: [
      'Real-time metrics',
      'Customer journey tracking',
      'Performance reports',
      'Custom dashboards'
    ],
    image: 'https://example.com/analytics.jpg'
  }
];

export const adminPhoneNumbers = process.env.ADMIN_PHONE_NUMBERS ? process.env.ADMIN_PHONE_NUMBERS.split(',') : [];