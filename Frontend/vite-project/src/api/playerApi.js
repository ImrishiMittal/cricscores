import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

// Helper — reads token from localStorage and builds the header
const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("cricket_token")}`,
  },
});

// Get all players
export const getAllPlayers = async () => {
  const response = await axios.get(`${BASE_URL}/players`, authHeader());
  return response.data;
};

// Add a player
export const addPlayer = async (playerData) => {
  const response = await axios.post(`${BASE_URL}/players`, playerData, authHeader());
  return response.data;
};

// Delete a player
export const deletePlayer = async (id) => {
  const response = await axios.delete(`${BASE_URL}/players/${id}`, authHeader());
  return response.data;
};