import { useState, useEffect, useMemo, useRef } from "react";

export default function useMatchEngine(matchData, swapStrike) {
  const rules = matchData.rules || {};

  const firstBattingTeam = matchData.battingFirst || matchData.teamA;
  const secondBattingTeam =
    firstBattingTeam === matchData.teamA ? matchData.teamB : matchData.teamA;

  const [innings, setInnings] = useState(1);
  const [target, setTarget] = useState(null);
  const [matchOver, setMatchOver] = useState(false);
  const [winner, setWinner] = useState("");

  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [overs, setOvers] = useState(0);

  const [currentOver, setCurrentOver] = useState([]);
  const [completeHistory, setCompleteHistory] = useState([]);
  const [isFreeHit, setIsFreeHit] = useState(false);

  // ✅ Extras tracking
  const [extras, setExtras] = useState({ wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 });
  const [innings1Extras, setInnings1Extras] = useState(null);

  const completeHistoryRef = useRef([]);
  const [wicketEvent, setWicketEvent] = useState(null);
  const [overCompleteEvent, setOverCompleteEvent] = useState(null);

  const [innings1Score, setInnings1Score] = useState(null);
  const [innings2Score, setInnings2Score] = useState(null);

  const [realMatchInnings1Score, setRealMatchInnings1Score] = useState(null);
  const [realMatchInnings2Score, setRealMatchInnings2Score] = useState(null);
  const realMatchScoresSavedRef = useRef(false);

  const [innings1History, setInnings1History] = useState([]);
  const innings1HistoryRef = useRef([]);

  const [tieDetected, setTieDetected] = useState(false);
  const [isSuperOver, setIsSuperOver] = useState(false);
  const [superOverNumber, setSuperOverNumber] = useState(0);

  const superOverBattingFirstRef = useRef(null);

  const totalOvers = isSuperOver ? 1 : Number(matchData.overs) || 10;
  const totalBalls = totalOvers * 6;

  const maxWickets = useMemo(() => {
    if (isSuperOver) return 2;
    const teamACount = Number(matchData.teamAPlayers || 11);
    const teamBCount = Number(matchData.teamBPlayers || 11);
    const count = innings === 1 ? teamACount - 1 : teamBCount - 1;
    console.log(
      `🎯 Max wickets recalculated for innings ${innings}: ${count} (A: ${teamACount}, B: ${teamBCount})`
    );
    return count;
  }, [innings, matchData.teamAPlayers, matchData.teamBPlayers, isSuperOver]);

  const lastManBatting = isSuperOver ? false : (matchData.lastManBatting || false);

  const addScore = (runs) => {
    setScore((prev) => prev + runs);
  };

  const addRunToCurrentOver = (runs, isWicket = false) => {
    setCurrentOver((prev) => [...prev, { runs, isWicket }]);
  };

  const restoreState = (snap) => {
    setScore(snap.score);
    setWickets(snap.wickets);
    setBalls(snap.balls);
    setOvers(snap.overs);
    setCurrentOver([...snap.currentOver]);
    setCompleteHistory([...snap.completeHistory]);
    completeHistoryRef.current = [...snap.completeHistory];
    if (snap.extras) setExtras({ ...snap.extras });
    if (snap.innings !== undefined) setInnings(snap.innings);
    if (snap.target !== undefined) setTarget(snap.target);
  };

  const endMatch = (
    winningTeam,
    finalScore,
    finalWickets,
    finalOvers,
    finalBalls
  ) => {
    if (innings === 2) {
      setInnings2Score({
        score: finalScore,
        wickets: finalWickets,
        overs: finalOvers,
        balls: finalBalls,
      });
      setInningsChangeEvent({ matchEnd: true });
    }
    setMatchOver(true);
    setWinner(winningTeam);
  };

  const [inningsChangeEvent, setInningsChangeEvent] = useState(null);

  const endInnings = (finalScore = score) => {
    if (innings === 1) {
      const newTarget = finalScore + 1;
      const capturedHistory = [...completeHistoryRef.current];

      console.log(
        `📜 Capturing innings 1 history: ${capturedHistory.length} balls`
      );
      setInnings1History(capturedHistory);
      innings1HistoryRef.current = capturedHistory;

      setTarget(newTarget);
      setInnings(2);
      setScore(0);
      setWickets(0);
      setBalls(0);
      setOvers(0);
      setCurrentOver([]);
      setCompleteHistory([]);
      completeHistoryRef.current = [];
      setIsFreeHit(false);

      setInnings1Extras({ ...extras });
      setExtras({ wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 });

      setInningsChangeEvent({ target: newTarget });
    }
  };

  const endMatchNoResult = () => {
    setMatchOver(true);
    setWinner("NO RESULT");
  };

  const checkMatchStatus = (newScore, nextWickets, nextBalls, nextOvers) => {
    const ballsBowled = nextOvers * 6 + nextBalls;

    console.log("🔍 Check Match Status:", {
      innings,
      nextWickets,
      maxWickets,
      newScore,
      target,
      ballsBowled,
      totalBalls,
    });

    if (innings === 2 && newScore > target) {
      console.log("🏆 Team 2 wins by exceeding target");
      endMatch(secondBattingTeam, newScore, nextWickets, nextOvers, nextBalls);
      return "MATCH_OVER";
    }

    if (innings === 2 && newScore === target && nextBalls > 0) {
      console.log("🏆 Team 2 wins by reaching target");
      endMatch(secondBattingTeam, newScore, nextWickets, nextOvers, nextBalls);
      return "MATCH_OVER";
    }

    const shouldEndForWickets = lastManBatting
      ? nextWickets > maxWickets
      : nextWickets >= maxWickets;

    if (shouldEndForWickets) {
      console.log("🏏 All out - ending innings/match");

      if (innings === 2) {
        if (newScore === target - 1) {
          console.log("🤝 All out TIE!");
          return handleTieOrEnd(newScore, nextWickets, nextOvers, nextBalls);
        }
        endMatch(firstBattingTeam, newScore, nextWickets, nextOvers, nextBalls);
      } else {
        console.log("💾 Saving innings 1 score (all out):", {
          score: newScore, wickets: nextWickets, overs: nextOvers, balls: nextBalls,
        });
        setInnings1Score({
          score: newScore, wickets: nextWickets, overs: nextOvers, balls: nextBalls,
        });
        endInnings(newScore);
      }
      return "MATCH_OVER";
    }

    if (ballsBowled >= totalBalls) {
      console.log("⏱️ Overs completed");

      if (innings === 2) {
        if (newScore === target - 1) {
          console.log("🤝 MATCH TIED at end of overs!");
          return handleTieOrEnd(newScore, nextWickets, nextOvers, nextBalls);
        }
        endMatch(firstBattingTeam, newScore, nextWickets, nextOvers, nextBalls);
      } else {
        console.log("💾 Saving innings 1 score (overs complete):", {
          score: newScore, wickets: nextWickets, overs: nextOvers, balls: nextBalls,
        });
        setInnings1Score({
          score: newScore, wickets: nextWickets, overs: nextOvers, balls: nextBalls,
        });
        endInnings(newScore);
      }
      return "MATCH_OVER";
    }

    return "CONTINUE";
  };

  const handleTieOrEnd = (finalScore, finalWickets, finalOvers, finalBalls) => {
    if (matchData.enableSuperOver) {
      console.log("🤝 Tie — triggering Super Over!");

      if (!isSuperOver && !realMatchScoresSavedRef.current) {
        realMatchScoresSavedRef.current = true;
        setRealMatchInnings1Score(innings1Score);
        setRealMatchInnings2Score({
          score: finalScore,
          wickets: finalWickets,
          overs: finalOvers,
          balls: finalBalls,
        });
        console.log("💾 Real match scores preserved for summary");
      }

      setMatchOver(true);
      setWinner("TIE");
      setTieDetected(true);
      return "TIE_DETECTED";
    } else {
      endMatch("TIE", finalScore, finalWickets, finalOvers, finalBalls);
      return "MATCH_OVER";
    }
  };

  useEffect(() => {
    if (matchOver) return;

    const ballsBowled = overs * 6 + balls;

    if (ballsBowled === 0 && score === 0 && wickets === 0) return;

    console.log(
      `🔍 Match Engine Check - Innings: ${innings}, Wickets: ${wickets}/${maxWickets}, Balls: ${ballsBowled}/${totalBalls}`
    );

    if (innings === 2 && score >= target) {
      console.log("🏆 Team 2 wins");
      endMatch(secondBattingTeam, score, wickets, overs, balls);
      return;
    }

    const shouldEndForWickets = lastManBatting
      ? wickets > maxWickets
      : wickets >= maxWickets;

    if (shouldEndForWickets) {
      console.log(`🏏 Innings ending - wickets (${wickets}) vs maxWickets (${maxWickets})`);
      if (innings === 2) {
        if (score === target - 1) {
          return;
        }
        endMatch(firstBattingTeam, score, wickets, overs, balls);
      } else {
        setInnings1Score({ score, wickets, overs, balls });
        endInnings();
      }
      return;
    }

    if (ballsBowled >= totalBalls && innings === 1) {
      console.log("🔄 Innings 1 complete - overs complete (engine)");
      setInnings1Score({ score, wickets, overs, balls });
      endInnings();
      return;
    }
  }, [
    overs,
    balls,
    wickets,
    score,
    maxWickets,
    innings,
    matchOver,
    target,
    lastManBatting,
  ]);

  // ✅ FIX: Accept strikerId parameter
  const handleRun = (runs, strikerId) => {
    if (matchOver) return;
    if (isFreeHit) setIsFreeHit(false);

    const newScore = score + runs;
    setScore(newScore);

    let nextBalls = balls + 1;
    let nextOvers = overs;

    const isLastManAlone = lastManBatting && wickets === maxWickets;

    if (!isLastManAlone && runs % 2 === 1) {
      swapStrike();
    }

    setCurrentOver((prev) => [...prev, { runs }]);
    // ✅ FIX: Include strikerId in history
    const runEntry = { event: "RUN", runs, over: overs, ball: balls, strikerId };
    completeHistoryRef.current = [...completeHistoryRef.current, runEntry];
    setCompleteHistory((prev) => [...prev, runEntry]);

    if (nextBalls === 6) {
      nextOvers++;
      nextBalls = 0;

      if (!isLastManAlone) swapStrike();

      setCurrentOver([]);

      const ballsBowled = nextOvers * 6;
      if (ballsBowled < totalBalls && wickets < maxWickets) {
        setOverCompleteEvent({ overNumber: nextOvers });
      }
    }

    setBalls(nextBalls);
    setOvers(nextOvers);

    checkMatchStatus(newScore, wickets, nextBalls, nextOvers);
  };

  // ✅ FIX: Accept strikerId parameter
  const handleWicket = (isRunout = false, isHitWicket = false, strikerId = null) => {
    if (matchOver) return;

    if (isFreeHit) {
      setCurrentOver((prev) => [...prev, { type: "FH" }]);
      const fhEntry = { event: "FREE_HIT", over: overs, ball: balls };
      completeHistoryRef.current = [...completeHistoryRef.current, fhEntry];
      setCompleteHistory((prev) => [...prev, fhEntry]);

      let nextBalls = balls + 1;
      let nextOvers = overs;

      if (nextBalls === 6) {
        nextOvers++;
        nextBalls = 0;
        swapStrike();
        setCurrentOver([]);

        const ballsBowled = nextOvers * 6;
        if (ballsBowled < totalBalls && wickets < maxWickets) {
          setOverCompleteEvent({ overNumber: nextOvers });
        }
      }

      setBalls(nextBalls);
      setOvers(nextOvers);
      setIsFreeHit(false);
      return;
    }

    if (!isRunout) {
      const eventType = isHitWicket ? "HW" : "WICKET";
      setCurrentOver((prev) => [...prev, { type: isHitWicket ? "HW" : "W" }]);
      // ✅ FIX: Include strikerId in wicket entry
      const wicketEntry = { event: eventType, over: overs, ball: balls, strikerId };
      completeHistoryRef.current = [...completeHistoryRef.current, wicketEntry];
      setCompleteHistory((prev) => [...prev, wicketEntry]);
    }

    setWicketEvent({ out: true });

    const nextWickets = wickets + 1;
    let nextBalls = isRunout ? balls : balls + 1;
    let nextOvers = overs;

    if (!isRunout && nextBalls === 6) {
      nextOvers++;
      nextBalls = 0;
      swapStrike();
      setCurrentOver([]);

      const ballsBowled = nextOvers * 6;
      const status = checkMatchStatus(score, nextWickets, nextBalls, nextOvers);
      const isMatchStillOn = status !== "MATCH_OVER" && status !== "TIE_DETECTED";

      if (
        ballsBowled < totalBalls &&
        nextWickets < maxWickets &&
        isMatchStillOn
      ) {
        setOverCompleteEvent({ overNumber: nextOvers });
      }
    }

    if (!isRunout) {
      setBalls(nextBalls);
      setOvers(nextOvers);
    }
    setWickets(nextWickets);

    checkMatchStatus(score, nextWickets, nextBalls, nextOvers);
  };

  // ✅ FIX: Restore extras tracking
  const handleWide = () => {
    if (!rules.wide || matchOver) return;
    setScore((prev) => prev + 1);
    setExtras((prev) => ({ ...prev, wides: prev.wides + 1, total: prev.total + 1 }));
    setCurrentOver((prev) => [...prev, { type: "WD" }]);
    const wdEntry = { event: "WD", over: overs, ball: balls };
    completeHistoryRef.current = [...completeHistoryRef.current, wdEntry];
    setCompleteHistory((prev) => [...prev, wdEntry]);
  };

  const handleNoBall = () => {
    if (!rules.noBall || matchOver) return;
    setScore((prev) => prev + 1);
    setIsFreeHit(true);
    setExtras((prev) => ({ ...prev, noBalls: prev.noBalls + 1, total: prev.total + 1 }));
    setCurrentOver((prev) => [...prev, { type: "NB" }]);
    const nbEntry = { event: "NB", over: overs, ball: balls };
    completeHistoryRef.current = [...completeHistoryRef.current, nbEntry];
    setCompleteHistory((prev) => [...prev, nbEntry]);
  };

  const handleBye = (runs = 1) => {
    if (!rules.byes || matchOver) return;

    setScore((prev) => prev + runs);
    setExtras((prev) => ({ ...prev, byes: prev.byes + runs, total: prev.total + runs }));

    let nextBalls = balls + 1;
    let nextOvers = overs;

    if (runs % 2 === 1) swapStrike();

    if (nextBalls === 6) {
      nextOvers++;
      nextBalls = 0;
      swapStrike();
      setCurrentOver([]);

      const ballsBowled = nextOvers * 6;
      if (ballsBowled < totalBalls && wickets < maxWickets) {
        setOverCompleteEvent({ overNumber: nextOvers });
      }
    }

    setBalls(nextBalls);
    setOvers(nextOvers);

    setCurrentOver((prev) => [...prev, { type: "BYE", runs }]);
    const byeEntry = { event: "BYE", runs, over: overs, ball: balls };
    completeHistoryRef.current = [...completeHistoryRef.current, byeEntry];
    setCompleteHistory((prev) => [...prev, byeEntry]);
  };

  const handleLegBye = (runs = 1) => {
    if (matchOver) return;

    setScore((prev) => prev + runs);
    setExtras((prev) => ({ ...prev, legByes: prev.legByes + runs, total: prev.total + runs }));

    let nextBalls = balls + 1;
    let nextOvers = overs;

    if (runs % 2 === 1) swapStrike();

    if (nextBalls === 6) {
      nextOvers++;
      nextBalls = 0;
      swapStrike();
      setCurrentOver([]);

      const ballsBowled = nextOvers * 6;
      if (ballsBowled < totalBalls && wickets < maxWickets) {
        setOverCompleteEvent({ overNumber: nextOvers });
      }
    }

    setBalls(nextBalls);
    setOvers(nextOvers);

    setCurrentOver((prev) => [...prev, { type: "LB", runs }]);
    const lbEntry = { event: "LB", runs, over: overs, ball: balls };
    completeHistoryRef.current = [...completeHistoryRef.current, lbEntry];
    setCompleteHistory((prev) => [...prev, lbEntry]);
  };

  const startSuperOver = (number) => {
    console.log("⚡ Starting Super Over", number);

    if (number === 1) {
      superOverBattingFirstRef.current = secondBattingTeam;
    }

    setTieDetected(false);
    setIsSuperOver(true);
    setSuperOverNumber(number);

    setMatchOver(false);
    setWinner("");

    setInnings(1);

    setScore(0);
    setWickets(0);
    setBalls(0);
    setOvers(0);

    setCurrentOver([]);
    completeHistoryRef.current = [];
    setCompleteHistory([]);

    setTarget(null);
    setIsFreeHit(false);

    setInnings1Score(null);
    setInnings2Score(null);

    setExtras({ wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 });
    setInnings1Extras(null);

    return "SUPER_OVER_STARTED";
  };

  return {
    score,
    wickets,
    balls,
    overs,
    currentOver,
    completeHistory,
    matchOver,
    winner,
    target,
    innings,
    isFreeHit,
    extras,
    innings1Extras,
    handleRun,
    handleWicket,
    handleWide,
    handleNoBall,
    handleBye,
    handleLegBye,
    wicketEvent,
    setWicketEvent,
    restoreState,
    overCompleteEvent,
    setOverCompleteEvent,
    inningsChangeEvent,
    setInningsChangeEvent,
    innings1Score,
    innings2Score,
    innings1History,
    innings1HistoryRef,
    addScore,
    addRunToCurrentOver,
    tieDetected,
    setTieDetected,
    isSuperOver,
    superOverNumber,
    startSuperOver,
    endMatchNoResult,
    realMatchInnings1Score,
    realMatchInnings2Score,
    superOverBattingFirst: superOverBattingFirstRef.current,
  };
}