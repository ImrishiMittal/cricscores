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
  innings1Score,
  innings2Score,
  innings1History,
  winner,
  extras,
  innings1Extras,  // ✅ extras snapshot from before innings reset
) {
  const [innings1Data, setInnings1Data] = useState(null);
  const [innings2Data, setInnings2Data] = useState(null);
  const [matchCompleted, setMatchCompleted] = useState(false);

  const innings2DataRef = useRef(null);
  const innings1HistoryRef = useRef([]);

  const callbacksRef = useRef({});
  callbacksRef.current = {
    savePartnership,
    restorePlayersState,
    restoreBowlersState,
    restorePartnershipState,
    setShowStartModal,
    setInningsChangeEvent,
    partnershipRuns,
    partnershipBalls,
    score,
    wickets,
    players,
    allPlayers,
    bowlers,
    completeHistory,
    overs,
    balls,
    innings1Score,
    innings1History,
    extras,
    innings1Extras,  // ✅ NEW
  };

  const captureCurrentInningsData = (
    playersData,
    allPlayersData,
    bowlersData,
    historyData,
    scoreData,
    wicketsData,
    oversData,
    ballsData,
    extrasData,   // ✅ NEW
  ) => {
    const allBattedPlayers = [...(allPlayersData || []), ...(playersData || [])];

    return {
      score: scoreData,
      wickets: wicketsData,
      overs: oversData,
      balls: ballsData,
      extras: extrasData || { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 }, // ✅ NEW
      battingStats: allBattedPlayers
        .filter((p) => p.balls > 0 || p.dismissal)
        .map((p) => ({
          playerId: p.playerId,
          name: p.displayName,
          runs: p.runs || 0,
          balls: p.balls || 0,
          strikeRate: p.balls ? ((p.runs / p.balls) * 100).toFixed(1) : "0.0",
          dismissal: p.dismissal || null,
        })),
      bowlingStats: (bowlersData || []).map((b) => ({
        playerId: b.playerId,
        name: b.displayName,
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

    const c = callbacksRef.current;

    if (inningsChangeEvent.matchEnd) {
      console.log("🏁 Match ended - capturing 2nd innings");
      const inn2Data = captureCurrentInningsData(
        c.players, c.allPlayers, c.bowlers,
        c.completeHistory,
        c.score, c.wickets, c.overs, c.balls,
        c.extras   // ✅ NEW
      );
      setInnings2Data(inn2Data);

      setTimeout(() => {
        setMatchCompleted(true);
        c.setInningsChangeEvent(null);
      }, 50);
      return;
    }

    console.log("🔄 Innings 1 ending");

    if (c.partnershipRuns > 0 || c.partnershipBalls > 0) {
      c.savePartnership(c.score, c.wickets);
    }

    const scoreToUse   = c.innings1Score?.score   ?? c.score;
    const wicketsToUse = c.innings1Score?.wickets ?? c.wickets;
    const oversToUse   = c.innings1Score?.overs   ?? c.overs;
    const ballsToUse   = c.innings1Score?.balls   ?? c.balls;

    const historyToUse = c.innings1History.length > 0
      ? c.innings1History
      : c.completeHistory;

    innings1HistoryRef.current = historyToUse;

    const inn1Data = captureCurrentInningsData(
      c.players, c.allPlayers, c.bowlers,
      historyToUse,
      scoreToUse, wicketsToUse, oversToUse, ballsToUse,
      c.innings1Extras || c.extras   // ✅ use snapshot, fallback to live
    );
    setInnings1Data(inn1Data);

    setTimeout(() => {
      c.restorePlayersState({ players: [], allPlayers: [], strikerIndex: 0, nonStrikerIndex: 1, isWicketPending: false, outBatsman: null });
      c.restoreBowlersState({ bowlers: [], currentBowlerIndex: 0 });
      c.restorePartnershipState({ partnershipRuns: 0, partnershipBalls: 0, striker1Contribution: 0, striker2Contribution: 0, partnershipHistory: [] });
      c.setShowStartModal(true);
      c.setInningsChangeEvent(null);
    }, 50);

  }, [inningsChangeEvent]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (matchOver && !matchCompleted && winner !== "NO RESULT") {
      const inn2Data = captureCurrentInningsData(
        players, allPlayers, bowlers,
        completeHistory,
        score, wickets, overs, balls,
        extras   // ✅ NEW
      );
      setInnings2Data(inn2Data);
      setTimeout(() => setMatchCompleted(true), 100);
    }
  }, [matchOver, matchCompleted, players, allPlayers, bowlers, completeHistory, score, wickets, overs, balls, extras]);

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