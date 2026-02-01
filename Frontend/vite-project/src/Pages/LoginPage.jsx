import styles from "./Auth.module.css";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // later: backend auth
    console.log("Login submitted");
    navigate("/setup");
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.badge}>LOG IN</div>

        <form onSubmit={handleLogin} className={styles.form}>
          <input
            className={styles.input}
            placeholder="Email"
            type="email"
            required
          />
          <input
            className={styles.input}
            placeholder="Password"
            type="password"
            required
          />

          <button type="submit" className={styles.submitBtn}>
            Log In
          </button>
        </form>

        <div className={styles.or}>OR</div>

        <div className={styles.socials}>
          <i className="fa-brands fa-google"></i>
          <i className="fa-solid fa-envelope"></i>
          <i className="fa-brands fa-x-twitter"></i>
        </div>

        <div className={styles.linkText}>
          Don't have an account?
          <span onClick={() => navigate("/signup")}> Sign Up</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

