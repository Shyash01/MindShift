let timelineChartInstance = null;
let activityChartInstance = null;
let moodChartInstance = null;

let currentActivityId = null;

async function getSuggestion() {
  const mood = document.getElementById("mood").value;
  const peopleCount = parseInt(document.getElementById("peopleCount").value);

  if (!peopleCount || peopleCount < 1 || peopleCount > 4) {
    alert("Please enter valid number of people (1-4)");
    return;
  }

  try {
    const response = await fetch("/api/suggest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mood,
        peopleCount,
        lastActivityId: currentActivityId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Error getting activity");
      return;
    }

    currentActivityId = data._id;

    document.getElementById("activity-title").innerText = data.title;
    document.getElementById("activity-section").style.display = "block";
    document.getElementById("result-section").innerText = "";

  } catch (error) {
    console.error(error);
    alert("Server error");
  }
}

async function submitFeedback() {
  const mood_before = parseInt(document.getElementById("mood_before").value);
  const mood_after = parseInt(document.getElementById("mood_after").value);
  const mood = document.getElementById("mood").value;
  const peopleCount = parseInt(document.getElementById("peopleCount").value);

  if (mood_before < 1 || mood_before > 10 ||
      mood_after < 1 || mood_after > 10) {
    alert("Mood values must be between 1 and 10");
    return;
  }
  
  if (!mood_before || !mood_after) {
    alert("Please enter mood values (1-10)");
    return;
  }

  try {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mood,
        peopleCount,
        mood_before,
        mood_after,
        activity_id: currentActivityId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Error saving feedback");
      return;
    }

    document.getElementById("result-section").innerText =
      `Mood Improvement: ${data.mood_delta}`;

    document.getElementById("activity-section").style.display = "none";
    document.getElementById("mood_before").value = "";
    document.getElementById("mood_after").value = "";

  } catch (error) {
    console.error(error);
    alert("Server error");
  }
}

async function loadAnalytics() {
  try {
    const response = await fetch("/api/analytics");
    const data = await response.json();

    const container = document.getElementById("analytics-result");

    container.innerHTML = `
      <p><strong>Total Sessions:</strong> ${data.total_sessions}</p>
      <p><strong>Average Mood Improvement:</strong> ${data.average_improvement}</p>
      <p><strong>Most Effective Activity:</strong> ${data.most_effective_activity || "N/A"}</p>
      <p><strong>Mood-wise Average:</strong></p>
      <ul>
        ${Object.entries(data.mood_wise_average)
          .map(([mood, value]) => `<li>${mood}: ${value}</li>`)
          .join("")}
      </ul>
    `;

  } catch (error) {
    console.error(error);
    alert("Error loading analytics");
  }
}

async function loadDetailedAnalytics() {
  try {
    const response = await fetch("/api/analytics/detailed");
    const data = await response.json();

    // 🔹 1️⃣ Timeline Chart
    const timelineCtx = document.getElementById("timelineChart").getContext("2d");

if (timelineChartInstance) {
  timelineChartInstance.destroy();
}

timelineChartInstance = new Chart(timelineCtx, {
      type: "line",
      data: {
        labels: data.timeline.map(item => "Session " + item.session),
        datasets: [{
          label: "Mood Improvement Over Time",
          data: data.timeline.map(item => item.mood_delta),
          borderColor: "#4CAF50",
          fill: false,
          tension: 0.2
        }]
      }
    });

    // 🔹 2️⃣ Activity Effectiveness Chart
    const activityCtx = document.getElementById("activityChart").getContext("2d");

if (activityChartInstance) {
  activityChartInstance.destroy();
}

activityChartInstance = new Chart(activityCtx, {
      type: "bar",
      data: {
        labels: data.activity_effectiveness.map(item => item.activity),
        datasets: [{
          label: "Activity Effectiveness (Avg Improvement)",
          data: data.activity_effectiveness.map(item => item.avg_delta),
          backgroundColor: "#2196F3"
        }]
      }
    });

    // 🔹 3️⃣ Mood Effectiveness Chart
    const moodCtx = document.getElementById("moodChart").getContext("2d");

if (moodChartInstance) {
  moodChartInstance.destroy();
}

moodChartInstance = new Chart(moodCtx, {
      type: "bar",
      data: {
        labels: data.mood_effectiveness.map(item => item.mood),
        datasets: [{
          label: "Mood-wise Improvement Pattern",
          data: data.mood_effectiveness.map(item => item.avg_delta),
          backgroundColor: "#FF9800"
        }]
      }
    });
    // 🔹 Generate Insight Narrative

let insightText = "<p>📊 Analysis based on your recorded sessions:</p>";
// Growth Trend
if (data.timeline.length >= 2) {
  const first = data.timeline[0].mood_delta;
  const last = data.timeline[data.timeline.length - 1].mood_delta;

  if (last > first) {
    insightText += "<p>📈 Your emotional improvement trend is increasing over time.</p>";
  } else if (last < first) {
    insightText += "<p>⚠️ Recent sessions show slightly reduced improvement. Consider consistency.</p>";
  } else {
    insightText += "<p>➡️ Your emotional response is stable across sessions.</p>";
  }
}

// Most Effective Activity
if (data.activity_effectiveness.length > 0) {
  const bestActivity = data.activity_effectiveness.reduce((prev, current) =>
    prev.avg_delta > current.avg_delta ? prev : current
  );

  insightText += `<p>🏆 Most effective intervention so far: <strong>${bestActivity.activity}</strong></p>`;
}

// Strongest Mood Response
if (data.mood_effectiveness.length > 0) {
  const bestMood = data.mood_effectiveness.reduce((prev, current) =>
    prev.avg_delta > current.avg_delta ? prev : current
  );

  insightText += `<p>🧠 Emotional state responding best to interventions: <strong>${bestMood.mood}</strong></p>`;
}

document.getElementById("insight-content").innerHTML = insightText;

  } catch (error) {
    console.error(error);
    alert("Error loading detailed analytics");
  }

}