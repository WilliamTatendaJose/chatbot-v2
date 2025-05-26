import { info, error as _error } from '../utils/logger.js';
import Payment from '../models/payment.model.js';
import Booking from '../models/booking.model.js';
import Quotation from '../models/quotation.model.js';

class PaymentTrackingService {
    async createPayment(paymentData) {
        try {
            const payment = await Payment.create(paymentData);
            info(`Payment created: ${payment._id}`);

            // Update associated booking or quotation
            if (payment.bookingId) {
                await Booking.findByIdAndUpdate(payment.bookingId, {
                    paymentStatus: payment.status === 'completed' ? 'paid' : 'pending'
                });
            } else if (payment.quotationId) {
                await Quotation.findByIdAndUpdate(payment.quotationId, {
                    status: payment.status === 'completed' ? 'accepted' : 'pending'
                });
            }

            return payment;
        } catch (err) {
            _error(`Error creating payment: ${err.message}`);
            throw err;
        }
    }

    async updatePaymentStatus(paymentId, status, metadata = {}) {
        try {
            const payment = await Payment.findByIdAndUpdate(
                paymentId,
                {
                    status,
                    ...metadata,
                    ...(status === 'completed' ? { paidAt: new Date() } : {})
                },
                { new: true }
            );

            if (!payment) {
                throw new Error('Payment not found');
            }

            // Update associated records
            if (payment.bookingId) {
                await Booking.findByIdAndUpdate(payment.bookingId, {
                    paymentStatus: status === 'completed' ? 'paid' : 'pending'
                });
            } else if (payment.quotationId) {
                await Quotation.findByIdAndUpdate(payment.quotationId, {
                    status: status === 'completed' ? 'accepted' : 'pending'
                });
            }

            return payment;
        } catch (err) {
            _error(`Error updating payment status: ${err.message}`);
            throw err;
        }
    }

    async processRefund(paymentId, amount, reason) {
        try {
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                throw new Error('Payment not found');
            }

            if (payment.status !== 'completed') {
                throw new Error('Can only refund completed payments');
            }

            if (amount > payment.amount) {
                throw new Error('Refund amount cannot exceed payment amount');
            }

            const updatedPayment = await Payment.findByIdAndUpdate(
                paymentId,
                {
                    status: 'refunded',
                    refundAmount: amount,
                    refundReason: reason,
                    refundDate: new Date()
                },
                { new: true }
            );

            // Update associated records
            if (payment.bookingId) {
                await Booking.findByIdAndUpdate(payment.bookingId, {
                    paymentStatus: 'refunded'
                });
            }

            return updatedPayment;
        } catch (err) {
            _error(`Error processing refund: ${err.message}`);
            throw err;
        }
    }

    async getPaymentsByCustomer(phone) {
        try {
            return await Payment.find({
                'customer.phone': phone
            }).sort({ createdAt: -1 });
        } catch (err) {
            _error(`Error getting customer payments: ${err.message}`);
            throw err;
        }
    }

    async getPaymentsByBooking(bookingId) {
        try {
            return await Payment.find({ bookingId }).sort({ createdAt: -1 });
        } catch (err) {
            _error(`Error getting booking payments: ${err.message}`);
            throw err;
        }
    }

    async getPaymentsByQuotation(quotationId) {
        try {
            return await Payment.find({ quotationId }).sort({ createdAt: -1 });
        } catch (err) {
            _error(`Error getting quotation payments: ${err.message}`);
            throw err;
        }
    }

    async getPaymentStats(startDate, endDate) {
        try {
            const stats = await Payment.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate },
                        status: 'completed'
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                            day: { $dayOfMonth: '$createdAt' }
                        },
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
                }
            ]);

            return stats;
        } catch (err) {
            _error(`Error getting payment stats: ${err.message}`);
            throw err;
        }
    }

    async validatePayment(paymentData) {
        const requiredFields = ['amount', 'paymentMethod', 'customer'];
        const missingFields = requiredFields.filter(field => !paymentData[field]);

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        if (!paymentData.bookingId && !paymentData.quotationId) {
            throw new Error('Either bookingId or quotationId must be provided');
        }

        return true;
    }
}

// Create singleton instance
const paymentTrackingService = new PaymentTrackingService();
export default paymentTrackingService; 