const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection pool — keep multiple connections ready
      maxPoolSize: 10,
      minPoolSize: 2,

      // Timeouts — fail fast instead of hanging
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,

      // Heartbeat — detect dead connections quickly
      heartbeatFrequencyMS: 10000,

      // Auto-reconnect settings
      retryWrites: true,
      retryReads: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected — will auto-reconnect");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
