// utils/recalculateDue.js
function recalculateDue(student) {
  student.extraPaid = student.extraPaid || 0;
  student.monthlyFee = student.monthlyFee || 0;

  // Apply prepaid credit to new month
  if (student.extraPaid >= student.monthlyFee) {
    student.extraPaid -= student.monthlyFee;
    student.dueAmount = 0;
  } else {
    student.dueAmount = student.monthlyFee - student.extraPaid;
    student.extraPaid = 0;
  }

  // Safety clamps
  if (student.dueAmount < 0) student.dueAmount = 0;
  if (student.extraPaid < 0) student.extraPaid = 0;

  if (student.dueAmount === 0) {
    student.paymentStatus = "completed";
  } else if ((student.totalCollected || 0) > 0 || (student.paymentsReceived || []).length > 0) {
    student.paymentStatus = "partial";
  } else {
    student.paymentStatus = "pending";
  }
  return student;
}

module.exports = recalculateDue;
