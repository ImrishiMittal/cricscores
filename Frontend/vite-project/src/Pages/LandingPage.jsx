import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.css";
import logo from "../assets/logo.png";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>

      {/* RIGHT — floating logo */}
      <div className={styles.rightSection}>
        <img src={logo} alt="CricScores Logo" />
      </div>

      {/* LEFT — content */}
      <div className={styles.leftSection}>

        {/* Live pill */}
        <div className={styles.livePill}>
          <span className={styles.liveDot} />
          Live Scorer
        </div>

        {/* Title */}
        <h1 className={styles.title}>
          Cric<span>Scores</span>
        </h1>
        <span className={styles.titleAccent} />

        {/* Tagline */}
        <p className={styles.tagline}>Score cricket matches like a pro</p>

        {/* Auth buttons */}
        <div className={styles.authLinks}>
          <button onClick={() => navigate("/login")} className={styles.login}>
            <i className="fa-solid fa-right-to-bracket" /> Log In
          </button>
          <button onClick={() => navigate("/signup")} className={styles.signup}>
            <i className="fa-solid fa-user-plus" /> Sign Up
          </button>
        </div>
      </div>

    </div>
  );
}

export default LandingPage;
