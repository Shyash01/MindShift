const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    max: 10
  },
  suitable_moods: {
    type: [String],
    required: true
  },
  min_people: {
    type: Number,
    required: true
  },
  max_people: {
    type: Number,
    required: true
  },
  base_score: {
    type: Number,
    default: 1
  }
});

module.exports = mongoose.model("Activity", ActivitySchema);