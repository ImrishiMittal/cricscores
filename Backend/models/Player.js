const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,        // every player must belong to a user
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper", ""],
    default: "",
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