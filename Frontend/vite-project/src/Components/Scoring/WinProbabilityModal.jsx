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
    const remainingBalls = Math.round(remainingOvers * 6);

    // Runs needed
    const runsNeeded = team1Score - team2Score + 1;

    // Maximum possible runs in remaining balls (6 runs per ball is maximum in cricket)
    const maxPossibleRuns = team2Score + (remainingBalls * 6);

    // Current run rate
    const currentRunRate = team2OversDecimal > 0 ? (team2Score / team2OversDecimal) : 0;
    
    // Required run rate to win
    const requiredRunRate = remainingOvers > 0 ? (runsNeeded / remainingOvers) : 0;

    // Remaining wickets
    const totalWickets = Number(matchData.teamBPlayers || 11) - 1;
    const remainingWickets = totalWickets - team2Wickets;

    // ✅ IMPROVED: Win Probability Logic with better accuracy
    let winProb = 50; // Base probability

    // If Team 2 already won
    if (team2Score > team1Score) {
      winProb = 100;
    }
    // If Team 2 already lost (all wickets fallen)
    else if (remainingWickets <= 0) {
      winProb = 0;
    }
    // If target is impossible to achieve in remaining balls
    else if (runsNeeded > maxPossibleRuns) {
      winProb = 0;
    }
    // If target is achievable
    else if (runsNeeded <= remainingBalls) {
      // ✅ KEY FIX: Check if RRR is achievable (≤ 6 per over)
      
      if (requiredRunRate <= 6) {
        // Base probability based on required run rate
        // If RRR is low, probability is high
        if (requiredRunRate <= 2) {
          winProb = 95; // Very easy target
        } else if (requiredRunRate <= 3) {
          winProb = 90; // Easy target
        } else if (requiredRunRate <= 4) {
          winProb = 85; // Moderate target
        } else if (requiredRunRate <= 5) {
          winProb = 80; // Challenging target
        } else if (requiredRunRate <= 6) {
          winProb = 75; // High risk target
        }

        // Adjust based on current vs required run rate
        if (currentRunRate >= requiredRunRate) {
          // Already ahead - increase probability significantly
          const advantage = Math.min(10, (currentRunRate - requiredRunRate) * 5);
          winProb = Math.min(99, winProb + advantage);
        } else {
          // Behind required rate - decrease probability
          const rateGap = requiredRunRate - currentRunRate;
          const penalty = Math.min(15, rateGap * 5);
          winProb = Math.max(50, winProb - penalty);
        }

        // ✅ CRUCIAL: Adjust based on remaining balls/overs
        // More balls remaining = higher probability
        if (remainingBalls <= 2) {
          // Very few balls - need perfect execution
          winProb *= 0.75;
        } else if (remainingBalls <= 6) {
          // One over remaining - moderate adjustment
          winProb *= 0.85;
        } else if (remainingBalls <= 12) {
          // 2 overs - slight adjustment
          winProb *= 0.92;
        } else if (remainingBalls >= 36) {
          // 6+ overs - comfortable position
          winProb *= 1.08;
        }

        // Adjust based on remaining wickets
        if (remainingWickets === 1) {
          winProb *= 0.70; // Last man scenario - very risky
        } else if (remainingWickets <= 2) {
          winProb *= 0.80; // Few wickets
        } else if (remainingWickets <= 3) {
          winProb *= 0.88; // Limited wickets
        } else if (remainingWickets >= 8) {
          winProb *= 1.05; // Plenty of wickets
        }

        // Cap probability
        winProb = Math.min(99, Math.max(50, winProb));
      } else {
        // Required run rate > 6 (more than 1 run per ball) - impossible
        winProb = 0;
      }
    } else {
      // Runs needed > remaining balls but <= maxPossible
      const ballsNeeded = Math.ceil(runsNeeded / 6);
      if (ballsNeeded <= remainingBalls) {
        // Need to score at more than 1 per ball but less than 6 per ball
        winProb = 65;
      } else {
        winProb = 0;
      }
    }

    // Final cap
    winProb = Math.min(100, Math.max(0, winProb));

    setProbability(Math.round(winProb));

    // Generate analysis
    const analysisData = {
      team1Score,
      team1Wickets,
      team2Score,
      team2Wickets,
      runsNeeded: Math.max(0, runsNeeded),
      currentRunRate: currentRunRate.toFixed(2),
      requiredRunRate: requiredRunRate.toFixed(2),
      remainingOvers: remainingOvers.toFixed(1),
      remainingBalls,
      remainingWickets,
      maxPossibleRuns: Math.round(maxPossibleRuns),
      isAchievable: requiredRunRate <= 6, // ✅ Track if RRR is achievable
    };

    setAnalysis(analysisData);
  };

  const getWinProbabilityColor = (prob) => {
    if (prob >= 90) return '#10b981'; // Emerald - Almost certain
    if (prob >= 80) return '#22c55e'; // Green - Very likely
    if (prob >= 70) return '#84cc16'; // Lime - Likely
    if (prob >= 60) return '#fbbf24'; // Yellow - Good chance
    if (prob >= 50) return '#f97316'; // Orange - Possible
    if (prob >= 30) return '#ef4444'; // Red - Unlikely
    return '#dc2626'; // Dark red - Very unlikely
  };

  const getWinProbabilityText = (prob) => {
    if (prob >= 95) return 'Almost Certain ✅';
    if (prob >= 85) return 'Very Strong ✅';
    if (prob >= 75) return 'Very Likely 💪';
    if (prob >= 65) return 'Likely 💪';
    if (prob >= 55) return 'Good Chance 🤔';
    if (prob >= 50) return 'Possible 🤔';
    if (prob >= 40) return 'Difficult ⚠️';
    if (prob >= 25) return 'Very Difficult ❌';
    if (prob > 0) return 'Extremely Difficult ❌';
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
                {/* ✅ Show if achievable */}
                <p className={styles.achievableText} style={{ 
                  color: analysis.isAchievable ? '#22c55e' : '#ef4444',
                  marginTop: '8px'
                }}>
                  {analysis.isAchievable ? '✅ Achievable' : '❌ Not Achievable'}
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
                  <span className={`${styles.value} ${parseFloat(analysis.requiredRunRate) <= 6 ? styles.green : styles.red}`}>
                    {analysis.requiredRunRate}
                  </span>
                </div>

                <div className={styles.analysisItem}>
                  <span className={styles.label}>Remaining Overs:</span>
                  <span className={styles.value}>{analysis.remainingOvers}</span>
                </div>

                <div className={styles.analysisItem}>
                  <span className={styles.label}>Remaining Balls:</span>
                  <span className={styles.value}>{analysis.remainingBalls}</span>
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
              </div>
            </div>

            {/* Insights */}
            <div className={styles.insightsBox}>
              <h3 className={styles.insightsTitle}>💡 Key Insights</h3>
              <ul className={styles.insightsList}>
                {analysis.isAchievable ? (
                  <li>✅ Target is achievable with required run rate ≤ 6 per over</li>
                ) : (
                  <li>❌ Target requires more than 1 run per ball (impossible)</li>
                )}
                
                {probability >= 85 && (
                  <li>💪 Team 2 is in a very strong position</li>
                )}
                {probability >= 70 && probability < 85 && (
                  <li>💪 Team 2 is in a good position</li>
                )}
                {probability >= 50 && probability < 70 && (
                  <li>🤔 Match is competitive - depends on execution</li>
                )}
                {probability < 50 && probability > 0 && (
                  <li>⚠️ Team 2 needs to accelerate significantly</li>
                )}
                
                {parseFloat(analysis.currentRunRate) > parseFloat(analysis.requiredRunRate) && (
                  <li>💚 Current run rate is above required rate</li>
                )}
                {parseFloat(analysis.currentRunRate) < parseFloat(analysis.requiredRunRate) && (
                  <li>📉 Run rate needs to increase</li>
                )}
                
                {analysis.remainingWickets === 1 && (
                  <li>🚨 Last man in - extreme pressure</li>
                )}
                {analysis.remainingWickets <= 2 && analysis.remainingWickets > 1 && (
                  <li>🚨 Few wickets remaining - critical phase</li>
                )}
                {analysis.remainingWickets >= 7 && (
                  <li>🛡️ Plenty of batting depth available</li>
                )}

                {analysis.remainingBalls <= 2 && (
                  <li>⏱️ Very limited balls - need perfect execution</li>
                )}
                {analysis.remainingBalls >= 36 && (
                  <li>✅ Comfortable number of balls remaining</li>
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