const mongoose = require("mongoose");

const fixtureSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },

    // Free-text, matching Match.js's team1Name/team2Name convention
    teamA: { type: String, required: true },
    teamB: { type: String, required: true },

    // Which round/stage this fixture belongs to.
    stage: {
      type: String,
      enum: [
        "league",
        // Standard knockout stages
        "quarterfinal",
        "semifinal",
        "final",
        // IPL Playoffs
        "qualifier1",   // 1 vs 2 — winner goes to final, loser goes to qualifier2
        "eliminator",   // 3 vs 4 — winner goes to qualifier2, loser is out
        "qualifier2",   // loser of Q1 vs winner of eliminator — winner goes to final
      ],
      default: "league",
    },

    // Group label for group-stage league fixtures: "Group A", "Group B", etc.
    // null for round-robin and all knockout fixtures.
    group: { type: String, default: null },

    // ── Knockout bracket progression ────────────────────────────────────────
    // Each knockout fixture has a unique slot label so we know WHICH future
    // fixture to update when this one completes. Format examples:
    //   "QF1", "QF2", "SF1", "SF2", "F", "Q1", "EL", "Q2"
    knockoutSlot: { type: String, default: null },

    // When this fixture completes, the winner is written into the slot below.
    // e.g. the QF1 winner goes into "teamA" of "SF1".
    // Format: "<targetSlot>:<side>"  e.g. "SF1:teamA", "SF2:teamB"
    winnerGoesTo: { type: String, default: null },

    scheduledDate: { type: Date, default: null },

    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "no-result"],
      default: "scheduled",
    },

    // Link to the actual scored match (Match.matchId string, not Mongo _id)
    matchId: { type: String, default: null },

    // ── Cached result snapshot ──────────────────────────────────────────────
    winner: { type: String, default: "" },

    teamARuns:    { type: Number, default: 0 },
    teamAWickets: { type: Number, default: 0 },
    teamABalls:   { type: Number, default: 0 },

    teamBRuns:    { type: Number, default: 0 },
    teamBWickets: { type: Number, default: 0 },
    teamBBalls:   { type: Number, default: 0 },

    resultText: { type: String, default: "" },
  },
  { timestamps: true }
);

fixtureSchema.index({ tournamentId: 1, status: 1 });
fixtureSchema.index({ tournamentId: 1, knockoutSlot: 1 });
fixtureSchema.index({ matchId: 1 });

module.exports = mongoose.model("Fixture", fixtureSchema);