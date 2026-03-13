let timelineChartInstance = null;
let activityChartInstance = null;
let moodChartInstance = null;

let currentActivityId = null;

const token = localStorage.getItem("token");

let selectedMood = null;


/* ===============================
   Mood Card Selection
=============================== */

document.addEventListener("DOMContentLoaded", () => {

const moodCards = document.querySelectorAll(".mood-card");

moodCards.forEach(card => {

card.addEventListener("click", () => {

moodCards.forEach(c => c.classList.remove("selected"));

card.classList.add("selected");

selectedMood = card.dataset.mood;

});

});

});


/* ===============================
   Suggest Activity
=============================== */

async function getSuggestion(event) {

  const mood = selectedMood;

  const peopleCount = parseInt(
    document.getElementById("peopleCount").value
  );

  /* -------------------------------
     Input Validation
  --------------------------------*/

  if (!mood) {
    alert("Please select your mood first.");
    return;
  }

  if (!peopleCount || peopleCount < 1 || peopleCount > 4) {
    alert("Please enter valid number of people (1-4)");
    return;
  }

  const button = event.target;
  const originalText = button.innerText;

  button.innerText = "Analyzing mood...";
  button.disabled = true;

  try {

    const response = await fetch("/api/suggest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
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

    /* -------------------------------
       Save current activity
    --------------------------------*/

    currentActivityId = data._id;

    /* -------------------------------
       Update UI with activity
    --------------------------------*/

    document.getElementById("activity-title").innerText = data.title;

    /* Show category (NEW) */

    const categoryElement = document.getElementById("activity-category");

    if (categoryElement) {
      categoryElement.innerText = "Category: " + data.category;
    }

    /* -------------------------------
       Reveal activity card with animation
    --------------------------------*/

    const activitySection = document.getElementById("activity-section");

    activitySection.classList.remove("hidden");
    activitySection.classList.add("activity-reveal");

    /* Clear previous result */

    document.getElementById("result-section").innerText = "";

    /* =========================================
       NEW: Reset the Record button and inputs 
       for the new activity
    ========================================= */
    const recordBtn = document.getElementById("record-btn");
    if (recordBtn) {
        recordBtn.innerText = "Record Your Mood"; 
        recordBtn.disabled = false;
    }

    document.getElementById("mood_before").value = "";
    document.getElementById("mood_after").value = "";

  } catch (error) {

    console.error(error);
    alert("Server error");

  } finally {

    button.innerText = originalText;
    button.disabled = false;

  }
}


/* ===============================
   Submit Feedback
=============================== */

async function submitFeedback(){

  const mood_before = parseInt(
    document.getElementById("mood_before").value
  );

  const mood_after = parseInt(
    document.getElementById("mood_after").value
  );

  const mood = selectedMood;

  const peopleCount = parseInt(
    document.getElementById("peopleCount").value
  );

  if(!mood_before || !mood_after){
    alert("Please enter mood values (1-10)");
    return;
  }

  if(mood_before < 1 || mood_before > 10 ||
     mood_after < 1 || mood_after > 10){

    alert("Mood values must be between 1 and 10");
    return;

  }

  try{

    const response = await fetch("/api/feedback",{

      method:"POST",

      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${token}`
      },

      body:JSON.stringify({
        mood,
        peopleCount,
        mood_before,
        mood_after,
        activity_id:currentActivityId
      })

    });

    const data = await response.json();

    if(!response.ok){
      alert(data.message || "Error saving feedback");
      return;
    }

    document.getElementById("result-section").innerHTML =
    `🌿 Great job! Mood improved by <strong>+${data.mood_delta}</strong>`;

    /* Wait 2 seconds before hiding activity and refreshing insights */
    const btn = document.getElementById("record-btn");

    btn.innerText = "✓ Recorded";
    btn.disabled = true;

    setTimeout(async () => {
      await loadDetailedAnalytics();
    }, 1000);

    document.getElementById("mood_before").value="";
    document.getElementById("mood_after").value="";

  }catch(error){

    console.error(error);
    alert("Server error");

  }

}


/* ===============================
   Load Detailed Analytics
=============================== */

async function loadDetailedAnalytics(){
document.getElementById("analytics-section").classList.remove("hidden");
document.getElementById("insight-placeholder").style.display = "none";

try{

const response = await fetch("/api/analytics/detailed",{

headers:{
"Authorization":`Bearer ${token}`
}

});

const data = await response.json();



/* -------------------------------
   Timeline Chart
-------------------------------- */

/* -------------------------------
   Timeline Chart
-------------------------------- */

const timelineCtx =
document.getElementById("timelineChart").getContext("2d");

/* Limit to last 20 sessions */

const timelineData = data.timeline.slice(-10);

if(timelineChartInstance){
timelineChartInstance.destroy();
}

timelineChartInstance = new Chart(timelineCtx,{

type:"line",

data:{
labels:timelineData.map(item=>"Session "+item.session),

datasets:[{
label:"Mood Improvement",

data:timelineData.map(item=>item.mood_delta),

borderColor:"#22c55e",

backgroundColor:"rgba(34,197,94,0.15)",

borderWidth:3,

tension:0.45,

pointRadius:6,

pointBackgroundColor:"#22c55e",

pointBorderColor:"#fff",

pointBorderWidth:2,

fill:true
}]
},

options:{
responsive:true,

plugins:{
legend:{
labels:{
color:"#334155",
font:{size:13}
}
},

tooltip:{
backgroundColor:"#0f172a",
titleColor:"#fff",
bodyColor:"#fff",
padding:12,
cornerRadius:6
}
},

scales:{
x:{
grid:{color:"rgba(0,0,0,0.05)"}
},
y:{
grid:{color:"rgba(0,0,0,0.05)"}
}
}

}

});



/* -------------------------------
   Activity Chart
-------------------------------- */
const activityCtx =
document.getElementById("activityChart").getContext("2d");

/* -------------------------------
   Get Top 5 Activities
-------------------------------- */

const topActivities = [...data.activity_effectiveness]
.sort((a,b)=>b.avg_delta-a.avg_delta)
.slice(0,5);

/* -------------------------------
   Destroy old chart
-------------------------------- */

if(activityChartInstance){
activityChartInstance.destroy();
}

/* -------------------------------
   Create Chart
-------------------------------- */

activityChartInstance = new Chart(activityCtx,{

type:"bar",

data:{
labels:topActivities.map(item =>
item.activity.length > 18
? item.activity.substring(0,18) + "..."
: item.activity
),

datasets:[{
label:"Activity Effectiveness",

data:topActivities.map(item=>item.avg_delta),

backgroundColor:"#3b82f6",

borderRadius:8,

barThickness:30
}]
},

options:{
responsive:true,

plugins:{
legend:{
labels:{color:"#334155"}
}
},

scales:{
x:{
grid:{display:false},
ticks:{
maxRotation:25,
minRotation:25
}
},
y:{
grid:{color:"rgba(0,0,0,0.05)"}
}
}

}

});


/* -------------------------------
   Mood Chart
-------------------------------- */

const moodCtx =
document.getElementById("moodChart").getContext("2d");

if(moodChartInstance){
moodChartInstance.destroy();
}

moodChartInstance = new Chart(moodCtx,{

type:"bar",

data:{
labels:data.mood_effectiveness.map(item=>item.mood),

datasets:[{
label:"Mood Effectiveness",

data:data.mood_effectiveness.map(item=>item.avg_delta),

backgroundColor:"#f59e0b",

borderRadius:8,

barThickness:40
}]
},

options:{
responsive:true,

plugins:{
legend:{
labels:{color:"#334155"}
}
},

scales:{
x:{grid:{display:false}},
y:{grid:{color:"rgba(0,0,0,0.05)"}}
}

}

});



/* -------------------------------
   Insight Cards
-------------------------------- */

let insightHTML="";

if(data.timeline.length>=2){

const first=data.timeline[0].mood_delta;
const last=data.timeline[data.timeline.length-1].mood_delta;

let trend="Stable emotional response";

if(last>first){
trend="Emotional improvement trend increasing";
}
else if(last<first){
trend="Recent sessions show slight decline";
}
insightHTML+=`
<div class="insight-card">
<div class="insight-title">📈 Emotional Trend</div>
<div class="insight-value">${trend}</div>
</div>
`;

}

if(data.activity_effectiveness.length>0){

const bestActivity=data.activity_effectiveness.reduce(
(prev,current)=>
prev.avg_delta>current.avg_delta?prev:current
);

insightHTML+=`
<div class="insight-card">
<div class="insight-title">🏆 Best Intervention</div>
<div class="insight-value">${bestActivity.activity}</div>
</div>
`;

}

if(data.mood_effectiveness.length>0){

const bestMood=data.mood_effectiveness.reduce(
(prev,current)=>
prev.avg_delta>current.avg_delta?prev:current
);

insightHTML+=`
<div class="insight-card">
<div class="insight-title">🧠 Most Responsive Mood</div>
<div class="insight-value">${bestMood.mood}</div>
</div>
`;

}

document.getElementById("insight-content").innerHTML=insightHTML;

loadStreak();
}catch(error){

console.error(error);
alert("Error loading detailed analytics");

}

}


/* ===============================
   Logout
=============================== */

function logout(){

localStorage.removeItem("token");

window.location.href="/login.html";

}


/*For Streak*/
async function loadStreak(){

  try{

    const response = await fetch("/api/analytics/streak",{
      headers:{
        "Authorization":`Bearer ${token}`
      }
    });

    const data = await response.json();

   const streakHTML = `
<div class="insight-card">
  <div class="insight-title">
    🔥 Consistency Streak
  </div>

  <div class="streak-grid">

    <div class="streak-item">
      <span class="streak-label">Current</span>
      <span class="streak-value">
        ${data.current_streak} day${data.current_streak !== 1 ? 's' : ''}
      </span>
    </div>

    <div class="streak-item">
      <span class="streak-label">Longest</span>
      <span class="streak-value">
        ${data.longest_streak} day${data.longest_streak !== 1 ? 's' : ''}
      </span>
    </div>

  </div>
</div>
`;

    document.getElementById("insight-content").innerHTML += streakHTML;

  }catch(error){

    console.error(error);

  }

}

/*Script for schedule planner*/

/* =====================================================
   INDUSTRY GRADE SCHEDULE PLANNER LOGIC
===================================================== */

let currentEditTaskId = null;

/* --- Load Tasks & Calculate Progress --- */
async function loadTasks() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch("/api/tasks/today", {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const tasks = await res.json();
    const list = document.getElementById("taskList");
    const emptyState = document.getElementById("emptyState");

    if (!list) return;

    list.innerHTML = "";

    // 1. Handle Empty State
    if (tasks.length === 0) {
      emptyState.classList.remove("hidden");
      updateProgress(0, 0);
      return;
    } else {
      emptyState.classList.add("hidden");
    }

    // 2. Calculate Progress
    const completedTasks = tasks.filter(t => t.completed).length;
    updateProgress(completedTasks, tasks.length);

    // 3. Render Tasks
    tasks.forEach(task => {
      const isCompleted = task.completed ? "completed" : "";
      const isChecked = task.completed ? "checked" : "";
      
      // Handle optional time display
      const timeDisplay = (task.startTime || task.endTime) 
        ? `<span class="task-time">🕒 ${task.startTime || '??'} - ${task.endTime || '??'}</span>` 
        : "";

      const div = document.createElement("div");
      div.className = `task-card ${isCompleted}`;
      div.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${isChecked} onclick="toggleTask('${task._id}')">
        
        <div class="task-content">
          <div class="task-text">${task.text}</div>
          <div class="task-meta">
            <span class="badge badge-${task.priority}">${task.priority}</span>
            <span class="badge badge-category">${task.category}</span>
            ${timeDisplay}
          </div>
        </div>

        <div class="task-actions">
          <button onclick="prepareEdit('${task._id}', '${task.text.replace(/'/g, "\\'")}', '${task.category}', '${task.priority}', '${task.startTime}', '${task.endTime}')" title="Edit Task">✏️</button>
          <button onclick="deleteTask('${task._id}')" class="delete-btn" title="Delete Task">🗑️</button>
        </div>
      `;

      list.appendChild(div);
    });

  } catch (err) {
    console.error("Error loading tasks:", err);
  }
}

/* --- Update Progress Bar UI --- */
function updateProgress(completed, total) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  
  const fill = document.getElementById("progress-fill");
  const text = document.getElementById("progress-text");
  
  if (fill && text) {
    fill.style.width = `${percent}%`;
    text.innerText = `${percent}%`;
    
    // Change color if 100% completed!
    if (percent === 100) {
      fill.style.background = "#10b981"; // Slightly deeper green for completion
    } else {
      fill.style.background = "#22c55e"; 
    }
  }
}

