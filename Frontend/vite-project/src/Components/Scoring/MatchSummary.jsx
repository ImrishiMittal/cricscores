import styles from "./scoring.module.css";

function MatchSummary({ team1, team2, summaryData, winner, onClose }) {
  if (!summaryData) return null;

  return (
    <div className={styles.summaryOverlay}>
      <div className={styles.summaryBox}>
        <h2>Match Summary</h2>

        {summaryData.map((inn, i) => (
          <div key={i} className={styles.summarySection}>
            <h3>{inn.team} — {inn.score}/{inn.wickets} ({inn.overs} overs)</h3>

            <div className={styles.summaryRow}>
              <div>
                <h4>Top Batsmen</h4>
                {inn.topBatsmen.map((b, idx) => (
                  <p key={idx}>{b.name} {b.runs}({b.balls})</p>
                ))}
              </div>

              <div>
                <h4>Top Bowlers</h4>
                {inn.topBowlers.map((b, idx) => (
                  <p key={idx}>{b.name} {b.wickets}/{b.runs} ({b.overs})</p>
                ))}
              </div>
            </div>
          </div>
        ))}

        <h3 className={styles.winnerText}>🏆 {winner}</h3>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default MatchSummary;
