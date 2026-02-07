import styles from "./scoring.module.css";

function InningsHistory({ history, onClose }) {
  if (!history || history.length === 0) {
    return (
      <div className={styles.summaryOverlay}>
        <div className={styles.summaryBox}>
          <h2>No innings data yet</h2>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.summaryOverlay}>
      <div className={styles.summaryBox}>
        <h2>Innings History</h2>

        {history.map((ball, i) => (
          <p key={i}>
            Ball {i + 1}: {ball.runs ?? ball.type}
          </p>
        ))}

        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default InningsHistory;
