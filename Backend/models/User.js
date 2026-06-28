const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: false,   // Phone users have no email
    unique: true,
    sparse: true,      // allows multiple null values in unique index
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: false,   // Google/Phone users have no password
    default: null,
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true,      // allows multiple null values (email users have no firebaseUid)
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
  },
  provider: {
    type: String,
    enum: ["email", "google", "phone"],
    default: "email",
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);