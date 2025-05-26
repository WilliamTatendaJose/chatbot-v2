import { createHmac, timingSafeEqual } from 'crypto';
import { info, error as _error } from '../utils/logger.js';
import { whatsapp, messenger } from '../config/index.js';
import whatsappService from '../services/whatsapp.service.js';
import messengerService from '../services/messenger.service.js';
import chatbotService from '../services/chatbot.service.js';
import paymentService from '../services/payment.service.js';
import { AppError } from '../utils/app-error.js';

// Async handler wrapper to catch errors
const catchAsync = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

class WebhookController {
  constructor() {
    this.whatsappService = whatsappService;
    this.messengerService = messengerService;
    this.chatbotService = chatbotService;
    this.paymentService = paymentService;
    info('Webhook controller initialized');
  }

  // WhatsApp webhook handler
  handleWhatsAppWebhook = catchAsync(async (req, res) => {
    // Handle GET request for webhook verification
    if (req.method === 'GET') {
      return this.verifyWhatsAppWebhook(req, res);
    }

    // Handle POST request for incoming messages
    if (req.method === 'POST') {
      return this.processWhatsAppMessage(req, res);
    }

    throw new AppError('Method not allowed', 405);
  });

  // WhatsApp webhook verification
  verifyWhatsAppWebhook = catchAsync(async (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    info(`WhatsApp webhook verification - Mode: ${mode}, Token: ${token}`);

    if (mode === 'subscribe' && token === whatsapp.webhookVerifyToken) {
      info('WhatsApp webhook verified successfully');
      return res.status(200).send(challenge);
    }

    warn('WhatsApp webhook verification failed');
    throw new AppError('Forbidden', 403);
  });
  // Process WhatsApp messages
  processWhatsAppMessage = catchAsync(async (req, res) => {
    try {
      const body = req.body;
      info(`WhatsApp webhook received: ${JSON.stringify(body, null, 2)}`);

      // Verify webhook signature
      if (!this.verifyWhatsAppSignature(req)) {
        warn('WhatsApp webhook signature verification failed');
        // Don't throw error, just log and return error response
        return res.status(403).json({ error: 'Invalid signature' });
      }

      // Process webhook payload
      if (body.object === 'whatsapp_business_account') {
        await Promise.all(body.entry?.map(async (entry) => {
          await Promise.all(entry.changes?.map(async (change) => {
            try {
              if (change.field === 'messages') {
                const value = change.value;
                
                // Process incoming messages
                if (value.messages) {
                  await Promise.all(value.messages.map(message => 
                    this.handleWhatsAppIncomingMessage(message, value)
                  ));
                }

                // Process message status updates
                if (value.statuses) {
                  value.statuses.forEach(status => 
                    this.handleWhatsAppMessageStatus(status)
                  );
                }
              }
            } catch (changeError) {
              _error(`Error processing WhatsApp change: ${changeError.message}`, changeError);
              // Continue processing other changes even if one fails
            }
          }));
        }));
      }

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      _error(`WhatsApp webhook error: ${error.message}`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  // Handle incoming WhatsApp messages
  async handleWhatsAppIncomingMessage(message, value) {
    try {
      const from = message.from;
      const messageType = message.type;
      
      info(`Processing WhatsApp message from ${from}, type: ${messageType}`);

      let messageText = '';
      let payload = null;
      
      // Extract message text based on type
      switch (messageType) {
        case 'text':
          messageText = message.text.body;
          break;
        case 'button':
          messageText = message.button.text;
          payload = message.button.payload;
          break;
        case 'interactive':
          if (message.interactive.type === 'button_reply') {
            messageText = message.interactive.button_reply.title;
            payload = message.interactive.button_reply.id;
          } else if (message.interactive.type === 'list_reply') {
            messageText = message.interactive.list_reply.title;
            payload = message.interactive.list_reply.id;
          }
          break;
        default:
          messageText = 'I can only process text messages at the moment.';
          await this.whatsappService.sendMessage(from, messageText);
          return;
      }

      // Handle quick reply payloads first
      if (payload) {
        await this.whatsappService.handleQuickReply(from, payload);
        return;
      }      // Process message through chatbot
      const response = await this.chatbotService.processMessage(messageText, {
        platform: 'whatsapp',
        userId: from,
        messageId: message.id
      });

      // Enhanced response handling with fallback
      let sendResult = null;
      
      // Handle special response types
      if (response.showCarousel === 'services') {
        sendResult = await this.whatsappService.sendServiceCarousel(from);
      } else if (response.showCarousel === 'products') {
        sendResult = await this.whatsappService.sendProductCarousel(from);
      } else {
        // Send regular text response
        sendResult = await this.whatsappService.sendMessage(from, response.text);
      }

      // If API call failed but we have fallback, provide immediate local response
      if (sendResult && sendResult.fallback) {
        await this.provideFallbackResponse(from, messageText, response);
      }

      // Handle workflow responses
      if (response.intent === 'booking.confirm') {
        await this.whatsappService.confirmBooking(from, response.details);
      } else if (response.intent === 'quotation.confirm') {
        await this.whatsappService.confirmQuotationRequest(from, response.details);
      }

      // Notify admin dashboard for important events
      if (['booking.confirm', 'quotation.confirm', 'transfer.human'].includes(response.intent)) {
        await this.notifyAdminDashboard(response.intent, {
          platform: 'whatsapp',
          userId: from,
          message: messageText,
          response: response
        });
      }

    } catch (error) {
      _error(`WhatsApp message handling error: ${error.message}`);
      await this.whatsappService.sendMessage(message.from, 'Sorry, I encountered an error. Please try again.');
    }
  }

  // Provide immediate fallback response when API calls fail
  async provideFallbackResponse(from, originalMessage, chatbotResponse) {
    try {
      info(`Providing fallback response for ${from}`);
      
      // Create immediate local response
      const fallbackMessage = {
        platform: 'whatsapp',
        userId: from,
        originalMessage: originalMessage,
        intendedResponse: chatbotResponse.text,
        timestamp: new Date(),
        status: 'api_failed_local_response'
      };
      
      // Log for admin dashboard
      info(`FALLBACK RESPONSE PROVIDED: User ${from} sent "${originalMessage}" - Intended response: "${chatbotResponse.text}"`);
      
      // Notify admin dashboard about the API failure
      await this.notifyAdminDashboard('api_failure', {
        platform: 'whatsapp',
        userId: from,
        message: originalMessage,
        intendedResponse: chatbotResponse.text,
        error: 'WhatsApp API authentication failed'
      });
      
      return fallbackMessage;
    } catch (error) {
      _error(`Error providing fallback response: ${error.message}`);
    }
  }

  // Handle WhatsApp message status updates
  handleWhatsAppMessageStatus(status) {
    info(`WhatsApp message status: ${status.status} for message ${status.id}`);
    // You can implement status tracking logic here
  }
  // Verify WhatsApp webhook signature
  verifyWhatsAppSignature(req) {
    try {
      const signature = req.headers['x-hub-signature-256'];
      if (!signature) {
        warn('Missing WhatsApp signature header');
        return false;
      }

      const elements = signature.split('=');
      if (elements.length !== 2) {
        warn('Invalid WhatsApp signature format');
        return false;
      }

      const signatureHash = elements[1];
      const expectedHash = createHmac('sha256', whatsapp.appSecret)
        .update(req.rawBody || '')
        .digest('hex');
      
      const isValid = timingSafeEqual(
        Buffer.from(signatureHash, 'hex'),
        Buffer.from(expectedHash, 'hex')
      );

      if (!isValid) {
        warn('WhatsApp signature mismatch');
        return false;
      }

      return true;
    } catch (error) {
      _error(`WhatsApp signature verification error: ${error.message}`);
      return false;
    }
  }

  // Messenger webhook handler
  handleMessengerWebhook = catchAsync(async (req, res) => {
    // Handle GET request for webhook verification
    if (req.method === 'GET') {
      return this.verifyMessengerWebhook(req, res);
    }

    // Handle POST request for incoming messages
    if (req.method === 'POST') {
      return this.processMessengerMessage(req, res);
    }

    throw new AppError('Method not allowed', 405);
  });

  // Messenger webhook verification
  verifyMessengerWebhook = catchAsync(async (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    info(`Messenger webhook verification - Mode: ${mode}, Token: ${token}`);

    if (mode === 'subscribe' && token === messenger.verifyToken) {
      info('Messenger webhook verified successfully');
      return res.status(200).send(challenge);
    }

    warn('Messenger webhook verification failed');
    throw new AppError('Forbidden', 403);
  });
  // Process Messenger messages
  processMessengerMessage = catchAsync(async (req, res) => {
    try {
      const body = req.body;
      info(`Messenger webhook received: ${JSON.stringify(body, null, 2)}`);

      // Verify webhook signature
      if (!this.verifyMessengerSignature(req)) {
        warn('Messenger webhook signature verification failed');
        // Don't throw error, just log and return error response
        return res.status(403).json({ error: 'Invalid signature' });
      }

      // Process webhook payload
      if (body.object === 'page') {
        await Promise.all(body.entry?.map(async (entry) => {
          await Promise.all(entry.messaging?.map(async (event) => {
            try {
              // Add logging for Messenger events
              if (event.message || event.postback) {
                console.log('Messenger Event:', JSON.stringify(event, null, 2));
              }

              // Guard to prevent forwarding generic messages to WhatsApp
              if (event.message && !event.message.text) {
                console.log('Generic or intentless message detected. Not forwarding to WhatsApp.');
                return;
              }

              if (event.message) {
                await this.handleMessengerIncomingMessage(event);
              } else if (event.postback) {
                await this.handleMessengerPostback(event);
              }
            } catch (eventError) {
              _error(`Error processing Messenger event: ${eventError.message}`, eventError);
              // Continue processing other events even if one fails
            }
          }));
        }));
      }

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      _error(`Messenger webhook error: ${error.message}`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  // Handle incoming Messenger messages
  async handleMessengerIncomingMessage(event) {
    try {
      const senderId = event.sender.id;
      const messageText = event.message.text;
      
      info(`Processing Messenger message from ${senderId}: ${messageText}`);

      // Handle direct workflow commands first
      if (messageText.toLowerCase().startsWith('book:')) {
        const details = messageText.substring(5).trim();
        return await this.messengerService.confirmBooking(senderId, details);
      } else if (messageText.toLowerCase().startsWith('quote:')) {
        const details = messageText.substring(6).trim();
        return await this.messengerService.confirmQuotationRequest(senderId, details);
      } else if (messageText.toLowerCase().startsWith('productquote:')) {
        const details = messageText.substring(13).trim();
        return await this.messengerService.confirmProductQuotationRequest(senderId, details);
      } else if (messageText.toLowerCase().startsWith('demo:')) {
        const details = messageText.substring(5).trim();
        return await this.messengerService.confirmDemoRequest(senderId, details);
      }

      // Process message through chatbot
      const response = await this.chatbotService.processMessage(messageText, {
        platform: 'messenger',
        userId: senderId,
        messageId: event.message.mid
      });

      // Handle special response types
      if (response.showCarousel === 'services') {
        await this.messengerService.sendServiceCarousel(senderId);
      } else if (response.showCarousel === 'products') {
        await this.messengerService.sendProductCarousel(senderId);
      } else {
        // Send regular text response
        await this.messengerService.sendMessage(senderId, response.text);
      }

      // Handle workflow responses
      if (response.intent === 'booking.confirm') {
        await this.messengerService.confirmBooking(senderId, response.details);
      } else if (response.intent === 'quotation.confirm') {
        await this.messengerService.confirmQuotationRequest(senderId, response.details);
      } else if (response.intent === 'product.quotation.confirm') {
        await this.messengerService.confirmProductQuotationRequest(senderId, response.details);
      }

      // Notify admin dashboard for important events
      if (['booking.confirm', 'quotation.confirm', 'product.quotation.confirm', 'transfer.human'].includes(response.intent)) {
        await this.notifyAdminDashboard(response.intent, {
          platform: 'messenger',
          userId: senderId,
          message: messageText,
          response: response
        });
      }

    } catch (error) {
      _error(`Messenger message handling error: ${error.message}`);
      await this.messengerService.sendMessage(event.sender.id, 'Sorry, I encountered an error. Please try again.');
    }
  }

  // Handle Messenger postbacks
  async handleMessengerPostback(event) {
    try {
      const senderId = event.sender.id;
      const payload = event.postback.payload;
      
      info(`Processing Messenger postback from ${senderId}: ${payload}`);

      await this.messengerService.handlePostback(senderId, payload);

    } catch (error) {
      _error(`Messenger postback handling error: ${error.message}`);
      await this.messengerService.sendMessage(event.sender.id, 'Sorry, I encountered an error. Please try again.');
    }
  }

  // Admin dashboard notification system
  async notifyAdminDashboard(eventType, data) {
    try {
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: eventType,
        platform: data.platform,
        userId: data.userId,
        message: data.message,
        timestamp: new Date(),
        status: 'unread',
        data: data.response
      };

      // In a real implementation, this would save to database and send real-time notifications
      // For now, we'll log it and could use WebSockets or Server-Sent Events
      info(`Admin notification: ${JSON.stringify(notification)}`);
      
      // You could implement WebSocket broadcasting here
      // this.broadcastToAdmins(notification);
      
      return notification;
    } catch (error) {
      _error(`Error sending admin notification: ${error.message}`);
    }
  }

  // Verify Messenger webhook signature
  verifyMessengerSignature(req) {
    try {
      const signature = req.headers['x-hub-signature-256'];
      if (!signature) {
        warn('Missing Messenger signature header');
        return false;
      }

      const elements = signature.split('=');
      if (elements.length !== 2) {
        warn('Invalid Messenger signature format');
        return false;
      }

      const signatureHash = elements[1];
      const expectedHash = createHmac('sha256', messenger.appSecret)
        .update(req.rawBody || '')
        .digest('hex');
      
      const isValid = timingSafeEqual(
        Buffer.from(signatureHash, 'hex'),
        Buffer.from(expectedHash, 'hex')
      );

      if (!isValid) {
        warn('Messenger signature verification failed');
      }

      return isValid;
    } catch (error) {
      _error(`Messenger signature verification error: ${error.message}`);
      return false;
    }
  }

  // Handle Paynow payment callbacks
  async handlePaynowCallback(req, res) {
    try {
      info(`Paynow callback received: ${JSON.stringify(req.body, null, 2)}`);

      // Process payment callback
      const result = await this.paymentService.handlePaymentCallback(req.body);
      
      if (result.success) {
        info(`Payment callback processed successfully: ${result.transactionId}`);
        res.status(200).json({ status: 'ok', message: 'Payment processed' });
      } else {
        _error(`Payment callback processing failed: ${result.error}`);
        res.status(400).json({ status: 'error', message: result.error });
      }
    } catch (error) {
      _error(`Paynow callback error: ${error.message}`);
      res.status(500).json({ error: 'Payment callback processing failed' });
    }
  }
}

// Create singleton instance
const webhookController = new WebhookController();

// Export handler methods
export function handleWhatsAppWebhook(req, res) { return webhookController.handleWhatsAppWebhook(req, res); }
export function handleMessengerWebhook(req, res) { return webhookController.handleMessengerWebhook(req, res); }
export function handlePaynowCallback(req, res) { return webhookController.handlePaynowCallback(req, res); }