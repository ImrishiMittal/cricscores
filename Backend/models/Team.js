// models/Team.js — complete version
const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name:     { type: String, required: true, trim: true },
    matches:  { type: Number, default: 0 },
    wins:     { type: Number, default: 0 },
    losses:   { type: Number, default: 0 },
    ties:     { type: Number, default: 0 },
    nr:       { type: Number, default: 0 },
    // ✅ Stores processed matchIds so PATCH /:id dedup works
    matchIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

// ✅ Prevents duplicate team names per user at the DB level
teamSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Team", teamSchema);