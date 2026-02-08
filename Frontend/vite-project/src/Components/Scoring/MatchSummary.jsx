import styles from './MatchSummary.module.css';

function MatchSummary({ 
  team1, 
  team2, 
  winner, 
  innings1Data, 
  innings2Data,
  innings1Score,
  innings2Score,
  matchData,
  onClose 
}) {
  
  console.log("📊 MatchSummary received:");
  console.log("Innings 1 Data:", innings1Data);
  console.log("Innings 2 Data:", innings2Data);
  
  // ✅ Get top 3 batsmen by runs
  const getTop3Batsmen = (battingStats) => {
    if (!battingStats || battingStats.length === 0) return [];
    return [...battingStats]
      .filter(b => b.balls > 0) // Only show batsmen who faced balls
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 3);
  };

  // ✅ Get top 3 bowlers by wickets (then by economy)
  const getTop3Bowlers = (bowlingStats) => {
    if (!bowlingStats || bowlingStats.length === 0) return [];
    return [...bowlingStats]
      .filter(b => b.balls > 0 || b.overs > 0) // Only show bowlers who bowled
      .sort((a, b) => {
        if (b.wickets !== a.wickets) return b.wickets - a.wickets;
        return parseFloat(a.economy) - parseFloat(b.economy);
      })
      .slice(0, 3);
  };

  const inn1TopBatsmen = getTop3Batsmen(innings1Data?.battingStats || []);
  const inn1TopBowlers = getTop3Bowlers(innings1Data?.bowlingStats || []);
  const inn2TopBatsmen = getTop3Batsmen(innings2Data?.battingStats || []);
  const inn2TopBowlers = getTop3Bowlers(innings2Data?.bowlingStats || []);

  // ✅ Calculate match result message
  const getMatchResult = () => {
    if (!winner) return "Match Drawn";
    
    const firstBattingTeam = matchData?.battingFirst || matchData?.teamA;
    const secondBattingTeam = firstBattingTeam === matchData?.teamA ? matchData?.teamB : matchData?.teamA;
    
    if (winner === firstBattingTeam) {
      const margin = innings1Score?.score - innings2Score?.score;
      return `${winner} won by ${margin} runs`;
    } else {
      const maxWickets = Number(matchData?.teamBPlayers || 11) - 1;
      const wicketsLeft = maxWickets - innings2Score?.wickets;
      return `${winner} won by ${wicketsLeft} wickets`;
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* ================= HEADER ================= */}
        <h2 className={styles.title}>🏆 Match Summary</h2>
  
        {/* ================= SCROLLABLE CONTENT ================= */}
        <div className={styles.content}>
          {/* INNINGS 1 */}
          <div className={styles.inningsBlock}>
            <div className={styles.inningsHeader}>
              <span className={styles.teamName}>{team1}</span>
              <span className={styles.scoreDisplay}>
                {innings1Score?.score || 0}/{innings1Score?.wickets || 0}
              </span>
              <span className={styles.oversDisplay}>
                ({innings1Score?.overs || 0}.{innings1Score?.balls || 0} overs)
              </span>
            </div>
  
            <div className={styles.statsGrid}>
              <div className={styles.statsColumn}>
                <h4 className={styles.columnTitle}>Batting</h4>
                {inn1TopBatsmen.length > 0 ? (
                  inn1TopBatsmen.map((bat, idx) => (
                    <div key={idx} className={styles.statRow}>
                      <span className={styles.playerName}>{bat.name}</span>
                      <span className={styles.statValue}>
                        {bat.runs} ({bat.balls})
                      </span>
                    </div>
                  ))
                ) : (
                  <p className={styles.noData}>No batting data</p>
                )}
              </div>
  
              <div className={styles.statsColumn}>
                <h4 className={styles.columnTitle}>Bowling</h4>
                {inn1TopBowlers.length > 0 ? (
                  inn1TopBowlers.map((bowl, idx) => (
                    <div key={idx} className={styles.statRow}>
                      <span className={styles.playerName}>{bowl.name}</span>
                      <span className={styles.statValue}>
                        {bowl.wickets}/{bowl.runs} ({bowl.overs}.{bowl.balls})
                      </span>
                    </div>
                  ))
                ) : (
                  <p className={styles.noData}>No bowling data</p>
                )}
              </div>
            </div>
          </div>
  
          <div className={styles.divider}></div>
  
          {/* INNINGS 2 */}
          <div className={styles.inningsBlock}>
            <div className={styles.inningsHeader}>
              <span className={styles.teamName}>{team2}</span>
              <span className={styles.scoreDisplay}>
                {innings2Score?.score || 0}/{innings2Score?.wickets || 0}
              </span>
              <span className={styles.oversDisplay}>
                ({innings2Score?.overs || 0}.{innings2Score?.balls || 0} overs)
              </span>
            </div>
  
            <div className={styles.statsGrid}>
              <div className={styles.statsColumn}>
                <h4 className={styles.columnTitle}>Batting</h4>
                {inn2TopBatsmen.length > 0 ? (
                  inn2TopBatsmen.map((bat, idx) => (
                    <div key={idx} className={styles.statRow}>
                      <span className={styles.playerName}>{bat.name}</span>
                      <span className={styles.statValue}>
                        {bat.runs} ({bat.balls})
                      </span>
                    </div>
                  ))
                ) : (
                  <p className={styles.noData}>No batting data</p>
                )}
              </div>
  
              <div className={styles.statsColumn}>
                <h4 className={styles.columnTitle}>Bowling</h4>
                {inn2TopBowlers.length > 0 ? (
                  inn2TopBowlers.map((bowl, idx) => (
                    <div key={idx} className={styles.statRow}>
                      <span className={styles.playerName}>{bowl.name}</span>
                      <span className={styles.statValue}>
                        {bowl.wickets}/{bowl.runs} ({bowl.overs}.{bowl.balls})
                      </span>
                    </div>
                  ))
                ) : (
                  <p className={styles.noData}>No bowling data</p>
                )}
              </div>
            </div>
          </div>
  
          {/* MATCH RESULT */}
          <div className={styles.resultBox}>
            <p className={styles.resultText}>{getMatchResult()}</p>
          </div>
        </div>
  
        {/* ================= CLOSE BUTTON ================= */}
        <button className={styles.closeBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default MatchSummary;


