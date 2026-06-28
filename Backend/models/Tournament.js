const mongoose = require("mongoose");
const standingsEntrySchema = new mongoose.Schema(
  {
    teamName: { type: String, required: true },

    played: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    ties: { type: Number, default: 0 },
    nr: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    runsFor: { type: Number, default: 0 },
    ballsFor: { type: Number, default: 0 }, 
    runsAgainst: { type: Number, default: 0 },
    ballsAgainst: { type: Number, default: 0 },
    nrr: { type: Number, default: 0 }, 
  },
  { _id: false }
);
const pointsRulesSchema = new mongoose.Schema(
  {
    win: { type: Number, default: 2 },
    loss: { type: Number, default: 0 },
    tie: { type: Number, default: 1 },
    noResult: { type: Number, default: 1 },
  },
  { _id: false }
);
const superOverRuleSchema = new mongoose.Schema(
  {
    leagueTieAllowed: { type: Boolean, default: true },
    knockoutMandatory: { type: Boolean, default: true },
  },
  { _id: false }
);

const tournamentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: { type: String, required: true, trim: true },
    format: {
      type: String,
      enum: ["Limited Overs", "Test"],
      required: true,
    },
    overs: { type: Number, default: null },
    matchDays: { type: Number, default: null },
    oversPerDay: { type: Number, default: null },
    teams: { type: [String], required: true },
    leagueFormat: {
      type: String,
      enum: ["roundRobin", "groups"],
      default: "roundRobin",
    },
    roundRobinType: {
      type: String,
      enum: ["single", "double"],
      default: "single",
    },
    numGroups: { type: Number, default: null },
    knockoutFormat: {
      type: String,
      enum: ["top2", "top4", "top8", "ipl", "none"],
      default: "none",
    },

    pointsRules: { type: pointsRulesSchema, default: () => ({}) },
    superOver: { type: superOverRuleSchema, default: () => ({}) },

    standings: { type: [standingsEntrySchema], default: [] },

    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed"],
      default: "upcoming",
    },

    winner: { type: String, default: "" }, 
    shareId:    { type: String, default: null },
    visibility: { type: String, enum: ["private", "public"], default: "private" },
  },
  { timestamps: true },
);

tournamentSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model("Tournament", tournamentSchema);