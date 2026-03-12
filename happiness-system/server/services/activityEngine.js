const Activity = require("../models/Activity");
const MoodLog = require("../models/MoodLog");

/* ------------------------------
   Recency Multiplier
------------------------------ */
function calculateRecencyMultiplier(hoursSinceLastUse) {

  const lambda = 0.25;

  return 1 - Math.exp(-lambda * hoursSinceLastUse);

}


/* ------------------------------
   Weighted Random Exploration
------------------------------ */
function weightedRandomPick(scoredActivities) {

  const totalScore = scoredActivities.reduce(
    (sum, a) => sum + a.score,
    0
  );

  let random = Math.random() * totalScore;

  for (let item of scoredActivities) {

    random -= item.score;

    if (random <= 0) {
      return item.activity;
    }

  }

  return scoredActivities[0].activity;

}


/* ------------------------------
   Global Effectiveness Learning
------------------------------ */
function computeActivityEffectiveness(logs) {

  const stats = {};

  logs.forEach(log => {

    const id = log.activity_id.toString();

    if (!stats[id]) {

      stats[id] = {
        totalDelta: 0,
        count: 0
      };

    }

    stats[id].totalDelta += log.mood_delta;
    stats[id].count += 1;

  });

  const effectiveness = {};

  Object.keys(stats).forEach(id => {

    const avgDelta = stats[id].totalDelta / stats[id].count;

    const confidence = Math.min(stats[id].count / 5, 1);

    effectiveness[id] =
      avgDelta * confidence;

  });

  return effectiveness;

}


/* =====================================================
   MAIN SUGGESTION ENGINE
===================================================== */
const suggestActivity = async (userId, mood, peopleCount, lastActivityId) => {

  /* ----------------------------------
     Step 1: Fetch Activities
  ---------------------------------- */

  let activities = await Activity.find({
    duration: { $lte: 10 }
  });

  activities = activities.filter(activity =>

    peopleCount >= activity.min_people &&
    peopleCount <= activity.max_people

  );

  if (lastActivityId) {

    activities = activities.filter(
      activity =>
        activity._id.toString() !== lastActivityId.toString()
    );

  }

  if (activities.length === 0) return null;

  const activityIds = activities.map(a => a._id);


  /* ----------------------------------
     Step 2: Fetch Logs (USER ONLY)
  ---------------------------------- */

  const logs = await MoodLog.find({
    user_id: userId,
    activity_id: { $in: activityIds }
  }).sort({ date: -1 });


  /* ----------------------------------
     Step 3: Compute Learning Signals
  ---------------------------------- */

  const effectivenessMap =
    computeActivityEffectiveness(logs);

  const logsByActivity = {};

  logs.forEach(log => {

    const id = log.activity_id.toString();

    if (!logsByActivity[id]) {

      logsByActivity[id] = {
        all: [],
        byMood: {}
      };

    }

    logsByActivity[id].all.push(log);

    if (!logsByActivity[id].byMood[log.mood]) {

      logsByActivity[id].byMood[log.mood] = [];

    }

    logsByActivity[id].byMood[log.mood].push(log);

  });


  /* ----------------------------------
     Step 4: Score Activities
  ---------------------------------- */

  const scoredActivities = activities.map(activity => {

    let score = activity.base_score;

    const id = activity._id.toString();

    const activityLogs = logsByActivity[id];

    /* Mood Suitability */

    if (activity.suitable_moods.includes(mood)) {

      score += 3;

    }

    /* ------------------------------
       Mood-Specific Reinforcement
    ------------------------------ */

    if (activityLogs && activityLogs.byMood[mood]) {

      const logs = activityLogs.byMood[mood];

      const totalDelta = logs.reduce(
        (sum, log) => sum + log.mood_delta,
        0
      );

      const avgDelta = totalDelta / logs.length;

      const confidence =
        Math.min(logs.length / 5, 1);

      const reinforcementEffect =
        Math.log(1 + Math.abs(avgDelta)) *
        Math.sign(avgDelta);

      score += reinforcementEffect * confidence;

    }

    /* ------------------------------
       Long-term Effectiveness
    ------------------------------ */

    if (effectivenessMap[id]) {

      score += effectivenessMap[id] * 0.5;

    }

    /* ------------------------------
       Recency Intelligence
    ------------------------------ */

    if (activityLogs && activityLogs.all.length > 0) {

      const lastLog = activityLogs.all[0];

      const hours =
        (Date.now() - new Date(lastLog.date)) /
        (1000 * 60 * 60);

      const recencyMultiplier =
        calculateRecencyMultiplier(hours);

      score *= recencyMultiplier;

    }

    /* ------------------------------
       Exploration Bonus
    ------------------------------ */

    if (!activityLogs) {

      score += 1;

    }

    /* Prevent negative scores */

    if (score < 0) score = 0.1;

    return {
      activity,
      score
    };

  });


  /* ----------------------------------
     Step 5: Sort
  ---------------------------------- */

  scoredActivities.sort(
    (a, b) => b.score - a.score
  );


  /* ----------------------------------
     Step 6: Exploration Strategy
  ---------------------------------- */

  const epsilon = 0.15;

  if (Math.random() < epsilon) {

    return weightedRandomPick(scoredActivities);

  }

  return scoredActivities[0].activity;

};


module.exports = { suggestActivity };