import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

export const loginUser = async (email, password) => {
  const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  return response.data; // { token, username, userId }
};

export const registerUser = async (username, email, password) => {
  const response = await axios.post(`${BASE_URL}/auth/register`, { username, email, password });
  return response.data; // { token, username, userId }
};