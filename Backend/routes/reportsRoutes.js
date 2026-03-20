const express = require("express");
const Student = require("../models/Student");
const excel = require("exceljs");
const router = express.Router();

function parseReportPeriod(period) {
  if (!period || typeof period !== "string") return null;
  const match = period.trim().match(/^(\d{1,2})\s*[-\/]\s*(\d{4})$/);
  if (!match) return null;

  const month = Number(match[1]);
  const year = Number(match[2]);
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
    return null;
  }

  return { month, year };
}

function getPaymentPeriod(payment) {
  const parsedPeriod = parseReportPeriod(payment && payment.period);
  if (parsedPeriod) return parsedPeriod;

  const date = payment && payment.date ? new Date(payment.date) : null;
  if (!date || Number.isNaN(date.getTime())) return null;

  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

function getMonthlyStudentStatus(student, paidForMonth, month, year) {
  const fee = Number(student.monthlyFee || 0);
  const joinDate = student.dateOfJoining ? new Date(student.dateOfJoining) : null;

  if (joinDate && !Number.isNaN(joinDate.getTime())) {
    const joinYear = joinDate.getFullYear();
    const joinMonth = joinDate.getMonth() + 1;
    if (year < joinYear || (year === joinYear && month < joinMonth)) {
      return "NA";
    }
  }

  if (fee > 0 && paidForMonth >= fee) return "Completed";
  if (paidForMonth > 0) return "Partial Paid";
  return "Pending";
}

function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
}

function computeAnnualStudentSummary(student, year, monthLimit) {
  const monthlyFee = Number(student.monthlyFee || 0);
  const monthlyPaid = Array(12).fill(0);

  (student.paymentsReceived || []).forEach((payment) => {
    const period = getPaymentPeriod(payment);
    if (!period || period.year !== year) return;
    monthlyPaid[period.month - 1] += Number(payment.amount || 0);
  });

  const joinDate = student.dateOfJoining ? new Date(student.dateOfJoining) : null;
  const hasValidJoinDate = joinDate && !Number.isNaN(joinDate.getTime());
  const joinYear = hasValidJoinDate ? joinDate.getFullYear() : null;
  const joinMonth = hasValidJoinDate ? joinDate.getMonth() + 1 : null;

  let activeMonths = 0;
  for (let month = 1; month <= monthLimit; month += 1) {
    if (hasValidJoinDate && (year < joinYear || (year === joinYear && month < joinMonth))) {
      continue;
    }
    activeMonths += 1;
  }

  const expectedYearlyFee = monthlyFee * activeMonths;
  const paidInYear = monthlyPaid
    .slice(0, monthLimit)
    .reduce((sum, amount) => sum + Number(amount || 0), 0);
  const dueInYear = Math.max(expectedYearlyFee - paidInYear, 0);

  let annualStatus = "Pending";
  if (activeMonths === 0) {
    annualStatus = "NA";
  } else if (paidInYear >= expectedYearlyFee && expectedYearlyFee > 0) {
    annualStatus = "Completed";
  } else if (paidInYear > 0) {
    annualStatus = "Partial Paid";
  }

  return {
    monthlyFee,
    activeMonths,
    expectedYearlyFee,
    paidInYear,
    dueInYear,
    annualStatus,
  };
}

// Utils to group by month
function getMonthName(date) {
  return new Date(date).toLocaleString("default", { month: "short" });
}

