import 'dotenv/config';
import { createSampleQuizzes } from './utils/seedQuizzes.js';
import connectDB from './config/db.js';
import mongoose from 'mongoose';

const runSeeder = async () => {
  try {
    await connectDB();
    
    const result = await createSampleQuizzes();
    
    if (result.success) {
      console.log('✅ Sample quizzes created successfully!');
      console.log(result.message);
      console.log('Data:', result.data);
    } else {
      console.log('❌ Failed to create sample quizzes');
      console.log(result.message);
      if (result.error) {
        console.log('Error:', result.error);
      }
    }
    
  } catch (error) {
    console.error('Error running seeder:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

runSeeder();
