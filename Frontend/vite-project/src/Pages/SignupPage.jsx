import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Auth.module.css";
import { registerUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false); // ✅ NEW

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser(username.trim(), email.trim(), password);
      login(data);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.badge}>SIGN UP</div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.input}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            className={styles.input}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* ✅ Password field with eye toggle */}
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
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{
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
              }}
            >
              <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
            </button>
          </div>

          {error && <p style={{ color: "#ff6b6b", fontSize: "0.85rem", margin: "0" }}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className={styles.or}>OR</div>

        <div className={styles.socials}>
          <i className="fa-brands fa-google"></i>
          <i className="fa-solid fa-envelope"></i>
          <i className="fa-brands fa-x-twitter"></i>
        </div>

        <div className={styles.linkText}>
          Already have an account?
          <span onClick={() => navigate("/login")}> Log In</span>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;