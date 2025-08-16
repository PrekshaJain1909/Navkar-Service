const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db.js");
const dashboardRoutes = require("./routes/dashboard.js");
const studentRoutes = require("./routes/studentRoutes.js");
const reportsRoutes = require("./routes/reportsRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const paymentsRoutes = require("./routes/payment.js");
const cron = require("node-cron");
const Student = require("./models/Student");
const recalculateDue = require("./utils/recalculateDue");

// Load environment variables and connect to DB
dotenv.config();
connectDB();

const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    "https://navkar-service-45dn.vercel.app",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

// Middlewares (ORDER MATTERS!)
app.use(cors(corsOptions)); // Only one CORS middleware needed
app.use(express.json());

// Routes
app.use("/api/students", studentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/payments", paymentsRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Cron job for monthly dues reset
cron.schedule("0 0 1 * *", async () => {
  console.log("Running monthly dues reset...");
  try {
    const students = await Student.find({ status: "active" });
    await Promise.all(students.map(s => {
      recalculateDue(s);
      return s.save();
    }));
    console.log("Monthly due reset complete.");
  } catch (error) {
    console.error("Error in monthly dues reset:", error);
  }
});