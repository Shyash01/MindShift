const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const PORT = process.env.PORT || 5000;

const authRoutes = require("./routes/authRoutes");
const activityRoutes = require("./routes/activityRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

app.use(cors());
app.use(express.json());

/* Serve frontend */
app.use(express.static(path.join(__dirname, "public"), {
  index: false
})); 

/* API routes */
app.use("/api", activityRoutes);
app.use("/api/auth", authRoutes);

/*Task App*/
app.use("/api/tasks", taskRoutes);
/* Landing page */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "landing.html"));
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch(err => console.log(err));



app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);