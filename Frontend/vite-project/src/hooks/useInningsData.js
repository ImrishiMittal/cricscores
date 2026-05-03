import { useState, useEffect, useRef } from "react";

// ─── Helper: parse dismissal string OR object ─────────────────────────────────
const parseDismissal = (dismissal) => {
  if (!dismissal) return { isOut: false, type: "", fielder: "", bowler: "" };
  if (typeof dismissal === "string") {
    return { isOut: true, type: "bowled", fielder: "", bowler: dismissal };
  }
  return {
    isOut: true,
    type: dismissal.type || "",
    fielder: dismissal.fielder || "",
    bowler: dismissal.bowler || "",
  };
};

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
  innings1Extras,
  overCompleteBowlerSnapshotRef,
  matchEngineInnings1HistoryRef
) {
  const [innings1Data, setInnings1Data] = useState(null);
  const [innings2Data, setInnings2Data] = useState(null);
  const [matchCompleted, setMatchCompleted] = useState(false);

  const innings1DataRef = useRef(null);
  const innings2DataRef = useRef(null);
  const innings1HistoryRef = useRef([]);
  const innings1BowlersSnapshotRef = useRef([]);

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
    innings1Extras,
  };

  // ─── Merge live bowlers with over-complete snapshot ──────────────────────────
  // Problem: after an over ends, the completed bowler's ball count is accurate
  // in the snapshot taken at that moment, but by innings-end the live React state
  // for that bowler may be stale (balls reset or not yet committed).
  // Solution: build a merged array keyed by playerId, preferring the higher
  // ballsBowled value between the snapshot and the live state.
  const mergeBowlers = (liveBowlers, snapshotBowlers) => {
    if (!snapshotBowlers || snapshotBowlers.length === 0)
      return liveBowlers || [];

    const merged = new Map();

    // Start with snapshot (has accurate counts for completed-over bowlers)
    for (const b of snapshotBowlers) {
      const key = String(b.playerId || b.displayName || b.name || "");
      if (key) merged.set(key, { ...b });
    }

    // Overlay with live bowlers — take the MAX of ballsBowled/runs
    // (live bowler is more accurate for the current over; snapshot for past overs)
    for (const b of liveBowlers || []) {
      const key = String(b.playerId || b.displayName || b.name || "");
      if (!key) continue;
      if (merged.has(key)) {
        const existing = merged.get(key);
        const snapshotBalls = existing.ballsBowled || existing.balls || 0;
        const liveBalls = b.ballsBowled || b.balls || 0;
        // Take whichever has more balls (live wins if it's the current over bowler)
        if (liveBalls >= snapshotBalls) {
          merged.set(key, { ...b });
        }
        // else keep snapshot (it has the full over count)
      } else {
        merged.set(key, { ...b });
      }
    }

    return Array.from(merged.values());
  };

  // ─── Recompute bowling stats from ball-by-ball history (ground truth) ─────────

    // REPLACE the entire function (from that line until its closing `};`) WITH:
      const computeBowlingFromHistory = (historyData) => {
        const statsMap = new Map();
    
        for (const ball of historyData || []) {
          if (ball.event === "FREE_HIT") continue;
    
          const bowlerName =
            ball.bowler || ball.bowlerName || ball.bowlerDisplayName ||
            ball.currentBowler || ball.bowlerId || "";
    
          if (!bowlerName || bowlerName === "Unknown") {
            if (!bowlerName) console.warn("⚠️ Missing bowler in ball:", ball);
            continue;
          }
    
          if (!statsMap.has(bowlerName)) {
            statsMap.set(bowlerName, {
              playerName: bowlerName, playerId: "",
              ballsBowled: 0, runsGiven: 0, wickets: 0,
              wides: 0, noBalls: 0, dotBallsBowled: 0, maidens: 0,
            });
          }
    
          const s = statsMap.get(bowlerName);
          const runs = ball.runs ?? ball.r ?? ball.runsScored ?? 0;
    
          const isWide = ball.event === "WD" || ball.type === "wide" ||
                         ball.wide === true || ball.extraType === "wide";
          if (isWide) {
            s.wides += 1;
            s.runsGiven += 1 + (runs > 0 ? runs : 0);
            continue;
          }
    
          const isNoBall = ball.event === "NB" || ball.type === "noBall" ||
                           ball.noBall === true || ball.extraType === "noBall";
          if (isNoBall) {
            s.noBalls += 1;
            s.runsGiven += 1 + (runs > 0 ? runs : 0);
            continue;
          }
    
          // Legal delivery — always counts
          s.ballsBowled += 1;
    
          const isBye = ball.event === "BYE" || ball.type === "bye" ||
                        ball.bye === true || ball.extraType === "bye";
          const isLegBye = ball.event === "LB" || ball.type === "legBye" ||
                           ball.legBye === true || ball.extraType === "legBye";
    
          if (isBye || isLegBye) {
            if (runs === 0) s.dotBallsBowled += 1;
          } else {
            s.runsGiven += runs;
            if (runs === 0) s.dotBallsBowled += 1;
          }
    
          const isWicket =
            ball.event === "WICKET" || ball.event === "HW" ||
            ball.wicket === true || ball.isWicket === true ||
            ball.w === true || String(ball.result) === "W" ||
            (ball.dismissal != null && ball.dismissal !== "");
    
          const isRunout =
            ball.event === "RUNOUT" ||
            ball.dismissalType === "runout" || ball.wicketType === "runout" ||
            ball.runout === true ||
            (typeof ball.dismissal === "string" &&
             ball.dismissal.toLowerCase().includes("run out")) ||
            (typeof ball.dismissal === "object" && ball.dismissal?.type === "runout");
    
          if (isWicket && !isRunout) {
            s.wickets += 1;
          }
        }
    
        return Array.from(statsMap.values()).filter(
          (b) => b.ballsBowled > 0 || b.wides > 0 || b.wickets > 0
        );
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
    extrasData
  ) => {
    // Merge dismissed (allPlayers) + active (players), deduplicate by playerId
    const merged = [...(playersData || []), ...(allPlayersData || [])];
    const seenP = new Set();
    const dedupedPlayers = merged.filter((p) => {
      const key = p.playerId || p.displayName;
      if (seenP.has(key)) return false;
      seenP.add(key);
      return true;
    });
    dedupedPlayers.sort((a, b) => (a.battingOrder ?? 999) - (b.battingOrder ?? 999));

    // ✅ PRIMARY: Compute bowling stats from history (always accurate)
    // FALLBACK: Use merged live+snapshot bowlers if history is empty
    let bowlingStatsSource = [];

    // 🔥 ALWAYS USE FINAL HISTORY (important fix)
    const finalHistory =
      historyData && historyData.length > 0
        ? historyData
        : innings1HistoryRef.current;

    if (finalHistory && finalHistory.length > 0) {
      bowlingStatsSource = computeBowlingFromHistory(finalHistory);
    }

    // ✅ 2. If history fails → use SNAPSHOT (NOT live state)
    if (bowlingStatsSource.length === 0) {
      console.warn("⚠️ Using snapshot fallback instead of live bowlers");
    
      bowlingStatsSource =
        innings1BowlersSnapshotRef.current.length > 0
          ? innings1BowlersSnapshotRef.current
          : [];
    }

    return {
      score: scoreData,
      wickets: wicketsData,
      overs: oversData,
      balls: ballsData,
      extras: extrasData || {
        wides: 0,
        noBalls: 0,
        byes: 0,
        legByes: 0,
        total: 0,
      },

      battingStats: dedupedPlayers
        .filter((p) => p.balls > 0 || !!p.dismissal || p.hasBatted)
        .map((p) => {
          const d = parseDismissal(p.dismissal);
          const ballsFaced = p.balls || (d.isOut ? 1 : 0);
          return {
            playerId: p.playerId,
            playerName: p.displayName,
            name: p.displayName,
            runs: p.runs || 0,
            balls: ballsFaced,
            fours: p.fours || 0,
            sixes: p.sixes || 0,
            strikeRate:
              ballsFaced > 0
                ? (((p.runs || 0) / ballsFaced) * 100).toFixed(1)
                : "0.0",
            dismissal: p.dismissal || null,
            isOut: d.isOut,
            dismissalType: d.type || p.dismissalType || "",
            fielderName: d.fielder || p.fielderName || "",
            bowlerName: d.bowler || p.bowlerName || "",
          };
        }),

      bowlingStats: bowlingStatsSource.map((b) => {
        const ballsBowled = b.ballsBowled || b.balls || 0;
        const runsGiven = b.runsGiven || b.runs || 0;
        const fullOvers = Math.floor(ballsBowled / 6);
        const remBalls = ballsBowled % 6;
        const oversDisplay =
          remBalls > 0 ? `${fullOvers}.${remBalls}` : `${fullOvers}.0`;
        return {
          playerId: b.playerId,
          playerName: b.displayName || b.name || b.playerName,
          displayName: b.displayName || b.name || b.playerName,
          overs: fullOvers + remBalls / 10,
          oversDisplay,
          balls: ballsBowled,
          ballsBowled,
          runs: runsGiven,
          runsGiven,
          wickets: b.wickets || 0,
          wides: b.wides || 0,
          noBalls: b.noBalls || 0,
          dotBallsBowled: b.dotBallsBowled || 0,
          maidens: b.maidens || 0,
          economy:
            ballsBowled > 0
              ? ((runsGiven / ballsBowled) * 6).toFixed(2)
              : "0.00",
        };
      }),

      history: [...historyData],
    };
  };

  useEffect(() => {
    if (!inningsChangeEvent) return;

    const c = callbacksRef.current;

    if (inningsChangeEvent.matchEnd) {
      console.log("🏁 Match ended - capturing 2nd innings");
      const inn2Data = captureCurrentInningsData(
        c.players,
        c.allPlayers,
        c.bowlers,
        c.completeHistory,
        c.score,
        c.wickets,
        c.overs,
        c.balls,
        c.extras
      );

      innings2DataRef.current = inn2Data;
      setInnings2Data(inn2Data);

      setTimeout(() => {
        setMatchCompleted(true);
        c.setInningsChangeEvent(null);
      }, 50);
      return;
    }

    console.log("🔄 Innings 1 ending");
    innings1HistoryRef.current = [...(callbacksRef.current.innings1History || [])];
innings1BowlersSnapshotRef.current = [...(c.bowlers || [])];
    console.log(
      "📸 [useInningsData] Bowlers snapshot:",
      innings1BowlersSnapshotRef.current
    );

    if (c.partnershipRuns > 0 || c.partnershipBalls > 0) {
      c.savePartnership(c.score, c.wickets);
    }

    const scoreToUse = c.innings1Score?.score ?? c.score;
    const wicketsToUse = c.innings1Score?.wickets ?? c.wickets;
    const oversToUse = c.innings1Score?.overs ?? c.overs;
    const ballsToUse = c.innings1Score?.balls ?? c.balls;

    const historyToUse =
      (matchEngineInnings1HistoryRef?.current?.length > 0)
        ? matchEngineInnings1HistoryRef.current
        : (c.innings1History && c.innings1History.length > 0)
          ? c.innings1History
          : c.completeHistory;
    innings1HistoryRef.current = historyToUse;

    const inn1Data = captureCurrentInningsData(
      c.players,
      c.allPlayers,
      c.bowlers,
      historyToUse,
      scoreToUse,
      wicketsToUse,
      oversToUse,
      ballsToUse,
      c.innings1Extras || c.extras
    );

    innings1DataRef.current = inn1Data;
    setInnings1Data(inn1Data);

    setTimeout(() => {
      c.restorePlayersState({
        players: [],
        allPlayers: [],
        strikerIndex: 0,
        nonStrikerIndex: 1,
        isWicketPending: false,
        outBatsman: null,
      });
      c.restoreBowlersState({ bowlers: [], currentBowlerIndex: 0 });
      c.restorePartnershipState({
        partnershipRuns: 0,
        partnershipBalls: 0,
        striker1Contribution: 0,
        striker2Contribution: 0,
        partnershipHistory: [],
      });
      c.setShowStartModal(true);
      c.setInningsChangeEvent(null);
    }, 50);
  }, [inningsChangeEvent]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (matchOver && !matchCompleted && winner !== "NO RESULT") {
      const inn2Data = captureCurrentInningsData(
        players,
        allPlayers,
        bowlers,
        completeHistory,
        score,
        wickets,
        overs,
        balls,
        extras
      );

      innings2DataRef.current = inn2Data;
      setInnings2Data(inn2Data);

      setTimeout(() => setMatchCompleted(true), 100);
    }
  }, [
    matchOver,
    matchCompleted,
    players,
    allPlayers,
    bowlers,
    completeHistory,
    score,
    wickets,
    overs,
    balls,
    extras,
    winner,
  ]);

  return {
    innings1Data,
    innings2Data,
    matchCompleted,
    innings1HistoryRef,
    innings2DataRef,
    innings1DataRef,
    captureCurrentInningsData,
    setInnings2Data,
    setMatchCompleted,
    innings1BowlersSnapshotRef,
  };
}

export default useInningsData;
