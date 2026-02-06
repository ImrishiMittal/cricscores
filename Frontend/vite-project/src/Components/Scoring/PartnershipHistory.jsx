import styles from "./scoring.module.css";

function PartnershipHistory({ history, onClose }) {
  if (!history || history.length === 0) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
          <h2>Partnership History</h2>
          <p style={{ textAlign: "center", color: "#888" }}>
            No partnerships yet
          </p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.partnershipHistoryBox}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles.modalTitle}>Partnership History</h2>

        <div className={styles.partnershipList}>
          {history.map((p, idx) => (
            <div key={idx} className={styles.partnershipCard}>
              <div className={styles.partnershipHeader}>
                <span className={styles.wicketBadge}>
                  Wicket {p.wicketNumber}
                </span>
                <span className={styles.scoreBadge}>
                  Score: {p.scoreWhenBroke}/{p.wicketNumber}
                </span>
              </div>

              <div className={styles.partnershipTotal}>
                {p.totalRuns} runs ({p.totalBalls} balls)
              </div>

              <div className={styles.batsmenContribution}>
                <div className={styles.batsmanRow}>
                  <span className={styles.batsmanName}>{p.batsman1}</span>
                  <span className={styles.batsmanRuns}>
                    {p.batsman1Runs} runs
                  </span>
                </div>
                <div className={styles.batsmanRow}>
                  <span className={styles.batsmanName}>{p.batsman2}</span>
                  <span className={styles.batsmanRuns}>
                    {p.batsman2Runs} runs
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className={styles.closeBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default PartnershipHistory;
