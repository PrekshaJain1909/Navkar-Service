const mongoose = require("mongoose");
// If you still plan to use the recalculateDue helper later
// const recalculateDue = require("../utils/recalculateDue");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },            // ✅ Required
  class: { type: String },                           // optional now
  schoolName: { type: String },                      // optional now
  pickupLocation: { type: String },                  // optional now
  dropLocation: { type: String },                    // optional now
  contactInfo: { type: String },                     // optional now
  monthlyFee: { type: Number, required: true },      // ✅ Required
  status: { type: String, enum: ["active", "inactive"], default: "active" },

  paymentsReceived: [{
    amount: Number,
    date: Date,
    mode: String,
    period: String,
    extraPaid: Number
  }],

  dueAmount: { type: Number, default: 0 },
  totalCollected: { type: Number, default: 0 },
  fathersName: { type: String },
  mothersName: { type: String },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  dob: { type: Date },
  address: { type: String },
  dateOfJoining: { type: Date },
  fathersContactNumber: { type: String },
  extraPaid: { type: Number, default: 0 },
  lastPaymentAmount: { type: Number, default: 0 },
  lastPaymentDate: { type: Date },
  lastPaymentMode: { type: String, enum: ["Cash", "UPI", "Bank Transfer"], default: "Cash" },
  lastPaymentPeriod: { type: String },
  paymentStatus: { type: String, enum: ["completed", "pending"], default: "pending" }
}, { timestamps: true });

// Make sure due & extraPaid are not negative before save
studentSchema.pre("save", function(next) {
  // Only calculate for new students and if dateOfJoining is set
  if (this.isNew && this.dateOfJoining) {
    const joinDate = this.dateOfJoining;
    const joinMonth = joinDate.getMonth() + 1; // JavaScript months are 0-11
    const joinYear = joinDate.getFullYear();
    
    let monthsToPay = 0;
    
    // Determine academic year
    // If month is April or later (month >= 4), it's the current academic year
    // If month is January-March (month <= 3), it's the previous academic year
    if (joinMonth >= 4) {
      // Joining between April-Dec
      monthsToPay = joinMonth - 4;
    } else {
      // Joining between Jan-Mar (considered as part of previous academic year)
      monthsToPay = joinMonth + 8; // (12 - 4) + joinMonth
    }
    
    // Calculate initial due
    this.dueAmount = monthsToPay * (this.monthlyFee || 0);
  }
  
  // Make sure due & extraPaid are not negative before save
  if (this.dueAmount < 0) this.dueAmount = 0;
  if (this.extraPaid < 0) this.extraPaid = 0;
  this.paymentStatus = this.dueAmount === 0 ? "completed" : "pending";
  next();
});
module.exports = mongoose.model("Student", studentSchema);
