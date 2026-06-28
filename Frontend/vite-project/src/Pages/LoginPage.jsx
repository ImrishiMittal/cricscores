import { useState } from "react";
import styles from "./Auth.module.css";
import { useNavigate } from "react-router-dom";
import { loginUser, loginWithGoogle } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser(email.trim(), password);
      login(data);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await loginWithGoogle();
      login(data);
      navigate("/home");
    } catch (err) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.badge}>LOG IN</div>

        <form onSubmit={handleEmailLogin} className={styles.form}>
          <input className={styles.input} placeholder="Email" type="email"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <div style={{ position: "relative", width: "100%" }}>
            <input className={styles.input} placeholder="Password"
              type={showPassword ? "text" : "password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: "42px" }} required />
            <button type="button" onClick={() => setShowPassword((p) => !p)} style={eyeStyle}>
              <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
            </button>
          </div>
          {error && <p style={errorStyle}>{error}</p>}
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div style={orDividerStyle}>
          <span style={orLineStyle} /><span style={orTextStyle}>OR</span><span style={orLineStyle} />
        </div>

        <button onClick={handleGoogleLogin} disabled={loading} style={googleBtnStyle}>
          <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 10 }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Continue with Google
        </button>

        <div className={styles.linkText}>
          Don't have an account?
          <span onClick={() => navigate("/signup")}> Sign Up</span>
        </div>
      </div>
    </div>
  );
}

// ── Inline styles ────────────────────────────────────────────────────────────
const eyeStyle = {
  position: "absolute",
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#9ca3af",
  fontSize: "16px",
  padding: 0,
  lineHeight: 1,
};

const orDividerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  width: "100%",
  margin: "4px 0",
};

const orLineStyle = {
  flex: 1,
  height: "1px",
  background: "rgba(255,255,255,0.12)",
  display: "block",
};

const orTextStyle = {
  color: "#6b7280",
  fontSize: "0.8rem",
  whiteSpace: "nowrap",
};

const googleBtnStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  padding: "11px 0",
  borderRadius: "10px",
  border: "1.5px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "#e5e7eb",
  fontSize: "0.95rem",
  fontWeight: 500,
  cursor: "pointer",
  transition: "background 0.2s",
};

const errorStyle = { color: "#ff6b6b", fontSize: "0.85rem", margin: "0" };

export default LoginPage;
