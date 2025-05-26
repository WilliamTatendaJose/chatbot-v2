import { Router } from 'express';
import { handleWhatsAppWebhook, handleMessengerWebhook, handlePaynowCallback } from '../controllers/webhook.controller.js';

const router = Router();

// WhatsApp webhook endpoints
router.get('/webhook/whatsapp', handleWhatsAppWebhook);
router.post('/webhook/whatsapp', handleWhatsAppWebhook);

// Messenger webhook endpoints
router.get('/webhook/messenger', handleMessengerWebhook);
router.post('/webhook/messenger', handleMessengerWebhook);

// Paynow payment callback endpoint
router.post('/payments/callback', handlePaynowCallback);

export default router;
