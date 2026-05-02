const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes   = require("./routes/auth");
const playerRoutes = require("./routes/players");
const matchRoutes  = require("./routes/matches");
const teamRoutes   = require("./routes/teams");   // ← ADD

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://cricscores.netlify.app" // update after you get Netlify URL
  ],
  credentials: true
}));
app.use(express.json());

app.use("/api/auth",    authRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/teams",   teamRoutes);              // ← ADD

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB error:", err));