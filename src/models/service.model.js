import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['repair', 'maintenance', 'installation', 'consultation', 'other']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    min: 0,
    default: 60 // Default duration in minutes
  },
  keywords: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
serviceSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Service = mongoose.model('Service', serviceSchema);

export default Service;
