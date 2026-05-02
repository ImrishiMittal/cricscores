// useHistorySnapshot.js
// Add pendingStatsRef as a new parameter to the hook
export const STORAGE_KEY = "cricket_match_snapshot";
import { useState, useEffect, useRef } from "react";

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
  retiredPlayers,
  innings,
  extras,
  getPendingStatsSnapshot,
  getDismissedSnapshot,
  getAllTimeDismissedSnapshot,
) {
  const [historyStack, setHistoryStack] = useState([]);
  const shouldSaveSnapshot = useRef(false);

  useEffect(() => {
    if (historyStack.length === 0) return;
    const latest = historyStack[historyStack.length - 1];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(latest));
    } catch (e) {
      console.warn("localStorage save failed:", e);
    }
  }, [historyStack]);

  useEffect(() => {
    if (!showStartModal && historyStack.length === 0 && players.length > 0) {
      const initialSnapshot = {
        score: 0, wickets: 0, balls: 0, overs: 0,
        innings: innings ?? 1,
        currentOver: [],
        completeHistory: [],
        players: JSON.parse(JSON.stringify(players)),
        allPlayers: JSON.parse(JSON.stringify(allPlayers)),
        strikerIndex: 0, nonStrikerIndex: 1,
        partnershipRuns: 0, partnershipBalls: 0,
        striker1Contribution: 0, striker2Contribution: 0,
        bowlers: JSON.parse(JSON.stringify(bowlers)),
        currentBowlerIndex: 0,
        partnershipHistory: [],
        isWicketPending: false,
        outBatsman: null,
        retiredPlayers: [],
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
        pendingStats: {},         // ✅ NEW
        dismissedPlayerIds: [],   // ✅ NEW
        allTimeDismissedIds: [],  // ✅ NEW
      };
      setHistoryStack([initialSnapshot]);
    }
  }, [showStartModal, players, bowlers]);

  useEffect(() => {
    if (shouldSaveSnapshot.current && !showStartModal) {
      // ✅ Capture DB buffer and dismissed sets at snapshot time
      const pendingStats = getPendingStatsSnapshot
        ? getPendingStatsSnapshot()
        : {};

      const snapshot = {
        score, wickets, balls, overs,
        innings: innings ?? 1,
        currentOver: [...currentOver],
        completeHistory: [...completeHistory],
        players: JSON.parse(JSON.stringify(players)),
        allPlayers: JSON.parse(JSON.stringify(allPlayers)),
        strikerIndex, nonStrikerIndex,
        isWicketPending, outBatsman,
        partnershipRuns, partnershipBalls,
        striker1Contribution, striker2Contribution,
        bowlers: JSON.parse(JSON.stringify(bowlers)),
        currentBowlerIndex,
        partnershipHistory: JSON.parse(JSON.stringify(partnershipHistory)),
        retiredPlayers: JSON.parse(JSON.stringify(retiredPlayers ?? [])),
        extras: extras ? { ...extras } : { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
        pendingStats: getPendingStatsSnapshot ? getPendingStatsSnapshot() : {},
    dismissedPlayerIds: getDismissedSnapshot ? [...getDismissedSnapshot()] : [],
    allTimeDismissedIds: getAllTimeDismissedSnapshot ? [...getAllTimeDismissedSnapshot()] : [],
  };

      setHistoryStack((prev) => [...prev, snapshot]);
      shouldSaveSnapshot.current = false;
    }
  }, [
    score, wickets, balls, overs, innings, players,
    strikerIndex, nonStrikerIndex, partnershipRuns, partnershipBalls,
    striker1Contribution, striker2Contribution, bowlers, currentBowlerIndex,
    isWicketPending, outBatsman, retiredPlayers, extras,
  ]);

  const getLastSnapshot = () =>
    historyStack.length === 0 ? null : historyStack[historyStack.length - 1];

  const popSnapshot = () =>
    setHistoryStack((prev) => prev.slice(0, -1));

  const triggerSnapshot = () => {
    shouldSaveSnapshot.current = true;
  };

  return {
    historyStack,
    getLastSnapshot,
    popSnapshot,
    triggerSnapshot,
    shouldSaveSnapshot,
    clearSavedMatch: () => localStorage.removeItem(STORAGE_KEY),
  };
}

export default useHistorySnapshot;