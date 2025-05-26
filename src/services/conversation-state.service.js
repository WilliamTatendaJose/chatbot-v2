import { info, error as _error } from '../utils/logger.js';
import Session from '../models/session.model.js';

// Manages conversation state and context for the chatbot
class ConversationStateService {
  constructor() {
    this.conversations = new Map();
  }

  async initializeState(userId, platform) {
    try {
      let session = await Session.findOne({ userId, platform });

      if (!session) {
        session = await Session.create({
          userId,
          platform,
          state: 'initial',
          context: {},
          lastActivity: new Date()
        });
      }

      // Cache the session
      this.conversations.set(userId, {
        ...session.toObject(),
        lastInteraction: new Date()
      });

      return session;
    } catch (err) {
      _error(`Error initializing state: ${err.message}`);
      throw err;
    }
  }

  async getState(userId) {
    try {
      let state = this.conversations.get(userId);

      if (!state) {
        const session = await Session.findOne({ userId });
        if (session) {
          state = {
            ...session.toObject(),
            lastInteraction: new Date()
          };
          this.conversations.set(userId, state);
        } else {
          state = {
            userId,
            stage: 'initial',
            context: {},
            lastInteraction: new Date(),
            history: []
          };
        }
      }

      return state;
    } catch (err) {
      _error(`Error getting state: ${err.message}`);
      throw err;
    }
  }

  async updateState(userId, updates) {
    try {
      const currentState = await this.getState(userId);
      const updatedState = {
        ...currentState,
        ...updates,
        lastInteraction: new Date()
      };

      // Update cache
      this.conversations.set(userId, updatedState);

      // Update database
      await Session.findOneAndUpdate(
        { userId },
        {
          state: updatedState.stage,
          context: updatedState.context,
          lastActivity: new Date()
        },
        { upsert: true }
      );

      return updatedState;
    } catch (err) {
      _error(`Error updating state: ${err.message}`);
      throw err;
    }
  }

  async clearState(userId) {
    try {
      // Clear from cache
      this.conversations.delete(userId);

      // Clear from database
      await Session.findOneAndDelete({ userId });
    } catch (err) {
      _error(`Error clearing state: ${err.message}`);
      throw err;
    }
  }

  addToHistory(userId, message) {
    const state = this.conversations.get(userId);
    if (state) {
      if (!state.history) {
        state.history = [];
      }
      state.history.push({
        content: message,
        timestamp: new Date()
      });
      this.conversations.set(userId, state);
    }
  }

  getHistory(userId) {
    const state = this.conversations.get(userId);
    return state?.history || [];
  }

  isStale(userId, timeoutMinutes = 30) {
    const state = this.conversations.get(userId);
    if (!state) return true;

    const now = new Date();
    const diff = (now - state.lastInteraction) / (1000 * 60); // Convert to minutes
    return diff > timeoutMinutes;
  }

  // Validate required fields for different stages
  validateFields(stage, data) {
    const requiredFields = {
      booking: ['name', 'date', 'time', 'service'],
      quotation: ['name', 'requirements'],
      payment: ['amount', 'service', 'paymentMethod']
    };

    const fields = requiredFields[stage];
    if (!fields) return { valid: true };

    const missing = fields.filter(field => !data[field]);
    return {
      valid: missing.length === 0,
      missing
    };
  }

  setStage(userId, stage, context = {}) {
    return this.updateState(userId, {
      stage,
      context: { ...this.getState(userId).context, ...context }
    });
  }
}

// Create singleton instance
const conversationState = new ConversationStateService();
export default conversationState;
