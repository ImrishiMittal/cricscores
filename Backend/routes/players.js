const express = require("express");
const router = express.Router();
const Player = require("../models/Player");
const authMiddleware = require("../middleware/auth");

// All routes protected
router.use(authMiddleware);

// GET — only return this user's players
router.get("/", async (req, res) => {
  try {
    const players = await Player.find({ userId: req.userId });
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — attach userId when creating a player
router.post("/", async (req, res) => {
  try {
    const player = new Player({
      ...req.body,
      userId: req.userId,   // always use the token's userId, never trust client
    });
    await player.save();
    res.status(201).json(player);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE — only allow deleting your own player
router.delete("/:id", async (req, res) => {
  try {
    const player = await Player.findOne({
      _id: req.params.id,
      userId: req.userId,   // prevents deleting another user's player
    });

    if (!player) {
      return res.status(404).json({ error: "Player not found or not yours." });
    }

    await player.deleteOne();
    res.json({ message: "Player deleted ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;