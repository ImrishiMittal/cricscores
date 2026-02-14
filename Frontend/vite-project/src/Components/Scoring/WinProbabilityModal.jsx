import { useState, useEffect } from 'react';
import styles from './WinProbabilityModal.module.css';

function WinProbabilityModal({ 
  matchData,
  innings1Score,
  innings1Wickets,
  currentScore,
  currentWickets,
  currentOvers,
  currentBalls,
  onClose 
}) {
  const [probability, setProbability] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const totalOvers = Number(matchData.overs || 50);
  const team1Score = innings1Score || 0;
  const team1Wickets = innings1Wickets || 0;
  
  const team2Score = currentScore || 0;
  const team2Wickets = currentWickets || 0;
  const team2OversDecimal = currentOvers + (currentBalls / 6);
  
  // Calculate Win Probability
  useEffect(() => {
    calculateWinProbability();
  }, []);

  const calculateWinProbability = () => {
    // Remaining overs for Team 2
    const remainingOvers = totalOvers - team2OversDecimal;
    const remainingBalls = remainingOvers * 6;

    // Runs needed
    const runsNeeded = team1Score - team2Score + 1;

    // Maximum possible runs in remaining balls
    const maxPossibleRuns = team2Score + (remainingOvers * 6); // Assuming 1 run per ball average

    // Current run rate
    const currentRunRate = team2OversDecimal > 0 ? (team2Score / team2OversDecimal).toFixed(2) : 0;
    
    // Required run rate
    const requiredRunRate = remainingOvers > 0 ? (runsNeeded / remainingOvers).toFixed(2) : 0;

    // Remaining wickets
    const totalWickets = Number(matchData.teamBPlayers || 11) - 1;
    const remainingWickets = totalWickets - team2Wickets;

    // Win Probability Logic
    let winProb = 50; // Base probability

    // If Team 2 already won
    if (team2Score > team1Score) {
      winProb = 100;
    }
    // If Team 2 already lost (all wickets fallen or cannot win)
    else if (remainingWickets <= 0 || (runsNeeded > maxPossibleRuns)) {
      winProb = 0;
    }
    // Calculation based on run rate and wickets
    else {
      // Adjust based on required vs current run rate
      if (requiredRunRate <= currentRunRate) {
        // Team 2 is ahead of required rate
        winProb = 75 + Math.min(25, (currentRunRate - requiredRunRate) * 5);
      } else {
        // Team 2 is behind required rate
        const rateGap = requiredRunRate - currentRunRate;
        winProb = Math.max(20, 50 - (rateGap * 10));
      }

      // Adjust based on remaining wickets
      if (remainingWickets <= 2) {
        winProb *= 0.85; // Reduce if few wickets left
      } else if (remainingWickets >= 8) {
        winProb *= 1.1; // Increase if many wickets left
      }

      // Adjust based on remaining overs
      if (remainingOvers <= 2) {
        if (runsNeeded > 0) {
          winProb *= 0.8; // Difficult to chase in few overs
        }
      }

      // Cap probability between 0 and 100
      winProb = Math.min(100, Math.max(0, winProb));
    }

    setProbability(Math.round(winProb));

    // Generate analysis
    const analysisData = {
      team1Score,
      team1Wickets,
      team2Score,
      team2Wickets,
      runsNeeded,
      currentRunRate,
      requiredRunRate,
      remainingOvers: remainingOvers.toFixed(1),
      remainingWickets,
      remainingBalls,
      maxPossibleRuns: Math.round(maxPossibleRuns),
    };

    setAnalysis(analysisData);
  };

  const getWinProbabilityColor = (prob) => {
    if (prob >= 75) return '#22c55e'; // Green - Very likely
    if (prob >= 50) return '#fbbf24'; // Yellow - Possible
    if (prob >= 25) return '#f97316'; // Orange - Unlikely
    return '#ef4444'; // Red - Very unlikely
  };

  const getWinProbabilityText = (prob) => {
    if (prob >= 90) return 'Almost Certain ✅';
    if (prob >= 75) return 'Very Likely ✅';
    if (prob >= 60) return 'Likely 💪';
    if (prob >= 50) return 'Possible 🤔';
    if (prob >= 40) return 'Unlikely ⚠️';
    if (prob >= 25) return 'Very Unlikely ❌';
    if (prob >= 10) return 'Almost Impossible ❌';
    return 'Impossible ❌';
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>📊 Win Probability</h2>

        {/* Main Probability Display */}
        {probability !== null && analysis && (
          <>
            <div className={styles.probabilityBox}>
              <div 
                className={styles.probabilityCircle}
                style={{ borderColor: getWinProbabilityColor(probability) }}
              >
                <span className={styles.probabilityNumber}>{probability}%</span>
              </div>
              <p className={styles.probabilityText}>
                {getWinProbabilityText(probability)}
              </p>
            </div>

            {/* Match Status */}
            <div className={styles.statusBox}>
              <h3 className={styles.statusTitle}>Match Status</h3>
              
              <div className={styles.scoreRow}>
                <div className={styles.teamBox}>
                  <span className={styles.teamLabel}>Team 1 (Completed)</span>
                  <span className={styles.teamScore}>
                    {analysis.team1Score}/{analysis.team1Wickets}
                  </span>
                </div>
                <div className={styles.vsBox}>VS</div>
                <div className={styles.teamBox}>
                  <span className={styles.teamLabel}>Team 2 (Chasing)</span>
                  <span className={styles.teamScore}>
                    {analysis.team2Score}/{analysis.team2Wickets}
                  </span>
                </div>
              </div>

              <div className={styles.needsBox}>
                <p className={styles.needsText}>
                  Needs <strong>{analysis.runsNeeded}</strong> runs from <strong>{analysis.remainingBalls}</strong> balls
                </p>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className={styles.analysisBox}>
              <h3 className={styles.analysisTitle}>Analysis</h3>
              
              <div className={styles.analysisGrid}>
                <div className={styles.analysisItem}>
                  <span className={styles.label}>Current Run Rate:</span>
                  <span className={styles.value}>{analysis.currentRunRate}</span>
                </div>

                <div className={styles.analysisItem}>
                  <span className={styles.label}>Required Run Rate:</span>
                  <span className={`${styles.value} ${parseFloat(analysis.requiredRunRate) > parseFloat(analysis.currentRunRate) ? styles.red : styles.green}`}>
                    {analysis.requiredRunRate}
                  </span>
                </div>

                <div className={styles.analysisItem}>
                  <span className={styles.label}>Remaining Overs:</span>
                  <span className={styles.value}>{analysis.remainingOvers}</span>
                </div>

                <div className={styles.analysisItem}>
                  <span className={styles.label}>Remaining Wickets:</span>
                  <span className={`${styles.value} ${analysis.remainingWickets <= 2 ? styles.red : styles.green}`}>
                    {analysis.remainingWickets}
                  </span>
                </div>

                <div className={styles.analysisItem}>
                  <span className={styles.label}>Max Possible Score:</span>
                  <span className={styles.value}>{analysis.maxPossibleRuns}</span>
                </div>

                <div className={styles.analysisItem}>
                  <span className={styles.label}>Target to Win:</span>
                  <span className={styles.value}>{analysis.team1Score + 1}</span>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className={styles.insightsBox}>
              <h3 className={styles.insightsTitle}>💡 Key Insights</h3>
              <ul className={styles.insightsList}>
                {probability >= 75 && (
                  <li>✅ Team 2 is in a strong position</li>
                )}
                {probability >= 50 && probability < 75 && (
                  <li>🤔 Match is evenly poised</li>
                )}
                {probability < 50 && probability > 0 && (
                  <li>⚠️ Team 2 needs to accelerate</li>
                )}
                
                {parseFloat(analysis.currentRunRate) > parseFloat(analysis.requiredRunRate) && (
                  <li>💪 Current run rate is above required rate</li>
                )}
                {parseFloat(analysis.currentRunRate) <= parseFloat(analysis.requiredRunRate) && (
                  <li>📉 Run rate needs improvement</li>
                )}
                
                {analysis.remainingWickets <= 2 && (
                  <li>🚨 Few wickets remaining - critical phase</li>
                )}
                {analysis.remainingWickets >= 7 && (
                  <li>🛡️ Plenty of batting depth available</li>
                )}
              </ul>
            </div>
          </>
        )}

        <button className={styles.closeBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default WinProbabilityModal;
