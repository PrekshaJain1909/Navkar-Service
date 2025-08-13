const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  emailNotifications: { type: Boolean, default: true },
  smsNotifications: { type: Boolean, default: true },
  whatsappNotifications: { type: Boolean, default: true },
  reminderDays: { type: Number, default: 5 },
  emailTemplate: { 
    type: String, 
    default: "Dear Parent, This is a reminder that the bus fee for {student_name} is due. Amount: ₹{amount}. Please pay by {due_date}."
  },
  smsTemplate: { 
    type: String, 
    default: "Bus fee reminder for {student_name}: ₹{amount} due by {due_date}. Pay now to avoid late fees."
  },
  whatsappTemplate: { 
    type: String, 
    default: "Hello {student_name}, your bus fee of ₹{amount} is due by {due_date}. Please pay to avoid late fees."
  }
}, { timestamps: true });

module.exports = mongoose.model("Settings", settingsSchema);