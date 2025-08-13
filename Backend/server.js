// import express from "express";
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db.js");
const dashboardRoutes = require("./routes/dashboard.js");
const studentRoutes = require("./routes/studentRoutes.js");
const reportsRoutes = require("./routes/reportsRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const paymentsRoutes = require("./routes/payment.js");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use(cors({ origin: "http://localhost:3000",  credentials: true, }));
app.use("/api/students", studentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/payments", paymentsRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


const cron = require("node-cron");
const Student = require("./models/Student");
const recalculateDue = require("./utils/recalculateDue");

cron.schedule("0 0 1 * *", async () => {
  console.log("Running monthly dues reset...");
  const students = await Student.find({ status: "active" });

  for (let s of students) {
    recalculateDue(s); // apply extraPaid to new month’s due
    await s.save();
  }

  console.log("Monthly due reset complete.");
});
