const express = require("express");
const Student = require("../models/Student");
const Stats = require("../models/Stats");

const router = express.Router();

// Reset total collected amount
router.post("/reset-total", async (req, res) => {
  try {
    // Reset all students' totals
    await Student.updateMany({}, { 
      $set: { 
        totalCollected: 0,
        extraPaid: 0
      } 
    });

    // Reset stats collection
    await Stats.findOneAndUpdate(
      {},
      { $set: { totalCollected: 0 } },
      { upsert: true }
    );

    res.json({ 
      success: true, 
      message: "All totals reset to 0",
      data: {
        studentsReset: (await Student.find({})).length,
        statsReset: 1
      }
    });

  } catch (error) {
    console.error("Error resetting total:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during reset",
      error: error.message 
    });
  }
});

// Record payment for a student
router.post("/:id/pay", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, mode, period } = req.body;

    // Validation
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ message: "Amount must be a valid number" });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be positive" });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Payment processing
    let paymentRemaining = amount;
    let overPayment = 0;

    // 1. Apply to current due
    if (paymentRemaining > 0 && student.dueAmount > 0) {
      const amountToDeduct = Math.min(paymentRemaining, student.dueAmount);
      student.dueAmount -= amountToDeduct;
      paymentRemaining -= amountToDeduct;
    }

    // 2. Any leftover goes to extraPaid
    if (paymentRemaining > 0) {
      student.extraPaid = (student.extraPaid || 0) + paymentRemaining;
      overPayment = paymentRemaining;
    }

    // 3. Update student records
    student.paymentStatus = student.dueAmount <= 0 ? "completed" : "pending";
    student.totalCollected = (student.totalCollected || 0) + amount;
    student.lastPaymentAmount = amount;
    student.lastPaymentDate = new Date();
    student.lastPaymentMode = mode || "Cash";
    student.lastPaymentPeriod = period;

    student.paymentsReceived.push({
      amount,
      date: new Date(),
      mode: mode || "Cash",
      period,
      extraPaid: overPayment
    });

    await student.save();

    // 4. Update global stats
    const stats = await Stats.findOneAndUpdate(
      {},
      { $inc: { totalCollected: amount } },
      { new: true, upsert: true }
    );

    res.json({ 
      success: true,
      message: "Payment recorded successfully",
      data: {
        student,
        stats
      }
    });

  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error processing payment",
      error: err.message 
    });
  }
});

// Get dashboard stats
router.get("/dashboard", async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const pendingStudents = await Student.countDocuments({ paymentStatus: "pending" });
    
    const stats = await Stats.findOne();
    const totalCollected = stats?.totalCollected || 0;

    // Calculate this month's collection
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyPayments = await Student.aggregate([
      { $unwind: "$paymentsReceived" },
      { 
        $match: { 
          "paymentsReceived.date": { $gte: firstDay } 
        } 
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$paymentsReceived.amount" }
        }
      }
    ]);

    const thisMonthCollection = monthlyPayments[0]?.total || 0;

    // Get recent payments
    const recentPayments = await Student.aggregate([
      { $unwind: "$paymentsReceived" },
      { $sort: { "paymentsReceived.date": -1 } },
      { $limit: 5 },
      {
        $project: {
          studentName: "$name",
          amount: "$paymentsReceived.amount",
          date: "$paymentsReceived.date",
          mode: "$paymentsReceived.mode",
          dueAmount: "$dueAmount"
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalCollected,
          pendingDues: pendingStudents,
          thisMonthCollection
        },
        recentPayments
      }
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching dashboard data",
      error: error.message 
    });
  }
});

module.exports = router;