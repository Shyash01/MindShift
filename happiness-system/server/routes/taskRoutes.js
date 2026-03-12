const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");

// Get today's tasks (or a specific date via query params)
router.get("/today", authMiddleware, async (req, res) => {
  try {
    // Allow frontend to pass a specific date, fallback to today
    const queryDate = req.query.date || new Date().toISOString().slice(0, 10);

    const tasks = await Task.find({
      user: req.user.id,
      date: queryDate
    }).sort({ startTime: 1, createdAt: 1 }); // Sort chronologically by time

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Error loading tasks" });
  }
});


// Add task (Upgraded with new fields)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { text, description, priority, category, startTime, endTime, date } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Task text is required" });
    }

    const taskDate = date || new Date().toISOString().slice(0, 10);

    const task = new Task({
      user: req.user.id,
      text,
      description,
      priority,
      category,
      startTime,
      endTime,
      date: taskDate
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: "Error adding task" });
  }
});


// Edit/Update entire task details (NEW ROUTE)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { text, description, priority, category, startTime, endTime, date } = req.body;

    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Security Check: Ensure user owns this task
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to edit this task" });
    }

    // Update fields if provided
    if (text) task.text = text;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (category) task.category = category;
    if (startTime !== undefined) task.startTime = startTime;
    if (endTime !== undefined) task.endTime = endTime;
    if (date) task.date = date;

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Error updating task details" });
  }
});


// Toggle completion (Upgraded with security check)
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Security Check: Ensure user owns this task
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    task.completed = !task.completed;
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Error updating task" });
  }
});


// Delete task (Upgraded with security check)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Security Check: Ensure user owns this task
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await task.deleteOne(); // Replaced findByIdAndDelete to ensure we check ownership first
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting task" });
  }
});

module.exports = router;