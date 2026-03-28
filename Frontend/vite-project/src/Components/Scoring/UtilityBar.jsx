import styles from "./scoring.module.css";

function UtilityBar({ partnershipHistory, matchCompleted, onPartnership, onInningsHistory, onInningsSummary, onComparisonGraph, onMore, onScorecard, onMatchSummary }) {
  return (
    <div className={styles.utilityRow}>
      {partnershipHistory.length > 0 && (
        <button className={styles.utilityBtn} onClick={onPartnership}>
          📊 Previous Partnerships ({partnershipHistory.length})
        </button>
      )}
      <button className={styles.utilityBtn} onClick={onInningsHistory}>📋 Innings History</button>
      <button className={styles.utilityBtn} onClick={onInningsSummary}>📄 Innings Summary</button>
      <button className={styles.utilityBtn} onClick={onComparisonGraph}>📈 Comparison Graph</button>
      <button className={styles.utilityBtn} onClick={onMore}>⚙ MORE</button>
      {matchCompleted && (
        <button className={styles.utilityBtn} onClick={onScorecard} style={{ background: "#1db954", color: "#000", fontWeight: "700" }}>
          📊 SCORECARD
        </button>
      )}
      {matchCompleted && (
        <button className={styles.utilityBtn} onClick={onMatchSummary}>🏆 Match Summary</button>
      )}
    </div>
  );
}

export default UtilityBar;