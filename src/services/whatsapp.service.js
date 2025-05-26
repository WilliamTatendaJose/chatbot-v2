import axios from 'axios';
import { info, error as _error } from '../utils/logger.js';
import { whatsapp, techrehubServices, techrehubProducts } from '../config/index.js';
import ChatSession from '../models/chat-session.model.js';

class WhatsAppService {
  constructor() {
    this.apiVersion = 'v18.0'; // WhatsApp API version
    this.phoneNumberId = whatsapp.phoneNumberId;
    this.accessToken = whatsapp.accessToken;
    this.apiUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    this.adminNumbers = whatsapp.adminPhoneNumbers;
    info('WhatsApp service initialized');
  }
  async sendMessage(to, message) {
    try {
      // Format the phone number correctly (remove + if present and ensure it's E.164 format)
      const formattedNumber = this.formatPhoneNumber(to);

      const response = await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedNumber,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      info(`Message sent to ${formattedNumber}, request ID: ${response.data.messages[0].id}`);
      return response.data;
    } catch (err) {
      _error(`Error sending WhatsApp message: ${err.message}`);
      if (err.response) {
        _error(`Response data: ${JSON.stringify(err.response.data)}`);
      }

      // FALLBACK: Store message for local processing/admin notification
      await this.storeFallbackMessage(to, message, err.message);

      // Don't throw error - return success to prevent webhook processing from failing
      return {
        success: false,
        fallback: true,
        message: 'Message stored for manual processing',
        error: err.message
      };
    }
  }

  // Store failed messages for manual processing
  async storeFallbackMessage(to, message, error) {
    try {
      const fallbackData = {
        platform: 'whatsapp',
        recipient: to,
        message: message,
        timestamp: new Date(),
        error: error,
        status: 'pending_manual_send'
      };

      info(`Storing fallback message for ${to}: ${message.substring(0, 50)}...`);

      // In a real implementation, store this in database
      // For now, we'll just log it for admin visibility
      _error(`FALLBACK MESSAGE STORED: ${JSON.stringify(fallbackData)}`);

      return fallbackData;
    } catch (fallbackErr) {
      _error(`Failed to store fallback message: ${fallbackErr.message}`);
    }
  }
  async sendServiceList(to) {
    const services = techrehubServices;
    let message = "🔧 *TechRehub Services* 🔧\n\n";

    services.forEach((service, index) => {
      message += `*${index + 1}. ${service.name}*\n`;
      message += `${service.description}\n`;
      message += `Price: ${service.price}\n\n`;
    });

    message += "Reply with the service number you're interested in, or type 'book' to schedule an appointment.";

    // Send interactive list message with options
    try {
      const formattedNumber = this.formatPhoneNumber(to);

      // Create a list of services as quick reply buttons
      // For simplicity, we'll just send a text message here, but in a real implementation
      // you would use interactive elements like lists or buttons

      return this.sendMessage(to, message);
    } catch (err) {
      _error(`Error sending service list: ${err.message}`);
      throw err;
    }
  }

  async requestQuotation(to) {
    try {
      const message = "To provide you with an accurate quote, please provide the following details:\n\n" +
        "*1. Your Name*\n" +
        "*2. Service Required*\n" +
        "*3. Project Requirements*\n" +
        "*4. Timeline (if any)*\n" +
        "*5. Budget Range (optional)*\n\n" +
        "Format: Quote: [Name], [Service], [Requirements], [Timeline], [Budget]\n\n" +
        "Example: Quote: Jane Smith, Network Setup, 5 computers and 2 printers, Next month, $1000-2000";

      await this.updateConversationState(to, {
        status: 'awaiting_quote_details',
        lastPrompt: 'quotation_format'
      });

      return this.sendMessage(to, message);
    } catch (err) {
      _error(`Error handling quotation request: ${err.message}`);
      throw err;
    }
  }

