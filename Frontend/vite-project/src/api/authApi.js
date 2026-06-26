import axios from "axios";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";
import { auth } from "../firebase";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Existing email/password (unchanged) ────────────────────────────────────

export const loginUser = async (email, password) => {
  const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  return response.data; // { token, username, userId }
};

export const registerUser = async (username, email, password) => {
  const response = await axios.post(`${BASE_URL}/auth/register`, { username, email, password });
  return response.data; // { token, username, userId }
};

// ─── Google Sign-In ──────────────────────────────────────────────────────────

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const firebaseToken = await result.user.getIdToken();

  // Send Firebase token to your backend → backend verifies + returns session
  const response = await axios.post(`${BASE_URL}/auth/firebase`, {
    firebaseToken,
    provider: "google",
    displayName: result.user.displayName,
    email: result.user.email,
  });
  return response.data; // { token, username, userId }
};

// ─── Phone OTP ───────────────────────────────────────────────────────────────

// Step 1: Send OTP — call this when user submits phone number
// containerId = id of a div in the DOM for invisible reCAPTCHA
export const sendOtp = async (phoneNumber, containerId = "recaptcha-container") => {
  // Clear existing verifier AND wipe the DOM element
  if (window._recaptchaVerifier) {
    try { window._recaptchaVerifier.clear(); } catch (_) {}
    window._recaptchaVerifier = null;
  }
  // Reset the container so Firebase sees a fresh element
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = "";

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {},
  });
  window._recaptchaVerifier = verifier;

  await verifier.render();

  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
  window._confirmationResult = confirmationResult;
  return confirmationResult;
};

// Step 2: Verify OTP — call this when user submits the 6-digit code
export const verifyOtp = async (otp) => {
  if (!window._confirmationResult) {
    throw new Error("No OTP session found. Please request OTP again.");
  }
  const result = await window._confirmationResult.confirm(otp);
  const firebaseToken = await result.user.getIdToken();

  // Send Firebase token to your backend
  const response = await axios.post(`${BASE_URL}/auth/firebase`, {
    firebaseToken,
    provider: "phone",
    phone: result.user.phoneNumber,
  });
  return response.data; // { token, username, userId }
};