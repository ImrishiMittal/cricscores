const mongoose = require("mongoose");

// One player entry inside a squad.
const squadPlayerSchema = new mongoose.Schema(
  {
    jersey: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["batsman", "bowler", "allrounder", "wk"],
      default: "batsman",
    },
  },
  { _id: false }
);

// A Squad is a saved, reusable list of players for a team, scoped to the
// logged-in user. tournamentId is optional:
//   - null/undefined  -> this is the team's "default" squad, usable in any
//                         tournament or even non-tournament matches later.
//   - set to an ObjectId -> this squad only applies within that specific
//                         tournament (lets the same team field different
//                         players across different tournaments if needed).
//
// MatchSetupPage looks up squads by (userId, teamName, tournamentId) first,
// falling back to (userId, teamName, tournamentId: null) if no
// tournament-specific squad exists.
const squadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    teamName: { type: String, required: true, trim: true },

    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      default: null,
    },

    players: { type: [squadPlayerSchema], default: [] },
  },
  { timestamps: true }
);

// A user can't have two squads with the same (teamName, tournamentId) pair —
// that would be ambiguous when looking up which squad to prefill.
squadSchema.index(
  { userId: 1, teamName: 1, tournamentId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Squad", squadSchema);