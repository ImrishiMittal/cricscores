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
  onClose,
}) {
  // ✅ FIX: Proper cricket over formatting
  const formatOvers = (overs, balls) => {
    const completeOvers = Math.floor(overs);
    const ballsInCurrentOver = balls % 6;
    return `${completeOvers}.${ballsInCurrentOver}`;
  };

  // ✅ FIXED: Determine match result with correct win type
  const determineResult = () => {
    const score1 = innings1Score?.score || 0;
    const score2 = innings2Score?.score || 0;
    const wickets1 = innings1Score?.wickets || 0;
    const wickets2 = innings2Score?.wickets || 0;
    const maxWickets = Number(matchData?.teamAPlayers || 11) - 1; // Total wickets available

    if (score1 === score2) {
      return {
        type: 'tie',
        message: `MATCH IS A TIE`,
        description: `Both teams scored ${score1} runs`,
      };
    }

    // ✅ Team 1 (Batting First) - Wins by RUNS
    if (score1 > score2) {
      return {
        type: 'win',
        message: `${team1} WON BY ${score1 - score2} RUNS`,
        description: `${team1} defeated ${team2}`,
      };
    }

    // ✅ Team 2 (Batting Second) - Wins by WICKETS (wickets remaining)
    const wicketsRemaining = maxWickets - wickets2;
    return {
      type: 'win',
      message: `${team2} WON BY ${wicketsRemaining} WICKET${wicketsRemaining === 1 ? '' : 'S'}`,
      description: `${team2} defeated ${team1}`,
    };
  };

  const result = determineResult();

  const team1Score = innings1Score?.score || 0;
  const team1Wickets = innings1Score?.wickets || 0;
  // ✅ FIX: Use proper cricket over format
  const team1OversFormatted = formatOvers(innings1Score?.overs || 0, innings1Score?.balls || 0);

  const team2Score = innings2Score?.score || 0;
  const team2Wickets = innings2Score?.wickets || 0;
  // ✅ FIX: Use proper cricket over format
  const team2OversFormatted = formatOvers(innings2Score?.overs || 0, innings2Score?.balls || 0);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className={styles.header}>
          <h1 className={styles.title}>🏆 MATCH SUMMARY</h1>
        </div>

        {/* RESULT BOX */}
        <div className={`${styles.resultBox} ${styles[result.type]}`}>
          <p className={styles.resultMessage}>{result.message}</p>
          <p className={styles.resultDescription}>{result.description}</p>
        </div>

        {/* SCORECARD CONTAINER */}
        <div className={styles.scorecardContainer}>
          {/* TEAM 1 SCORECARD */}
          <div className={styles.scorecard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.teamNameCard}>{team1}</h2>
              <span className={styles.oversCard}>
                OVERS {team1OversFormatted}
              </span>
            </div>

            <div className={styles.mainScore}>
              <span className={styles.scoreNumber}>{team1Score}</span>
              <span className={styles.wicketsNumber}>-{team1Wickets}</span>
            </div>

            {/* BATTING STATS TABLE */}
            {innings1Data?.battingStats && innings1Data.battingStats.length > 0 ? (
              <div className={styles.statsTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.playerCol}>BATSMAN</div>
                  <div className={styles.statCol}>R</div>
                  <div className={styles.statCol}>B</div>
                  <div className={styles.statCol}>SR</div>
                </div>
                {innings1Data.battingStats.map((player, idx) => (
                  <div key={idx} className={styles.tableRow}>
                    <div className={styles.playerCol}>{player.name}</div>
                    <div className={styles.statCol}>{player.runs}</div>
                    <div className={styles.statCol}>{player.balls}</div>
                    <div className={styles.statCol}>{player.strikeRate}</div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* BOWLING STATS TABLE */}
            {innings1Data?.bowlingStats && innings1Data.bowlingStats.length > 0 ? (
              <div className={styles.statsTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.playerCol}>BOWLER</div>
                  <div className={styles.statCol}>O</div>
                  <div className={styles.statCol}>R</div>
                  <div className={styles.statCol}>W</div>
                </div>
                {innings1Data.bowlingStats.map((bowler, idx) => (
                  <div key={idx} className={styles.tableRow}>
                    <div className={styles.playerCol}>{bowler.name}</div>
                    <div className={styles.statCol}>{bowler.overs}</div>
                    <div className={styles.statCol}>{bowler.runs}</div>
                    <div className={styles.statCol}>{bowler.wickets}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* DIVIDER */}
          <div className={styles.divider} />

          {/* TEAM 2 SCORECARD */}
          <div className={styles.scorecard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.teamNameCard}>{team2}</h2>
              <span className={styles.oversCard}>
                OVERS {team2OversFormatted}
              </span>
            </div>

            <div className={styles.mainScore}>
              <span className={styles.scoreNumber}>{team2Score}</span>
              <span className={styles.wicketsNumber}>-{team2Wickets}</span>
            </div>

            {/* BATTING STATS TABLE */}
            {innings2Data?.battingStats && innings2Data.battingStats.length > 0 ? (
              <div className={styles.statsTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.playerCol}>BATSMAN</div>
                  <div className={styles.statCol}>R</div>
                  <div className={styles.statCol}>B</div>
                  <div className={styles.statCol}>SR</div>
                </div>
                {innings2Data.battingStats.map((player, idx) => (
                  <div key={idx} className={styles.tableRow}>
                    <div className={styles.playerCol}>{player.name}</div>
                    <div className={styles.statCol}>{player.runs}</div>
                    <div className={styles.statCol}>{player.balls}</div>
                    <div className={styles.statCol}>{player.strikeRate}</div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* BOWLING STATS TABLE */}
            {innings2Data?.bowlingStats && innings2Data.bowlingStats.length > 0 ? (
              <div className={styles.statsTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.playerCol}>BOWLER</div>
                  <div className={styles.statCol}>O</div>
                  <div className={styles.statCol}>R</div>
                  <div className={styles.statCol}>W</div>
                </div>
                {innings2Data.bowlingStats.map((bowler, idx) => (
                  <div key={idx} className={styles.tableRow}>
                    <div className={styles.playerCol}>{bowler.name}</div>
                    <div className={styles.statCol}>{bowler.overs}</div>
                    <div className={styles.statCol}>{bowler.runs}</div>
                    <div className={styles.statCol}>{bowler.wickets}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* CLOSE BUTTON */}
        <button className={styles.closeBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default MatchSummary;
