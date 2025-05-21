import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Export models
export * from './models/user.model';
export * from './models/expense.model';

// Initialize environment variables
dotenv.config();

// Set mongoose options
mongoose.set('strictQuery', true);

// Database connection state
let isConnected = false;

/**
 * Connect to MongoDB
 */
export const connectToDatabase = async (): Promise<void> => {
    if (isConnected) {
        console.log('MongoDB is already connected');
        return;
    }

    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/household-expenses';

        await mongoose.connect(mongoUri);

        isConnected = true;
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectFromDatabase = async (): Promise<void> => {
    if (!isConnected) {
        return;
    }

    try {
        await mongoose.disconnect();
        isConnected = false;
        console.log('MongoDB disconnected successfully');
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
        throw error;
    }
};
