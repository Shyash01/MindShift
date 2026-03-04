const mongoose = require("mongoose");
require("dotenv").config();
const Activity = require("./models/Activity");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected for Seeding"))
  .catch(err => console.log(err));

const activities = [

  // EXPRESSIVE (Low Energy)
  {
    title: "5-minute sunlight exposure",
    category: "physical",
    duration: 5,
    suitable_moods: ["expressive"],
    min_people: 1,
    max_people: 2,
    base_score: 2
  },
  {
    title: "Light stretching routine",
    category: "physical",
    duration: 7,
    suitable_moods: ["expressive", "dissociative"],
    min_people: 1,
    max_people: 1,
    base_score: 2
  },
  {
    title: "Write 3 small tasks and complete 1",
    category: "cognitive",
    duration: 10,
    suitable_moods: ["expressive"],
    min_people: 1,
    max_people: 1,
    base_score: 3
  },

  // ANXIOUS
  {
    title: "5-4-3-2-1 grounding technique",
    category: "emotional",
    duration: 7,
    suitable_moods: ["anxious"],
    min_people: 1,
    max_people: 1,
    base_score: 3
  },
  {
    title: "Box breathing exercise",
    category: "emotional",
    duration: 5,
    suitable_moods: ["anxious"],
    min_people: 1,
    max_people: 1,
    base_score: 3
  },
  {
    title: "Cold water face splash",
    category: "physical",
    duration: 3,
    suitable_moods: ["anxious", "irritable"],
    min_people: 1,
    max_people: 1,
    base_score: 2
  },

  // IRRITABLE
  {
    title: "20 jumping jacks",
    category: "physical",
    duration: 5,
    suitable_moods: ["irritable"],
    min_people: 1,
    max_people: 1,
    base_score: 3
  },
  {
    title: "2-minute wall sit challenge",
    category: "physical",
    duration: 5,
    suitable_moods: ["irritable"],
    min_people: 1,
    max_people: 1,
    base_score: 3
  },
  {
    title: "Rage journaling for 5 minutes",
    category: "cognitive",
    duration: 5,
    suitable_moods: ["irritable"],
    min_people: 1,
    max_people: 1,
    base_score: 2
  },

  // DISSOCIATIVE
  {
    title: "Touch and describe 5 objects around you",
    category: "emotional",
    duration: 5,
    suitable_moods: ["dissociative"],
    min_people: 1,
    max_people: 1,
    base_score: 3
  },
  {
    title: "Hold ice cube for 30 seconds",
    category: "physical",
    duration: 3,
    suitable_moods: ["dissociative"],
    min_people: 1,
    max_people: 1,
    base_score: 2
  },
  {
    title: "Describe your room aloud",
    category: "cognitive",
    duration: 5,
    suitable_moods: ["dissociative"],
    min_people: 1,
    max_people: 2,
    base_score: 2
  }

];

const seedDB = async () => {
  await Activity.deleteMany({});
  await Activity.insertMany(activities);
  console.log("Activities Seeded Successfully");
  mongoose.connection.close();
};

seedDB();