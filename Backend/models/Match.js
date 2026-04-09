const mongoose = require("mongoose");

// Per-player batting scorecard entry for a match
const battingEntrySchema = new mongoose.Schema({
  playerId:     { type: String, default: "" },  // MongoDB _id or jersey key
  playerName:   { type: String, required: true },
  jersey:       { type: String, default: "" },
  runs:         { type: Number, default: 0 },
  balls:        { type: Number, default: 0 },
  fours:        { type: Number, default: 0 },
  sixes:        { type: Number, default: 0 },
  dotBalls:     { type: Number, default: 0 },
  ones:         { type: Number, default: 0 },
  twos:         { type: Number, default: 0 },
  threes:       { type: Number, default: 0 },
  isOut:        { type: Boolean, default: false },
  dismissalType:{ type: String, default: "" },  // "bowled","caught","lbw","runout","stumped"
  fielderName:  { type: String, default: "" },  // catcher / stumper / run-out fielder
  bowlerName:   { type: String, default: "" },
}, { _id: false });

// Per-player bowling scorecard entry
const bowlingEntrySchema = new mongoose.Schema({
  playerId:       { type: String, default: "" },
  playerName:     { type: String, required: true },
  jersey:         { type: String, default: "" },
  ballsBowled:    { type: Number, default: 0 },
  runsGiven:      { type: Number, default: 0 },
  wickets:        { type: Number, default: 0 },
  wides:          { type: Number, default: 0 },
  noBalls:        { type: Number, default: 0 },
  dotBallsBowled: { type: Number, default: 0 },
  maidens:        { type: Number, default: 0 },
}, { _id: false });

const matchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Unique match identifier (same as what you put in localStorage)
  matchId: { type: String, required: true },

  // Basic info
  matchDate:  { type: Date, default: Date.now },
  venue:      { type: String, default: "" },
  totalOvers: { type: Number, required: true },

  // Teams
  team1Name: { type: String, required: true },
  team2Name: { type: String, required: true },

  // Scores
  team1Score:   { type: Number, default: 0 },
  team1Wickets: { type: Number, default: 0 },
  team1Balls:   { type: Number, default: 0 },

  team2Score:   { type: Number, default: 0 },
  team2Wickets: { type: Number, default: 0 },
  team2Balls:   { type: Number, default: 0 },

  // Result
  winner:     { type: String, default: "" },
  resultText: { type: String, default: "" },

  // Captain info (for captaincy stats)
  team1Captain: { type: String, default: "" },  // player name
  team2Captain: { type: String, default: "" },

  // Detailed scorecards
  team1Batting: [battingEntrySchema],
  team2Batting: [battingEntrySchema],
  team1Bowling: [bowlingEntrySchema],
  team2Bowling: [bowlingEntrySchema],

  status: {
    type: String,
    enum: ["in-progress", "completed"],
    default: "completed",
  },
}, { timestamps: true });

module.exports = mongoose.model("Match", matchSchema);
