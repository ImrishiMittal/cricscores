const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const playerRoutes = require("./routes/players");
const authRoutes = require("./routes/auth"); // ADD THIS

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ Connection failed:", err));

app.get("/", (req, res) => {
  res.json({ message: "API working ✅" });
});

app.use("/api/players", playerRoutes);
app.use("/api/auth", authRoutes); // ADD THIS

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});