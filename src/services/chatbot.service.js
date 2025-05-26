// filepath: c:\Users\William Jose\source\repos\chatbot\src\services\chatbot.service.js
import { NlpManager } from 'node-nlp';
import { info, error as _error } from '../utils/logger.js';
import conversationState from './conversation-state.service.js';
import Service from '../models/service.model.js';
import Product from '../models/product.model.js';
import ChatSession from '../models/chat-session.model.js';
import Booking from '../models/booking.model.js';
import Quotation from '../models/quotation.model.js';
import Payment from '../models/payment.model.js';
import paymentTrackingService from './payment-tracking.service.js';

class ChatbotService {
  constructor() {
    this.nlp = new NlpManager({ languages: ['en'] });
    this.initializeNLP();
    info('Chatbot service initialized');
  }

  async initializeNLP() {
    // Add intents and training data
    await this.addGreetingIntents();
    await this.addServiceIntents();
    await this.addBookingIntents();
    await this.addQuotationIntents();
    await this.addPaymentIntents();
    await this.addHumanTransferIntents();
    await this.addProductIntents();
    await this.addPortfolioIntents();
    await this.addCustomChatbotIntents();
    await this.addPromotionIntents();
    await this.addTestimonialIntents();
    await this.addNewsletterIntents();
    await this.addLeadGenerationIntents();
    await this.addFallbackIntents();

    // Train the NLP model
    await this.nlp.train();
    info('NLP model trained successfully');
  }

  addGreetingIntents() {
    // Greeting intent
    this.nlp.addDocument('en', 'hello', 'greeting');
    this.nlp.addDocument('en', 'hi', 'greeting');
    this.nlp.addDocument('en', 'hey', 'greeting');
    this.nlp.addDocument('en', 'good morning', 'greeting');
    this.nlp.addDocument('en', 'good afternoon', 'greeting');
    this.nlp.addDocument('en', 'good evening', 'greeting');
    this.nlp.addDocument('en', "what's up", 'greeting');

    this.nlp.addAnswer('en', 'greeting', 'Hello! Welcome to TechRehub. How can I assist you today?');
    this.nlp.addAnswer('en', 'greeting', 'Hi there! Welcome to TechRehub. How may I help you?');
    this.nlp.addAnswer('en', 'greeting', "Greetings! I'm TechRehub's virtual assistant. What can I do for you today?");
  }

  async addServiceIntents() {
    // Get all active services from database
    const services = await Service.find({ isActive: true });

    // Service list intent
    this.nlp.addDocument('en', 'what services do you offer', 'service.list');
    this.nlp.addDocument('en', 'show me your services', 'service.list');
    this.nlp.addDocument('en', 'services', 'service.list');
    this.nlp.addDocument('en', 'what can you fix', 'service.list');
    this.nlp.addDocument('en', 'list of services', 'service.list');
    this.nlp.addDocument('en', 'what do you do', 'service.list');

    // Add service-specific intents
    services.forEach(service => {
      const intentName = `service.info.${service._id}`;

      // Add variations using service keywords
      if (service.keywords && service.keywords.length > 0) {
        service.keywords.forEach(keyword => {
          this.nlp.addDocument('en', `tell me about ${keyword}`, intentName);
          this.nlp.addDocument('en', `what is ${keyword}`, intentName);
          this.nlp.addDocument('en', `${keyword} service`, intentName);
        });
      }

      // Add basic service name variations
      this.nlp.addDocument('en', `tell me about ${service.name}`, intentName);
      this.nlp.addDocument('en', `what is ${service.name}`, intentName);
      this.nlp.addDocument('en', `${service.name} service`, intentName);

      // Add service response
      this.nlp.addAnswer('en', intentName,
        `${service.name} - ${service.description}\n` +
        `Category: ${service.category}\n` +
        `Price: $${service.price}`
      );
    });

    // Add general service list response
    this.nlp.addAnswer('en', 'service.list', 'SERVICE_LIST');
  }

  addBookingIntents() {
    // Booking intent
    this.nlp.addDocument('en', 'book a service', 'booking.start');
    this.nlp.addDocument('en', 'make an appointment', 'booking.start');
    this.nlp.addDocument('en', 'schedule a repair', 'booking.start');
    this.nlp.addDocument('en', 'book', 'booking.start');
    this.nlp.addDocument('en', 'need to book', 'booking.start');
    this.nlp.addDocument('en', 'want to schedule', 'booking.start');

    this.nlp.addAnswer('en', 'booking.start', 'BOOKING_REQUEST');
  }

