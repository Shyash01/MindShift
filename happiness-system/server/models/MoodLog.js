const mongoose = require("mongoose");

const MoodLogSchema = new mongoose.Schema({
  mood: {
    type: String,
    required: true
  },
  peopleCount: {
    type: Number,
    required: true
  },
  mood_before: {
    type: Number,
    required: true
  },
  mood_after: {
    type: Number,
    required: true
  },
  mood_delta: {
    type: Number
  },
  activity_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Activity",
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("MoodLog", MoodLogSchema);