import axios from "axios";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const loginUser = async (email, password) => {
  const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  return response.data;
};

export const registerUser = async (username, email, password) => {
  const response = await axios.post(`${BASE_URL}/auth/register`, { username, email, password });
  return response.data;
};

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const firebaseToken = await result.user.getIdToken();
  const response = await axios.post(`${BASE_URL}/auth/firebase`, {
    firebaseToken,
    provider: "google",
    displayName: result.user.displayName,
    email: result.user.email,
  });
  return response.data;
};

export const sendOtp = async (phoneNumber) => {
  const digits = phoneNumber.replace(/\D/g, "").slice(-10);
  const response = await axios.post(`${BASE_URL}/auth/send-otp`, { phone: digits });
  return response.data;
};

export const verifyOtp = async (otp, phoneNumber) => {
  const digits = phoneNumber.replace(/\D/g, "").slice(-10);
  const response = await axios.post(`${BASE_URL}/auth/verify-otp`, { phone: digits, otp });
  return response.data;
};