  addQuotationIntents() {
    // Quotation intent
    this.nlp.addDocument('en', 'get a quote', 'quotation.start');
    this.nlp.addDocument('en', 'request quote', 'quotation.start');
    this.nlp.addDocument('en', 'how much does it cost', 'quotation.start');
    this.nlp.addDocument('en', 'pricing', 'quotation.start');
    this.nlp.addDocument('en', 'price', 'quotation.start');
    this.nlp.addDocument('en', 'quotation', 'quotation.start');

    this.nlp.addAnswer('en', 'quotation.start', 'QUOTATION_REQUEST');
  }

  addPaymentIntents() {
    // Payment intent
    this.nlp.addDocument('en', 'make payment', 'payment.initiate');
    this.nlp.addDocument('en', 'pay for service', 'payment.initiate');
    this.nlp.addDocument('en', 'pay now', 'payment.initiate');
    this.nlp.addDocument('en', 'i want to pay', 'payment.initiate');
    this.nlp.addDocument('en', 'payment methods', 'payment.initiate');
    this.nlp.addDocument('en', 'how to pay', 'payment.initiate');
    this.nlp.addDocument('en', 'pay for booking', 'payment.initiate');
    this.nlp.addDocument('en', 'pay for quotation', 'payment.initiate');
    this.nlp.addDocument('en', 'payment options', 'payment.initiate');

    this.nlp.addAnswer('en', 'payment.initiate', 'PAYMENT_INITIATE');

    // Payment status intent
    this.nlp.addDocument('en', 'payment status', 'payment.status');
    this.nlp.addDocument('en', 'check my payment', 'payment.status');
    this.nlp.addDocument('en', 'is my payment complete', 'payment.status');
    this.nlp.addDocument('en', 'did my payment go through', 'payment.status');
    this.nlp.addDocument('en', 'track payment', 'payment.status');
    this.nlp.addDocument('en', 'check payment status', 'payment.status');

    this.nlp.addAnswer('en', 'payment.status', 'PAYMENT_STATUS_CHECK');
  }

  addHumanTransferIntents() {
    // Human transfer intent with more variations
    this.nlp.addDocument('en', 'speak to a human', 'transfer.human');
    this.nlp.addDocument('en', 'speak to an agent', 'transfer.human');
    this.nlp.addDocument('en', 'talk to a person', 'transfer.human');
    this.nlp.addDocument('en', 'human assistance', 'transfer.human');
    this.nlp.addDocument('en', 'real person', 'transfer.human');
    this.nlp.addDocument('en', 'agent', 'transfer.human');
    this.nlp.addDocument('en', 'human', 'transfer.human');
    this.nlp.addDocument('en', 'connect to support', 'transfer.human');
    this.nlp.addDocument('en', 'live support', 'transfer.human');
    this.nlp.addDocument('en', 'customer service', 'transfer.human');
    this.nlp.addDocument('en', 'need human help', 'transfer.human');
    this.nlp.addDocument('en', 'representative', 'transfer.human');
    this.nlp.addDocument('en', 'speak with someone', 'transfer.human');
    this.nlp.addDocument('en', 'talk to someone', 'transfer.human');
    this.nlp.addDocument('en', 'live agent', 'transfer.human');
    this.nlp.addDocument('en', 'live chat', 'transfer.human');
    this.nlp.addDocument('en', 'stop bot', 'transfer.human');
    this.nlp.addDocument('en', 'no bot', 'transfer.human');

    this.nlp.addAnswer('en', 'transfer.human', 'HUMAN_TRANSFER');
  }

