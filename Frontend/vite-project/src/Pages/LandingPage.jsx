import styles from "./LandingPage.module.css";
import logo from "../assets/logo.png";

function LandingPage() {
  return (
    <div className={styles.container}>
      <div className={styles.rightSection}>
        <img src={logo} alt="CricScores Logo" />
      </div>
      <div className={styles.leftSection}>
        <h1 className={styles.title}>
          Cric<span>Scores</span>
        </h1>

        <p className={styles.tagline}><i>Score cricket matches like a pro</i></p>

        <div className={styles.authLinks}>
          <button className={styles.login}><i className="fa-solid fa-right-to-bracket"></i><b> Log In</b></button>
          <button className={styles.signup}><i className="fa-solid fa-user-plus"></i><b> Sign Up</b></button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
