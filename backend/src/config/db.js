import mongoose from 'mongoose';

async function connectDatabase(mongodbUri) {
  if (!mongodbUri) {
    throw new Error('MONGODB_URI is not set. Add it to backend/.env');
  }

  await mongoose.connect(mongodbUri);
  console.log('MongoDB connected');
}

export { connectDatabase };
