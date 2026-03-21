const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is missing. Set it in Render Environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error("ℹ️ Ensure MongoDB Atlas Network Access allows Render (temporarily 0.0.0.0/0 for testing).");
    process.exit(1);
  }
};

module.exports = connectDB;
