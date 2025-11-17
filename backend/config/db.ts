import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    // Determine which MongoDB URI to use based on NODE_ENV
    const isProduction = process.env.NODE_ENV === "production";
    const mongoURI = isProduction
      ? process.env.PROD_MONGO_URI
      : process.env.DEV_MONGO_URI;

    if (!mongoURI) {
      throw new Error(
        `MongoDB URI not found. Please set ${isProduction ? 'PROD_MONGO_URI' : 'DEV_MONGO_URI'} in .env file`
      );
    }

    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Connecting to: ${isProduction ? 'Production' : 'Development'} Database`);

    await mongoose.connect(mongoURI, {
      maxPoolSize: isProduction ? 50 : 20,  // More connections in production
      minPoolSize: isProduction ? 10 : 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    console.log(`📊 Database: ${mongoose.connection.name}`);

  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📴 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 MongoDB connection closed due to app termination');
  process.exit(0);
});

export default connectDB;
