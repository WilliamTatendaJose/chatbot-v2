import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  platform: {
    type: String,
    required: [true, 'Platform is required'],
    enum: ['whatsapp', 'messenger', 'unknown'],
    default: 'unknown'
  },
  state: {
    type: String,
    default: 'initial'
  },
  context: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  history: [{
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastActivity on save
sessionSchema.pre('save', function (next) {
  this.lastActivity = new Date();
  next();
});

// Create indexes
sessionSchema.index({ userId: 1, platform: 1 }, { unique: true });
sessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 24 * 60 * 60 }); // TTL index for 24 hours

const Session = mongoose.model('Session', sessionSchema);
export default Session;
