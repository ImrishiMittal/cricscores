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
    draws:    { type: Number, default: 0 },   // ← Phase 5 addition
    matchIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

teamSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Team", teamSchema);