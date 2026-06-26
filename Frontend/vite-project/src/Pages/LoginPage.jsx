import { useState } from "react";
import styles from "./Auth.module.css";
import { useNavigate } from "react-router-dom";
import { loginUser, loginWithGoogle, sendOtp, verifyOtp } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

// Phone number must be E.164: +91XXXXXXXXXX
const toE164 = (phone) => {
  const digits = phone.replace(/\D/g, "");
  // If user typed 10 digits, assume India (+91). Adjust if needed.
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  return `+${digits}`;
};

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Tab: "email" | "phone"
  const [tab, setTab] = useState("email");

  // Email/password state
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone/OTP state
  const [phone, setPhone]       = useState("");
  const [otp, setOtp]           = useState("");
  const [otpSent, setOtpSent]   = useState(false);

  // Shared
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo]     = useState("");

  // ── Email login ──────────────────────────────────────────────────────────
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");
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

  // ── Send OTP ─────────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");
    if (!phone.trim()) { setError("Enter a phone number."); return; }
    setLoading(true);
    try {
      await sendOtp(toE164(phone.trim()));
      setOtpSent(true);
      setInfo("OTP sent! Check your messages.");
    } catch (err) {
      setError(err.message || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ───────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");
    if (!otp.trim()) { setError("Enter the OTP."); return; }
    setLoading(true);
    try {
      const data = await verifyOtp(otp.trim());
      login(data);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ── Google login ─────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setError(""); setInfo("");
    setLoading(true);
    try {
      const data = await loginWithGoogle();
      login(data);
      navigate("/home");
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled.");
      } else {
        setError(err.response?.data?.error || err.message || "Google sign-in failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Invisible reCAPTCHA anchor — required for phone auth */}
      <div id="recaptcha-container" />

      <div className={styles.card}>
        <div className={styles.badge}>LOG IN</div>

        {/* ── Method tabs ── */}
        <div style={tabBarStyle}>
          <button style={tabStyle(tab === "email")}  onClick={() => { setTab("email");  setError(""); setInfo(""); }}>Email</button>
          <button style={tabStyle(tab === "phone")}  onClick={() => { setTab("phone");  setError(""); setInfo(""); setOtpSent(false); }}>Phone</button>
        </div>

        {/* ── Email/password form ── */}
        {tab === "email" && (
          <form onSubmit={handleEmailLogin} className={styles.form}>
            <input
              className={styles.input}
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div style={{ position: "relative", width: "100%" }}>
              <input
                className={styles.input}
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: "42px" }}
                required
              />
              <button type="button" onClick={() => setShowPassword((p) => !p)} style={eyeStyle}>
                <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
              </button>
            </div>
            {error && <p style={errorStyle}>{error}</p>}
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
        )}

        {/* ── Phone/OTP form ── */}
        {tab === "phone" && (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className={styles.form}>
            <div style={{ position: "relative", width: "100%" }}>
              <input
                className={styles.input}
                placeholder="Phone number (e.g. 9876543210)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={otpSent}
                required
              />
              {otpSent && (
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(""); setError(""); setInfo(""); }}
                  style={changeLinkStyle}
                >
                  Change
                </button>
              )}
            </div>

            {otpSent && (
              <input
                className={styles.input}
                placeholder="Enter 6-digit OTP"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            )}

            {info  && <p style={infoStyle}>{info}</p>}
            {error && <p style={errorStyle}>{error}</p>}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading
                ? otpSent ? "Verifying..." : "Sending OTP..."
                : otpSent ? "Verify OTP" : "Send OTP"}
            </button>
          </form>
        )}

        {/* ── OR divider ── */}
        <div style={orDividerStyle}>
          <span style={orLineStyle} />
          <span style={orTextStyle}>OR</span>
          <span style={orLineStyle} />
        </div>

        {/* ── Google button ── */}
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
const tabBarStyle = {
  display: "flex",
  gap: "8px",
  width: "100%",
  marginBottom: "4px",
};

const tabStyle = (active) => ({
  flex: 1,
  padding: "8px 0",
  borderRadius: "8px",
  border: active ? "2px solid #4f8ef7" : "2px solid transparent",
  background: active ? "rgba(79,142,247,0.12)" : "rgba(255,255,255,0.05)",
  color: active ? "#4f8ef7" : "#9ca3af",
  fontWeight: active ? 600 : 400,
  cursor: "pointer",
  fontSize: "0.9rem",
  transition: "all 0.2s",
});

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

const changeLinkStyle = {
  position: "absolute",
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#4f8ef7",
  fontSize: "13px",
  padding: 0,
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
const infoStyle  = { color: "#34d399", fontSize: "0.85rem", margin: "0" };

export default LoginPage;
