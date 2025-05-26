import mongoose from 'mongoose';
import { mongodb } from '../config/index.js';
import { info, error as _error } from '../utils/logger.js';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    info('Using existing database connection');
    return;
  }

  if (!mongodb.uri) {
    throw new Error('MongoDB URI is not configured in environment variables');
  }

  try {
    await mongoose.connect(mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    isConnected = true;

    // Handle initial connection errors
    mongoose.connection.on('error', (err) => {
      _error(`MongoDB connection error: ${err.message}`);
      process.exit(1);
    });

    // Handle disconnections
    mongoose.connection.on('disconnected', () => {
      _error('MongoDB disconnected. Attempting to reconnect...');
    });

    // Handle successful reconnection
    mongoose.connection.on('reconnected', () => {
      info('MongoDB reconnected successfully');
    });

    info('MongoDB connected successfully');
  } catch (err) {
    _error(`MongoDB connection error: ${err.message}`);
    throw err;
  }
};

export const disconnectDB = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    info('MongoDB disconnected');
  } catch (err) {
    _error('Error disconnecting from MongoDB:', err.message);
    throw err;
  }
};