// GET /api/reports
router.get("/", async (req, res) => {
  try {
    const ownerId = req.user && req.user.sub;
    const students = await Student.find({ owner: ownerId });

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
      totalPending += s.dueAmount || 0;

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
        overdueAccounts: students.filter((s) => (s.dueAmount || 0) > 0).length,
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

// GET /api/reports/monthly-export?month=3&year=2026
router.get("/monthly-export", async (req, res) => {
  try {
    const ownerId = req.user && req.user.sub;
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();
    const format = String(req.query.format || "csv").toLowerCase();

    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
      return res.status(400).json({ error: "Invalid month or year" });
    }

    if (!["csv", "xlsx"].includes(format)) {
      return res.status(400).json({ error: "Invalid format. Use csv or xlsx" });
    }

    const students = await Student.find({ owner: ownerId }).lean();

    const rows = students.map((student) => {
      const paidForMonth = (student.paymentsReceived || []).reduce((sum, payment) => {
        const period = getPaymentPeriod(payment);
        if (!period) return sum;
        if (period.month === month && period.year === year) {
          return sum + Number(payment.amount || 0);
        }
        return sum;
      }, 0);

      const monthlyFee = Number(student.monthlyFee || 0);
      const monthlyStatus = getMonthlyStudentStatus(student, paidForMonth, month, year);

      return [
        student.name || "",
        student.class || "",
        student.schoolName || "",
        student.contactInfo || "",
        monthlyFee,
        paidForMonth,
        Math.max(monthlyFee - paidForMonth, 0),
        monthlyStatus,
        student.lastPaymentDate ? new Date(student.lastPaymentDate).toLocaleDateString("en-IN") : "",
        student.lastPaymentMode || "",
      ];
    });

    const header = [
      "Student Name",
      "Class",
      "School",
      "Contact",
      "Monthly Fee",
      "Paid In Selected Month",
      "Due For Selected Month",
      "Monthly Status",
      "Last Payment Date",
      "Last Payment Mode",
    ];

    const filenameBase = `monthly-report-${year}-${String(month).padStart(2, "0")}`;

    if (format === "xlsx") {
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet("Monthly Report");

      worksheet.addRow(header);
      rows.forEach((row) => worksheet.addRow(row));

      worksheet.columns = [
        { key: "name", width: 24 },
        { key: "class", width: 12 },
        { key: "school", width: 24 },
        { key: "contact", width: 16 },
        { key: "monthlyFee", width: 14 },
        { key: "paid", width: 20 },
        { key: "due", width: 19 },
        { key: "status", width: 16 },
        { key: "lastDate", width: 18 },
        { key: "lastMode", width: 16 },
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE5E7EB" },
      };

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename=${filenameBase}.xlsx`);

      await workbook.xlsx.write(res);
      return res.end();
    }

    const csv = `\uFEFF${toCsv([header, ...rows])}`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=${filenameBase}.csv`);

    return res.status(200).send(csv);
  } catch (error) {
    console.error("Monthly export error:", error);
    return res.status(500).json({ error: "Failed to export monthly report" });
  }
});

// GET /api/reports/annual-export?year=2026&format=csv
router.get("/annual-export", async (req, res) => {
  try {
    const ownerId = req.user && req.user.sub;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const year = Number(req.query.year) || currentYear;
    const format = String(req.query.format || "csv").toLowerCase();

    if (!Number.isInteger(year)) {
      return res.status(400).json({ error: "Invalid year" });
    }

    if (year > currentYear) {
      return res.status(400).json({ error: "Year cannot be in the future" });
    }

    if (!["csv", "xlsx"].includes(format)) {
      return res.status(400).json({ error: "Invalid format. Use csv or xlsx" });
    }

    const monthLimit = year === currentYear ? currentMonth : 12;
    const students = await Student.find({ owner: ownerId }).lean();

    const rows = students.map((student) => {
      const summary = computeAnnualStudentSummary(student, year, monthLimit);

      return [
        student.name || "",
        student.class || "",
        student.schoolName || "",
        student.contactInfo || "",
        summary.monthlyFee,
        summary.activeMonths,
        summary.expectedYearlyFee,
        summary.paidInYear,
        summary.dueInYear,
        summary.annualStatus,
      ];
    });

    const header = [
      "Student Name",
      "Class",
      "School",
      "Contact",
      "Monthly Fee",
      "Active Months In Year",
      "Expected Amount In Year",
      "Paid In Year",
      "Due In Year",
      "Annual Status",
    ];

    const filenameBase = `annual-report-${year}`;

    if (format === "xlsx") {
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet("Annual Report");

      worksheet.addRow(header);
      rows.forEach((row) => worksheet.addRow(row));

      worksheet.columns = [
        { key: "name", width: 24 },
        { key: "class", width: 12 },
        { key: "school", width: 24 },
        { key: "contact", width: 16 },
        { key: "monthlyFee", width: 14 },
        { key: "activeMonths", width: 18 },
        { key: "expected", width: 20 },
        { key: "paid", width: 14 },
        { key: "due", width: 14 },
        { key: "status", width: 16 },
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE5E7EB" },
      };

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename=${filenameBase}.xlsx`);

      await workbook.xlsx.write(res);
      return res.end();
    }

    const csv = `\uFEFF${toCsv([header, ...rows])}`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=${filenameBase}.csv`);

    return res.status(200).send(csv);
  } catch (error) {
    console.error("Annual export error:", error);
    return res.status(500).json({ error: "Failed to export annual report" });
  }
});

// GET /api/reports/annual-table?year=2026
router.get("/annual-table", async (req, res) => {
  try {
    const ownerId = req.user && req.user.sub;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const year = Number(req.query.year) || currentYear;

    if (!Number.isInteger(year)) {
      return res.status(400).json({ error: "Invalid year" });
    }

    if (year > currentYear) {
      return res.status(400).json({ error: "Year cannot be in the future" });
    }

    const monthLimit = year === currentYear ? currentMonth : 12;
    const students = await Student.find({ owner: ownerId }).lean();

    const rows = students.map((student) => {
      const summary = computeAnnualStudentSummary(student, year, monthLimit);

      return {
        id: String(student._id),
        name: student.name || "",
        class: student.class || "",
        schoolName: student.schoolName || "",
        contactInfo: student.contactInfo || "",
        monthlyFee: summary.monthlyFee,
        activeMonths: summary.activeMonths,
        expectedAmount: summary.expectedYearlyFee,
        paidAmount: summary.paidInYear,
        dueAmount: summary.dueInYear,
        status: summary.annualStatus,
      };
    });

    const summary = rows.reduce(
      (acc, row) => {
        acc.totalExpected += row.expectedAmount;
        acc.totalPaid += row.paidAmount;
        acc.totalDue += row.dueAmount;

        if (row.status === "Completed") acc.completed += 1;
        else if (row.status === "Partial Paid") acc.partial += 1;
        else if (row.status === "Pending") acc.pending += 1;
        else if (row.status === "NA") acc.na += 1;

        return acc;
      },
      {
        totalExpected: 0,
        totalPaid: 0,
        totalDue: 0,
        completed: 0,
        partial: 0,
        pending: 0,
        na: 0,
      }
    );

    return res.json({
      year,
      monthLimit,
      rows,
      summary,
    });
  } catch (error) {
    console.error("Annual table error:", error);
    return res.status(500).json({ error: "Failed to fetch annual table" });
  }
});

module.exports = router;
