import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    platform: {
        type: String,
        enum: ['whatsapp', 'messenger', 'web'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'transferred', 'closed'],
        default: 'active'
    },
    topic: {
        type: String,
        trim: true
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    messages: [{
        content: {
            type: String,
            required: true
        },
        from: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['user', 'bot', 'agent'],
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    assignedAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastMessage: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    closedAt: Date
});

// Update timestamps before saving
chatSessionSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    if (this.isModified('status') && this.status === 'closed' && !this.closedAt) {
        this.closedAt = new Date();
    }
    next();
});

// Add message to session
chatSessionSchema.methods.addMessage = function (content, from, type = 'user') {
    this.messages.push({ content, from, type });
    this.lastMessage = new Date();
    return this.save();
};

// Check if session is stale (no activity for 30 minutes)
chatSessionSchema.methods.isStale = function () {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return this.lastMessage < thirtyMinutesAgo;
};

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession; 