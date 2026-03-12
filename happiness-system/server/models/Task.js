const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ""
  },
  priority: {
    type: String,
    enum: ["High", "Medium", "Low"],
    default: "Medium"
  },
  category: {
    type: String,
    enum: ["Work", "Health", "Personal", "Other"],
    default: "Personal"
  },
  startTime: {
    type: String, // Expecting format like "09:00"
    default: ""
  },
  endTime: {
    type: String, // Expecting format like "10:30"
    default: ""
  },
  completed: {
    type: Boolean,
    default: false
  },
  date: {
    type: String, // Keeping your current YYYY-MM-DD format
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Task", taskSchema);