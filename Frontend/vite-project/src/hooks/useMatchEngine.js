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

  // Ref that mirrors completeHistory synchronously
  const completeHistoryRef = useRef([]);
  
  const [wicketEvent, setWicketEvent] = useState(null);
  const [overCompleteEvent, setOverCompleteEvent] = useState(null);

  const [innings1Score, setInnings1Score] = useState(null);
  const [innings2Score, setInnings2Score] = useState(null);

  // ✅ Innings 1 history - stored in BOTH state and ref
  const [innings1History, setInnings1History] = useState([]);
  const innings1HistoryRef = useRef([]);  // ✅ Never cleared, always accessible

  const maxWickets = useMemo(() => {
    const teamACount = Number(matchData.teamAPlayers || 11);
    const teamBCount = Number(matchData.teamBPlayers || 11);
    const count = innings === 1 ? teamACount - 1 : teamBCount - 1;
    
    console.log(
      `🎯 Max wickets recalculated for innings ${innings}: ${count} (A: ${teamACount}, B: ${teamBCount})`
    );
    
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

  const endInnings = () => {
    if (innings === 1) {
      const newTarget = score + 1;

      // ✅ CRITICAL: Capture innings 1 history to BOTH state and ref
      const capturedHistory = [...completeHistoryRef.current];
      console.log(`📜 Capturing innings 1 history: ${capturedHistory.length} balls`);
      console.log(`   First ball:`, capturedHistory[0]);
      console.log(`   Last ball:`, capturedHistory[capturedHistory.length - 1]);
      
      setInnings1History(capturedHistory);
      innings1HistoryRef.current = capturedHistory;  // ✅ Store in ref - never cleared

      setTarget(newTarget);
      setInnings(2);
      setScore(0);
      setWickets(0);
      setBalls(0);
      setOvers(0);
      setCurrentOver([]);
      
      // Now safe to clear for innings 2
      setCompleteHistory([]);
      completeHistoryRef.current = [];
      
      setIsFreeHit(false);

      setInningsChangeEvent({ target: newTarget });
    }
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

    if (innings === 2 && newScore >= target) {
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
        endMatch(firstBattingTeam, newScore, nextWickets, nextOvers, nextBalls);
      } else {
        console.log("💾 Saving innings 1 score (all out):", {
          score: newScore,
          wickets: nextWickets,
          overs: nextOvers,
          balls: nextBalls,
        });
        setInnings1Score({
          score: newScore,
          wickets: nextWickets,
          overs: nextOvers,
          balls: nextBalls,
        });
        endInnings();
      }

      return "MATCH_OVER";
    }

    if (ballsBowled >= totalBalls) {
      console.log("⏱️ Overs completed");

      if (innings === 2) {
        endMatch(firstBattingTeam, newScore, nextWickets, nextOvers, nextBalls);
      } else {
        console.log("💾 Saving innings 1 score (overs complete):", {
          score: newScore,
          wickets: nextWickets,
          overs: nextOvers,
          balls: nextBalls,
        });
        setInnings1Score({
          score: newScore,
          wickets: nextWickets,
          overs: nextOvers,
          balls: nextBalls,
        });
        endInnings();
      }

      return "MATCH_OVER";
    }

    return "CONTINUE";
  };

  useEffect(() => {
    if (matchOver) return;

    const ballsBowled = overs * 6 + balls;

    console.log(
      `🔍 Match Engine Check - Innings: ${innings}, Wickets: ${wickets}/${maxWickets}, Balls: ${ballsBowled}/${totalBalls}`
    );

    if (innings === 2 && score >= target) {
      console.log("🏆 Team 2 wins - target reached");
      endMatch(secondBattingTeam, score, wickets, overs, balls);
      return;
    }

    const shouldEndForWickets = lastManBatting
      ? wickets > maxWickets
      : wickets >= maxWickets;

    if (shouldEndForWickets) {
      console.log(
        `🏏 Innings ending - wickets (${wickets}) vs maxWickets (${maxWickets}), gully: ${lastManBatting}`
      );
      if (innings === 2) {
        console.log("🏆 Team 1 wins - all wickets down");
        endMatch(firstBattingTeam, score, wickets, overs, balls);
      } else {
        console.log("🔄 Innings 1 complete - all wickets down");
        console.log("💾 Saving innings 1 score (master engine - all out):", {
          score,
          wickets,
          overs,
          balls,
        });
        setInnings1Score({ score, wickets, overs, balls });
        endInnings();
      }
      return;
    }

    if (ballsBowled >= totalBalls) {
      console.log("⏱️ Overs completed");
      if (innings === 2) {
        console.log("🏆 Team 1 wins - overs complete");
        endMatch(firstBattingTeam, score, wickets, overs, balls);
      } else {
        console.log("🔄 Innings 1 complete - overs complete");
        console.log("💾 Saving innings 1 score (master engine - overs):", {
          score,
          wickets,
          overs,
          balls,
        });
        setInnings1Score({ score, wickets, overs, balls });
        endInnings();
      }
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

  const handleRun = (runs) => {
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
    const runEntry = { event: "RUN", runs, over: overs, ball: balls };
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

  const handleWicket = (isRunout = false) => {
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
      setCurrentOver((prev) => [...prev, { type: "W" }]);
      const wicketEntry = { event: "WICKET", over: overs, ball: balls };
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

  const handleWide = () => {
    if (!rules.wide || matchOver) return;
    setScore((prev) => prev + 1);
    setCurrentOver((prev) => [...prev, { type: "WD" }]);
    const wdEntry = { event: "WD", over: overs, ball: balls };
    completeHistoryRef.current = [...completeHistoryRef.current, wdEntry];
    setCompleteHistory((prev) => [...prev, wdEntry]);
  };

  const handleNoBall = () => {
    if (!rules.noBall || matchOver) return;
    setScore((prev) => prev + 1);
    setIsFreeHit(true);
    setCurrentOver((prev) => [...prev, { type: "NB" }]);
    const nbEntry = { event: "NB", over: overs, ball: balls };
    completeHistoryRef.current = [...completeHistoryRef.current, nbEntry];
    setCompleteHistory((prev) => [...prev, nbEntry]);
  };

  const handleBye = (runs = 1) => {
    if (!rules.byes || matchOver) return;

    setScore((prev) => prev + runs);

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
    handleRun,
    handleWicket,
    handleWide,
    handleNoBall,
    handleBye,
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
    innings1HistoryRef,  // ✅ Export the ref
    addScore,
    addRunToCurrentOver,
  };
}
