const express = require("express");
const Student = require("../models/Student");
const router = express.Router();

// Utils to group by month
function getMonthName(date) {
  return new Date(date).toLocaleString("default", { month: "short" });
}

// GET /api/reports
router.get("/", async (req, res) => {
  try {
    const students = await Student.find();

    const monthlyMap = {};
    const modeMap = { Cash: 0, UPI: 0, "Bank Transfer": 0 };

    let totalCollected = 0;
    let totalPending = 0;

    students.forEach((s) => {
      const fee = s.monthlyFee || 0;
      const paid = s.lastPaymentAmount || 0;
      const status = s.paymentStatus;

      // For summary stats
      totalCollected += paid;
      totalPending += s.totalDue || 0;

      // Monthly data
      if (s.lastPaymentDate) {
        const month = getMonthName(s.lastPaymentDate);
        if (!monthlyMap[month]) {
          monthlyMap[month] = { month, collected: 0, pending: 0 };
        }
        if (status === "completed") {
          monthlyMap[month].collected += paid;
        } else {
          monthlyMap[month].pending += fee - paid;
        }
      }

      // Mode distribution
      if (s.lastPaymentMode && modeMap[s.lastPaymentMode] !== undefined) {
        modeMap[s.lastPaymentMode] += 1;
      }
    });

    const monthlyData = Object.values(monthlyMap);
    const paymentModeData = Object.entries(modeMap).map(([name, value]) => ({
      name,
      value,
      // colors for pie chart
      color:
        name === "UPI"
          ? "#0088FE"
          : name === "Cash"
          ? "#00C49F"
          : "#FFBB28",
    }));

    const report = {
      keyMetrics: {
        collectionRate:
          totalCollected + totalPending > 0
            ? ((totalCollected / (totalCollected + totalPending)) * 100).toFixed(1)
            : 0,
        activeStudents: students.length,
        monthlyAverage:
          monthlyData.length > 0
            ? Math.round(totalCollected / monthlyData.length)
            : 0,
        overdueAccounts: students.filter((s) => (s.totalDue || 0) > 0).length,
      },
      monthlyData,
      paymentModeData,
      // optional: fetch routes/schools in real app
      topRoutes: [],
      outstandingBySchool: [],
      thisMonthSummary: {
        collected: totalCollected,
        pending: totalPending,
        collectionRate:
          totalCollected + totalPending > 0
            ? ((totalCollected / (totalCollected + totalPending)) * 100).toFixed(1)
            : 0,
      },
    };

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

module.exports = router;
