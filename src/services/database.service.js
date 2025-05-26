import { info, error as _error } from '../utils/logger.js';
import Session from '../models/session.model.js';
import Booking from '../models/booking.model.js';
import Quotation from '../models/quotation.model.js';

class DatabaseService {
  // Session Management
  async getSession(userId, platform) {
    try {
      let session = await Session.findOne({ userId, platform });

      if (!session) {
        session = await Session.create({
          userId,
          platform,
          state: 'idle',
          context: {}
        });
      }

      return session;
    } catch (error) {
      _error(`Error getting session: ${error.message}`);
      throw error;
    }
  }

  async updateSession(userId, platform, updates) {
    try {
      const session = await Session.findOneAndUpdate(
        { userId, platform },
        { ...updates, lastActivity: Date.now() },
        { new: true, upsert: true }
      );

      return session;
    } catch (error) {
      _error(`Error updating session: ${error.message}`);
      throw error;
    }
  }

  // Booking Management
  async createBooking(bookingData) {
    try {
      const booking = await Booking.create(bookingData);
      info(`New booking created: ${booking._id}`);
      return booking;
    } catch (error) {
      _error(`Error creating booking: ${error.message}`);
      throw error;
    }
  }

  async getBookingsByPhone(phoneNumber) {
    try {
      return await Booking.find({ phoneNumber }).sort({ dateTime: 1 });
    } catch (error) {
      _error(`Error getting bookings: ${error.message}`);
      throw error;
    }
  }

  async updateBooking(bookingId, updates) {
    try {
      const booking = await Booking.findByIdAndUpdate(
        bookingId,
        updates,
        { new: true }
      );
      return booking;
    } catch (error) {
      _error(`Error updating booking: ${error.message}`);
      throw error;
    }
  }

  // Quotation Management
  async createQuotation(quotationData) {
    try {
      const quotation = await Quotation.create(quotationData);
      info(`New quotation created: ${quotation._id}`);
      return quotation;
    } catch (error) {
      _error(`Error creating quotation: ${error.message}`);
      throw error;
    }
  }

  async getQuotationsByPhone(phoneNumber) {
    try {
      return await Quotation.find({ phoneNumber }).sort({ createdAt: -1 });
    } catch (error) {
      _error(`Error getting quotations: ${error.message}`);
      throw error;
    }
  }

  async updateQuotation(quotationId, updates) {
    try {
      const quotation = await Quotation.findByIdAndUpdate(
        quotationId,
        updates,
        { new: true }
      );
      return quotation;
    } catch (error) {
      _error(`Error updating quotation: ${error.message}`);
      throw error;
    }
  }

  // Helper function to parse booking data from message
  parseBookingData(message, phoneNumber, platform) {
    try {
      // Expected format: "Name, Date Time, Description"
      const parts = message.split(',').map(part => part.trim());

      if (parts.length < 3) {
        throw new Error('Invalid booking format');
      }

      const name = parts[0];
      const dateTimeStr = parts[1];
      const description = parts.slice(2).join(', '); // Everything after the second comma is the description

      // Simple date parsing - in production, use a more robust solution
      const dateTime = new Date(dateTimeStr);

      // Determine service from description (simplified)
      let service = 'Computer Repair'; // Default
      const lowerDesc = description.toLowerCase();

      if (lowerDesc.includes('network') || lowerDesc.includes('wifi')) {
        service = 'Network Setup';
      } else if (lowerDesc.includes('data') || lowerDesc.includes('recover') || lowerDesc.includes('file')) {
        service = 'Data Recovery';
      } else if (lowerDesc.includes('virus') || lowerDesc.includes('malware')) {
        service = 'Virus Removal';
      } else if (lowerDesc.includes('upgrade') || lowerDesc.includes('performance')) {
        service = 'System Upgrade';
      }

      return {
        name,
        phoneNumber,
        service,
        dateTime,
        description,
        platform,
        status: 'pending'
      };
    } catch (error) {
      _error(`Error parsing booking data: ${error.message}`);
      throw new Error('Could not parse booking information. Please provide your name, date/time, and description.');
    }
  }

  // Helper function to parse quotation data from message
  parseQuotationData(message, phoneNumber, platform) {
    try {
      // Expected format: "Name, Service, Requirements"
      const parts = message.split(',').map(part => part.trim());

      if (parts.length < 3) {
        throw new Error('Invalid quotation format');
      }

      const name = parts[0];
      const service = parts[1];
      const requirements = parts.slice(2).join(', '); // Everything after the second comma is the requirements

      return {
        name,
        phoneNumber,
        service,
        requirements,
        platform,
        status: 'pending'
      };
    } catch (error) {
      _error(`Error parsing quotation data: ${error.message}`);
      throw new Error('Could not parse quotation information. Please provide your name, service, and requirements.');
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();
export default databaseService;
