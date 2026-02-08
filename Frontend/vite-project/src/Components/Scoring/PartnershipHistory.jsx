import { addCaptainTag } from "../../utils/captainHelper";
import styles from "./scoring.module.css";

function PartnershipHistory({ history, onClose, matchData, battingTeam }) {
  if (!history || history.length === 0) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.partnershipHistoryBox} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>Partnership History</h2>
            <button className={styles.modalHeaderCloseBtn} onClick={onClose}>✖</button>
          </div>
          <p style={{ textAlign: "center", color: "#888", padding: "20px" }}>
            No partnerships yet
          </p>
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
        <div className={styles.modalHeader}>
          <h2>Partnership History</h2>
          <button className={styles.modalHeaderCloseBtn} onClick={onClose}>✖</button>
        </div>

        <div className={styles.partnershipList}>
          {history.map((p, idx) => {
            const batsman1Display = addCaptainTag(p.batsman1, matchData, battingTeam);
            const batsman2Display = addCaptainTag(p.batsman2, matchData, battingTeam);

            return (
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
                  <div className={styles.partnershipBatsmanRow}>
                    <span className={styles.partnershipBatsmanName}>{batsman1Display}</span>
                    <span className={styles.partnershipBatsmanRuns}>
                      {p.batsman1Runs} runs
                    </span>
                  </div>
                  <div className={styles.partnershipBatsmanRow}>
                    <span className={styles.partnershipBatsmanName}>{batsman2Display}</span>
                    <span className={styles.partnershipBatsmanRuns}>
                      {p.batsman2Runs} runs
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PartnershipHistory;