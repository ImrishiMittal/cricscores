import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.css";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>

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
      <p className={styles.tagline}>Choose what you want to do</p>

      {/* Action buttons */}
      <div className={styles.authLinks}>
        <button
          onClick={() => navigate("/setup")}
          className={styles.btnPrimary}
        >
          <span className={styles.btnEmoji}>🏏</span>
          START MATCH
        </button>

        <button
          onClick={() => navigate("/stats")}
          className={styles.btnSecondary}
        >
          <span className={styles.btnEmoji}>📊</span>
          VIEW RECORDS
        </button>

        <button
          onClick={() => navigate("/history")}
          className={styles.btnSecondary}
        >
          <span className={styles.btnEmoji}>📋</span>
          MATCH HISTORY
        </button>
      </div>

      <p className={styles.footerHint}>CricScores · v1.0</p>
    </div>
  );
}

export default HomePage;
