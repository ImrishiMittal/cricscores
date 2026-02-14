import { useState, useEffect, useRef } from "react";

/**
 * Custom hook to manage undo/redo functionality via history snapshots
 */
function useHistorySnapshot(
  showStartModal,
  players,
  allPlayers,
  bowlers,
  score,
  wickets,
  balls,
  overs,
  currentOver,
  completeHistory,
  strikerIndex,
  nonStrikerIndex,
  partnershipRuns,
  partnershipBalls,
  striker1Contribution,
  striker2Contribution,
  currentBowlerIndex,
  partnershipHistory,
  isWicketPending,
  outBatsman
) {
  const [historyStack, setHistoryStack] = useState([]);
  const shouldSaveSnapshot = useRef(false);

  /**
   * Effect: Save initial state
   */
  useEffect(() => {
    if (!showStartModal && historyStack.length === 0 && players.length > 0) {
      const initialSnapshot = {
        score: 0,
        wickets: 0,
        balls: 0,
        overs: 0,
        currentOver: [],
        completeHistory: [],
        players: JSON.parse(JSON.stringify(players)),
        allPlayers: [],
        strikerIndex: 0,
        nonStrikerIndex: 1,
        partnershipRuns: 0,
        partnershipBalls: 0,
        striker1Contribution: 0,
        striker2Contribution: 0,
        bowlers: JSON.parse(JSON.stringify(bowlers)),
        currentBowlerIndex: 0,
        partnershipHistory: [],
        isWicketPending: false,
        outBatsman: null,
      };

      setHistoryStack([initialSnapshot]);
    }
  }, [showStartModal, players, bowlers]);

  /**
   * Effect: Auto-save snapshot after state updates
   */
  useEffect(() => {
    if (shouldSaveSnapshot.current && !showStartModal) {
      const snapshot = {
        score,
        wickets,
        balls,
        overs,
        currentOver: [...currentOver],
        completeHistory: [...completeHistory],
        players: JSON.parse(JSON.stringify(players)),
        allPlayers: JSON.parse(JSON.stringify(allPlayers)),
        strikerIndex,
        nonStrikerIndex,
        isWicketPending,
        outBatsman,
        partnershipRuns,
        partnershipBalls,
        striker1Contribution,
        striker2Contribution,
        bowlers: JSON.parse(JSON.stringify(bowlers)),
        currentBowlerIndex,
        partnershipHistory: JSON.parse(JSON.stringify(partnershipHistory)),
      };

      setHistoryStack((prev) => [...prev, snapshot]);
      shouldSaveSnapshot.current = false;
    }
  }, [
    score,
    wickets,
    balls,
    overs,
    players,
    strikerIndex,
    nonStrikerIndex,
    partnershipRuns,
    partnershipBalls,
    striker1Contribution,
    striker2Contribution,
    bowlers,
    currentBowlerIndex,
    isWicketPending,
    outBatsman,
  ]);

  /**
   * Get the last snapshot from history
   */
  const getLastSnapshot = () => {
    if (historyStack.length === 0) return null;
    return historyStack[historyStack.length - 1];
  };

  /**
   * Remove the last snapshot from history
   */
  const popSnapshot = () => {
    setHistoryStack((prev) => prev.slice(0, -1));
  };

  /**
   * Trigger a snapshot save
   */
  const triggerSnapshot = () => {
    shouldSaveSnapshot.current = true;
  };

  return {
    historyStack,
    getLastSnapshot,
    popSnapshot,
    triggerSnapshot,
    shouldSaveSnapshot,
  };
}

export default useHistorySnapshot;