import { useState, useEffect } from "react";

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
  const [overCompleteEvent, setOverCompleteEvent] = useState(null); // ✅ NEW

  const maxWickets =
    innings === 1
      ? Number(matchData.teamAPlayers || 11) - 1
      : Number(matchData.teamBPlayers || 11) - 1;

  /* ================= RESTORE STATE (UNDO) ================= */
  const restoreState = (snap) => {
    setScore(snap.score);
    setWickets(snap.wickets);
    setBalls(snap.balls);
    setOvers(snap.overs);
    setCurrentOver([...snap.currentOver]);
  };

  /* ================= END MATCH ================= */
  const endMatch = (winningTeam) => {
    setMatchOver(true);
    setWinner(winningTeam);
  };

  /* ================= END INNINGS ================= */
  const endInnings = () => {
    if (innings === 1) {
      setTarget(score + 1);
      setInnings(2);
      setScore(0);
      setWickets(0);
      setBalls(0);
      setOvers(0);
      setCurrentOver([]);
      setCompleteHistory([]);
      setIsFreeHit(false);
    }
  };

  /* ================= MATCH STATUS ================= */
  const checkMatchStatus = (newScore, nextWickets, nextBalls, nextOvers) => {
    const ballsBowled = nextOvers * 6 + nextBalls;

    if (innings === 2 && newScore >= target) {
      endMatch(secondBattingTeam);
      return true;
    }

    if (nextWickets >= maxWickets) {
      innings === 2 ? endMatch(firstBattingTeam) : endInnings();
      return true;
    }

    if (ballsBowled >= totalBalls) {
      innings === 2 ? endMatch(firstBattingTeam) : endInnings();
      return true;
    }

    return false;
  };

  /* ================= MASTER ENGINE ================= */
  useEffect(() => {
    if (matchOver) return;

    const ballsBowled = overs * 6 + balls;

    if (innings === 2 && score >= target) endMatch(secondBattingTeam);
    if (innings === 2 && (wickets >= maxWickets || ballsBowled >= totalBalls))
      endMatch(firstBattingTeam);
    if (innings === 1 && (wickets >= maxWickets || ballsBowled >= totalBalls))
      endInnings();
  }, [overs, balls, wickets, score]);

  /* ================= RUN ================= */
  const handleRun = (runs) => {
    if (matchOver) return;
    if (isFreeHit) setIsFreeHit(false);

    const newScore = score + runs;
    setScore(newScore);

    let nextBalls = balls + 1;
    let nextOvers = overs;

    if (runs % 2 === 1) swapStrike();

    setCurrentOver(prev => [...prev, { runs }]);
    setCompleteHistory(prev => [...prev, { event: "RUN", runs, over: overs, ball: balls }]);

    if (nextBalls === 6) {
      nextOvers++;
      nextBalls = 0;
      swapStrike();
      setCurrentOver([]);
      
      // ✅ CHECK: Should we ask for new bowler?
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
      setCurrentOver(prev => [...prev, { type: "FH" }]);
      setCompleteHistory(prev => [...prev, { event: "FREE_HIT", over: overs, ball: balls }]);
  
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
  
    // ✅ LOG WICKET FIRST with current over/ball (BEFORE any updates)
    setCurrentOver(prev => [...prev, { type: "W" }]);
    setCompleteHistory(prev => [...prev, { event: "WICKET", over: overs, ball: balls }]);
    
    setWicketEvent({ out: true });
  
    // ✅ THEN calculate next values
    const nextWickets = wickets + 1;
    let nextBalls = balls + 1;
    let nextOvers = overs;
  
    if (nextBalls === 6) {
      nextOvers++;
      nextBalls = 0;
      swapStrike();
      setCurrentOver([]);
      
      const ballsBowled = nextOvers * 6;
      const isMatchStillOn = !checkMatchStatus(score, nextWickets, nextBalls, nextOvers);
      if (ballsBowled < totalBalls && nextWickets < maxWickets && isMatchStillOn) {
        setOverCompleteEvent({ overNumber: nextOvers });
      }
    }
  
    // ✅ Update state
    setBalls(nextBalls);
    setOvers(nextOvers);
    setWickets(nextWickets);
  
    checkMatchStatus(score, nextWickets, nextBalls, nextOvers);
  };
  /* ================= WIDE ================= */
  const handleWide = () => {
    if (!rules.wide || matchOver) return;
    setScore(prev => prev + 1);
    setCurrentOver(prev => [...prev, { type: "WD" }]);
    setCompleteHistory(prev => [...prev, { event: "WD", over: overs, ball: balls }]);
  };

  /* ================= NO BALL ================= */
  const handleNoBall = () => {
    if (!rules.noBall || matchOver) return;
    setScore(prev => prev + 1);
    setIsFreeHit(true);
    setCurrentOver(prev => [...prev, { type: "NB" }]);
    setCompleteHistory(prev => [...prev, { event: "NB", over: overs, ball: balls }]);
  };

  /* ================= BYE ================= */
  const handleBye = (runs = 1) => {
    if (!rules.byes || matchOver) return;

    setScore(prev => prev + runs);

    let nextBalls = balls + 1;
    let nextOvers = overs;

    if (runs % 2 === 1) swapStrike();

    if (nextBalls === 6) {
      nextOvers++;
      nextBalls = 0;
      swapStrike();
      setCurrentOver([]);
      
      // ✅ Check for new bowler
      const ballsBowled = nextOvers * 6;
      if (ballsBowled < totalBalls && wickets < maxWickets) {
        setOverCompleteEvent({ overNumber: nextOvers });
      }
    }

    setBalls(nextBalls);
    setOvers(nextOvers);

    setCurrentOver(prev => [...prev, { type: "BYE", runs }]);
    setCompleteHistory(prev => [...prev, { event: "BYE", runs, over: overs, ball: balls }]);
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
    overCompleteEvent,      // ✅ NEW
    setOverCompleteEvent,   // ✅ NEW
  };
}