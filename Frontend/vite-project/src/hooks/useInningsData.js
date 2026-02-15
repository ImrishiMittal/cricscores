import { useState, useEffect, useRef } from "react";

function useInningsData(
  completeHistory,
  players,
  allPlayers,
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
  setShowStartModal,
  // ✅ ADD: Get innings scores from engine
  innings1Score,
  innings2Score
) {
  const [innings1Data, setInnings1Data] = useState(null);
  const [innings2Data, setInnings2Data] = useState(null);
  const [matchCompleted, setMatchCompleted] = useState(false);

  const innings2DataRef = useRef(null);
  const innings1HistoryRef = useRef([]);

  const captureCurrentInningsData = (
    playersData,
    allPlayersData,
    bowlersData,
    historyData,
    scoreData,
    wicketsData,
    oversData,
    ballsData
  ) => {
    const allBattedPlayers = [...(allPlayersData || []), ...(playersData || [])];
    
    return {
      score: scoreData,
      wickets: wicketsData,
      overs: oversData,
      balls: ballsData,
      battingStats: allBattedPlayers
        .filter(p => p.balls > 0 || p.dismissal)
        .map((p) => ({
          name: p.name,
          runs: p.runs || 0,
          balls: p.balls || 0,
          strikeRate: p.balls ? ((p.runs / p.balls) * 100).toFixed(1) : "0.0",
          dismissal: p.dismissal || null,
        })),
      bowlingStats: (bowlersData || []).map((b) => ({
        name: b.name,
        overs: b.overs || 0,
        balls: b.balls || 0,
        runs: b.runs || 0,
        wickets: b.wickets || 0,
        economy: b.overs > 0 ? (b.runs / b.overs).toFixed(2) : "0.00",
      })),
      history: [...historyData],
    };
  };

  useEffect(() => {
    if (!inningsChangeEvent) return;

    if (inningsChangeEvent.matchEnd) {
      console.log("🏁 Match ended – capturing 2nd innings");
      const inn2Data = captureCurrentInningsData(
        players,
        allPlayers,
        bowlers,
        completeHistory,
        score,
        wickets,
        overs,
        balls
      );
      setInnings2Data(inn2Data);
      console.log("✅ Innings 2 Data:", inn2Data);
      
      setTimeout(() => {
        setMatchCompleted(true);
        setInningsChangeEvent(null);
      }, 50);
      return;
    }

    // ✅ FIX: Use innings1Score from engine instead of reset state
    console.log("🔄 Innings 1 ending");
    console.log("📊 innings1Score from engine:", innings1Score);

    if (partnershipRuns > 0 || partnershipBalls > 0) {
      savePartnership(score, wickets);
    }

    // ✅ Use innings1Score if available, otherwise use current state
    const scoreToUse = innings1Score?.score ?? score;
    const wicketsToUse = innings1Score?.wickets ?? wickets;
    const oversToUse = innings1Score?.overs ?? overs;
    const ballsToUse = innings1Score?.balls ?? balls;

    console.log("📊 Using innings 1 data:", {
      score: scoreToUse,
      wickets: wicketsToUse,
      overs: oversToUse,
      balls: ballsToUse,
    });

    const inn1Data = captureCurrentInningsData(
      players,
      allPlayers,
      bowlers,
      completeHistory,
      scoreToUse,
      wicketsToUse,
      oversToUse,
      ballsToUse
    );
    setInnings1Data(inn1Data);
    console.log("✅ Innings 1 Data Captured:", inn1Data);

    if (innings1HistoryRef.current.length < completeHistory.length) {
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
    allPlayers,
    bowlers,
    strikerIndex,
    nonStrikerIndex,
    savePartnership,
    score,
    wickets,
    overs,
    balls,
    completeHistory,
    restorePlayersState,
    restoreBowlersState,
    restorePartnershipState,
    setShowStartModal,
    innings1Score, // ✅ ADD to dependency array
  ]);

  useEffect(() => {
    if (matchOver && !matchCompleted) {
      console.log("🏁 Match Over");
      
      const inn2Data = captureCurrentInningsData(
        players,
        allPlayers,
        bowlers,
        completeHistory,
        score,
        wickets,
        overs,
        balls
      );
      setInnings2Data(inn2Data);

      setTimeout(() => {
        setMatchCompleted(true);
      }, 100);
    }
  }, [matchOver, matchCompleted, players, allPlayers, bowlers, completeHistory, score, wickets, overs, balls]);

  useEffect(() => {
    if (innings === 1 && completeHistory.length > 0) {
      innings1HistoryRef.current = [...completeHistory];
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
