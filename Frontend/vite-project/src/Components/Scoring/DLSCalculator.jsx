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
  // Match settings
  const totalOvers = Number(matchData?.overs || 50);
  const maxWickets = Number(matchData?.teamBPlayers || 11) - 1;

  // Team 1 (completed innings) state
  const [team1FinalScore] = useState(team1Score || 0);
  const [team1OversAllocated, setTeam1OversAllocated] = useState(totalOvers);
  const initialTeam1Overs =
  team1Overs && team1Overs > 0
    ? team1Overs
    : totalOvers;

const [team1OversCompleted, setTeam1OversCompleted] =
  useState(initialTeam1Overs);

  
  const [team1WicketsLost, setTeam1WicketsLost] = useState(team1Wickets || 0);

  // Team 2 (current innings) state - for interruption scenario
  const [team2OversAllocated, setTeam2OversAllocated] = useState(totalOvers);
  const [team2CurrentOvers, setTeam2CurrentOvers] = useState(
    currentOvers || 0
  );
  
  const [team2CurrentWickets, setTeam2CurrentWickets] = useState(
    currentWickets || 0
  );

  // G50 selection
  const [g50, setG50] = useState(G50_VALUES.international);

  // Calculation result
  const [result, setResult] = useState(null);

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
    g50,
  ]);

  const handleCalculate = () => {
    try {
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

      setResult(calculationResult);
    } catch (error) {
      console.error("DLS Calculation Error:", error);
      setResult({ error: "Calculation failed. Please check your inputs." });
    }
  };

  const handleQuickScenario = (scenario) => {
    switch (scenario) {
      case "reducedOvers":
        // Reduce Team 2's overs by 10
        setTeam2OversAllocated(Math.max(5, totalOvers - 10));
        break;
      case "earlyInterruption":
        // Interruption after 10 overs
        setTeam2CurrentOvers(10);
        setTeam2OversAllocated(Math.max(20, totalOvers - 5));
        break;
      case "reset":
        // Reset to current match state
        setTeam1OversAllocated(totalOvers);
        setTeam1OversCompleted(team1Overs + team1Balls / 6);
        setTeam1WicketsLost(team1Wickets || 0);
        setTeam2OversAllocated(totalOvers);
        setTeam2CurrentOvers(currentOvers || 0);
        setTeam2CurrentWickets(currentWickets || 0);
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
                {currentScore}/{currentWickets}
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
                    {result.revisedTarget}
                  </span>
                </div>

                {result.parScore !== null && (
                  <div className={styles.parBox}>
                    <span className={styles.parLabel}>Par Score</span>
                    <span className={styles.parValue}>{result.parScore}</span>
                  </div>
                )}
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
                    <strong>{result.revisedTarget - currentScore}</strong> runs
                    from{" "}
                    <strong>
                      {((team2OversAllocated - team2CurrentOvers) * 6).toFixed(
                        0
                      )}
                    </strong>{" "}
                    balls
                  </p>
                  <p className={styles.chaseText}>
                    Required Run Rate:{" "}
                    <strong>
                      {(
                        (result.revisedTarget - currentScore) /
                        (team2OversAllocated - team2CurrentOvers)
                      ).toFixed(2)}
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
