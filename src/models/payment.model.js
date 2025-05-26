import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  customer: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  method: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'ecocash', 'onemoney'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  reference: {
    type: String,
    unique: true,
    sparse: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  notes: String,
  metadata: {
    type: Map,
    of: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  refundedAt: Date
});

// Update timestamps before saving
paymentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.isModified('status')) {
    switch (this.status) {
      case 'completed':
        this.completedAt = new Date();
        break;
      case 'refunded':
        this.refundedAt = new Date();
        break;
    }
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