  async confirmQuotationRequest(to, details) {
    try {
      // Parse quotation details
      const parts = details.split(',').map(p => p.trim());
      if (parts.length < 3) {
        return this.requestQuotationRetry(to, "Please provide at least your name, service, and requirements.");
      }

      const [name, service, ...requirements] = parts;
      const requirementsText = requirements.join(', ');

      // Create confirmatory message with details for verification
      const confirmMessage = `📝 *Quotation Request Summary*\n\n` +
        `Name: *${name}*\n` +
        `Service: *${service}*\n` +
        `Requirements: *${requirementsText}*\n\n` +
        `Is this information correct?\n` +
        `Reply with:\n` +
        `✓ *YES* to confirm\n` +
        `✗ *NO* to provide details again`;

      await this.updateConversationState(to, {
        status: 'confirming_quote',
        quoteDetails: {
          name,
          service,
          requirements: requirementsText
        }
      });

      // Notify admins about the new quotation
      await this.notifyAdmins('NEW_QUOTATION', {
        from: to,
        service,
        requirements: requirementsText
      });

      return this.sendMessage(to, confirmMessage);
    } catch (err) {
      _error(`Error confirming quotation: ${err.message}`);
      return this.requestQuotationRetry(to);
    }
  }

  async requestQuotationRetry(to, reason = '') {
    const message = `${reason}\n\nPlease provide your quotation details in this format:\n` +
      "Quote: [Name], [Service], [Requirements]\n\n" +
      "Example: Quote: Jane Smith, Network Setup, 5 computers and 2 printers";

    return this.sendMessage(to, message);
  }

  async handleBookingRequest(to, service) {
    try {
      const message = `📅 To book our *${service}* service, please provide:\n\n` +
        "*1. Your Name*\n" +
        "*2. Preferred Date* (DD/MM/YYYY)\n" +
        "*3. Preferred Time* (e.g., 10:00 AM)\n" +
        "*4. Brief Description*\n\n" +
        "Format: Book: [Name], [Date], [Time], [Description]\n\n" +
        "Example: Book: John Doe, 25/05/2024, 10:00 AM, Laptop repair";

      await this.updateConversationState(to, {
        status: 'awaiting_booking_details',
        lastPrompt: 'booking_format',
        service
      });

      return this.sendMessage(to, message);
    } catch (err) {
      _error(`Error handling booking request: ${err.message}`);
      throw err;
    }
  }

  async confirmBooking(to, details) {
    try {
      // Parse booking details
      const parts = details.split(',').map(p => p.trim());
      if (parts.length < 4) {
        return this.requestBookingRetry(to, "Please provide your name, date, time, and description.");
      }

      const [name, date, time, description] = parts;

      // Validate date and time
      const bookingDateTime = new Date(`${date} ${time}`);
      if (isNaN(bookingDateTime.getTime())) {
        return this.requestBookingRetry(to, "Please provide a valid date and time.");
      }

      // Create confirmation message
      const confirmMessage = `📅 *Booking Request Summary*\n\n` +
        `Name: *${name}*\n` +
        `Date: *${date}*\n` +
        `Time: *${time}*\n` +
        `Description: *${description}*\n\n` +
        `Is this information correct?\n` +
        `Reply with:\n` +
        `✓ *YES* to confirm\n` +
        `✗ *NO* to provide details again`;

      await this.updateConversationState(to, {
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
        from: to,
        date: `${date} ${time}`,
        details: description
      });

      return this.sendMessage(to, confirmMessage);
    } catch (err) {
      _error(`Error confirming booking: ${err.message}`);
      return this.requestBookingRetry(to);
    }
  }

  async requestBookingRetry(to, reason = '') {
    const message = `${reason}\n\nPlease provide your booking details in this format:\n` +
      "Book: [Name], [Date], [Time], [Description]\n\n" +
      "Example: Book: John Doe, 25/05/2024, 10:00 AM, Laptop repair";

    return this.sendMessage(to, message);
  }

