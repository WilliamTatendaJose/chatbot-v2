import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  customer: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    start: {
      type: String,
      required: true
    },
    end: String
  },
  duration: {
    type: Number,
    min: 0,
    default: 60 // Duration in minutes
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded'],
      default: 'pending'
    },
    amount: {
      type: Number,
      min: 0
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'ecocash', 'onemoney']
    },
    transactionId: String,
    paidAmount: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  notes: String,
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'whatsapp']
    },
    sentAt: Date,
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed']
    }
  }],
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
  confirmedAt: Date,
  completedAt: Date,
  cancelledAt: Date
});

// Update timestamps before saving
bookingSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.isModified('status')) {
    switch (this.status) {
      case 'confirmed':
        this.confirmedAt = new Date();
        break;
      case 'completed':
        this.completedAt = new Date();
        break;
      case 'cancelled':
        this.cancelledAt = new Date();
        break;
    }
  }
  next();
});

// Calculate end time based on start time and duration
bookingSchema.pre('save', function (next) {
  if (this.isModified('time.start') || this.isModified('duration')) {
    const [hours, minutes] = this.time.start.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0);
    const endDate = new Date(startDate.getTime() + this.duration * 60000);
    this.time.end = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  }
  next();
});

// Check if booking time has passed
bookingSchema.methods.hasPassed = function () {
  const bookingDate = new Date(this.date);
  const [hours, minutes] = this.time.end.split(':').map(Number);
  bookingDate.setHours(hours, minutes, 0);
  return bookingDate < new Date();
};

// Calculate remaining payment
bookingSchema.methods.getRemainingPayment = function () {
  return this.payment.amount - this.payment.paidAmount;
};

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