  async addProductIntents() {
    // Get all active products from database
    const products = await Product.find({ isActive: true });

    // Product list intent
    this.nlp.addDocument('en', 'show me your products', 'product.list');
    this.nlp.addDocument('en', 'what products do you have', 'product.list');
    this.nlp.addDocument('en', 'buy products', 'product.list');
    this.nlp.addDocument('en', 'purchase items', 'product.list');
    this.nlp.addDocument('en', 'shop', 'product.list');

    // Add product-specific intents
    products.forEach(product => {
      const intentName = `product.info.${product._id}`;

      // Add variations using product keywords
      if (product.keywords && product.keywords.length > 0) {
        product.keywords.forEach(keyword => {
          this.nlp.addDocument('en', `tell me about ${keyword}`, intentName);
          this.nlp.addDocument('en', `what is ${keyword}`, intentName);
          this.nlp.addDocument('en', `${keyword} product`, intentName);
        });
      }

      // Add basic product name variations
      this.nlp.addDocument('en', `tell me about ${product.name}`, intentName);
      this.nlp.addDocument('en', `what is ${product.name}`, intentName);
      this.nlp.addDocument('en', `${product.name} product`, intentName);

      // Add product response
      this.nlp.addAnswer('en', intentName,
        `${product.name} - ${product.description}\n` +
        `Category: ${product.category}\n` +
        `Price: $${product.price}\n` +
        `Stock: ${product.stock} units available`
      );
    });

    // Add general product list response
    this.nlp.addAnswer('en', 'product.list', 'PRODUCT_LIST');
  }

  addPortfolioIntents() {
    this.nlp.addDocument('en', 'show your work', 'portfolio.show');
    this.nlp.addDocument('en', 'past projects', 'portfolio.show');
    this.nlp.addDocument('en', 'portfolio', 'portfolio.show');
    this.nlp.addDocument('en', 'previous work', 'portfolio.show');
    this.nlp.addDocument('en', 'case studies', 'portfolio.show');

    this.nlp.addAnswer('en', 'portfolio.show', 'PORTFOLIO_SHOW');

    this.nlp.addDocument('en', 'client testimonials', 'portfolio.testimonials');
    this.nlp.addDocument('en', 'success stories', 'portfolio.testimonials');
    this.nlp.addDocument('en', 'reviews', 'portfolio.testimonials');

    this.nlp.addAnswer('en', 'portfolio.testimonials', 'PORTFOLIO_TESTIMONIALS');
  }

  addCustomChatbotIntents() {
    this.nlp.addDocument('en', 'build a chatbot', 'chatbot.development');
    this.nlp.addDocument('en', 'create a chatbot', 'chatbot.development');
    this.nlp.addDocument('en', 'chatbot development', 'chatbot.development');
    this.nlp.addDocument('en', 'custom chatbot', 'chatbot.development');
    this.nlp.addDocument('en', 'ai chatbot', 'chatbot.development');

    this.nlp.addAnswer('en', 'chatbot.development', 'CHATBOT_DEVELOPMENT');

    this.nlp.addDocument('en', 'chatbot pricing', 'chatbot.pricing');
    this.nlp.addDocument('en', 'how much for a chatbot', 'chatbot.pricing');
    this.nlp.addDocument('en', 'chatbot cost', 'chatbot.pricing');

    this.nlp.addAnswer('en', 'chatbot.pricing', 'CHATBOT_PRICING');
  }

  addPromotionIntents() {
    this.nlp.addDocument('en', 'special offers', 'promotion.offers');
    this.nlp.addDocument('en', 'discounts', 'promotion.offers');
    this.nlp.addDocument('en', 'deals', 'promotion.offers');
    this.nlp.addDocument('en', 'promotions', 'promotion.offers');
    this.nlp.addDocument('en', 'current offers', 'promotion.offers');

    this.nlp.addAnswer('en', 'promotion.offers', 'PROMOTION_OFFERS');

    this.nlp.addDocument('en', 'loyalty program', 'promotion.loyalty');
    this.nlp.addDocument('en', 'rewards', 'promotion.loyalty');
    this.nlp.addDocument('en', 'points', 'promotion.loyalty');

    this.nlp.addAnswer('en', 'promotion.loyalty', 'PROMOTION_LOYALTY');
  }

  addTestimonialIntents() {
    this.nlp.addDocument('en', 'show testimonials', 'testimonials.show');
    this.nlp.addDocument('en', 'customer reviews', 'testimonials.show');
    this.nlp.addDocument('en', 'client feedback', 'testimonials.show');
    this.nlp.addDocument('en', 'what others say', 'testimonials.show');

    this.nlp.addAnswer('en', 'testimonials.show', 'TESTIMONIALS_SHOW');
  }

