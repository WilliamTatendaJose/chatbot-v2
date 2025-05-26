import axios from 'axios';
import { info, error as _error } from '../utils/logger.js';
import { messenger, techrehubServices, techrehubProducts } from '../config/index.js';
import ChatSession from '../models/chat-session.model.js';

class MessengerService {
  constructor() {
    this.pageToken = messenger.pageAccessToken;
    this.apiVersion = 'v18.0';
    this.apiUrl = `https://graph.facebook.com/${this.apiVersion}/me/messages`;
    info('Messenger service initialized');
  }

  async sendMessage(recipientId, message) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          recipient: { id: recipientId },
          message: { text: message }
        },
        {
          params: { access_token: this.pageToken }
        }
      );

      info(`Message sent to ${recipientId}`);
      return response.data;
    } catch (err) {
      _error(`Error sending Messenger message: ${err.message}`);
      throw err;
    }
  }
  async handleBookingRequest(recipientId, serviceId) {
    try {
      const service = techrehubServices.find(s => s.id === serviceId);
      if (!service) {
        return this.sendMessage(recipientId, "Sorry, I couldn't find that service. Please try again.");
      }

      const message = `📅 To book our *${service.name}* service, please provide:\n\n` +
        "1. Your Name\n" +
        "2. Preferred Date (DD/MM/YYYY)\n" +
        "3. Preferred Time (e.g., 10:00 AM)\n" +
        "4. Brief Description\n\n" +
        "Format: Book: [Name], [Date], [Time], [Description]\n\n" +
        "Example: Book: John Doe, 25/05/2024, 10:00 AM, Laptop repair";

      await this.updateConversationState(recipientId, {
        status: 'awaiting_booking_details',
        lastPrompt: 'booking_format',
        service: service.name
      });

      return this.sendMessage(recipientId, message);
    } catch (err) {
      _error(`Error handling booking request: ${err.message}`);
      throw err;
    }
  }

  async confirmBooking(recipientId, details) {
    try {
      // Parse booking details
      const parts = details.split(',').map(p => p.trim());
      if (parts.length < 4) {
        return this.requestBookingRetry(recipientId, "Please provide your name, date, time, and description.");
      }

      const [name, date, time, description] = parts;

      // Validate date and time
      const bookingDateTime = new Date(`${date} ${time}`);
      if (isNaN(bookingDateTime.getTime())) {
        return this.requestBookingRetry(recipientId, "Please provide a valid date and time.");
      }

      // Create confirmation message with quick reply buttons
      await this.sendQuickReplies(
        recipientId,
        `📅 *Booking Request Summary*\n\n` +
        `Name: ${name}\n` +
        `Date: ${date}\n` +
        `Time: ${time}\n` +
        `Description: ${description}\n\n` +
        `Is this information correct?`,
        [
          {
            content_type: 'text',
            title: 'Yes, Confirm',
            payload: 'BOOKING_CONFIRM'
          },
          {
            content_type: 'text',
            title: 'No, Retry',
            payload: 'BOOKING_RETRY'
          }
        ]
      );

      await this.updateConversationState(recipientId, {
        status: 'confirming_booking',
        bookingDetails: {
          name,
          date,
          time,
          description
        }
      });

      // Notify admins about the new booking
      await this.notifyAdmins('NEW_BOOKING', {
        from: recipientId,
        date: `${date} ${time}`,
        details: description,
        platform: 'messenger'
      });

    } catch (err) {
      _error(`Error confirming booking: ${err.message}`);
      return this.requestBookingRetry(recipientId);
    }
  }

  async requestBookingRetry(recipientId, reason = '') {
    const message = `${reason}\n\nPlease provide your booking details in this format:\n` +
      "Book: [Name], [Date], [Time], [Description]\n\n" +
      "Example: Book: John Doe, 25/05/2024, 10:00 AM, Laptop repair";

    return this.sendMessage(recipientId, message);
  }
  async requestQuotation(recipientId, serviceId) {
    try {
      const service = techrehubServices.find(s => s.id === serviceId);
      if (!service) {
        return this.sendMessage(recipientId, "Sorry, I couldn't find that service. Please try again.");
      }

      const message = `📝 For a quote on our ${service.name} service, please provide:\n\n` +
        "1. Your Name\n" +
        "2. Requirements Detail\n" +
        "3. Timeline (if any)\n" +
        "4. Budget Range (optional)\n\n" +
        "Format: Quote: [Name], [Requirements], [Timeline], [Budget]\n\n" +
        "Example: Quote: Jane Smith, Office network setup for 10 computers, Next month, $1000-2000";

      await this.updateConversationState(recipientId, {
        status: 'awaiting_quote_details',
        lastPrompt: 'quotation_format',
        service: service.name
      });

      return this.sendMessage(recipientId, message);
    } catch (err) {
      _error(`Error requesting quotation: ${err.message}`);
      throw err;
    }
  }

  async confirmQuotationRequest(recipientId, details) {
    try {
      // Parse quotation details
      const parts = details.split(',').map(p => p.trim());
      if (parts.length < 2) {
        return this.requestQuotationRetry(recipientId, "Please provide at least your name and requirements.");
      }

      const [name, ...requirements] = parts;
      const requirementsText = requirements.join(', ');

      // Send confirmation with quick reply buttons
      await this.sendQuickReplies(
        recipientId,
        `📝 *Quotation Request Summary*\n\n` +
        `Name: ${name}\n` +
        `Requirements: ${requirementsText}\n\n` +
        `Is this information correct?`,
        [
          {
            content_type: 'text',
            title: 'Yes, Confirm',
            payload: 'QUOTE_CONFIRM'
          },
          {
            content_type: 'text',
            title: 'No, Retry',
            payload: 'QUOTE_RETRY'
          }
        ]
      );

      await this.updateConversationState(recipientId, {
        status: 'confirming_quote',
        quoteDetails: {
          name,
          requirements: requirementsText
        }
      });

      // Notify admins about the new quotation
      await this.notifyAdmins('NEW_QUOTATION', {
        from: recipientId,
        requirements: requirementsText,
        platform: 'messenger'
      });

    } catch (err) {
      _error(`Error confirming quotation: ${err.message}`);
      return this.requestQuotationRetry(recipientId);
    }
  }

  async transferToHuman(recipientId, initialMessage = '') {
    try {
      // Create a new chat session
      const session = await ChatSession.create({
        userId: recipientId,
        platform: 'messenger',
        topic: 'Human Transfer Request',
        metadata: {
          transferReason: initialMessage,
          priority: 'high'
        }
      });

      // Add initial message to history
      session.addMessage(initialMessage, recipientId, 'user');
      await session.save();

      // Update conversation state
      await this.updateConversationState(recipientId, {
        status: 'transferred',
        transferTime: new Date(),
        lastMessage: initialMessage,
        chatSessionId: session._id
      });

      // Get conversation history
      const history = await this.getConversationHistory(recipientId);
      if (history && history !== "No history available") {
        session.history.unshift(...history.map(msg => ({
          content: msg.content,
          from: msg.from,
          type: msg.type,
          timestamp: msg.timestamp
        })));
        await session.save();
      }

      // Notify all admin channels
      await this.notifyAdmins('HUMAN_TRANSFER', {
        from: recipientId,
        message: initialMessage,
        history,
        platform: 'messenger',
        chatSessionId: session._id
      });

      // Send acknowledgment to user
      const message = "I've notified our support team and shared your conversation history to provide better assistance. " +
        "A human agent will take over this conversation shortly. " +
        "You can continue to send messages in the meantime.\n\n" +
        "Your chat reference number is: " + session._id;

      return this.sendMessage(recipientId, message);
    } catch (err) {
      _error(`Error in human transfer: ${err.message}`);
      throw err;
    }
  }

  async updateConversationState(userId, updates) {
    try {
      // In a real implementation, this would update a database
      // For now, we'll just log it
      info(`Updating conversation state for ${userId}: ${JSON.stringify(updates)}`);
    } catch (err) {
      _error(`Error updating conversation state: ${err.message}`);
    }
  }

  async getConversationHistory(userId) {
    // In a real implementation, this would fetch from a database
    // For now, we'll return a placeholder
    return "No history available";
  }

  async notifyAdmins(type, data) {
    try {
      // In a real implementation, this might send notifications to a dashboard,
      // email, or another messaging system. For now, we'll just log it.
      info(`Admin notification (${type}): ${JSON.stringify(data)}`);
      return true;
    } catch (err) {
      _error(`Error sending admin notification: ${err.message}`);
      return false;
    }
  }

  async sendQuickReplies(recipientId, message, quickReplies) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          recipient: { id: recipientId },
          messaging_type: 'RESPONSE',
          message: {
            text: message,
            quick_replies: quickReplies
          }
        },
        {
          params: { access_token: this.pageToken }
        }
      );

      info(`Quick replies sent to ${recipientId}`);
      return response.data;
    } catch (err) {
      _error(`Error sending quick replies: ${err.message}`);
      throw err;
    }
  }

  async sendCarousel(recipientId, elements) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          recipient: { id: recipientId },
          message: {
            attachment: {
              type: 'template',
              payload: {
                template_type: 'generic',
                elements: elements
              }
            }
          }
        },
        {
          params: { access_token: this.pageToken }
        }
      );

      info(`Carousel sent to ${recipientId}`);
      return response.data;
    } catch (err) {
      _error(`Error sending carousel: ${err.message}`);
      throw err;
    }
  }
  async sendServiceCarousel(recipientId) {
    try {
      const services = techrehubServices;

      const elements = services.map(service => ({
        title: service.name,
        subtitle: `${service.description}\n💰 ${service.price} • ⏱️ ${service.duration}`,
        image_url: service.image,
        buttons: [
          {
            type: 'postback',
            title: 'View Details',
            payload: `SERVICE_DETAILS_${service.id}`
          },
          {
            type: 'postback',
            title: 'Book Now',
            payload: `BOOK_SERVICE_${service.id}`
          },
          {
            type: 'postback',
            title: 'Get Quote',
            payload: `QUOTE_SERVICE_${service.id}`
          }
        ]
      }));

      return this.sendCarousel(recipientId, elements);
    } catch (err) {
      _error(`Error sending service carousel: ${err.message}`);
      throw err;
    }
  }
  async sendProductCarousel(recipientId) {
    try {
      const products = techrehubProducts;

      const elements = products.map(product => ({
        title: product.name,
        subtitle: `${product.description}\n💰 ${product.price}`,
        image_url: product.image,
        buttons: [
          {
            type: 'postback',
            title: 'View Details',
            payload: `PRODUCT_DETAILS_${product.id}`
          },
          {
            type: 'postback',
            title: 'Request Demo',
            payload: `DEMO_PRODUCT_${product.id}`
          },
          {
            type: 'postback',
            title: 'More Info',
            payload: `INFO_PRODUCT_${product.id}`
          }
        ]
      }));

      return this.sendCarousel(recipientId, elements);
    } catch (err) {
      _error(`Error sending product carousel: ${err.message}`);
      throw err;
    }
  }
  async sendServiceDetails(recipientId, serviceId) {
    try {
      const service = techrehubServices.find(s => s.id === serviceId);
      if (!service) {
        return this.sendMessage(recipientId, "Sorry, I couldn't find that service. Please try again.");
      }

      const featuresText = service.features.map(feature => `✓ ${feature}`).join('\n');

      const message = `🔧 ${service.name}\n\n` +
        `${service.description}\n\n` +
        `💰 Price: ${service.price}\n` +
        `⏱️ Duration: ${service.duration}\n\n` +
        `What's included:\n${featuresText}`;

      const quickReplies = [
        {
          content_type: 'text',
          title: '📅 Book Now',
          payload: `BOOK_SERVICE_${serviceId}`
        },
        {
          content_type: 'text',
          title: '💬 Get Quote',
          payload: `QUOTE_SERVICE_${serviceId}`
        },
        {
          content_type: 'text',
          title: '⬅️ Back to Services',
          payload: 'SHOW_SERVICES'
        }
      ];

      return this.sendQuickReplies(recipientId, message, quickReplies);
    } catch (err) {
      _error(`Error sending service details: ${err.message}`);
      throw err;
    }
  }
  async sendProductDetails(recipientId, productId) {
    try {
      const product = techrehubProducts.find(p => p.id === productId);
      if (!product) {
        return this.sendMessage(recipientId, "Sorry, I couldn't find that product. Please try again.");
      }

      const featuresText = product.features.map(feature => `✓ ${feature}`).join('\n');

      const message = `💻 ${product.name}\n\n` +
        `${product.description}\n\n` +
        `💰 Price: ${product.price}\n\n` +
        `Key features:\n${featuresText}`;

      const quickReplies = [
        {
          content_type: 'text',
          title: '🎯 Request Demo',
          payload: `DEMO_PRODUCT_${productId}`
        },
        {
          content_type: 'text',
          title: '📋 More Info',
          payload: `INFO_PRODUCT_${productId}`
        },
        {
          content_type: 'text',
          title: '⬅️ Back to Products',
          payload: 'SHOW_PRODUCTS'
        }
      ];

      return this.sendQuickReplies(recipientId, message, quickReplies);
    } catch (err) {
      _error(`Error sending product details: ${err.message}`);
      throw err;
    }
  }
  async handlePostback(recipientId, payload) {
    try {
      if (payload.startsWith('SERVICE_DETAILS_')) {
        const serviceId = payload.replace('SERVICE_DETAILS_', '');
        return this.sendServiceDetails(recipientId, serviceId);
      } else if (payload.startsWith('PRODUCT_DETAILS_')) {
        const productId = payload.replace('PRODUCT_DETAILS_', '');
        return this.sendProductDetails(recipientId, productId);
      } else if (payload.startsWith('BOOK_SERVICE_')) {
        const serviceId = payload.replace('BOOK_SERVICE_', '');
        return this.handleBookingRequest(recipientId, serviceId);
      } else if (payload.startsWith('QUOTE_SERVICE_')) {
        const serviceId = payload.replace('QUOTE_SERVICE_', '');
        return this.requestQuotation(recipientId, serviceId);
      } else if (payload.startsWith('DEMO_PRODUCT_')) {
        const productId = payload.replace('DEMO_PRODUCT_', '');
        return this.requestProductDemo(recipientId, productId);
      } else if (payload.startsWith('INFO_PRODUCT_')) {
        const productId = payload.replace('INFO_PRODUCT_', '');
        return this.sendProductMoreInfo(recipientId, productId);
      } else if (payload.startsWith('QUOTE_PRODUCT_')) {
        const productId = payload.replace('QUOTE_PRODUCT_', '');
        return this.requestProductQuotation(recipientId, productId);
      } else if (payload === 'BOOKING_CONFIRM') {
        return this.finalizeBooking(recipientId);
      } else if (payload === 'BOOKING_RETRY') {
        return this.requestBookingRetry(recipientId, "Let's try again with your booking details.");
      } else if (payload === 'QUOTE_CONFIRM') {
        return this.finalizeQuotation(recipientId);
      } else if (payload === 'QUOTE_RETRY') {
        return this.requestQuotationRetry(recipientId, "Let's try again with your quotation details.");
      } else if (payload === 'PRODUCT_QUOTE_CONFIRM') {
        return this.finalizeProductQuotation(recipientId);
      } else if (payload === 'PRODUCT_QUOTE_RETRY') {
        return this.requestProductQuotationRetry(recipientId, "Let's try again with your product quotation details.");
      } else if (payload === 'DEMO_CONFIRM') {
        return this.finalizeDemoRequest(recipientId);
      } else if (payload === 'DEMO_RETRY') {
        return this.requestDemoRetry(recipientId, "Let's try again with your demo request details.");
      } else if (payload === 'SCHEDULE_DEMO') {
        return this.sendMessage(recipientId, "Please provide your demo details using this format:\nDemo: [Name], [Company], [Date/Time], [Users]\n\nExample: Demo: John Smith, ABC Corp, Tomorrow 2PM, 50 users");
      } else if (payload === 'SHOW_SERVICES') {
        return this.sendServiceCarousel(recipientId);
      } else if (payload === 'SHOW_PRODUCTS') {
        return this.sendProductCarousel(recipientId);
      } else if (payload === 'HUMAN_TRANSFER') {
        return this.transferToHuman(recipientId, 'User requested human assistance');
      } else if (payload === 'MAIN_MENU') {
        return this.sendMainMenu(recipientId);
      } else if (payload === 'HELP_MENU') {
        return this.sendHelpMenu(recipientId);
      } else {
        // Handle unknown postback
        info(`Unknown postback payload: ${payload}`);
        return this.sendMessage(recipientId, "I'm not sure what you're looking for. Type 'menu' to see available options or 'help' for assistance.");
      }
    } catch (err) {
      _error(`Error handling postback: ${err.message}`);
      throw err;
    }
  }
  async requestProductDemo(recipientId, productId) {
    try {
      const product = techrehubProducts.find(p => p.id === productId);
      if (!product) {
        return this.sendMessage(recipientId, "Sorry, I couldn't find that product.");
      }

      const message = `🎯 Request Demo for ${product.name}\n\n` +
        `To schedule your personalized demo, please provide:\n\n` +
        `1. Your Name\n` +
        `2. Company/Organization\n` +
        `3. Preferred Date & Time\n` +
        `4. Number of Users\n\n` +
        `Format: Demo: [Name], [Company], [Date/Time], [Users]\n\n` +
        `Example: Demo: John Smith, ABC Corp, Tomorrow 2PM, 50 users`;

      await this.updateConversationState(recipientId, {
        status: 'awaiting_demo_details',
        lastPrompt: 'demo_format',
        product: product.name
      });

      return this.sendMessage(recipientId, message);
    } catch (err) {
      _error(`Error requesting product demo: ${err.message}`);
      throw err;
    }
  }

  async sendProductMoreInfo(recipientId, productId) {
    try {
      const product = techrehubProducts.find(p => p.id === productId);
      if (!product) {
        return this.sendMessage(recipientId, "Sorry, I couldn't find that product. Please try again.");
      }

      const message = `📋 **More Information about ${product.name}**\n\n` +
        `**Category:** ${product.category}\n` +
        `**Price:** ${product.price}\n` +
        `**Description:** ${product.description}\n\n` +
        `**Key Benefits:**\n${product.features.map(feature => `• ${feature}`).join('\n')}\n\n` +
        `**Technical Specifications:**\n` +
        `• Platform compatibility: Web, Mobile, Desktop\n` +
        `• Setup time: 24-48 hours\n` +
        `• Training included: Yes\n` +
        `• Support: 24/7 technical support\n` +
        `• Updates: Regular feature updates included\n\n` +
        `**Implementation Process:**\n` +
        `1. Initial consultation and requirements analysis\n` +
        `2. Custom configuration and setup\n` +
        `3. Data migration (if applicable)\n` +
        `4. Staff training and onboarding\n` +
        `5. Go-live support and monitoring\n\n` +
        `Ready to get started?`;

      const quickReplies = [
        {
          content_type: 'text',
          title: '🎯 Request Demo',
          payload: `DEMO_PRODUCT_${productId}`
        },
        {
          content_type: 'text',
          title: '💬 Get Custom Quote',
          payload: `QUOTE_PRODUCT_${productId}`
        },
        {
          content_type: 'text',
          title: '📞 Speak to Expert',
          payload: 'HUMAN_TRANSFER'
        },
        {
          content_type: 'text',
          title: '⬅️ Back to Products',
          payload: 'SHOW_PRODUCTS'
        }
      ];

      return this.sendQuickReplies(recipientId, message, quickReplies);
    } catch (err) {
      _error(`Error sending product more info: ${err.message}`);
      throw err;
    }
  }

  async finalizeBooking(recipientId) {
    try {
      // Get conversation state to retrieve booking details
      // In a real implementation, this would fetch from database
      const message = `✅ **Booking Confirmed!**\n\n` +
        `Thank you for your booking request. Here's what happens next:\n\n` +
        `📧 **Confirmation Email:** You'll receive a detailed confirmation email within 5 minutes\n` +
        `📱 **SMS Reminder:** We'll send you a reminder 24 hours before your appointment\n` +
        `🔗 **Preparation:** Check your email for any preparation instructions\n\n` +
        `**Need to make changes?**\n` +
        `• To reschedule: Reply with "reschedule"\n` +
        `• To cancel: Reply with "cancel booking"\n` +
        `• For questions: Type "speak to human"\n\n` +
        `**Payment:**\n` +
        `Payment will be processed after service completion. We accept all major payment methods including Ecocash, OneMoney, and bank cards.\n\n` +
        `Reference Number: BK${Date.now().toString().slice(-6)}\n\n` +
        `We look forward to serving you! 🚀`;

      await this.updateConversationState(recipientId, {
        status: 'booking_confirmed',
        confirmationTime: new Date(),
        referenceNumber: `BK${Date.now().toString().slice(-6)}`
      });

      // Send confirmation message
      await this.sendMessage(recipientId, message);

      // Send follow-up quick replies for additional actions
      const quickReplies = [
        {
          content_type: 'text',
          title: '📅 Book Another Service',
          payload: 'SHOW_SERVICES'
        },
        {
          content_type: 'text',
          title: '💬 Get Quote',
          payload: 'SHOW_SERVICES'
        },
        {
          content_type: 'text',
          title: '🏠 Main Menu',
          payload: 'MAIN_MENU'
        }
      ];

      return this.sendQuickReplies(recipientId, "What else can I help you with?", quickReplies);
    } catch (err) {
      _error(`Error finalizing booking: ${err.message}`);
      return this.sendMessage(recipientId, "Your booking has been received, but there was an issue sending the confirmation. Our team will contact you shortly.");
    }
  }

  async finalizeQuotation(recipientId) {
    try {
      // Get conversation state to retrieve quote details
      // In a real implementation, this would fetch from database
      const message = `✅ **Quotation Request Submitted!**\n\n` +
        `Thank you for your quotation request. Here's what happens next:\n\n` +
        `⏱️ **Processing Time:** 2-4 business hours for standard quotes\n` +
        `📧 **Detailed Quote:** You'll receive a comprehensive quote via email\n` +
        `📞 **Follow-up Call:** Our team may call to clarify requirements\n\n` +
        `**Your quote will include:**\n` +
        `• Detailed breakdown of costs\n` +
        `• Timeline and milestones\n` +
        `• Terms and conditions\n` +
        `• Payment options\n\n` +
        `**Expedited quotes available:**\n` +
        `For urgent requests, type "urgent quote" to speak with our team immediately.\n\n` +
        `Reference Number: QT${Date.now().toString().slice(-6)}\n\n` +
        `We'll be in touch soon! 📝`;

      await this.updateConversationState(recipientId, {
        status: 'quote_confirmed',
        confirmationTime: new Date(),
        referenceNumber: `QT${Date.now().toString().slice(-6)}`
      });

      // Send confirmation message
      await this.sendMessage(recipientId, message);

      // Send follow-up quick replies
      const quickReplies = [
        {
          content_type: 'text',
          title: '📋 Request Another Quote',
          payload: 'SHOW_SERVICES'
        },
        {
          content_type: 'text',
          title: '📅 Book a Service',
          payload: 'SHOW_SERVICES'
        },
        {
          content_type: 'text',
          title: '📞 Speak to Expert',
          payload: 'HUMAN_TRANSFER'
        },
        {
          content_type: 'text',
          title: '🏠 Main Menu',
          payload: 'MAIN_MENU'
        }
      ];

      return this.sendQuickReplies(recipientId, "What else can I help you with today?", quickReplies);
    } catch (err) {
      _error(`Error finalizing quotation: ${err.message}`);
      return this.sendMessage(recipientId, "Your quotation request has been received, but there was an issue sending the confirmation. Our team will contact you shortly.");
    }
  }
  async requestProductQuotation(recipientId, productId) {
    try {
      const product = techrehubProducts.find(p => p.id === productId);
      if (!product) {
        return this.sendMessage(recipientId, "Sorry, I couldn't find that product. Please try again.");
      }

      const message = `💬 **Custom Quote for ${product.name}**\n\n` +
        `To provide you with an accurate quote tailored to your needs, please provide:\n\n` +
        `📋 **Required Information:**\n` +
        `1. **Company/Organization Name**\n` +
        `2. **Number of Users/Licenses needed**\n` +
        `3. **Specific features required**\n` +
        `4. **Integration requirements** (if any)\n` +
        `5. **Timeline for implementation**\n` +
        `6. **Budget range** (optional)\n\n` +
        `**Format your request as:**\n` +
        `ProductQuote: [Company], [Users], [Features], [Integrations], [Timeline], [Budget]\n\n` +
        `**Example:**\n` +
        `ProductQuote: ABC Corp, 50 users, CRM + Analytics, Existing ERP integration, 3 months, $10,000-15,000\n\n` +
        `💡 **Tip:** The more details you provide, the more accurate your quote will be!`;

      await this.updateConversationState(recipientId, {
        status: 'awaiting_product_quote_details',
        lastPrompt: 'product_quote_format',
        product: product.name,
        productId: productId
      });

      // Send the message with quick reply options for help
      const quickReplies = [
        {
          content_type: 'text',
          title: '📞 Call for Help',
          payload: 'HUMAN_TRANSFER'
        },
        {
          content_type: 'text',
          title: '🎯 Request Demo Instead',
          payload: `DEMO_PRODUCT_${productId}`
        },
        {
          content_type: 'text',
          title: '⬅️ Back to Product',
          payload: `PRODUCT_DETAILS_${productId}`
        }
      ];

      await this.sendMessage(recipientId, message);
      return this.sendQuickReplies(recipientId, "Need help with your quote request?", quickReplies);
    } catch (err) {
      _error(`Error requesting product quotation: ${err.message}`);
      throw err;
    }
  }

  async sendMainMenu(recipientId) {
    try {
      const message = `🏠 **TechRehub Main Menu**\n\n` +
        `Welcome! How can we help you today?\n\n` +
        `Choose from the options below:`;

      const quickReplies = [
        {
          content_type: 'text',
          title: '🔧 View Services',
          payload: 'SHOW_SERVICES'
        },
        {
          content_type: 'text',
          title: '💻 View Products',
          payload: 'SHOW_PRODUCTS'
        },
        {
          content_type: 'text',
          title: '📅 Book Service',
          payload: 'SHOW_SERVICES'
        },
        {
          content_type: 'text',
          title: '💬 Get Quote',
          payload: 'SHOW_SERVICES'
        },
        {
          content_type: 'text',
          title: '❓ Help & Support',
          payload: 'HELP_MENU'
        },
        {
          content_type: 'text',
          title: '📞 Speak to Human',
          payload: 'HUMAN_TRANSFER'
        }
      ];

      return this.sendQuickReplies(recipientId, message, quickReplies);
    } catch (err) {
      _error(`Error sending main menu: ${err.message}`);
      throw err;
    }
  }

  async sendHelpMenu(recipientId) {
    try {
      const message = `❓ **Help & Support**\n\n` +
        `Here are the ways we can assist you:\n\n` +
        `🔧 **Services:** IT support, consulting, development\n` +
        `💻 **Products:** Software solutions and platforms\n` +
        `📅 **Booking:** Schedule appointments and consultations\n` +
        `💬 **Quotes:** Get custom pricing for your needs\n\n` +
        `**Quick Commands:**\n` +
        `• Type "services" - View our service offerings\n` +
        `• Type "products" - Browse our software solutions\n` +
        `• Type "book" - Schedule an appointment\n` +
        `• Type "quote" - Request a custom quote\n` +
        `• Type "menu" - Return to main menu\n` +
        `• Type "human" - Speak with our team\n\n` +
        `**Business Hours:**\n` +
        `Monday - Friday: 8:00 AM - 6:00 PM\n` +
        `Saturday: 9:00 AM - 2:00 PM\n` +
        `Sunday: Closed (Emergency support available)\n\n` +
        `How would you like to proceed?`;

      const quickReplies = [
        {
          content_type: 'text',
          title: '🔧 View Services',
          payload: 'SHOW_SERVICES'
        },
        {
          content_type: 'text',
          title: '💻 View Products',
          payload: 'SHOW_PRODUCTS'
        },
        {
          content_type: 'text',
          title: '📞 Contact Support',
          payload: 'HUMAN_TRANSFER'
        },
        {
          content_type: 'text',
          title: '🏠 Main Menu',
          payload: 'MAIN_MENU'
        }
      ];

      return this.sendQuickReplies(recipientId, message, quickReplies);
    } catch (err) {
      _error(`Error sending help menu: ${err.message}`);
      throw err;
    }
  }

  // Enhanced method to handle product quote confirmation
  async confirmProductQuotationRequest(recipientId, details) {
    try {
      // Parse product quotation details
      const parts = details.split(',').map(p => p.trim());
      if (parts.length < 3) {
        return this.requestProductQuotationRetry(recipientId, "Please provide at least company name, number of users, and required features.");
      }

      const [company, users, features, ...rest] = parts;
      const [integrations = 'None specified', timeline = 'Flexible', budget = 'To be discussed'] = rest;

      // Send confirmation with quick reply buttons
      const message = `📝 **Product Quotation Request Summary**\n\n` +
        `**Company:** ${company}\n` +
        `**Users:** ${users}\n` +
        `**Features:** ${features}\n` +
        `**Integrations:** ${integrations}\n` +
        `**Timeline:** ${timeline}\n` +
        `**Budget:** ${budget}\n\n` +
        `Is this information correct?`;

      const quickReplies = [
        {
          content_type: 'text',
          title: 'Yes, Submit Quote',
          payload: 'PRODUCT_QUOTE_CONFIRM'
        },
        {
          content_type: 'text',
          title: 'No, Edit Details',
          payload: 'PRODUCT_QUOTE_RETRY'
        },
        {
          content_type: 'text',
          title: '📞 Discuss with Expert',
          payload: 'HUMAN_TRANSFER'
        }
      ];

      await this.updateConversationState(recipientId, {
        status: 'confirming_product_quote',
        productQuoteDetails: {
          company,
          users,
          features,
          integrations,
          timeline,
          budget
        }
      });

      // Notify admins about the new product quotation
      await this.notifyAdmins('NEW_PRODUCT_QUOTATION', {
        from: recipientId,
        company,
        users,
        features,
        platform: 'messenger'
      });

      return this.sendQuickReplies(recipientId, message, quickReplies);
    } catch (err) {
      _error(`Error confirming product quotation: ${err.message}`);
      return this.requestProductQuotationRetry(recipientId);
    }
  }

  async requestProductQuotationRetry(recipientId, reason = '') {
    const message = `${reason}\n\nPlease provide your product quotation details in this format:\n` +
      "ProductQuote: [Company], [Users], [Features], [Integrations], [Timeline], [Budget]\n\n" +
      "Example: ProductQuote: ABC Corp, 50 users, CRM + Analytics, ERP integration, 3 months, $10,000-15,000";

    return this.sendMessage(recipientId, message);
  }

  async finalizeProductQuotation(recipientId) {
    try {
      const message = `✅ **Product Quotation Request Submitted!**\n\n` +
        `Thank you for your detailed product quotation request. Here's what happens next:\n\n` +
        `⏱️ **Response Time:** 4-6 business hours for complex product quotes\n` +
        `📧 **Detailed Proposal:** You'll receive a comprehensive proposal including:\n` +
        `   • Custom pricing based on your requirements\n` +
        `   • Implementation timeline and milestones\n` +
        `   • Training and support options\n` +
        `   • Integration possibilities\n` +
        `   • Licensing and maintenance terms\n\n` +
        `📞 **Consultation Call:** Our product specialist will schedule a call to:\n` +
        `   • Review your specific needs\n` +
        `   • Demonstrate relevant features\n` +
        `   • Discuss customization options\n` +
        `   • Answer any technical questions\n\n` +
        `🎯 **Demo Available:** We can arrange a personalized demo of the product configured for your use case.\n\n` +
        `Reference Number: PQ${Date.now().toString().slice(-6)}\n\n` +
        `Our product team is excited to work with you! 🚀`;

      await this.updateConversationState(recipientId, {
        status: 'product_quote_confirmed',
        confirmationTime: new Date(),
        referenceNumber: `PQ${Date.now().toString().slice(-6)}`
      });

      // Send confirmation message
      await this.sendMessage(recipientId, message);

      // Send follow-up quick replies
      const quickReplies = [
        {
          content_type: 'text',
          title: '🎯 Schedule Demo Now',
          payload: 'SCHEDULE_DEMO'
        },
        {
          content_type: 'text',
          title: '📋 Request Service Quote',
          payload: 'SHOW_SERVICES'
        },
        {
          content_type: 'text',
          title: '📞 Speak to Specialist',
          payload: 'HUMAN_TRANSFER'
        },
        {
          content_type: 'text',
          title: '🏠 Main Menu',
          payload: 'MAIN_MENU'
        }
      ]; return this.sendQuickReplies(recipientId, "What would you like to do next?", quickReplies);
    } catch (err) {
      _error(`Error finalizing product quotation: ${err.message}`);
      return this.sendMessage(recipientId, "Your product quotation request has been received, but there was an issue sending the confirmation. Our team will contact you shortly.");
    }
  }

  async confirmDemoRequest(recipientId, details) {
    try {
      // Parse demo details
      const parts = details.split(',').map(p => p.trim());
      if (parts.length < 3) {
        return this.requestDemoRetry(recipientId, "Please provide at least your name, company, and preferred date/time.");
      }

      const [name, company, dateTime, users = 'Not specified'] = parts;

      // Send confirmation with quick reply buttons
      const message = `🎯 **Demo Request Summary**\n\n` +
        `**Name:** ${name}\n` +
        `**Company:** ${company}\n` +
        `**Preferred Date/Time:** ${dateTime}\n` +
        `**Number of Users:** ${users}\n\n` +
        `Is this information correct?`;

      const quickReplies = [
        {
          content_type: 'text',
          title: 'Yes, Schedule Demo',
          payload: 'DEMO_CONFIRM'
        },
        {
          content_type: 'text',
          title: 'No, Edit Details',
          payload: 'DEMO_RETRY'
        },
        {
          content_type: 'text',
          title: '📞 Call to Schedule',
          payload: 'HUMAN_TRANSFER'
        }
      ];

      await this.updateConversationState(recipientId, {
        status: 'confirming_demo',
        demoDetails: {
          name,
          company,
          dateTime,
          users
        }
      });

      // Notify admins about the new demo request
      await this.notifyAdmins('NEW_DEMO_REQUEST', {
        from: recipientId,
        name,
        company,
        dateTime,
        users,
        platform: 'messenger'
      });

      return this.sendQuickReplies(recipientId, message, quickReplies);
    } catch (err) {
      _error(`Error confirming demo request: ${err.message}`);
      return this.requestDemoRetry(recipientId);
    }
  }

  async requestDemoRetry(recipientId, reason = '') {
    const message = `${reason}\n\nPlease provide your demo request details in this format:\n` +
      "Demo: [Name], [Company], [Date/Time], [Number of Users]\n\n" +
      "Example: Demo: John Smith, ABC Corp, Tomorrow 2PM, 50 users";

    return this.sendMessage(recipientId, message);
  }

  async finalizeDemoRequest(recipientId) {
    try {
      const message = `✅ **Demo Request Confirmed!**\n\n` +
        `Thank you for requesting a personalized demo. Here's what happens next:\n\n` +
        `📞 **Confirmation Call:** Our demo specialist will call you within 2 hours to:\n` +
        `   • Confirm the demo time and date\n` +
        `   • Understand your specific requirements\n` +
        `   • Send you the meeting invitation\n\n` +
        `🎯 **Demo Preparation:** We'll customize the demo to focus on:\n` +
        `   • Features most relevant to your business\n` +
        `   • Your specific use cases and workflows\n` +
        `   • Integration possibilities with your current systems\n\n` +
        `💻 **What to Expect:**\n` +
        `   • 45-60 minute interactive demonstration\n` +
        `   • Q&A session with product experts\n` +
        `   • Detailed feature walkthrough\n` +
        `   • Custom pricing discussion\n\n` +
        `📧 **Resources:** You'll receive demo materials and trial access information via email.\n\n` +
        `Reference Number: DM${Date.now().toString().slice(-6)}\n\n` +
        `Looking forward to showing you what we can do! 🚀`;

      await this.updateConversationState(recipientId, {
        status: 'demo_confirmed',
        confirmationTime: new Date(),
        referenceNumber: `DM${Date.now().toString().slice(-6)}`
      });

      // Send confirmation message
      await this.sendMessage(recipientId, message);

      // Send follow-up quick replies
      const quickReplies = [
        {
          content_type: 'text',
          title: '📋 Request Service Quote',
          payload: 'SHOW_SERVICES'
        },
        {
          content_type: 'text',
          title: '💻 View Other Products',
          payload: 'SHOW_PRODUCTS'
        },
        {
          content_type: 'text',
          title: '📞 Speak to Sales',
          payload: 'HUMAN_TRANSFER'
        },
        {
          content_type: 'text',
          title: '🏠 Main Menu',
          payload: 'MAIN_MENU'
        }
      ];

      return this.sendQuickReplies(recipientId, "What else can we help you with?", quickReplies);
    } catch (err) {
      _error(`Error finalizing demo request: ${err.message}`);
      return this.sendMessage(recipientId, "Your demo request has been received, but there was an issue sending the confirmation. Our team will contact you shortly.");
    }
  }
}

// Create singleton instance
const messengerService = new MessengerService();
export default messengerService;