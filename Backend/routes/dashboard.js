// routes/dashboard.js
const express = require("express");
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Stats = require("../models/Stats");
const router = express.Router();

function toObjectId(value) {
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }

  return value;
}

router.get("/", async (req, res) => {
  try {
    const ownerId = req.user && req.user.sub;
    const ownerObjectId = toObjectId(ownerId);

    // Get all active students
    const students = await Student.find({ status: 'active', owner: ownerId });
    
    // ✅ Lifetime total collected (from Stats collection for accuracy)
    const statsDoc = await Stats.findOne({ owner: ownerId });
    const totalFeesCollected = statsDoc ? statsDoc.totalCollected : 0;

    // Calculate total due amount from all active students (using dueAmount field)
    const pendingDues = students.reduce((sum, student) => {
      return sum + (student.dueAmount || 0);
    }, 0);

    // Calculate this month's collection
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const thisMonthCollection = students.reduce((sum, student) => {
      if (student.lastPaymentDate && new Date(student.lastPaymentDate) >= firstDayOfMonth) {
        return sum + (student.lastPaymentAmount || 0);
      }
      return sum;
    }, 0);

    // Get recent payments (last 5 payments) using aggregation for better performance
    const recentPayments = await Student.aggregate([
      { $match: { status: 'active', owner: ownerObjectId } },
      { $unwind: "$paymentsReceived" },
      { $sort: { "paymentsReceived.date": -1 } },
      { $limit: 5 },
      { $project: {
          id: { $toString: "$paymentsReceived._id" },
          studentId: { $toString: "$_id" },
          studentName: "$name",
          amount: "$paymentsReceived.amount",
          date: { $dateToString: { format: "%Y-%m-%d", date: "$paymentsReceived.date" } },
          mode: "$paymentsReceived.mode",
          dueAmount: "$dueAmount"
      }}
    ]);

    res.json({
      stats: {
        totalStudents: students.length,
        totalFeesCollected,
        pendingDues,
        thisMonthCollection,
        totalDueAmount: pendingDues // For consistency with frontend
      },
      recentPayments
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;