import express from 'express';
import { asyncHandler } from '../middlewares/async.middleware.js';
import { AppError } from '../utils/app-error.js';
import Payment from '../models/payment.model.js';
import paymentTrackingService from '../services/payment-tracking.service.js';
import { info, error as _error } from '../utils/logger.js';

const router = express.Router();

// EcoCash webhook
router.post('/ecocash', asyncHandler(async (req, res) => {
    const { reference, status, amount, transactionId } = req.body;

    info(`Received EcoCash webhook: ${JSON.stringify(req.body)}`);

    if (!reference || !status || !amount || !transactionId) {
        throw new AppError('Invalid webhook payload', 400);
    }

    const payment = await Payment.findById(reference);
    if (!payment) {
        throw new AppError('Payment not found', 404);
    }

    // Verify amount matches
    if (payment.amount !== parseFloat(amount)) {
        _error(`Amount mismatch: Expected ${payment.amount}, got ${amount}`);
        throw new AppError('Amount mismatch', 400);
    }

    await paymentTrackingService.updatePaymentStatus(
        payment._id,
        status === 'SUCCESS' ? 'completed' : 'failed',
        {
            provider: 'ecocash',
            transactionId,
            rawResponse: req.body
        }
    );

    res.json({ success: true });
}));

// OneMoney webhook
router.post('/onemoney', asyncHandler(async (req, res) => {
    const { reference, status, amount, transactionId } = req.body;

    info(`Received OneMoney webhook: ${JSON.stringify(req.body)}`);

    if (!reference || !status || !amount || !transactionId) {
        throw new AppError('Invalid webhook payload', 400);
    }

    const payment = await Payment.findById(reference);
    if (!payment) {
        throw new AppError('Payment not found', 404);
    }

    // Verify amount matches
    if (payment.amount !== parseFloat(amount)) {
        _error(`Amount mismatch: Expected ${payment.amount}, got ${amount}`);
        throw new AppError('Amount mismatch', 400);
    }

    await paymentTrackingService.updatePaymentStatus(
        payment._id,
        status === 'SUCCESS' ? 'completed' : 'failed',
        {
            provider: 'onemoney',
            transactionId,
            rawResponse: req.body
        }
    );

    res.json({ success: true });
}));

// Bank transfer webhook
router.post('/bank-transfer', asyncHandler(async (req, res) => {
    const { reference, status, amount, transactionId, accountNumber } = req.body;

    info(`Received bank transfer webhook: ${JSON.stringify(req.body)}`);

    if (!reference || !status || !amount || !transactionId || !accountNumber) {
        throw new AppError('Invalid webhook payload', 400);
    }

    const payment = await Payment.findById(reference);
    if (!payment) {
        throw new AppError('Payment not found', 404);
    }

    // Verify amount matches
    if (payment.amount !== parseFloat(amount)) {
        _error(`Amount mismatch: Expected ${payment.amount}, got ${amount}`);
        throw new AppError('Amount mismatch', 400);
    }

    await paymentTrackingService.updatePaymentStatus(
        payment._id,
        status === 'SUCCESS' ? 'completed' : 'failed',
        {
            provider: 'bank_transfer',
            transactionId,
            accountNumber,
            rawResponse: req.body
        }
    );

    res.json({ success: true });
}));

// Card payment webhook
router.post('/card', asyncHandler(async (req, res) => {
    const { reference, status, amount, transactionId, last4, brand } = req.body;

    info(`Received card payment webhook: ${JSON.stringify(req.body)}`);

    if (!reference || !status || !amount || !transactionId) {
        throw new AppError('Invalid webhook payload', 400);
    }

    const payment = await Payment.findById(reference);
    if (!payment) {
        throw new AppError('Payment not found', 404);
    }

    // Verify amount matches
    if (payment.amount !== parseFloat(amount)) {
        _error(`Amount mismatch: Expected ${payment.amount}, got ${amount}`);
        throw new AppError('Amount mismatch', 400);
    }

    await paymentTrackingService.updatePaymentStatus(
        payment._id,
        status === 'SUCCESS' ? 'completed' : 'failed',
        {
            provider: 'card',
            transactionId,
            cardLast4: last4,
            cardBrand: brand,
            rawResponse: req.body
        }
    );

    res.json({ success: true });
}));

// Generic payment status check
router.get('/:paymentId/status', asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) {
        throw new AppError('Payment not found', 404);
    }

    res.json({
        status: payment.status,
        amount: payment.amount,
        method: payment.paymentMethod,
        updatedAt: payment.updatedAt
    });
}));

export default router; 