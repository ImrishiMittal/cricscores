import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.css";
import logo from "../assets/logo.png";


function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      {/* RIGHT SIDE (LOGO) */}
      <div className={styles.rightSection}>
      <img src={logo} alt="CricScores Logo" />
      </div>

      {/* LEFT SIDE */}
      <div className={styles.leftSection}>
        <h1 className={styles.title}>
          Cric<span>Scores</span>
        </h1>

        <p className={styles.tagline}>Score cricket matches like a pro</p>

        <div className={styles.authLinks}>
          <button onClick={() => navigate("/login")} className={styles.login}>
            <i className="fa-solid fa-right-to-bracket"></i> Log In
          </button>

          <button onClick={() => navigate("/signup")} className={styles.signup}>
            <i className="fa-solid fa-user-plus"></i> Sign Up
          </button>
        </div>
      </div>


    </div>
  );
}

export default LandingPage;
