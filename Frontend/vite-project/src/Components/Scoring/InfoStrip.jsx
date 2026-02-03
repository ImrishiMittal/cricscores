import styles from "./scoring.module.css";

function InfoStrip({ overs, bowler }) {
  return (
    <div className={styles.infoStrip}>
      <div>
        <span className={styles.label}>OVERS - </span>
        <span className={styles.value}>{overs}</span>
      </div>
      <div className={styles.divider}></div>
      <div>
        <span className={styles.label}>BOWLER - </span>
        <span className={styles.value}>{bowler}</span>
      </div>
    </div>
  );
}

export default InfoStrip;
