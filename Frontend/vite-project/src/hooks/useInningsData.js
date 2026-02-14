import { useState, useEffect, useRef } from "react";

/**
 * Custom hook to manage innings data capture and transitions
 * Handles innings 1 & 2 data, match completion
 */
function useInningsData(
  completeHistory,
  players,
  bowlers,
  score,
  wickets,
  overs,
  balls,
  innings,
  inningsChangeEvent,
  setInningsChangeEvent,
  matchOver,
  partnershipRuns,
  partnershipBalls,
  strikerIndex,
  nonStrikerIndex,
  savePartnership,
  restorePlayersState,
  restoreBowlersState,
  restorePartnershipState,
  setShowStartModal
) {
  const [innings1Data, setInnings1Data] = useState(null);
  const [innings2Data, setInnings2Data] = useState(null);
  const [matchCompleted, setMatchCompleted] = useState(false);

  const innings2DataRef = useRef(null);
  const innings1HistoryRef = useRef([]);

  /**
   * Helper: Capture current innings data
   */
  const captureCurrentInningsData = () => {
    return {
      battingStats: players.map((p) => ({
        name: p.name,
        runs: p.runs || 0,
        balls: p.balls || 0,
        strikeRate: p.balls ? ((p.runs / p.balls) * 100).toFixed(1) : "0.0",
        dismissal: p.dismissal || null,
      })),
      bowlingStats: bowlers.map((b) => ({
        name: b.name,
        overs: b.overs || 0,
        balls: b.balls || 0,
        runs: b.runs || 0,
        wickets: b.wickets || 0,
        economy: b.overs > 0 ? (b.runs / b.overs).toFixed(2) : "0.00",
      })),
      history: [...completeHistory],
    };
  };

  /**
   * Effect: Handle innings change
   */
  useEffect(() => {
    if (!inningsChangeEvent) return;

    // MATCH END (2nd innings finished)
    if (inningsChangeEvent.matchEnd) {
      console.log("🏁 Match ended — capturing 2nd innings");

      const inn2Data = captureCurrentInningsData();
      setInnings2Data(inn2Data);

      setTimeout(() => {
        setMatchCompleted(true);
        setInningsChangeEvent(null);
      }, 50);

      return;
    }

    // INNINGS 1 END
    console.log("🔄 Innings 1 ending — capturing data");

    // Save current partnership before reset
    if (partnershipRuns > 0 || partnershipBalls > 0) {
      const striker = players[strikerIndex]?.name || "Unknown";
      const nonStriker = players[nonStrikerIndex]?.name || "Unknown";
      console.log("💾 Saving final partnership of innings 1:", {
        striker,
        nonStriker,
        runs: partnershipRuns,
      });
      savePartnership(score, wickets + 1);
    }

    // Capture innings 1 data
    const inn1Data = captureCurrentInningsData();
    setInnings1Data(inn1Data);

    // Ensure history ref is updated
    if (
      innings1HistoryRef.current.length === 0 ||
      innings1HistoryRef.current.length < completeHistory.length
    ) {
      innings1HistoryRef.current = [...completeHistory];
    }

    setTimeout(() => {
      restorePlayersState({
        players: [],
        allPlayers: [],
        strikerIndex: 0,
        nonStrikerIndex: 1,
        isWicketPending: false,
        outBatsman: null,
      });

      restoreBowlersState({
        bowlers: [],
        currentBowlerIndex: 0,
      });

      restorePartnershipState({
        partnershipRuns: 0,
        partnershipBalls: 0,
        striker1Contribution: 0,
        striker2Contribution: 0,
        partnershipHistory: [],
      });

      setShowStartModal(true);
      setInningsChangeEvent(null);
    }, 50);
  }, [
    inningsChangeEvent,
    partnershipRuns,
    partnershipBalls,
    players,
    strikerIndex,
    nonStrikerIndex,
    savePartnership,
  ]);

  /**
   * Effect: Show summary on match end
   */
  useEffect(() => {
    if (matchOver && !matchCompleted) {
      console.log("🏁 Match Over");

      if (innings2DataRef.current) {
        setInnings2Data(innings2DataRef.current);
      } else {
        const inn2Data = captureCurrentInningsData();
        setInnings2Data(inn2Data);
      }

      setTimeout(() => {
        setMatchCompleted(true);
      }, 100);
    }
  }, [matchOver, matchCompleted]);

  /**
   * Effect: Continuously save innings 1 history
   */
  useEffect(() => {
    if (innings === 1 && completeHistory.length > 0) {
      innings1HistoryRef.current = [...completeHistory];
      console.log(
        "📊 Updating innings 1 history ref:",
        innings1HistoryRef.current.length,
        "balls"
      );
    }
  }, [innings, completeHistory]);

  return {
    innings1Data,
    innings2Data,
    matchCompleted,
    innings1HistoryRef,
    innings2DataRef,
    captureCurrentInningsData,
    setInnings2Data,
    setMatchCompleted,
  };
}

export default useInningsData;