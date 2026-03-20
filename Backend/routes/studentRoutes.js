const express = require("express");
const Student = require("../models/Student");
const recalculateDue = require("../utils/recalculateDue");
const excel = require('exceljs');

const router = express.Router();

function getOwnerId(req) {
  return req.user && req.user.sub;
}

// 📤 Export all students to Excel
router.get('/export', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const students = await Student.find({ owner: ownerId }).lean();

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Students Data');

    worksheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Class', key: 'class', width: 15 },
      { header: 'School', key: 'schoolName', width: 25 },
      { header: 'Monthly Fee', key: 'monthlyFee', width: 15 },
      { header: 'Due Amount', key: 'dueAmount', width: 15 },
      { header: 'Total Collected', key: 'totalCollected', width: 15 },
      { header: 'Extra Paid', key: 'extraPaid', width: 15 },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Last Payment Date', key: 'lastPaymentDate', width: 20 },
      { header: 'Last Payment Amount', key: 'lastPaymentAmount', width: 20 },
      { header: 'Contact', key: 'contactInfo', width: 20 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    students.forEach(student => {
      worksheet.addRow({
        name: student.name,
        class: student.class,
        schoolName: student.schoolName,
        monthlyFee: student.monthlyFee,
        dueAmount: student.dueAmount || 0,
        totalCollected: student.totalCollected || 0,
        extraPaid: student.extraPaid || 0,
        paymentStatus: student.paymentStatus || 'pending',
        lastPaymentDate: student.lastPaymentDate ? new Date(student.lastPaymentDate).toLocaleDateString() : '',
        lastPaymentAmount: student.lastPaymentAmount || 0,
        contactInfo: student.contactInfo,
        status: student.status
      });
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=students-data.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// ➕ Create Student
router.post("/", async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { owner: _, ...payload } = req.body || {};

    const student = new Student({
      ...payload,
      owner: ownerId,
    });
    recalculateDue(student); // set initial due according to monthlyFee & extraPaid
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📄 Get all students
router.get("/", async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const students = await Student.find({ owner: ownerId });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✏️ Update a student (Edit Save)
router.put("/:id", async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { owner: _, ...payload } = req.body || {};

    let student = await Student.findOne({ _id: req.params.id, owner: ownerId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    Object.assign(student, payload); // merge changes
    recalculateDue(student); // apply due/extraPaid rule
    await student.save();

    res.json(student);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: err.message });
  }
});

// 📄 Get single student
router.get("/:id", async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const student = await Student.findOne({ _id: req.params.id, owner: ownerId });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🗑 Delete student
router.delete("/:id", async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const deleted = await Student.findOneAndDelete({ _id: req.params.id, owner: ownerId });

    if (!deleted) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
