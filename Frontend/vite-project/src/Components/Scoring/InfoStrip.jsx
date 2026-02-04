import styles from "./scoring.module.css";


function InfoStrip({ overs, bowler, runRate, isFreeHit }) {
  return (
    <div className={styles.infoStrip}>
      <div>
        <span className={styles.label}>OVERS</span>
        <span className={styles.value}>{overs}</span>
      </div>

      <div className={styles.divider}></div>

      <div>
        <span className={styles.label}>RUN RATE</span>
        <span className={styles.value}>{runRate}</span>
      </div>

      <div className={styles.divider}></div>

      <div>
        <span className={styles.label}>BOWLER</span>
        <span className={styles.value}>{bowler}</span>
      </div>
      {isFreeHit && (
        <>
          <div className={styles.divider}></div>
          <div className={styles.freeHitBox}>FREE HIT</div>
        </>
      )}
    </div>
  );
}

export default InfoStrip;

