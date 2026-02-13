import { useState, useEffect, useMemo } from "react";

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
  const [wicketEvent, setWicketEvent] = useState(null);
  const [overCompleteEvent, setOverCompleteEvent] = useState(null);

  // ✅ ADD: State to store final scores for both innings
  const [innings1Score, setInnings1Score] = useState(null);
  const [innings2Score, setInnings2Score] = useState(null);

  // ✅ FIX: Make maxWickets dynamic using useMemo - recalculates when matchData changes
  const maxWickets = useMemo(() => {
    const teamACount = Number(matchData.teamAPlayers || 11);
    const teamBCount = Number(matchData.teamBPlayers || 11);
  
    const count =
      innings === 1
        ? teamACount - 1
        : teamBCount - 1;
  
    console.log(
      `🎯 Max wickets recalculated for innings ${innings}: ${count} (A: ${teamACount}, B: ${teamBCount})`
    );
  
    return count;
  }, [
    innings,
    matchData.teamAPlayers,
    matchData.teamBPlayers
  ]);  

  const lastManBatting = matchData.lastManBatting || false;

  /* ================= RESTORE STATE (UNDO) ================= */
  const restoreState = (snap) => {
    setScore(snap.score);
    setWickets(snap.wickets);
    setBalls(snap.balls);
    setOvers(snap.overs);
    setCurrentOver([...snap.currentOver]);
    setCompleteHistory([...snap.completeHistory]);
  };

  /* ================= END MATCH ================= */
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

      // 🧠 FORCE parent to capture BEFORE reset
      setInningsChangeEvent({ matchEnd: true });
    }

    setMatchOver(true);
    setWinner(winningTeam);
  };

  const [inningsChangeEvent, setInningsChangeEvent] = useState(null);

  /* ================= END INNINGS ================= */
  const endInnings = () => {
    if (innings === 1) {
      const newTarget = score + 1;

      // ✅ SAVE INNINGS 1 FINAL SCORE
      setInnings1Score({ score, wickets, overs, balls });

      setTarget(newTarget);
      setInnings(2);
      setScore(0);
      setWickets(0);
      setBalls(0);
      setOvers(0);
      setCurrentOver([]);
      setCompleteHistory([]);
      setIsFreeHit(false);

      setInningsChangeEvent({ target: newTarget });
    }
  };

  /* ================= MATCH STATUS ================= */
  const checkMatchStatus = (newScore, nextWickets, nextBalls, nextOvers) => {
    const ballsBowled = nextOvers * 6 + nextBalls;
  
    console.log("🔍 Check Match Status:", {
      innings,
      nextWickets,
      maxWickets,
      newScore,
      target,
      ballsBowled,
      totalBalls
    });
  
    // ✅ Check if team 2 reached target
    
  if (innings === 2 && newScore >= target) {
    console.log("🏆 Team 2 wins by reaching target");
    endMatch(secondBattingTeam, newScore, nextWickets, nextOvers, nextBalls);
    return "MATCH_OVER";
  }

  // 🔴 FIX: Simply check if wickets reached/exceeded maxWickets
  const isLastWicket = nextWickets >= maxWickets;

  if (isLastWicket) {
    console.log("🏏 All out - ending innings/match");
    
    if (innings === 2) {
      endMatch(firstBattingTeam, newScore, nextWickets, nextOvers, nextBalls);
    } else {
      endInnings();
    }

    return "MATCH_OVER";
  }

  if (ballsBowled >= totalBalls) {
    console.log("⏱️ Overs completed");
    
    if (innings === 2) {
      endMatch(firstBattingTeam, newScore, nextWickets, nextOvers, nextBalls);
    } else {
      endInnings();
    }
    
    return "MATCH_OVER";
  }

  return "CONTINUE";
};

  /* ================= MASTER ENGINE ================= */
  useEffect(() => {
    if (matchOver) return;
  
    const ballsBowled = overs * 6 + balls;
    
    console.log(`🔍 Match Engine Check - Innings: ${innings}, Wickets: ${wickets}/${maxWickets}, Balls: ${ballsBowled}/${totalBalls}`);
  
    // Priority 1: Team 2 reached target
    if (innings === 2 && score >= target) {
      console.log("🏆 Team 2 wins - target reached");
      endMatch(secondBattingTeam, score, wickets, overs, balls);
      return;
    }
  
    // 🔴 KEY FIX: Handle mid-innings team size reduction
    // When team size is reduced, wickets can EXCEED maxWickets
    // Only allow last man batting if wickets === maxWickets AND lastManBatting is enabled
    // If wickets > maxWickets (team size was reduced), ALWAYS end innings
    const shouldEndForWickets = wickets >= maxWickets && (!lastManBatting || wickets > maxWickets);
    
    if (shouldEndForWickets) {
      console.log(`🏏 Innings ending - wickets (${wickets}) >= maxWickets (${maxWickets})`);
      if (innings === 2) {
        console.log("🏆 Team 1 wins - all wickets down");
        endMatch(firstBattingTeam, score, wickets, overs, balls);
      } else {
        console.log("🔄 Innings 1 complete - all wickets down");
        endInnings();
      }
      return;
    }
  
    // Priority 3: Overs completed
    if (ballsBowled >= totalBalls) {
      console.log("⏱️ Overs completed");
      if (innings === 2) {
        console.log("🏆 Team 1 wins - overs complete");
        endMatch(firstBattingTeam, score, wickets, overs, balls);
      } else {
        console.log("🔄 Innings 1 complete - overs complete");
        endInnings();
      }
      return;
    }
  
  }, [overs, balls, wickets, score, maxWickets, innings, matchOver, target, lastManBatting]);
  

  /* ================= RUN ================= */
  const handleRun = (runs) => {
    if (matchOver) return;
    if (isFreeHit) setIsFreeHit(false);
  
    const newScore = score + runs;
    setScore(newScore);
  
    let nextBalls = balls + 1;
    let nextOvers = overs;
  
    const isLastManMode = lastManBatting && wickets >= maxWickets - 1;
  
    // 🟢 Normal strike rule (only if NOT last man)
    if (!isLastManMode && runs % 2 === 1) {
      swapStrike();
    }
  
    setCurrentOver(prev => [...prev, { runs }]);
    setCompleteHistory(prev => [
      ...prev,
      { event: "RUN", runs, over: overs, ball: balls }
    ]);
  
    // 🟢 Over complete
    if (nextBalls === 6) {
      nextOvers++;
      nextBalls = 0;
  
      // Swap strike only if NOT last man
      if (!isLastManMode) swapStrike();
  
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
  

  /* ================= WICKET ================= */
  const handleWicket = () => {
    if (matchOver) return;

    if (isFreeHit) {
      setCurrentOver((prev) => [...prev, { type: "FH" }]);
      setCompleteHistory((prev) => [
        ...prev,
        { event: "FREE_HIT", over: overs, ball: balls },
      ]);

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

    setCurrentOver((prev) => [...prev, { type: "W" }]);
    setCompleteHistory((prev) => [
      ...prev,
      { event: "WICKET", over: overs, ball: balls },
    ]);

    setWicketEvent({ out: true });

    const nextWickets = wickets + 1;
    let nextBalls = balls + 1;
    let nextOvers = overs;

    if (nextBalls === 6) {
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

    setBalls(nextBalls);
    setOvers(nextOvers);
    setWickets(nextWickets);

    checkMatchStatus(score, nextWickets, nextBalls, nextOvers);
  };

  

  /* ================= WIDE ================= */
  const handleWide = () => {
    if (!rules.wide || matchOver) return;
    setScore((prev) => prev + 1);
    setCurrentOver((prev) => [...prev, { type: "WD" }]);
    setCompleteHistory((prev) => [
      ...prev,
      { event: "WD", over: overs, ball: balls },
    ]);
  };

  /* ================= NO BALL ================= */
  const handleNoBall = () => {
    if (!rules.noBall || matchOver) return;
    setScore((prev) => prev + 1);
    setIsFreeHit(true);
    setCurrentOver((prev) => [...prev, { type: "NB" }]);
    setCompleteHistory((prev) => [
      ...prev,
      { event: "NB", over: overs, ball: balls },
    ]);
  };

  /* ================= BYE ================= */
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
    setCompleteHistory((prev) => [
      ...prev,
      { event: "BYE", runs, over: overs, ball: balls },
    ]);
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
    innings1Score, // ✅ EXPORT
    innings2Score, // ✅ EXPORT
  };
}