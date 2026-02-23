/**
 * MongoDB Connection Module
 * Handles connection to MongoDB database
 */

import mongoose from 'mongoose';
import { log } from 'console';

const MONGODB_URI = "mongodb+srv://admin:navneet@cluster0.juvuasp.mongodb.net/?appName=Cluster0";

export const connectDB = async (): Promise<void> => {
  try {
    console.log("mongo_url", MONGODB_URI);
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