/* --- Toast Notification Utility --- */
function showToast(message, type = "success") {
  const toast = document.getElementById("toast-notification");
  if (!toast) return;
  
  toast.innerText = message;
  toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}
/* --- Add or Update Task --- */
/* --- Add or Update Task (With Validation & Polish) --- */
async function addTask() {
  const token = localStorage.getItem("token");
  
  const text = document.getElementById("taskInput").value;
  const category = document.getElementById("taskCategory").value;
  const priority = document.getElementById("taskPriority").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;
  const btn = document.getElementById("saveTaskBtn");

  // 1. Validation: Prevent empty tasks
  if (!text.trim()) {
    showToast("Please enter a task description.", "error");
    return;
  }

  // 2. Validation: Ensure time logic is correct
  if (startTime && endTime) {
    if (startTime >= endTime) {
      showToast("End time must be after the start time.", "error");
      return;
    }
  }

  const payload = { text, category, priority, startTime, endTime };

  // 3. UI Polish: Loading state
  const originalBtnText = btn.innerText;
  btn.innerText = "Saving...";
  btn.disabled = true;

  try {
    if (currentEditTaskId) {
      // UPDATE EXISTING TASK
      await fetch(`/api/tasks/${currentEditTaskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      currentEditTaskId = null;
      btn.innerText = "Add Task";
      showToast("Task updated successfully!");
    } else {
      // CREATE NEW TASK
      await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      showToast("Task added to your schedule!");
    }

    // Reset form
    document.getElementById("taskInput").value = "";
    document.getElementById("startTime").value = "";
    document.getElementById("endTime").value = "";
    
    loadTasks();

  } catch (err) {
    console.error("Error saving task:", err);
    showToast("Server error. Could not save task.", "error");
  } finally {
    // Revert button state
    btn.innerText = currentEditTaskId ? "Update Task" : "Add Task";
    btn.disabled = false;
  }
}
/* --- Toggle Completion --- */
async function toggleTask(id) {
  const token = localStorage.getItem("token");
  try {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
    loadTasks();
  } catch (err) {
    console.error("Error toggling task:", err);
  }
}

/* --- Delete Task --- */
async function deleteTask(id) {
  if (!confirm("Are you sure you want to delete this task?")) return;
  
  const token = localStorage.getItem("token");
  try {
    await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    loadTasks();
  } catch (err) {
    console.error("Error deleting task:", err);
  }
}

/* --- Prepare Form for Editing --- */
function prepareEdit(id, text, category, priority, startTime, endTime) {
  currentEditTaskId = id;
  
  document.getElementById("taskInput").value = text;
  document.getElementById("taskCategory").value = category;
  document.getElementById("taskPriority").value = priority;
  document.getElementById("startTime").value = startTime === 'undefined' ? '' : startTime;
  document.getElementById("endTime").value = endTime === 'undefined' ? '' : endTime;
  
  document.getElementById("saveTaskBtn").innerText = "Update Task";
  
  // Scroll to top so user sees the form
  window.scrollTo({ top: 0, behavior: 'smooth' });
}