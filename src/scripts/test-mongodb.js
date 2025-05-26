// Test MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');
const { MONGODB_URI } = process.env;

console.log('Attempting to connect to MongoDB...');
console.log(`Connection string: ${MONGODB_URI.replace(/mongodb\+srv:\/\/[^:]+:([^@]+)@/, 'mongodb+srv://[username]:[hidden]@')}`);

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully!');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
