import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema({
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
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  requirements: {
    type: String,
    required: true
  },
  timeline: String,
  budget: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  quotedAmount: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'quoted', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  validUntil: {
    type: Date,
    default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) // 30 days from creation
  },
  notes: String,
  terms: String,
  attachments: [{
    url: String,
    filename: String,
    mimetype: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: Date,
  acceptedAt: Date,
  rejectedAt: Date
});

// Update timestamps before saving
quotationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.isModified('status')) {
    switch (this.status) {
      case 'quoted':
        this.respondedAt = new Date();
        break;
      case 'accepted':
        this.acceptedAt = new Date();
        break;
      case 'rejected':
        this.rejectedAt = new Date();
        break;
    }
  }
  next();
});

// Check if quotation has expired
quotationSchema.methods.isExpired = function () {
  return this.validUntil && this.validUntil < new Date();
};

// Extend validity
quotationSchema.methods.extendValidity = function (days = 30) {
  this.validUntil = new Date(+new Date() + days * 24 * 60 * 60 * 1000);
  return this.save();
};

const Quotation = mongoose.model('Quotation', quotationSchema);

export default Quotation;
