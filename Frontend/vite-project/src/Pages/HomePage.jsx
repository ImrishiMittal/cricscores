import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.css";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <h1 className={styles.title}>
          Cric<span>Scores</span>
        </h1>

        <p className={styles.tagline}>Choose what you want to do</p>

        <div className={styles.authLinks}>
          <button onClick={() => navigate("/setup")} className={styles.login}>
            🏏 Start Match
          </button>

          <button onClick={() => navigate("/stats")} className={styles.signup}>
            📊 View Records
          </button>
          <button
            onClick={() => navigate("/history")}
            className={styles.signup}
            style={{ marginTop: 8 }}
          >
            📋 Match History
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
