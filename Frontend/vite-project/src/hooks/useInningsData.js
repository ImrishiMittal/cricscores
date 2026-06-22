import { useState, useEffect, useRef } from "react";

// ─── Helper: parse dismissal string OR object ─────────────────────────────────
const parseDismissal = (dismissal) => {
  if (!dismissal) return { isOut: false, type: "", fielder: "", bowler: "" };
  
  if (typeof dismissal === "object") {
    return {
      isOut: true,
      type: dismissal.type || "",
      fielder: dismissal.fielder || "",
      bowler: dismissal.bowler || "",
    };
  }

  // Parse string format: "c FielderName b BowlerName", "b BowlerName",
  // "run out (FielderName)", "st FielderName b BowlerName", etc.
  const s = dismissal.trim();

  // "c & b BowlerName"
  const cAndB = s.match(/^c\s*&\s*b\s+(.+)$/i);
  if (cAndB) return { isOut: true, type: "caught", fielder: cAndB[1].trim(), bowler: cAndB[1].trim() };

  // "c FielderName b BowlerName"
  const caught = s.match(/^c\s+(.+?)\s+b\s+(.+)$/i);
  if (caught) return { isOut: true, type: "caught", fielder: caught[1].trim(), bowler: caught[2].trim() };

  // "st FielderName b BowlerName"
  const stumped = s.match(/^st\s+(.+?)\s+b\s+(.+)$/i);
  if (stumped) return { isOut: true, type: "stumped", fielder: stumped[1].trim(), bowler: stumped[2].trim() };

  // "run out (FielderName)"
  const runout = s.match(/^run\s+out\s*\((.+)\)$/i);
  if (runout) return { isOut: true, type: "runout", fielder: runout[1].trim(), bowler: "" };

  // "run out" (no fielder)
  if (/^run\s+out$/i.test(s)) return { isOut: true, type: "runout", fielder: "", bowler: "" };

  // "b BowlerName" or "lbw b BowlerName"
  const bowled = s.match(/^(?:lbw\s+)?b\s+(.+)$/i);
  if (bowled) return { isOut: true, type: s.toLowerCase().startsWith("lbw") ? "lbw" : "bowled", fielder: "", bowler: bowled[1].trim() };

  // Fallback
  return { isOut: true, type: "bowled", fielder: "", bowler: s };
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
  matchEngineInnings1HistoryRef,
  innings2History,
  innings3History,
  partnershipHistory  
) {
  const [innings1Data, setInnings1Data] = useState(null);
  const [innings2Data, setInnings2Data] = useState(null);
  const [innings3Data, setInnings3Data] = useState(null);
  const [innings4Data, setInnings4Data] = useState(null);
  const innings3DataRef = useRef(null);
  const innings4DataRef = useRef(null);
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
    innings,
    innings1Score,
    innings1History,
    extras,
    innings1Extras,
    innings2History,
    innings3History: innings3History || [],
    partnershipHistory: partnershipHistory || [],
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
        ball.bowler ||
        ball.bowlerName ||
        ball.bowlerDisplayName ||
        ball.currentBowler ||
        ball.bowlerId ||
        "";

      if (!bowlerName || bowlerName === "Unknown") {
        if (!bowlerName) console.warn("⚠️ Missing bowler in ball:", ball);
        continue;
      }

      if (!statsMap.has(bowlerName)) {
        statsMap.set(bowlerName, {
          playerName: bowlerName,
          playerId: "",
          ballsBowled: 0,
          runsGiven: 0,
          wickets: 0,
          wides: 0,
          noBalls: 0,
          dotBallsBowled: 0,
          maidens: 0,
        });
      }

      const s = statsMap.get(bowlerName);
      const runs = ball.runs ?? ball.r ?? ball.runsScored ?? 0;

      const isWide =
        ball.event === "WD" ||
        ball.type === "wide" ||
        ball.wide === true ||
        ball.extraType === "wide";
      if (isWide) {
        s.wides += 1;
        s.runsGiven += 1 + (runs > 0 ? runs : 0);
        continue;
      }

      const isNoBall =
        ball.event === "NB" ||
        ball.type === "noBall" ||
        ball.noBall === true ||
        ball.extraType === "noBall";
      if (isNoBall) {
        s.noBalls += 1;
        s.runsGiven += 1 + (runs > 0 ? runs : 0);
        continue;
      }

      // Legal delivery — always counts
      s.ballsBowled += 1;

      const isBye =
        ball.event === "BYE" ||
        ball.type === "bye" ||
        ball.bye === true ||
        ball.extraType === "bye";
      const isLegBye =
        ball.event === "LB" ||
        ball.type === "legBye" ||
        ball.legBye === true ||
        ball.extraType === "legBye";

      if (isBye || isLegBye) {
        if (runs === 0) s.dotBallsBowled += 1;
      } else {
        s.runsGiven += runs;
        if (runs === 0) s.dotBallsBowled += 1;
      }

      const isWicket =
        ball.event === "WICKET" ||
        ball.event === "HW" ||
        ball.wicket === true ||
        ball.isWicket === true ||
        ball.w === true ||
        String(ball.result) === "W" ||
        (ball.dismissal != null && ball.dismissal !== "");

      const isRunout =
        ball.event === "RUNOUT" ||
        ball.dismissalType === "runout" ||
        ball.wicketType === "runout" ||
        ball.runout === true ||
        (typeof ball.dismissal === "string" &&
          ball.dismissal.toLowerCase().includes("run out")) ||
        (typeof ball.dismissal === "object" &&
          ball.dismissal?.type === "runout");

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
    dedupedPlayers.sort(
      (a, b) => (a.battingOrder ?? 999) - (b.battingOrder ?? 999)
    );

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
      partnershipHistory: [],
    };
  };

  useEffect(() => {
    if (!inningsChangeEvent) return;

    const c = callbacksRef.current;

    if (inningsChangeEvent.matchEnd) {
      console.log("🏁 Match ended - capturing innings", innings);
    
      const finalData = captureCurrentInningsData(
        c.players, c.allPlayers, c.bowlers,
        c.completeHistory,
        c.score, c.wickets, c.overs, c.balls, c.extras
      );
      finalData.partnershipHistory = c.partnershipHistory || [];
    
      if (c.innings === 4) {
        innings4DataRef.current = finalData;
        setInnings4Data(finalData);
      } else if (c.innings === 3) {
        innings3DataRef.current = finalData;
        setInnings3Data(finalData);
      } else {
        innings2DataRef.current = finalData;
        setInnings2Data(finalData);
      }
    
      setTimeout(() => {
        setMatchCompleted(true);
        c.setInningsChangeEvent(null);
      }, 50);
      return;
    }

    // Test match: innings 3 ending
    if (inningsChangeEvent.inningsNumber === 4) {
      console.log("🔄 Innings 3 ending → innings 4 starting");
      const inn3Data = captureCurrentInningsData(
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
      inn3Data.partnershipHistory = c.partnershipHistory || [];
      innings3DataRef.current = inn3Data;
      setInnings3Data(inn3Data);

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
      return;
    }

    // Test match: innings 2 ending → innings 3 starting (or follow-on check)
    if (
      inningsChangeEvent.inningsNumber === 3 ||
      inningsChangeEvent.followOnCheck
    ) {
      console.log("🔄 Innings 2 ending → innings 3 starting");
      const inn2Data = captureCurrentInningsData(
        c.players,
        c.allPlayers,
        c.bowlers,
        c.innings2History?.length > 0 ? c.innings2History : c.completeHistory,
        c.score,
        c.wickets,
        c.overs,
        c.balls,
        c.extras
      );
      inn2Data.partnershipHistory = c.partnershipHistory || []; 
      innings2DataRef.current = inn2Data;
      setInnings2Data(inn2Data);

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
        if (!inningsChangeEvent.followOnCheck) {
          c.setShowStartModal(true);
        }
        // If followOnCheck=true, ScoringPage shows FollowOnModal instead
        c.setInningsChangeEvent(null);
      }, 50);
      return;
    }

    console.log("🔄 Innings 1 ending");
    innings1HistoryRef.current = [
      ...(callbacksRef.current.innings1History || []),
    ];
    innings1BowlersSnapshotRef.current = [...(c.bowlers || [])];
    console.log(
      "📸 [useInningsData] Bowlers snapshot:",
      innings1BowlersSnapshotRef.current
    );

    if (c.partnershipRuns > 0 || c.partnershipBalls > 0) {
      c.savePartnership(c.score, c.wickets, undefined, undefined, c.overs, c.balls);
    }

    const scoreToUse = c.innings1Score?.score ?? c.score;
    const wicketsToUse = c.innings1Score?.wickets ?? c.wickets;
    const oversToUse = c.innings1Score?.overs ?? c.overs;
    const ballsToUse = c.innings1Score?.balls ?? c.balls;

    const historyToUse =
      matchEngineInnings1HistoryRef?.current?.length > 0
        ? matchEngineInnings1HistoryRef.current
        : c.innings1History && c.innings1History.length > 0
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
    inn1Data.partnershipHistory = callbacksRef.current.partnershipHistory || [];

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

  // WITH THIS:
useEffect(() => {
  if (matchOver && !matchCompleted && winner !== "NO RESULT") {
    const finalData = captureCurrentInningsData(
      players, allPlayers, bowlers, completeHistory,
      score, wickets, overs, balls, extras
    );
    finalData.partnershipHistory = callbacksRef.current.partnershipHistory || [];
    if (innings === 4) {
      innings4DataRef.current = finalData;
      setInnings4Data(finalData);
    } else if (innings === 3) {
      innings3DataRef.current = finalData;
      setInnings3Data(finalData);
    } else {
      innings2DataRef.current = finalData;
      setInnings2Data(finalData);
    }

    setTimeout(() => setMatchCompleted(true), 100);
  }
}, [
  matchOver,
  matchCompleted,
  innings,
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
    innings3Data,
    innings4Data,
    innings3DataRef,
    innings4DataRef,
    setInnings3Data,
    setInnings4Data,
  };
}

export default useInningsData;
