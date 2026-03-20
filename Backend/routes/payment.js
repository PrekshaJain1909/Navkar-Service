const express = require("express");
const Student = require("../models/Student");
const Stats = require("../models/Stats");

const router = express.Router();

router.post("/:id/pay", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, mode, period } = req.body;
    const ownerId = req.user && req.user.sub;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    const student = await Student.findOne({ _id: id, owner: ownerId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    let paymentRemaining = amount;
    let overPayment = 0;

    // 1️⃣ Apply to current due
    if (paymentRemaining >= student.dueAmount) {
      paymentRemaining -= student.dueAmount;
      student.dueAmount = 0;
    } else {
      student.dueAmount -= paymentRemaining;
      paymentRemaining = 0;
    }

    // 2️⃣ Any leftover goes to extraPaid
    if (paymentRemaining > 0) {
      student.extraPaid = (student.extraPaid || 0) + paymentRemaining;
      overPayment = paymentRemaining;
      paymentRemaining = 0;
    }

    // 3️⃣ Clamp
    if (student.dueAmount < 0) student.dueAmount = 0;
    if (student.extraPaid < 0) student.extraPaid = 0;

    // 4️⃣ Audit info
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

    if (student.dueAmount === 0) {
      student.paymentStatus = "completed";
    } else {
      student.paymentStatus = "partial";
    }

    await student.save();

    await Stats.findOneAndUpdate(
      { owner: ownerId },
      {
        $inc: { totalCollected: amount },
        $setOnInsert: { owner: ownerId },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ message: "Payment recorded successfully", student });

  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
