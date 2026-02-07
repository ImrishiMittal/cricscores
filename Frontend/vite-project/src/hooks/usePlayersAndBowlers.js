import { useState } from "react";

export default function usePlayersAndBowlers() {
  /* ================= PLAYERS ================= */
  const [players, setPlayers] = useState([]);
  const [strikerIndex, setStrikerIndex] = useState(0);
  const [nonStrikerIndex, setNonStrikerIndex] = useState(1);
  const [isWicketPending, setIsWicketPending] = useState(false);
  const [outBatsman, setOutBatsman] = useState(null);

  /* ================= BOWLERS ================= */
  const [bowlers, setBowlers] = useState([]);
  const [currentBowlerIndex, setCurrentBowlerIndex] = useState(0);
  const [isNewBowlerPending, setIsNewBowlerPending] = useState(false);

  /* ================= START INNINGS ================= */
  const startInnings = (strikerName, nonStrikerName, bowlerName) => {
    setPlayers([
      { name: strikerName, runs: 0, balls: 0 },
      { name: nonStrikerName, runs: 0, balls: 0 },
    ]);

    setBowlers([{ name: bowlerName, overs: 0, balls: 0, runs: 0, wickets: 0 }]);
    setStrikerIndex(0);
    setNonStrikerIndex(1);
  };

  /* ================= SWAP STRIKE ================= */
  const swapStrike = () => {
    setStrikerIndex((prev) => {
      setNonStrikerIndex(prev);
      return prev === 0 ? 1 : 0;
    });
  };

  /* ================= UPDATE BATSMAN RUN ================= */
  const addRunsToStriker = (runs) => {
    setPlayers((prev) => {
      const updated = [...prev];
      updated[strikerIndex].runs += runs;
      updated[strikerIndex].balls += 1;
      return updated;
    });
  };

  /* ================= WICKET FLOW ================= */
  const registerWicket = () => {
    setOutBatsman(strikerIndex);
    setIsWicketPending(true);
  };

  const confirmNewBatsman = (name) => {
    setPlayers((prev) => {
      const updated = [...prev];
      updated[outBatsman] = { name, runs: 0, balls: 0 };
      return updated;
    });

    setIsWicketPending(false);
  };

  /* ================= NEW BOWLER FLOW ================= */
  const requestNewBowler = () => setIsNewBowlerPending(true);

  const confirmNewBowler = (name) => {
    setBowlers((prev) => [
      ...prev,
      { name, overs: 0, balls: 0, runs: 0, wickets: 0 },
    ]);

    setCurrentBowlerIndex((prev) => prev + 1);
    setIsNewBowlerPending(false);
  };

  /* ================= RESTORE (FOR UNDO) ================= */
  const restorePlayersState = (snap) => {
    setPlayers(JSON.parse(JSON.stringify(snap.players)));
    setStrikerIndex(snap.strikerIndex);
    setNonStrikerIndex(snap.nonStrikerIndex);
    setIsWicketPending(snap.isWicketPending || false);
  };

  const restoreBowlersState = (snap) => {
    setBowlers(JSON.parse(JSON.stringify(snap.bowlers)));
    setCurrentBowlerIndex(snap.currentBowlerIndex);
  };

  return {
    players,
    strikerIndex,
    nonStrikerIndex,
    bowlers,
    currentBowlerIndex,
    isWicketPending,
    isNewBowlerPending,
    outBatsman,
    setOutBatsman,
    setIsWicketPending,
    startInnings,
    swapStrike,
    addRunsToStriker,
    registerWicket,
    confirmNewBatsman,
    requestNewBowler,
    confirmNewBowler,
    restorePlayersState,
    restoreBowlersState,
  };
}