import { useState, useEffect, useRef } from "react";

/**
 * Custom hook to manage undo/redo functionality via history snapshots.
 *
 * CHANGES vs original:
 * - Added `retiredPlayers` param (was passed from ScoringPage but missing from signature)
 * - Added `innings` param (critical: stored in every snapshot so ScoringPage can
 *   track innings2SnapshotCount reliably)
 * - Fixed initial snapshot: allPlayers was hardcoded to [], now uses actual allPlayers
 * - Added `innings` and `retiredPlayers` to the auto-save snapshot and dep array
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
  outBatsman,
  retiredPlayers, // ✅ ADDED: was passed from ScoringPage but missing from signature
  innings,        // ✅ ADDED: critical for innings2SnapshotCount guard in ScoringPage
) {
  const [historyStack, setHistoryStack] = useState([]);
  const shouldSaveSnapshot = useRef(false);

  /* ================= INITIAL SNAPSHOT ================= */
  useEffect(() => {
    if (!showStartModal && historyStack.length === 0 && players.length > 0) {
      const initialSnapshot = {
        score: 0,
        wickets: 0,
        balls: 0,
        overs: 0,
        innings: innings ?? 1,                              // ✅ FIXED: was missing
        currentOver: [],
        completeHistory: [],
        players: JSON.parse(JSON.stringify(players)),
        allPlayers: JSON.parse(JSON.stringify(allPlayers)), // ✅ FIXED: was hardcoded []
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
        retiredPlayers: [],                                 // ✅ ADDED
      };

      setHistoryStack([initialSnapshot]);
    }
  }, [showStartModal, players, bowlers]);

  /* ================= AUTO-SAVE SNAPSHOT ================= */
  useEffect(() => {
    if (shouldSaveSnapshot.current && !showStartModal) {
      const snapshot = {
        score,
        wickets,
        balls,
        overs,
        innings: innings ?? 1,                                          // ✅ ADDED
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
        retiredPlayers: JSON.parse(JSON.stringify(retiredPlayers ?? [])), // ✅ ADDED
      };

      setHistoryStack((prev) => [...prev, snapshot]);
      shouldSaveSnapshot.current = false;
    }
  }, [
    score,
    wickets,
    balls,
    overs,
    innings,            // ✅ ADDED
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
    retiredPlayers,     // ✅ ADDED
  ]);

  /* ================= API ================= */

  /** Read the last snapshot without removing it */
  const getLastSnapshot = () => {
    if (historyStack.length === 0) return null;
    return historyStack[historyStack.length - 1];
  };

  /** Remove the last snapshot from the stack */
  const popSnapshot = () => {
    setHistoryStack((prev) => prev.slice(0, -1));
  };

  /** Signal that a snapshot should be saved on the next state-change effect */
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