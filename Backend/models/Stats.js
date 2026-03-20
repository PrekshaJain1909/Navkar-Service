const mongoose = require("mongoose");

const statsSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true,
  },
  totalCollected: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model("Stats", statsSchema);