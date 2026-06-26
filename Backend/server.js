const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes   = require("./routes/auth");
const playerRoutes = require("./routes/players");
const matchRoutes  = require("./routes/matches");
const teamRoutes   = require("./routes/teams"); 
const squadsRouter = require("./routes/squads");
const tournamentRoutes = require("./routes/tournaments");
const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://cricscorers.netlify.app",
    "https://cricscorers.in",
    "https://www.cricscorers.in"
  ],
  credentials: true
}));
app.use(express.json());

app.use("/api/auth",    authRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/teams",   teamRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/squads", squadsRouter);
app.use("/api/head-to-head", require("./routes/headToHead"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB error:", err));