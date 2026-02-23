/**
 * MongoDB Connection Module
 * Handles connection to MongoDB database
 */

import mongoose from 'mongoose';
import { log } from 'console';

const MONGODB_URI = process.env.MONGODB_URI || "" ;

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    log(`Error connecting to MongoDB: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  log(`MongoDB error: ${err.message}`);
});

export default mongoose;