  async notifyAdmins(type, data) {
    try {
      let message = '';
      const timestamp = new Date().toLocaleString();

      switch (type) {
        case 'HUMAN_TRANSFER':
          message = `⚠️ *URGENT: Human Assistance Needed* ⚠️\n\n` +
            `From: ${data.from}\n` +
            `Time: ${timestamp}\n` +
            `Previous Topic: ${data.topic || 'N/A'}\n` +
            `Last Message: ${data.message}\n\n` +
            `Previous Interactions:\n${data.history || 'No history available'}\n\n` +
            `Reply directly to assist this customer.`;
          break;

        case 'NEW_QUOTATION':
          message = `📝 *New Quotation Request* 📝\n\n` +
            `From: ${data.from}\n` +
            `Time: ${timestamp}\n` +
            `Service: ${data.service}\n` +
            `Requirements: ${data.requirements}\n\n` +
            `Reply with a quote or type 'Contact: ${data.from}' to call the customer.`;
          break;

        case 'NEW_BOOKING':
          message = `📅 *New Booking Request* 📅\n\n` +
            `From: ${data.from}\n` +
            `Time: ${timestamp}\n` +
            `Service: ${data.service}\n` +
            `Requested Date: ${data.date}\n` +
            `Details: ${data.details}\n\n` +
            `Reply to confirm or reschedule.`;
          break;
      }

      // Send to all admin numbers
      const promises = this.adminNumbers.map(adminNumber =>
        this.sendMessage(adminNumber, message)
      );

      await Promise.all(promises);
      info(`Admin notification sent for ${type}`);

      return true;
    } catch (err) {
      _error(`Error sending admin notification: ${err.message}`);
      return false;
    }
  }

