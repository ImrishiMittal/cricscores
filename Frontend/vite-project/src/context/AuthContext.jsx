import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { token, username, userId }
  const [loading, setLoading] = useState(true);

  // On app load, restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem("cricket_token");
    const username = localStorage.getItem("cricket_username");
    const userId = localStorage.getItem("cricket_userId");
    if (token && username && userId) {
      setUser({ token, username, userId });
    }
    setLoading(false);
  }, []);

  // Intercept 401s and auto-logout
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // Called after any successful auth (email, phone, or Google)
  // data = { token, username, userId } from your backend
  const login = (data) => {
    localStorage.setItem("cricket_token", data.token);
    localStorage.setItem("cricket_username", data.username);
    localStorage.setItem("cricket_userId", data.userId);
    setUser(data);
  };

  const logout = async () => {
    localStorage.removeItem("cricket_token");
    localStorage.removeItem("cricket_username");
    localStorage.removeItem("cricket_userId");
    setUser(null);
    // Also sign out from Firebase (safe to call even if not Firebase session)
    try {
      await signOut(auth);
    } catch (_) {}
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
