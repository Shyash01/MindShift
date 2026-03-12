const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { suggestActivity } = require("../services/activityEngine");
const MoodLog = require("../models/MoodLog");

/* ===============================
   POST /api/suggest
================================ */
router.post("/suggest", authMiddleware, async (req, res) => {
  try {
    const { mood, peopleCount, lastActivityId } = req.body;

    if (!mood || !peopleCount) {
      return res.status(400).json({ message: "Mood and peopleCount are required" });
    }

    const activity = await suggestActivity(
      req.user.id,
      mood,
      peopleCount,
      lastActivityId
    );

    if (!activity) {
      return res.status(404).json({ message: "No suitable activity found" });
    }

    res.json(activity);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


/* ===============================
   POST /api/feedback
================================ */
router.post("/feedback", authMiddleware, async (req, res) => {
  try {

    const { mood, peopleCount, mood_before, mood_after, activity_id } = req.body;

    if (!mood || !peopleCount || mood_before == null || mood_after == null || !activity_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const mood_delta = mood_after - mood_before;

    const log = new MoodLog({
      user_id: req.user.id,
      mood,
      peopleCount,
      mood_before,
      mood_after,
      mood_delta,
      activity_id
    });

    await log.save();

    res.json({
      message: "Feedback saved successfully",
      mood_delta
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


/* ===============================
   GET /api/analytics
================================ */
router.get("/analytics", authMiddleware, async (req, res) => {
  try {

    const logs = await MoodLog.find({
      user_id: req.user.id
    }).populate("activity_id");

    if (logs.length === 0) {
      return res.json({
        total_sessions: 0,
        average_improvement: 0,
        most_effective_activity: null,
        mood_wise_average: {}
      });
    }

    const total_sessions = logs.length;

    const totalDelta = logs.reduce((sum, log) => sum + log.mood_delta, 0);
    const average_improvement = (totalDelta / total_sessions).toFixed(2);

    const activityMap = {};

    logs.forEach(log => {

      if (!log.activity_id) return;

      const title = log.activity_id.title;

      if (!activityMap[title]) {
        activityMap[title] = [];
      }

      activityMap[title].push(log.mood_delta);

    });

    let most_effective_activity = null;
    let bestAverage = -Infinity;

    for (let activity in activityMap) {

      const avg =
        activityMap[activity].reduce((a, b) => a + b, 0) /
        activityMap[activity].length;

      if (avg > bestAverage) {
        bestAverage = avg;
        most_effective_activity = activity;
      }
    }

    const moodMap = {};

    logs.forEach(log => {

      if (!moodMap[log.mood]) {
        moodMap[log.mood] = [];
      }

      moodMap[log.mood].push(log.mood_delta);

    });

    const mood_wise_average = {};

    for (let mood in moodMap) {

      mood_wise_average[mood] =
        (moodMap[mood].reduce((a, b) => a + b, 0) / moodMap[mood].length)
          .toFixed(2);

    }

    res.json({
      total_sessions,
      average_improvement,
      most_effective_activity,
      mood_wise_average
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


/* ===============================
   GET /api/analytics/detailed
================================ */
router.get("/analytics/detailed", authMiddleware, async (req, res) => {
  try {

    const logs = await MoodLog.find({
      user_id: req.user.id
    }).populate("activity_id");

    if (logs.length === 0) {
      return res.json({
        timeline: [],
        activity_effectiveness: [],
        mood_effectiveness: []
      });
    }

    /* Timeline */
    const timeline = logs.map((log, index) => ({
      session: index + 1,
      mood_delta: log.mood_delta,
      date: log.date
    }));

    /* Activity Effectiveness */
    const activityMap = {};

    logs.forEach(log => {

      if (!log.activity_id) return;

      const title = log.activity_id.title;

      if (!activityMap[title]) {
        activityMap[title] = [];
      }

      activityMap[title].push(log.mood_delta);

    });

    const activity_effectiveness = Object.keys(activityMap).map(activity => ({
      activity,
      avg_delta:
        activityMap[activity].reduce((a, b) => a + b, 0) /
        activityMap[activity].length
    }));


    /* Mood Effectiveness */
    const moodMap = {};

    logs.forEach(log => {

      if (!moodMap[log.mood]) {
        moodMap[log.mood] = [];
      }

      moodMap[log.mood].push(log.mood_delta);

    });

    const mood_effectiveness = Object.keys(moodMap).map(mood => ({
      mood,
      avg_delta:
        moodMap[mood].reduce((a, b) => a + b, 0) /
        moodMap[mood].length
    }));


    res.json({
      timeline,
      activity_effectiveness,
      mood_effectiveness
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


/* ===============================
   GET /api/analytics/evaluation
================================ */
router.get("/analytics/evaluation", authMiddleware, async (req, res) => {
  try {

    const logs = await MoodLog.find({
      user_id: req.user.id
    });

    if (logs.length === 0) {
      return res.json({ message: "No data yet." });
    }

    const totalLogs = logs.length;

    const totalDelta = logs.reduce(
      (sum, log) => sum + log.mood_delta,
      0
    );

    const avgMoodImprovement = totalDelta / totalLogs;

    const activityStats = {};

    logs.forEach(log => {

      const id = log.activity_id.toString();

      if (!activityStats[id]) {
        activityStats[id] = {
          totalDelta: 0,
          count: 0
        };
      }

      activityStats[id].totalDelta += log.mood_delta;
      activityStats[id].count += 1;

    });

    const perActivityMetrics = Object.entries(activityStats).map(
      ([activityId, data]) => {

        const avgDelta = data.totalDelta / data.count;

        const effectiveness =
          avgDelta * Math.log(1 + data.count);

        return {
          activityId,
          usageCount: data.count,
          avgMoodDelta: avgDelta,
          effectivenessScore: effectiveness
        };

      }
    );

    const uniqueActivitiesUsed =
      Object.keys(activityStats).length;

    const diversityIndex =
      uniqueActivitiesUsed / totalLogs;

    const confidenceGrowth =
      perActivityMetrics.reduce(
        (sum, a) => sum + Math.log(1 + a.usageCount),
        0
      ) / perActivityMetrics.length;

    res.json({
      totalLogs,
      avgMoodImprovement,
      diversityIndex,
      confidenceGrowth,
      perActivityMetrics
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ===============================
   GET /api/analytics/streak
================================ */

router.get("/analytics/streak", authMiddleware, async (req, res) => {

  try {

    const logs = await MoodLog.find({
      user_id: req.user.id
    }).sort({ date: 1 });

    if (logs.length === 0) {
      return res.json({
        current_streak: 0,
        longest_streak: 0
      });
    }

    /* -----------------------------
       Convert logs to unique days
    ----------------------------- */

    const days = [...new Set(
      logs.map(log =>
        new Date(log.date).toISOString().split("T")[0]
      )
    )];

    let current_streak = 1;
    let longest_streak = 1;

    for (let i = 1; i < days.length; i++) {

      const prev = new Date(days[i - 1]);
      const curr = new Date(days[i]);

      const diff =
        (curr - prev) / (1000 * 60 * 60 * 24);

      if (diff === 1) {

        current_streak++;
        longest_streak = Math.max(longest_streak, current_streak);

      } else {

        current_streak = 1;

      }

    }

    res.json({
      current_streak,
      longest_streak
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }

});
module.exports = router;