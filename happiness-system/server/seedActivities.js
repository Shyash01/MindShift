const mongoose = require("mongoose");
require("dotenv").config();
const Activity = require("./models/Activity");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected for Seeding"))
  .catch(err => console.log(err));

const activities = [

{ title:"Deep breathing for 2 minutes", category:"calming", duration:2, min_people:1, max_people:4 },
{ title:"5-4-3-2-1 grounding exercise", category:"mindfulness", duration:3, min_people:1, max_people:4 },
{ title:"Drink a glass of water mindfully", category:"reset", duration:1, min_people:1, max_people:4 },
{ title:"Stretch your arms and shoulders", category:"physical", duration:2, min_people:1, max_people:4 },
{ title:"Take a short mindful walk", category:"physical", duration:5, min_people:1, max_people:2 },
{ title:"Observe 5 objects around you carefully", category:"mindfulness", duration:2, min_people:1, max_people:4 },
{ title:"Roll your shoulders slowly 5 times", category:"physical", duration:1, min_people:1, max_people:3 },
{ title:"Relax your jaw and unclench your teeth", category:"calming", duration:1, min_people:1, max_people:4 },
{ title:"Close your eyes and breathe slowly", category:"calming", duration:2, min_people:1, max_people:4 },
{ title:"Focus on your breathing for 1 minute", category:"mindfulness", duration:1, min_people:1, max_people:4 },

{ title:"Stand up and stretch your back", category:"physical", duration:2, min_people:1, max_people:4 },
{ title:"Look outside and observe nature", category:"mindfulness", duration:2, min_people:1, max_people:4 },
{ title:"Count backwards from 50 slowly", category:"focus", duration:2, min_people:1, max_people:1 },
{ title:"Name 3 things you are grateful for", category:"positive_thinking", duration:2, min_people:1, max_people:3 },
{ title:"Write down one positive thought", category:"positive_thinking", duration:2, min_people:1, max_people:2 },
{ title:"Visualize a calm and peaceful place", category:"mindfulness", duration:3, min_people:1, max_people:1 },
{ title:"Observe sounds around you carefully", category:"mindfulness", duration:2, min_people:1, max_people:4 },
{ title:"Touch something cold and focus on the sensation", category:"mindfulness", duration:1, min_people:1, max_people:2 },
{ title:"Shake your arms gently to release tension", category:"physical", duration:1, min_people:1, max_people:3 },
{ title:"Stand in a confident posture for 30 seconds", category:"confidence", duration:1, min_people:1, max_people:4 },

{ title:"Smile intentionally for 10 seconds", category:"positive_thinking", duration:1, min_people:1, max_people:4 },
{ title:"Think of a recent small success", category:"positive_thinking", duration:2, min_people:1, max_people:3 },
{ title:"Look at something that makes you happy", category:"positive_thinking", duration:2, min_people:1, max_people:4 },
{ title:"Send a short positive message to someone", category:"social", duration:2, min_people:1, max_people:2 },
{ title:"Ask someone how they are doing", category:"social", duration:2, min_people:2, max_people:4 },
{ title:"Make brief eye contact with someone nearby", category:"social", duration:1, min_people:2, max_people:4 },
{ title:"Say hello to someone nearby", category:"social", duration:1, min_people:2, max_people:4 },
{ title:"Share one positive thought with someone", category:"social", duration:2, min_people:2, max_people:4 },
{ title:"Listen actively to someone for a moment", category:"social", duration:2, min_people:2, max_people:4 },
{ title:"Focus on the sensation of your feet touching the ground", category:"mindfulness", duration:2, min_people:1, max_people:4 },

{ title:"Take 3 slow deep breaths", category:"calming", duration:1, min_people:1, max_people:4 },
{ title:"Slowly inhale and exhale while counting to 5", category:"calming", duration:2, min_people:1, max_people:4 },
{ title:"Observe your hands carefully for 30 seconds", category:"mindfulness", duration:1, min_people:1, max_people:2 },
{ title:"Pause and take a mindful moment", category:"mindfulness", duration:1, min_people:1, max_people:4 },
{ title:"Roll your neck gently from side to side", category:"physical", duration:1, min_people:1, max_people:3 },
{ title:"Stand and stretch your legs briefly", category:"physical", duration:2, min_people:1, max_people:4 },
{ title:"Walk slowly across the room", category:"physical", duration:2, min_people:1, max_people:2 },
{ title:"Look at the sky for a few seconds", category:"mindfulness", duration:1, min_people:1, max_people:4 },
{ title:"Think about something you appreciate today", category:"positive_thinking", duration:2, min_people:1, max_people:3 },
{ title:"Recall a moment that made you smile recently", category:"positive_thinking", duration:2, min_people:1, max_people:3 },

{ title:"Take a slow mindful pause", category:"mindfulness", duration:1, min_people:1, max_people:4 },
{ title:"Relax your shoulders consciously", category:"calming", duration:1, min_people:1, max_people:4 },
{ title:"Sit comfortably and breathe calmly", category:"calming", duration:2, min_people:1, max_people:4 },
{ title:"Observe your surroundings quietly", category:"mindfulness", duration:2, min_people:1, max_people:4 },
{ title:"Think about one goal you want to achieve today", category:"focus", duration:2, min_people:1, max_people:2 }

];

const seedDB = async () => {
  try {
    await Activity.deleteMany({});
    await Activity.insertMany(activities);
    console.log("Activities Seeded Successfully");
  } catch (error) {
    console.error("Error Seeding Activities:", error);
  } finally {
    mongoose.connection.close();
  }
};

seedDB();