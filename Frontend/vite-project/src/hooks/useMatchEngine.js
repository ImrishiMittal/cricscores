import { useState, useEffect, useMemo, useRef } from "react";

export default function useMatchEngine(matchData, swapStrike) {
  const rules = matchData.rules || {};
  const totalOvers = Number(matchData.overs) || 10;
  const totalBalls = totalOvers * 6;

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

  // ✅ NEW: Extras tracking
  const [extras, setExtras] = useState({ wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 });

  const completeHistoryRef = useRef([]);

  const [wicketEvent, setWicketEvent] = useState(null);
  const [overCompleteEvent, setOverCompleteEvent] = useState(null);

  const [innings1Score, setInnings1Score] = useState(null);
  const [innings2Score, setInnings2Score] = useState(null);

  const [innings1History, setInnings1History] = useState([]);
  const innings1HistoryRef = useRef([]);
  const [innings1Extras, setInnings1Extras] = useState(null); // ✅ extras snapshot before reset

  const maxWickets = useMemo(() => {
    const teamACount = Number(matchData.teamAPlayers || 11);
    const teamBCount = Number(matchData.teamBPlayers || 11);
    const count = innings === 1 ? teamACount - 1 : teamBCount - 1;
    console.log(`🎯 Max wickets recalculated for innings ${innings}: ${count} (A: ${teamACount}, B: ${teamBCount})`);
    return count;
  }, [innings, matchData.teamAPlayers, matchData.teamBPlayers]);

  const lastManBatting = matchData.lastManBatting || false;

  const addScore = (runs) => {
    setScore(prev => prev + runs);
    console.log(`📊 Score manually increased by ${runs} (runout)`);
  };

  const addRunToCurrentOver = (runs, isWicket = false) => {
    setCurrentOver(prev => [...prev, { runs, isWicket }]);
    console.log(`📊 Added ${runs} runs to currentOver (runout, isWicket=${isWicket})`);
  };

  const restoreState = (snap) => {
    setScore(snap.score);
    setWickets(snap.wickets);
    setBalls(snap.balls);
    setOvers(snap.overs);
    setCurrentOver([...snap.currentOver]);
    setCompleteHistory([...snap.completeHistory]);
    completeHistoryRef.current = [...snap.completeHistory];
    // ✅ Restore extras from snapshot
    if (snap.extras) setExtras({ ...snap.extras });
    if (snap.innings !== undefined) setInnings(snap.innings);
    if (snap.target !== undefined) setTarget(snap.target);
  };

  const endMatch = (winningTeam, finalScore, finalWickets, finalOvers, finalBalls) => {
    if (innings === 2) {
      setInnings2Score({ score: finalScore, wickets: finalWickets, overs: finalOvers, balls: finalBalls });
      setInningsChangeEvent({ matchEnd: true });
    }
    setMatchOver(true);
    setWinner(winningTeam);
  };

  const [inningsChangeEvent, setInningsChangeEvent] = useState(null);

  const endMatchNoResult = () => {
    console.log("🌧️ Match declared No Result");
    if (innings === 2) setInnings2Score({ score, wickets, overs, balls });
    if (innings === 1) setInnings1Score({ score, wickets, overs, balls });
    setMatchOver(true);
    setWinner("NO RESULT");
  };

  const endInnings = () => {
    if (innings === 1) {
      const newTarget = score + 1;
      const capturedHistory = [...completeHistoryRef.current];
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
      setInnings1Extras({ ...extras }); // ✅ snapshot before reset
      // ✅ Reset extras for innings 2
      setExtras({ wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 });

      setInningsChangeEvent({ target: newTarget });
    }
  };

  const checkMatchStatus = (newScore, nextWickets, nextBalls, nextOvers) => {
    const ballsBowled = nextOvers * 6 + nextBalls;

    console.log("🔍 Check Match Status:", { innings, nextWickets, maxWickets, newScore, target, ballsBowled, totalBalls });

    if (innings === 2 && newScore >= target) {
      endMatch(secondBattingTeam, newScore, nextWickets, nextOvers, nextBalls);
      return "MATCH_OVER";
    }

    const shouldEndForWickets = lastManBatting ? nextWickets > maxWickets : nextWickets >= maxWickets;

    if (shouldEndForWickets) {
      if (innings === 2) {
        endMatch(firstBattingTeam, newScore, nextWickets, nextOvers, nextBalls);
      } else {
        setInnings1Score({ score: newScore, wickets: nextWickets, overs: nextOvers, balls: nextBalls });
        endInnings();
      }
      return "MATCH_OVER";
    }

    if (ballsBowled >= totalBalls) {
      if (innings === 2) {
        endMatch(firstBattingTeam, newScore, nextWickets, nextOvers, nextBalls);
      } else {
        setInnings1Score({ score: newScore, wickets: nextWickets, overs: nextOvers, balls: nextBalls });
        endInnings();
      }
      return "MATCH_OVER";
    }

    return "CONTINUE";
  };

  useEffect(() => {
    if (matchOver) return;

    const ballsBowled = overs * 6 + balls;
    console.log(`🔍 Match Engine Check - Innings: ${innings}, Wickets: ${wickets}/${maxWickets}, Balls: ${ballsBowled}/${totalBalls}`);

    if (innings === 2 && score >= target) {
      endMatch(secondBattingTeam, score, wickets, overs, balls);
      return;
    }

    const shouldEndForWickets = lastManBatting ? wickets > maxWickets : wickets >= maxWickets;

    if (shouldEndForWickets) {
      if (innings === 2) {
        endMatch(firstBattingTeam, score, wickets, overs, balls);
      } else {
        setInnings1Score({ score, wickets, overs, balls });
        endInnings();
      }
      return;
    }

    if (ballsBowled >= totalBalls) {
      if (innings === 2) {
        endMatch(firstBattingTeam, score, wickets, overs, balls);
      } else {
        setInnings1Score({ score, wickets, overs, balls });
        endInnings();
      }
      return;
    }
  }, [overs, balls, wickets, score, maxWickets, innings, matchOver, target, lastManBatting]);

  const handleRun = (runs, strikerId) => {
    if (matchOver) return;
    if (isFreeHit) setIsFreeHit(false);

    const newScore = score + runs;
    setScore(newScore);

    let nextBalls = balls + 1;
    let nextOvers = overs;

    const isLastManAlone = lastManBatting && wickets === maxWickets;

    if (!isLastManAlone && runs % 2 === 1) swapStrike();

    setCurrentOver((prev) => [...prev, { runs }]);
    // ✅ Add strikerId to entry
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

    // ✅ eventType defined BEFORE wicketEntry
    if (!isRunout) {
      const eventType = isHitWicket ? "HW" : "WICKET";
      setCurrentOver((prev) => [...prev, { type: isHitWicket ? "HW" : "W" }]);
      // ✅ strikerId included here
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
      const isMatchStillOn = status !== "MATCH_OVER";
      if (ballsBowled < totalBalls && nextWickets < maxWickets && isMatchStillOn) {
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

  const handleWide = () => {
    if (!rules.wide || matchOver) return;
    setScore((prev) => prev + 1);
    // ✅ Track wide extra
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
    // ✅ Track no ball extra
    setExtras((prev) => ({ ...prev, noBalls: prev.noBalls + 1, total: prev.total + 1 }));
    setCurrentOver((prev) => [...prev, { type: "NB" }]);
    const nbEntry = { event: "NB", over: overs, ball: balls };
    completeHistoryRef.current = [...completeHistoryRef.current, nbEntry];
    setCompleteHistory((prev) => [...prev, nbEntry]);
  };

  const handleBye = (runs = 1) => {
    if (!rules.byes || matchOver) return;

    setScore((prev) => prev + runs);
    // ✅ Track bye extra
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

  // ✅ NEW: Leg bye handler
  const handleLegBye = (runs = 1) => {
    if (matchOver) return;

    setScore((prev) => prev + runs);
    // ✅ Track leg bye extra
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
    innings1Extras,   // ✅ NEW
    handleRun,
    handleWicket,
    handleWide,
    handleNoBall,
    handleBye,
    handleLegBye,     // ✅ NEW
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
    endMatchNoResult,
  };
}