  async transferToHuman(from, message, topic = '', history = '') {
    try {
      // Create a new chat session
      const session = await ChatSession.create({
        userId: from,
        platform: 'whatsapp',
        topic: topic || 'Human Transfer Request',
        metadata: {
          transferReason: message,
          priority: 'high'
        }
      });

      // Add initial message to history
      session.addMessage(message, from, 'user');
      await session.save();

      // Track the transfer in conversation state
      await this.updateConversationState(from, {
        status: 'transferred',
        transferTime: new Date(),
        lastMessage: message,
        topic: topic,
        chatSessionId: session._id
      });

      // Add conversation history if available
      if (history) {
        const historyMessages = Array.isArray(history) ? history : [history];
        session.history.unshift(...historyMessages.map(msg => ({
          content: typeof msg === 'string' ? msg : msg.content,
          from: typeof msg === 'string' ? from : msg.from,
          type: typeof msg === 'string' ? 'user' : msg.type,
          timestamp: typeof msg === 'string' ? new Date() : (msg.timestamp || new Date())
        })));
        await session.save();
      }

      // Notify admins with full context
      await this.notifyAdmins('HUMAN_TRANSFER', {
        from,
        message,
        topic,
        history,
        chatSessionId: session._id
      });

      // Notify the customer with estimated response time
      const customerMessage = "I've notified our support team and shared your conversation history to provide better assistance. " +
        "A human agent will contact you within the next 30 minutes during business hours (8 AM - 5 PM CAT).\n\n" +
        "You can continue to send messages, and they will be forwarded to our team.\n\n" +
        "Your chat reference number is: " + session._id;

      return this.sendMessage(from, customerMessage);
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

  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Remove leading '+' or '00' if present
    if (cleaned.startsWith('00')) {
      cleaned = cleaned.substring(2);
    }

    return cleaned;
  }
  async sendInteractiveList(to, headerText, bodyText, footerText, buttonText, sections) {
    try {
      const formattedNumber = this.formatPhoneNumber(to);

      // Validate and fix sections to meet WhatsApp API requirements
      const validatedSections = this.validateAndFixSections(sections);

      if (validatedSections.length === 0) {
        throw new Error('No valid sections available for interactive list');
      }

      const response = await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedNumber,
          type: 'interactive',
          interactive: {
            type: 'list',
            header: {
              type: 'text',
              text: headerText
            },
            body: {
              text: bodyText
            },
            footer: {
              text: footerText
            },
            action: {
              button: buttonText,
              sections: validatedSections
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      info(`Interactive list sent to ${formattedNumber}`);
      return response.data;
    } catch (err) {
      _error(`Error sending interactive list: ${err.message}`);
      throw err;
    }
  }

  async sendInteractiveButtons(to, bodyText, buttons) {
    try {
      const formattedNumber = this.formatPhoneNumber(to);

      const response = await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedNumber,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: {
              text: bodyText
            },
            action: {
              buttons: buttons
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      info(`Interactive buttons sent to ${formattedNumber}`);
      return response.data;
    } catch (err) {
      _error(`Error sending interactive buttons: ${err.message}`);
      throw err;
    }
  }
  async sendServiceCarousel(to) {
    try {
      const services = techrehubServices;

      // Create sections for interactive list
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
      ]; return this.sendInteractiveList(
        to,
        "🔧 TechRehub Services",
        "Choose a service category to learn more or book an appointment:",
        "Select a service for detailed information",
        "View Services",
        sections
      );
    } catch (err) {
      _error(`Error sending service carousel: ${err.message}`);
      throw err;
    }
  }
  async sendProductCarousel(to) {
    try {
      const products = techrehubProducts;

      const sections = [
        {
          title: "💻 Software Solutions",
          rows: products.map(product => ({
            id: `product_${product.id}`,
            title: product.name,
            description: `${product.price} • ${product.category}`
          }))
        }
      ]; return this.sendInteractiveList(
        to,
        "💻 TechRehub Products",
        "Explore our software solutions and products:",
        "Select a product for detailed information",
        "View Products",
        sections
      );
    } catch (err) {
      _error(`Error sending product carousel: ${err.message}`);
      throw err;
    }
  }

  async sendServiceDetails(to, serviceId) {
    try {
      const service = techrehubServices.find(s => s.id === serviceId);
      if (!service) {
        return this.sendMessage(to, "Sorry, I couldn't find that service. Please try again.");
      }

      const featuresText = service.features.map(feature => `✓ ${feature}`).join('\n');

      const message = `🔧 *${service.name}*\n\n` +
        `${service.description}\n\n` +
        `💰 *Price:* ${service.price}\n` +
        `⏱️ *Duration:* ${service.duration}\n\n` +
        `*What's included:*\n${featuresText}\n\n` +
        `What would you like to do next?`;

      const buttons = [
        {
          type: 'reply',
          reply: {
            id: `book_${serviceId}`,
            title: '📅 Book Now'
          }
        },
        {
          type: 'reply',
          reply: {
            id: `quote_${serviceId}`,
            title: '💬 Get Quote'
          }
        },
        {
          type: 'reply',
          reply: {
            id: 'back_services',
            title: '⬅️ Back to Services'
          }
        }
      ];

      return this.sendInteractiveButtons(to, message, buttons);
    } catch (err) {
      _error(`Error sending service details: ${err.message}`);
      throw err;
    }
  }

  async sendProductDetails(to, productId) {
    try {
      const product = techrehubProducts.find(p => p.id === productId);
      if (!product) {
        return this.sendMessage(to, "Sorry, I couldn't find that product. Please try again.");
      }

      const featuresText = product.features.map(feature => `✓ ${feature}`).join('\n');

      const message = `💻 *${product.name}*\n\n` +
        `${product.description}\n\n` +
        `💰 *Price:* ${product.price}\n\n` +
        `*Key features:*\n${featuresText}\n\n` +
        `What would you like to do next?`;

      const buttons = [
        {
          type: 'reply',
          reply: {
            id: `demo_${productId}`,
            title: '🎯 Request Demo'
          }
        },
        {
          type: 'reply',
          reply: {
            id: `info_${productId}`,
            title: '📋 More Info'
          }
        },
        {
          type: 'reply',
          reply: {
            id: 'back_products',
            title: '⬅️ Back to Products'
          }
        }
      ];

      return this.sendInteractiveButtons(to, message, buttons);
    } catch (err) {
      _error(`Error sending product details: ${err.message}`);
      throw err;
    }
  }

  async handleQuickReply(to, payload) {
    try {
      if (payload.startsWith('service_')) {
        const serviceId = payload.replace('service_', '');
        return this.sendServiceDetails(to, serviceId);
      } else if (payload.startsWith('product_')) {
        const productId = payload.replace('product_', '');
        return this.sendProductDetails(to, productId);
      } else if (payload.startsWith('book_')) {
        const serviceId = payload.replace('book_', '');
        return this.handleBookingRequest(to, serviceId);
      } else if (payload.startsWith('quote_')) {
        const serviceId = payload.replace('quote_', '');
        return this.requestQuotation(to, serviceId);
      } else if (payload.startsWith('demo_')) {
        const productId = payload.replace('demo_', '');
        return this.requestProductDemo(to, productId);
      } else if (payload === 'back_services') {
        return this.sendServiceCarousel(to);
      } else if (payload === 'back_products') {
        return this.sendProductCarousel(to);
      } else if (payload === 'human_transfer') {
        return this.transferToHuman(to, 'User requested human assistance');
      }
    } catch (err) {
      _error(`Error handling quick reply: ${err.message}`);
      throw err;
    }
  }

  async requestProductDemo(to, productId) {
    try {
      const product = techrehubProducts.find(p => p.id === productId);
      if (!product) {
        return this.sendMessage(to, "Sorry, I couldn't find that product.");
      }

      const message = `🎯 *Request Demo for ${product.name}*\n\n` +
        `To schedule your personalized demo, please provide:\n\n` +
        `*1. Your Name*\n` +
        `*2. Company/Organization*\n` +
        `*3. Preferred Date & Time*\n` +
        `*4. Number of Users*\n\n` +
        `Format: Demo: [Name], [Company], [Date/Time], [Users]\n\n` +
        `Example: Demo: John Smith, ABC Corp, Tomorrow 2PM, 50 users`;

      await this.updateConversationState(to, {
        status: 'awaiting_demo_details',
        lastPrompt: 'demo_format',
        product: product.name
      });

      return this.sendMessage(to, message);
    } catch (err) {
      _error(`Error requesting product demo: ${err.message}`);
      throw err;
    }
  }

  // Helper method to validate and fix interactive list sections for WhatsApp API limits
  validateAndFixSections(sections) {
    const fixedSections = sections.map(section => {
      const fixedRows = section.rows.map(row => {
        // WhatsApp Interactive List limits:
        // - Row title: max 24 characters
        // - Row description: max 72 characters
        // - Section title: max 24 characters

        let title = row.title || '';
        let description = row.description || '';

        // Truncate title if too long
        if (title.length > 24) {
          title = title.substring(0, 21) + '...';
        }

        // Truncate description if too long
        if (description.length > 72) {
          description = description.substring(0, 69) + '...';
        }

        return {
          id: row.id,
          title: title,
          description: description
        };
      }).filter(row => row.title && row.id); // Remove rows without title or id

      // Fix section title
      let sectionTitle = section.title || '';
      if (sectionTitle.length > 24) {
        sectionTitle = sectionTitle.substring(0, 21) + '...';
      }

      return {
        title: sectionTitle,
        rows: fixedRows
      };
    }).filter(section => section.rows.length > 0); // Remove empty sections

    return fixedSections;
  }
}

// Create singleton instance
const whatsappService = new WhatsAppService();
export default whatsappService;