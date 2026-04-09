// Backend/models/Player.js
// Field names match exactly what usePlayerDatabase.js accumulates in pendingStatsRef.
// DO NOT rename these — the PATCH /stats route does $inc on these exact keys.

const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // ── Identity ───────────────────────────────────────────────────────────────
  name:    { type: String, required: true, trim: true },
  jersey:  { type: String, default: "" },
  country: { type: String, default: "" },
  role: {
    type: String,
    enum: ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper", ""],
    default: "",
  },

  // ── Match tracking ─────────────────────────────────────────────────────────
  matches:        { type: Number, default: 0 },
  matchIds:       { type: [String], default: [] },  // for deduplication

  // ── Batting ────────────────────────────────────────────────────────────────
  runs:           { type: Number, default: 0 },
  balls:          { type: Number, default: 0 },
  innings:        { type: Number, default: 0 },
  fours:          { type: Number, default: 0 },
  sixes:          { type: Number, default: 0 },
  dotBalls:       { type: Number, default: 0 },
  ones:           { type: Number, default: 0 },
  twos:           { type: Number, default: 0 },
  threes:         { type: Number, default: 0 },

  // Batting milestones
  thirties:       { type: Number, default: 0 },
  fifties:        { type: Number, default: 0 },
  hundreds:       { type: Number, default: 0 },
  ducks:          { type: Number, default: 0 },
  highestScore:   { type: Number, default: 0 },

  // Dismissal tracking
  dismissals:     { type: Number, default: 0 },
  notOuts:        { type: Number, default: 0 },

  // ── Bowling ────────────────────────────────────────────────────────────────
  wickets:          { type: Number, default: 0 },
  runsGiven:        { type: Number, default: 0 },
  ballsBowled:      { type: Number, default: 0 },
  bowlingInnings:   { type: Number, default: 0 },
  bowlingMatchIds:  { type: [String], default: [] },
  wides:            { type: Number, default: 0 },
  noBalls:          { type: Number, default: 0 },
  dotBallsBowled:   { type: Number, default: 0 },
  maidens:          { type: Number, default: 0 },

  // Bowling milestones
  threeWickets:   { type: Number, default: 0 },
  fiveWickets:    { type: Number, default: 0 },
  tenWickets:     { type: Number, default: 0 },

  // Best bowling figures in a single innings
  bestBowlingWickets: { type: Number, default: 0 },
  bestBowlingRuns:    { type: Number, default: 0 },

  // ── Fielding ───────────────────────────────────────────────────────────────
  catches:    { type: Number, default: 0 },
  runouts:    { type: Number, default: 0 },
  stumpings:  { type: Number, default: 0 },

  // ── Captaincy ──────────────────────────────────────────────────────────────
  captainMatches: { type: Number, default: 0 },
  captainWins:    { type: Number, default: 0 },
  captainLosses:  { type: Number, default: 0 },
  captainTies:    { type: Number, default: 0 },
  captainNR:      { type: Number, default: 0 },

}, { timestamps: true });

// ── Virtual computed stats (never stored, always derived) ──────────────────────
// These match what your StatsPage and PlayerDetailPage already display.

playerSchema.virtual("battingAverage").get(function () {
  if (!this.dismissals) return this.runs > 0 ? this.runs : 0;
  return parseFloat((this.runs / this.dismissals).toFixed(2));
});

playerSchema.virtual("strikeRate").get(function () {
  if (!this.balls) return 0;
  return parseFloat(((this.runs / this.balls) * 100).toFixed(2));
});

playerSchema.virtual("bowlingAverage").get(function () {
  if (!this.wickets) return 0;
  return parseFloat((this.runsGiven / this.wickets).toFixed(2));
});

playerSchema.virtual("economy").get(function () {
  const overs = this.ballsBowled / 6;
  if (!overs) return 0;
  return parseFloat((this.runsGiven / overs).toFixed(2));
});

playerSchema.virtual("bowlingStrikeRate").get(function () {
  if (!this.wickets) return 0;
  return parseFloat((this.ballsBowled / this.wickets).toFixed(2));
});

// Send virtuals in every res.json() response
playerSchema.set("toJSON",   { virtuals: true });
playerSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Player", playerSchema);
