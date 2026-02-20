import { useState, useEffect } from "react";
import { calculateDLSTarget, G50_VALUES } from "../../utils/dlsData";
import styles from "./DLSCalculator.module.css";

function DLSCalculator({
  onClose,
  matchData,
  currentScore,
  currentWickets,
  currentOvers,
  currentBalls,
  team1Score,
  team1Wickets,
  team1Overs,
  team1Balls,
}) {
  // ✅ DEBUG LOG
  console.log("🔍 DLS Calculator Props:", {
    team1Score,
    team1Wickets,
    team1Overs,
    team1Balls,
    currentScore,
    currentWickets,
    currentOvers,
    currentBalls,
  });

  // Match settings
  const totalOvers = Number(matchData?.overs || 50);
  const maxWickets = Number(matchData?.teamBPlayers || 11) - 1;

  // ✅ FIX: Calculate team1 overs properly
  const calculateOvers = (overs, balls) => {
    if (overs === undefined || overs === null) return 0;
    const ballsComponent = balls || 0;
    return overs + (ballsComponent / 6);
  };

  // Team 1 (completed innings) state
  const [team1FinalScore] = useState(team1Score || 0);
  const [team1OversAllocated, setTeam1OversAllocated] = useState(totalOvers);
  
  // ✅ FIX: Properly calculate team1 overs from overs + balls
  const initialTeam1Overs = calculateOvers(team1Overs, team1Balls);
  const [team1OversCompleted, setTeam1OversCompleted] = useState(initialTeam1Overs);
  const [team1WicketsLost, setTeam1WicketsLost] = useState(team1Wickets || 0);

  // Team 2 (current innings) state
  const [team2OversAllocated, setTeam2OversAllocated] = useState(totalOvers);
  
  // ✅ FIX: Calculate current overs from overs + balls
  const initialTeam2Overs = calculateOvers(currentOvers, currentBalls);
  const [team2CurrentOvers, setTeam2CurrentOvers] = useState(initialTeam2Overs);
  const [team2CurrentWickets, setTeam2CurrentWickets] = useState(currentWickets || 0);
  
  // ✅ FIX: Track Team 2's score at the point of calculation (not live match score)
  const [team2CurrentScore, setTeam2CurrentScore] = useState(currentScore || 0);

  // G50 selection
  const [g50, setG50] = useState(G50_VALUES.international);

  // Calculation result
  const [result, setResult] = useState(null);

  // ✅ Update team2 current overs when props change (live updates)
  useEffect(() => {
    const liveOvers = calculateOvers(currentOvers, currentBalls);
    setTeam2CurrentOvers(liveOvers);
    setTeam2CurrentWickets(currentWickets || 0);
    setTeam2CurrentScore(currentScore || 0);
    console.log("📊 Updating live Team 2 data:", {
      overs: currentOvers,
      balls: currentBalls,
      calculated: liveOvers,
      wickets: currentWickets,
      score: currentScore,
    });
  }, [currentOvers, currentBalls, currentWickets, currentScore]);

  // Auto-calculate on mount and when values change
  useEffect(() => {
    handleCalculate();
  }, [
    team1OversAllocated,
    team1OversCompleted,
    team1WicketsLost,
    team2OversAllocated,
    team2CurrentOvers,
    team2CurrentWickets,
    team2CurrentScore,
    g50,
  ]);

  const handleCalculate = () => {
    try {
      console.log("🧮 Calculating DLS with:", {
        team1Score: team1FinalScore,
        team1OversUsed: team1OversCompleted,
        team1WicketsLost: team1WicketsLost,
        team2OversUsed: team2CurrentOvers,
        team2WicketsLost: team2CurrentWickets,
      });

      const calculationResult = calculateDLSTarget({
        team1Score: team1FinalScore,
        team1OversAllocated: team1OversAllocated,
        team1OversUsed: team1OversCompleted,
        team1WicketsLost: team1WicketsLost,
        team2OversAllocated: team2OversAllocated,
        team2OversUsed: team2CurrentOvers,
        team2WicketsLost: team2CurrentWickets,
        g50: g50,
      });

      console.log("✅ DLS Result:", calculationResult);
      setResult(calculationResult);
    } catch (error) {
      console.error("DLS Calculation Error:", error);
      setResult({ error: "Calculation failed. Please check your inputs." });
    }
  };

  const handleQuickScenario = (scenario) => {
    switch (scenario) {
      case "reducedOvers":
        setTeam2OversAllocated(Math.max(5, totalOvers - 10));
        break;
      case "earlyInterruption":
        setTeam2CurrentOvers(10);
        setTeam2OversAllocated(Math.max(20, totalOvers - 5));
        break;
      case "reset":
        // ✅ FIX: Reset using calculated values
        setTeam1OversAllocated(totalOvers);
        setTeam1OversCompleted(calculateOvers(team1Overs, team1Balls));
        setTeam1WicketsLost(team1Wickets || 0);
        setTeam2OversAllocated(totalOvers);
        setTeam2CurrentOvers(calculateOvers(currentOvers, currentBalls));
        setTeam2CurrentWickets(currentWickets || 0);
        setTeam2CurrentScore(currentScore || 0);
        break;
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>🌧 DLS Calculator</h2>
          <button className={styles.closeIcon} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {/* G50 Selection */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Match Type</h3>
            <div className={styles.g50Buttons}>
              <button
                className={`${styles.g50Btn} ${
                  g50 === G50_VALUES.international ? styles.active : ""
                }`}
                onClick={() => setG50(G50_VALUES.international)}
              >
                International (G50 = 245)
              </button>
              <button
                className={`${styles.g50Btn} ${
                  g50 === G50_VALUES.lower ? styles.active : ""
                }`}
                onClick={() => setG50(G50_VALUES.lower)}
              >
                Lower Level (G50 = 200)
              </button>
            </div>
          </div>

          {/* Team 1 (Completed Innings) */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📊 Team 1 (Completed)</h3>
            <div className={styles.infoRow}>
              <span className={styles.label}>Final Score:</span>
              <span className={styles.value}>
                {team1FinalScore}/{team1WicketsLost}
              </span>
            </div>

            <div className={styles.inputRow}>
              <label className={styles.inputLabel}>Overs Allocated:</label>
              <input
                type="number"
                min="1"
                max="50"
                step="0.1"
                value={team1OversAllocated}
                onChange={(e) =>
                  setTeam1OversAllocated(parseFloat(e.target.value) || 0)
                }
                className={styles.input}
              />
            </div>

            <div className={styles.inputRow}>
              <label className={styles.inputLabel}>Overs Completed:</label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={
                  isNaN(team1OversCompleted)
                    ? 0
                    : team1OversCompleted.toFixed(1)
                }
                onChange={(e) =>
                  setTeam1OversCompleted(parseFloat(e.target.value) || 0)
                }
                className={styles.input}
              />
            </div>

            <div className={styles.inputRow}>
              <label className={styles.inputLabel}>Wickets Lost:</label>
              <input
                type="number"
                min="0"
                max={maxWickets}
                value={team1WicketsLost}
                onChange={(e) =>
                  setTeam1WicketsLost(parseInt(e.target.value) || 0)
                }
                className={styles.input}
              />
            </div>
          </div>

          {/* Team 2 (Current Innings) */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>🎯 Team 2 (Chasing)</h3>
            <div className={styles.infoRow}>
              <span className={styles.label}>Current Score:</span>
              <span className={styles.value}>
                {team2CurrentScore}/{team2CurrentWickets}
              </span>
            </div>

            <div className={styles.inputRow}>
              <label className={styles.inputLabel}>Overs Allocated:</label>
              <input
                type="number"
                min="1"
                max="50"
                step="0.1"
                value={team2OversAllocated}
                onChange={(e) =>
                  setTeam2OversAllocated(parseFloat(e.target.value) || 0)
                }
                className={styles.input}
              />
            </div>

            <div className={styles.inputRow}>
              <label className={styles.inputLabel}>Overs Bowled:</label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={
                  isNaN(team2CurrentOvers) ? 0 : team2CurrentOvers.toFixed(1)
                }
                onChange={(e) =>
                  setTeam2CurrentOvers(
                    isNaN(parseFloat(e.target.value))
                      ? 0
                      : parseFloat(e.target.value)
                  )
                }
                className={styles.input}
              />
            </div>

            <div className={styles.inputRow}>
              <label className={styles.inputLabel}>Wickets Lost:</label>
              <input
                type="number"
                min="0"
                max={maxWickets}
                value={team2CurrentWickets}
                onChange={(e) =>
                  setTeam2CurrentWickets(parseInt(e.target.value) || 0)
                }
                className={styles.input}
              />
            </div>
          </div>

          {/* Quick Scenarios */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>⚡ Quick Scenarios</h3>
            <div className={styles.scenarioButtons}>
              <button
                className={styles.scenarioBtn}
                onClick={() => handleQuickScenario("reducedOvers")}
              >
                Reduce Team 2 Overs (-10)
              </button>
              <button
                className={styles.scenarioBtn}
                onClick={() => handleQuickScenario("earlyInterruption")}
              >
                Early Interruption
              </button>
              <button
                className={styles.scenarioBtn}
                onClick={() => handleQuickScenario("reset")}
              >
                Reset to Current
              </button>
            </div>
          </div>

          {/* Results */}
          {result && !result.error && (
            <div className={styles.resultSection}>
              <h3 className={styles.resultTitle}>📈 DLS Result</h3>

              <div className={styles.mainResult}>
                <div className={styles.targetBox}>
                  <span className={styles.targetLabel}>Revised Target</span>
                  <span className={styles.targetValue}>
                    {Math.max(1, result.revisedTarget)}
                  </span>
                </div>

                <div className={styles.parBox}>
                  <span className={styles.parLabel}>Par Score</span>
                  <span className={styles.parValue}>
                    {Math.max(0, result.parScore || 0)}
                  </span>
                </div>
              </div>

              <div className={styles.resourceInfo}>
                <div className={styles.resourceRow}>
                  <span className={styles.resourceLabel}>Team 1 Resource:</span>
                  <span className={styles.resourceValue}>
                    {result.team1Resource.toFixed(1)}%
                  </span>
                </div>
                <div className={styles.resourceRow}>
                  <span className={styles.resourceLabel}>Team 2 Resource:</span>
                  <span className={styles.resourceValue}>
                    {result.team2Resource.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className={styles.explanation}>
                <p className={styles.explanationText}>{result.explanation}</p>
              </div>

              {team2CurrentOvers > 0 && (
                <div className={styles.chaseInfo}>
                  <p className={styles.chaseText}>
                    Team 2 needs{" "}
                    <strong>{Math.max(0, result.revisedTarget - team2CurrentScore)}</strong> runs
                    from{" "}
                    <strong>
                      {Math.max(0, ((team2OversAllocated - team2CurrentOvers) * 6).toFixed(0))}
                    </strong>{" "}
                    balls
                  </p>
                  <p className={styles.chaseText}>
                    Required Run Rate:{" "}
                    <strong>
                      {Math.max(
                        0,
                        (
                          (result.revisedTarget - team2CurrentScore) /
                          Math.max(0.1, team2OversAllocated - team2CurrentOvers)
                        ).toFixed(2)
                      )}
                    </strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {result && result.error && (
            <div className={styles.errorBox}>
              <p className={styles.errorText}>{result.error}</p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <p className={styles.footerNote}>
            ℹ️ This calculator uses the ICC DLS Standard Edition method
          </p>
        </div>
      </div>
    </div>
  );
}

export default DLSCalculator;
