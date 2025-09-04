const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const seedDatabase = require("./scripts/seedDatabase");

const connectDB = require("./config/database");
const { errorHandler } = require("./middleware/errorHandler");
const routes = require("./routes");

const app = express();

// Connect to Database
connectDB();

// Seed Database
seedDatabase();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    status: false,
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api", limiter);

// Routes
app.use("/api", routes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: true,
    message: "VAATCO Backend API is running successfully",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
// app.use("/:*", (req, res) => {
//   res.status(404).json({
//     status: false,
//     message: "Route not found",
//   });
// });

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`VAATCO Backend server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
