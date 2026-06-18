const mongoose = require("mongoose");

// One row in the points table — scoped to THIS tournament only.
// We do NOT reuse Team.wins/losses/ties/nr here, because Team is a
// lifetime aggregate across all of a user's matches. A tournament
// needs its own isolated counters so stats don't bleed in from
// matches played outside this tournament.
const standingsEntrySchema = new mongoose.Schema(
  {
    teamName: { type: String, required: true },

    played: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    ties: { type: Number, default: 0 },
    nr: { type: Number, default: 0 }, // no result
    points: { type: Number, default: 0 },

    // Running totals needed to compute Net Run Rate.
    // Convention: "for" = runs/overs scored BY this team,
    // "against" = runs/overs scored against this team.
    // Overs are stored as balls internally, converted to overs only for display/NRR math.
    runsFor: { type: Number, default: 0 },
    ballsFor: { type: Number, default: 0 }, // balls this team faced while batting
    runsAgainst: { type: Number, default: 0 },
    ballsAgainst: { type: Number, default: 0 }, // balls bowled at the opponent

    nrr: { type: Number, default: 0 }, // recalculated and cached whenever standings update
  },
  { _id: false }
);

// Customizable points-per-result, since league rules vary (some give 2/0,
// some give 4/0, some give bonus points etc.)
const pointsRulesSchema = new mongoose.Schema(
  {
    win: { type: Number, default: 2 },
    loss: { type: Number, default: 0 },
    tie: { type: Number, default: 1 },
    noResult: { type: Number, default: 1 },
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

    // Mirrors the match-format concept already used elsewhere in the app.
    format: {
      type: String,
      enum: ["Limited Overs", "Test"],
      required: true,
    },

    // Only meaningful when format === "Limited Overs"
    overs: { type: Number, default: null },
    // Only meaningful when format === "Test"
    days: { type: Number, default: null },

    // Free-text team names, consistent with how Match.js stores
    // team1Name/team2Name as strings rather than Team references.
    teams: { type: [String], required: true },

    // User-selectable fixture generation style.
    // "single" = each team plays every other team once.
    // "double" = each team plays every other team twice (home/away mirror).
    roundRobinType: {
      type: String,
      enum: ["single", "double"],
      default: "single",
    },

    pointsRules: { type: pointsRulesSchema, default: () => ({}) },

    standings: { type: [standingsEntrySchema], default: [] },

    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed"],
      default: "upcoming",
    },

    winner: { type: String, default: "" }, // set once knockouts/finals conclude
  },
  { timestamps: true }
);

tournamentSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model("Tournament", tournamentSchema);