  addNewsletterIntents() {
    this.nlp.addDocument('en', 'subscribe newsletter', 'newsletter.subscribe');
    this.nlp.addDocument('en', 'join mailing list', 'newsletter.subscribe');
    this.nlp.addDocument('en', 'email updates', 'newsletter.subscribe');
    this.nlp.addDocument('en', 'subscribe', 'newsletter.subscribe');

    this.nlp.addAnswer('en', 'newsletter.subscribe', 'NEWSLETTER_SUBSCRIBE');
  }

  addLeadGenerationIntents() {
    this.nlp.addDocument('en', 'contact sales', 'lead.contact');
    this.nlp.addDocument('en', 'talk to sales', 'lead.contact');
    this.nlp.addDocument('en', 'business inquiry', 'lead.contact');
    this.nlp.addDocument('en', 'sales team', 'lead.contact');

    this.nlp.addAnswer('en', 'lead.contact', 'LEAD_CONTACT');

    this.nlp.addDocument('en', 'free consultation', 'lead.consultation');
    this.nlp.addDocument('en', 'consultation call', 'lead.consultation');
    this.nlp.addDocument('en', 'book consultation', 'lead.consultation');

    this.nlp.addAnswer('en', 'lead.consultation', 'LEAD_CONSULTATION');
  }

  addFallbackIntents() {
    // Fallback intent
    this.nlp.addAnswer('en', 'None', "I'm not sure I understand. Could you rephrase that or ask about our services, bookings, or quotations?");
    this.nlp.addAnswer('en', 'None', "Sorry, I didn't get that. You can ask about TechRehub services, book an appointment, or request a quote.");
    this.nlp.addAnswer('en', 'None', "I'm still learning. You can try asking about our services or type 'speak to a human' to connect with our team.");
  }

  async processMessage(message, data) {
    try {
      const state = conversationState.getState(data.userId);

      // Check if conversation is stale and reset if needed
      if (conversationState.isStale(data.userId)) {
        conversationState.clearState(data.userId);
        return {
          intent: 'session_expired',
          text: "I notice it's been a while since our last interaction. Let me know how I can help you today!"
        };
      }

      // Add message to history
      conversationState.addToHistory(data.userId, message);

      // Handle ongoing conversations based on current stage
      if (state.stage !== 'initial') {
        const stageResponse = await this.handleStageResponse(message, state);
        if (stageResponse) return stageResponse;
      }

      // Handle special command formats
      if (message.toLowerCase().includes('book:')) {
        return this.handleBookingRequest(message, data.userId);
      }

      if (message.toLowerCase().includes('quote:')) {
        return this.handleQuotationRequest(message, data.userId);
      }

      // Use NLP for regular messages
      const result = await this.nlp.process('en', message);
      info(`NLP result: Intent - ${result.intent}, Score - ${result.score}`);

      // Handle result based on intent
      return await this.handleNlpResult(result, data.userId);
    } catch (error) {
      _error(`Error processing message: ${error.message}`);
      return {
        intent: 'error',
        text: "I'm sorry, I encountered an error. Please try again or type 'help' for assistance."
      };
    }
  }

  async handleStageResponse(message, state) {
    switch (state.stage) {
      case 'awaiting_booking_details':
        return await this.handleBookingInput(message, state.userId);

      case 'awaiting_quote_details':
        return await this.handleQuotationInput(message, state.userId);

      case 'awaiting_payment':
        return await this.handlePaymentInput(message, state.userId);

      case 'confirming_booking':
        return await this.handleBookingConfirmation(message, state.userId);

      case 'confirming_quote':
        return await this.handleQuotationConfirmation(message, state.userId);

      default:
        return null;
    }
  }

  async handleBookingRequest(message, userId) {
    const details = message.substring(message.indexOf('Book:') + 5).trim();
    const parts = details.split(',').map(p => p.trim());

    if (parts.length < 4) {
      return {
        intent: 'booking.invalid',
        text: 'Please provide all required booking details in the format:\n' +
          'Book: [Name], [Date], [Time], [Description]'
      };
    }

    const [name, date, time, ...descParts] = parts;
    const description = descParts.join(',').trim();

    // Validate date and time
    const bookingDate = new Date(`${date} ${time}`);
    if (isNaN(bookingDate.getTime())) {
      return {
        intent: 'booking.invalid_datetime',
        text: 'Please provide a valid date and time in the format:\n' +
          'DD/MM/YYYY for date and HH:MM AM/PM for time'
      };
    }

    // Update conversation state
    conversationState.setStage(userId, 'confirming_booking', {
      bookingDetails: { name, date, time, description }
    });

    return {
      intent: 'booking.confirm',
      text: `📅 Please confirm your booking details:\n\n` +
        `Name: ${name}\n` +
        `Date: ${date}\n` +
        `Time: ${time}\n` +
        `Description: ${description}\n\n` +
        `Is this correct? (Yes/No)`,
      requiresConfirmation: true
    };
  }

