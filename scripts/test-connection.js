import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '..', 'packages', 'database', '.env') });

// Connection URI from environment variables or default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/household-expenses';

console.log('Testing MongoDB connection...');
console.log(`Attempting to connect to: ${MONGODB_URI}`);

async function testConnection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('\n✅ MongoDB connection successful!\n');
    
    // Check database stats
    const db = mongoose.connection.db;
    const stats = await db.stats();
    
    console.log('Database Information:');
    console.log('--------------------');
    console.log(`Database: ${db.databaseName}`);
    console.log(`Collections: ${stats.collections}`);
    console.log(`Documents: ${stats.objects}`);
    console.log(`Storage size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    
    // List collections
    console.log('\nCollections:');
    console.log('--------------------');
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('No collections found. Database is empty.');
    } else {
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`- ${collection.name} (${count} documents)`);
      }
    }
    
    console.log('\nConnection test completed successfully.');
  } catch (error) {
    console.error('\n❌ MongoDB connection failed:');
    console.error(error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('\nConnection closed.');
  }
}

testConnection();
