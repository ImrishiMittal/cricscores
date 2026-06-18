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
    // "league" covers all round-robin fixtures; the rest are Phase 5 knockouts.
    stage: {
      type: String,
      enum: ["league", "semifinal", "final"],
      default: "league",
    },

    scheduledDate: { type: Date, default: null },

    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "no-result"],
      default: "scheduled",
    },

    // --- Link to the actual scored match ---
    // Match.js identifies itself by a string matchId (not Mongo _id),
    // so we store that same string here to stay consistent.
    matchId: { type: String, default: null },

    // --- Cached result fields ---
    // Populated once the linked Match is completed, so the points table
    // and NRR calculations don't need to fetch+join every Match document
    // on every read. These are a snapshot, not the source of truth —
    // the source of truth is always the Match document itself.
    winner: { type: String, default: "" }, // "" until decided; teamA/teamB name, or "Tie"/"No Result"

    teamARuns: { type: Number, default: 0 },
    teamAWickets: { type: Number, default: 0 },
    teamABalls: { type: Number, default: 0 },

    teamBRuns: { type: Number, default: 0 },
    teamBWickets: { type: Number, default: 0 },
    teamBBalls: { type: Number, default: 0 },

    resultText: { type: String, default: "" }, // e.g. "Team A won by 24 runs"
  },
  { timestamps: true }
);

fixtureSchema.index({ tournamentId: 1, status: 1 });
fixtureSchema.index({ matchId: 1 });

module.exports = mongoose.model("Fixture", fixtureSchema);