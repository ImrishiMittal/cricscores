const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"],
    required: true,
  },
  battingAverage: {
    type: Number,
    default: 0,
  },
  bowlingAverage: {
    type: Number,
    default: 0,
  },
  matches: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model("Player", playerSchema);