  async handleQuotationRequest(message, userId) {
    const details = message.substring(message.indexOf('Quote:') + 6).trim();
    const parts = details.split(',').map(p => p.trim());

    if (parts.length < 2) {
      return {
        intent: 'quote.invalid',
        text: 'Please provide all required quotation details in the format:\n' +
          'Quote: [Name], [Requirements], [Timeline], [Budget]'
      };
    }

    const [name, ...reqParts] = parts;
    const requirements = reqParts.join(',').trim();

    // Update conversation state
    conversationState.setStage(userId, 'confirming_quote', {
      quoteDetails: { name, requirements }
    });

    return {
      intent: 'quote.confirm',
      text: `📝 Please confirm your quotation request:\n\n` +
        `Name: ${name}\n` +
        `Requirements: ${requirements}\n\n` +
        `Is this correct? (Yes/No)`,
      requiresConfirmation: true
    };
  }

  async handlePaymentInput(message, userId) {
    const state = conversationState.getState(userId);
    const paymentInfo = state.context.paymentDetails;

    if (!paymentInfo) {
      conversationState.setStage(userId, 'initial');
      return {
        intent: 'payment.error',
        text: 'Sorry, I could not find your payment information. Please start over.'
      };
    }

    // Here you would integrate with your payment service
    // For now, we'll just simulate a successful payment
    conversationState.setStage(userId, 'payment_completed');

    return {
      intent: 'payment.completed',
      text: `✅ Payment completed successfully!\n\n` +
        `Amount: $${paymentInfo.amount}\n` +
        `Service: ${paymentInfo.service}\n` +
        `Reference: ${Date.now()}\n\n` +
        `Thank you for your business! 🙏`
    };
  }

  async handleNlpResult(result, userId) {
    if (result.score < 0.6 && !result.intent.startsWith('service.info') && !result.intent.startsWith('product.info')) {
      return {
        intent: 'fallback',
        text: result.answer || "I'm not sure I understand. Could you rephrase that?"
      };
    }

    // Handle different intents
    switch (result.intent) {
      case 'service.list':
        const services = await Service.find({ isActive: true });
        return {
          intent: 'service.list',
          text: 'Here are our available services:',
          data: services,
          showCarousel: 'services'
        };

      case 'product.list':
        const products = await Product.find({ isActive: true });
        return {
          intent: 'product.list',
          text: 'Here are our available products:',
          data: products,
          showCarousel: 'products'
        };

      case 'booking.start':
        conversationState.setStage(userId, 'awaiting_booking_details');
        return {
          intent: 'booking.start',
          text: '📅 To make a booking, please provide:\n\n' +
            '1. Your Name\n' +
            '2. Preferred Date (DD/MM/YYYY)\n' +
            '3. Preferred Time (HH:MM AM/PM)\n' +
            '4. Service Description\n\n' +
            'Format: Book: [Name], [Date], [Time], [Description]'
        };

      case 'quotation.start':
        conversationState.setStage(userId, 'awaiting_quote_details');
        return {
          intent: 'quotation.start',
          text: '📝 For a quotation, please provide:\n\n' +
            '1. Your Name\n' +
            '2. Service Requirements\n' +
            '3. Timeline (if any)\n' +
            '4. Budget Range (optional)\n\n' +
            'Format: Quote: [Name], [Requirements], [Timeline], [Budget]'
        };

      default:
        // Handle service.info.* and product.info.* intents
        if (result.intent.startsWith('service.info.') || result.intent.startsWith('product.info.')) {
          return {
            intent: result.intent,
            text: result.answer
          };
        }

        return {
          intent: result.intent,
          text: result.answer
        };
    }
  }

  async getServiceInfo(serviceId) {
    return await Service.findById(serviceId);
  }

  async getProductInfo(productId) {
    return await Product.findById(productId);
  }
}

// Create singleton instance
const chatbotService = new ChatbotService();
export default chatbotService;
