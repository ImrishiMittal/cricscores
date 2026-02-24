import { calculateManOfTheMatch } from '../../utils/momCalculator';
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
  const formatOvers = (overs, balls) => {
    const completeOvers = Math.floor(overs);
    const ballsInCurrentOver = balls % 6;
    return `${completeOvers}.${ballsInCurrentOver}`;
  };

  const determineResult = () => {

    if (winner === "NO RESULT") {
      return {
        type: 'noresult',
        message: '🌧️ NO RESULT',
        description: 'Match ended without a result',
      };
    }
    
    const score1 = innings1Score?.score || 0;
    const score2 = innings2Score?.score || 0;
    const wickets2 = innings2Score?.wickets || 0;
    const maxWickets = Number(matchData?.teamAPlayers || 11) - 1;

    if (score1 === score2) {
      return {
        type: 'tie',
        message: `MATCH IS A TIE`,
        description: `Both teams scored ${score1} runs`,
      };
    }

    if (score1 > score2) {
      return {
        type: 'win',
        message: `${team1} WON BY ${score1 - score2} RUNS`,
        description: `${team1} defeated ${team2}`,
      };
    }

    const wicketsRemaining = maxWickets - wickets2;
    return {
      type: 'win',
      message: `${team2} WON BY ${wicketsRemaining} WICKET${wicketsRemaining === 1 ? '' : 'S'}`,
      description: `${team2} defeated ${team1}`,
    };
  };

  // ✅ Calculate Man of the Match
  const manOfTheMatch = calculateManOfTheMatch(innings1Data, innings2Data, winner, matchData);

  const result = determineResult();
  const team1Score = innings1Score?.score || 0;
  const team1Wickets = innings1Score?.wickets || 0;
  const team1OversFormatted = formatOvers(innings1Score?.overs || 0, innings1Score?.balls || 0);
  const team2Score = innings2Score?.score || 0;
  const team2Wickets = innings2Score?.wickets || 0;
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

        {/* ✅ MAN OF THE MATCH */}
        {manOfTheMatch && (
          <div className={styles.momBox}>
            <div className={styles.momContent}>
              <p className={styles.momLabel}>MAN OF THE MATCH</p>
              <p className={styles.momName}>{manOfTheMatch.name}</p>
              <p className={styles.momTeam}>{manOfTheMatch.team}</p>
              <div className={styles.momStats}>
                {manOfTheMatch.battingScore > 0 && (
                  <span className={styles.momStat}>Batting: {manOfTheMatch.battingScore} pts</span>
                )}
                {manOfTheMatch.bowlingScore > 0 && (
                  <span className={styles.momStat}>Bowling: {manOfTheMatch.bowlingScore} pts</span>
                )}
                <span className={styles.momTotal}>Total: {manOfTheMatch.totalScore} pts</span>
              </div>
            </div>
          </div>
        )}

        {/* SCORECARD CONTAINER */}
        <div className={styles.scorecardContainer}>
          {/* TEAM 1 SCORECARD */}
          <div className={styles.scorecard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.teamNameCard}>{team1}</h2>
              <span className={styles.oversCard}>OVERS {team1OversFormatted}</span>
            </div>

            <div className={styles.mainScore}>
              <span className={styles.scoreNumber}>{team1Score}</span>
              <span className={styles.wicketsNumber}>-{team1Wickets}</span>
            </div>

            {innings1Data?.battingStats && innings1Data.battingStats.length > 0 && (
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
            )}

            {innings1Data?.bowlingStats && innings1Data.bowlingStats.length > 0 && (
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
                    <div className={styles.statCol}>{bowler.overs}.{bowler.balls}</div>
                    <div className={styles.statCol}>{bowler.runs}</div>
                    <div className={styles.statCol}>{bowler.wickets}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.divider} />

          {/* TEAM 2 SCORECARD */}
          <div className={styles.scorecard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.teamNameCard}>{team2}</h2>
              <span className={styles.oversCard}>OVERS {team2OversFormatted}</span>
            </div>

            <div className={styles.mainScore}>
              <span className={styles.scoreNumber}>{team2Score}</span>
              <span className={styles.wicketsNumber}>-{team2Wickets}</span>
            </div>

            {innings2Data?.battingStats && innings2Data.battingStats.length > 0 && (
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
            )}

            {innings2Data?.bowlingStats && innings2Data.bowlingStats.length > 0 && (
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
                    <div className={styles.statCol}>{bowler.overs}.{bowler.balls}</div>
                    <div className={styles.statCol}>{bowler.runs}</div>
                    <div className={styles.statCol}>{bowler.wickets}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default MatchSummary;
