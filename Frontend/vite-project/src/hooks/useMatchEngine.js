import { useState, useEffect } from "react";

export default function useMatchEngine(matchData, swapStrike, strikerIndex) {
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
    setCurrentOver(snap.currentOver);
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
      setIsFreeHit(false);
    }
  };

  /* ================= MATCH STATUS ================= */
  const checkMatchStatus = (newScore, nextWickets, nextBalls, nextOvers) => {
    const ballsBowled = nextOvers * 6 + nextBalls;

    if (innings === 2 && newScore >= target) return endMatch(secondBattingTeam);
    if (nextWickets >= maxWickets)
      return innings === 2 ? endMatch(firstBattingTeam) : endInnings();
    if (ballsBowled >= totalBalls)
      return innings === 2 ? endMatch(firstBattingTeam) : endInnings();
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
    setCompleteHistory(prev => [...prev, { event: "RUN", runs }]);

    if (nextBalls === 6) {
      nextOvers++;
      nextBalls = 0;
      swapStrike();
      setCurrentOver([]);
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
      setCompleteHistory(prev => [...prev, { event: "FREE_HIT" }]);

      let nextBalls = balls + 1;
      let nextOvers = overs;

      if (nextBalls === 6) {
        nextOvers++;
        nextBalls = 0;
        swapStrike();
      }

      setBalls(nextBalls);
      setOvers(nextOvers);
      setIsFreeHit(false);
      return;
    }

    setCompleteHistory(prev => [...prev, { event: "WICKET" }]);

    const nextWickets = wickets + 1;
    let nextBalls = balls + 1;
    let nextOvers = overs;

    if (nextBalls === 6) {
      nextOvers++;
      nextBalls = 0;
      swapStrike();
    }

    setBalls(nextBalls);
    setOvers(nextOvers);
    setWickets(nextWickets);

    setCurrentOver(prev => [...prev, { type: "W" }]);
    setWicketEvent({ out: true });

    checkMatchStatus(score, nextWickets, nextBalls, nextOvers);
  };

  /* ================= WIDE ================= */
  const handleWide = () => {
    if (!rules.wide || matchOver) return;
    setScore(prev => prev + 1);
    setCurrentOver(prev => [...prev, { type: "WD" }]);
    setCompleteHistory(prev => [...prev, { event: "WD" }]);
  };

  /* ================= NO BALL ================= */
  const handleNoBall = () => {
    if (!rules.noBall || matchOver) return;
    setScore(prev => prev + 1);
    setIsFreeHit(true);
    setCurrentOver(prev => [...prev, { type: "NB" }]);
    setCompleteHistory(prev => [...prev, { event: "NB" }]);
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
    }

    setBalls(nextBalls);
    setOvers(nextOvers);

    setCurrentOver(prev => [...prev, { type: "BYE", runs }]);
    setCompleteHistory(prev => [...prev, { event: "BYE", runs }]);
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
    restoreState, // ⭐ REQUIRED FOR UNDO
  };
}
