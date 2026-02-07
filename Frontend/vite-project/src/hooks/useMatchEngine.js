import { useState, useEffect } from "react";

export default function useMatchEngine(
  matchData,
  swapStrike
) {
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

  // ❌ DELETE THIS ENTIRE useEffect BLOCK - IT'S CAUSING THE ERROR
  // useEffect(() => {
  //   if (wicketEvent) {
  //     setOutBatsman(wicketEvent.outIndex);
  //     setIsWicketPending(true);
  //   }
  // }, [wicketEvent]);

  /* ================= RUN ================= */
  const handleRun = (runs) => {
    if (matchOver) return;
    if (isFreeHit) setIsFreeHit(false);

    const newScore = score + runs;
    setScore(newScore);

    let nextBalls = balls + 1;
    let nextOvers = overs;

    if (runs % 2 === 1) swapStrike();

    setCurrentOver((prev) => [...prev, { runs }]);
    setCompleteHistory((prev) => [...prev, { runs }]);

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

    // 🟡 FREE HIT → NOT OUT
    if (isFreeHit) {
      setCurrentOver((prev) => [...prev, { type: "FH" }]);      // ✅ Changed from FH-W
      setCompleteHistory((prev) => [...prev, { type: "FH" }]);  // ✅ Changed from FH-W

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
      return; // 🚫 No wicket event
    }

    // 🔴 REAL WICKET
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

    setCurrentOver((prev) => [...prev, { type: "W" }]);
    setCompleteHistory((prev) => [...prev, { type: "W" }]);

    // 🚨 ENGINE TELLS UI A WICKET HAPPENED
    setWicketEvent({ out: true });

    checkMatchStatus(score, nextWickets, nextBalls, nextOvers);
  };

  /* ================= WIDE ================= */
  const handleWide = () => {
    if (!rules.wide || matchOver) return;
    setScore((prev) => prev + 1);
    setCurrentOver((prev) => [...prev, { type: "WD" }]);
    setCompleteHistory((prev) => [...prev, { type: "WD" }]);
  };

  /* ================= NO BALL ================= */
  const handleNoBall = () => {
    if (!rules.noBall || matchOver) return;
    setScore((prev) => prev + 1);
    setIsFreeHit(true);
    setCurrentOver((prev) => [...prev, { type: "NB" }]);
    setCompleteHistory((prev) => [...prev, { type: "NB" }]);
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
    }

    setBalls(nextBalls);
    setOvers(nextOvers);

    setCurrentOver((prev) => [...prev, { type: "BYE", runs }]);
    setCompleteHistory((prev) => [...prev, { type: "BYE", runs }]);
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
  };
}