const { initializeApp, getApps, cert } = require("firebase-admin/app");
const serviceAccount = require("./serviceAccountKey.json");

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

// Export getters so other files can use auth, firestore, etc.
const { getAuth } = require("firebase-admin/auth");

module.exports = { getAuth };