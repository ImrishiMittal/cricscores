import { useState } from "react";

export default function usePartnerships() {
  const [partnershipRuns, setPartnershipRuns] = useState(0);
  const [partnershipBalls, setPartnershipBalls] = useState(0);

  const [striker1Contribution, setStriker1Contribution] = useState(0);
  const [striker2Contribution, setStriker2Contribution] = useState(0);

  // ✅ Now stores { playerId, displayName } objects instead of plain name strings
  const [currentPartnershipBatsmen, setCurrentPartnershipBatsmen] = useState([]);

  const [partnershipHistory, setPartnershipHistory] = useState([]);
  const [showPartnershipHistory, setShowPartnershipHistory] = useState(false);

  /* ================= START NEW PARTNERSHIP ================= */
  // ✅ b1 and b2 are now { playerId, displayName } objects
  const startPartnership = (b1, b2) => {
    setCurrentPartnershipBatsmen([b1, b2]);
    setPartnershipRuns(0);
    setPartnershipBalls(0);
    setStriker1Contribution(0);
    setStriker2Contribution(0);
  };

  /* ================= ADD RUN ================= */
  // ✅ Compare by playerId — rename-safe
  const addRunsToPartnership = (runs, strikerId) => {
    setPartnershipRuns((p) => p + runs);
    setPartnershipBalls((p) => p + 1);

    if (strikerId === currentPartnershipBatsmen[0]?.playerId) {
      setStriker1Contribution((prev) => prev + runs);
    } else {
      setStriker2Contribution((prev) => prev + runs);
    }
  };

  /* ================= ADD EXTRA (no batsman run) ================= */
  const addExtraToPartnership = (runs = 1) => {
    setPartnershipRuns((p) => p + runs);
  };

  /* ================= ADD BALL (bye/legbye/dot) ================= */
  const addBallToPartnership = () => {
    setPartnershipBalls((p) => p + 1);
  };

  /* ================= SAVE PARTNERSHIP ================= */
  const savePartnership = (score, wicketNumber) => {
    const data = {
      // ✅ Store both playerId (stable) and displayName (for rendering)
      batsman1: currentPartnershipBatsmen[0]?.displayName ?? "",
      batsman1Id: currentPartnershipBatsmen[0]?.playerId ?? "",
      batsman1Runs: striker1Contribution,
      batsman2: currentPartnershipBatsmen[1]?.displayName ?? "",
      batsman2Id: currentPartnershipBatsmen[1]?.playerId ?? "",
      batsman2Runs: striker2Contribution,
      totalRuns: partnershipRuns,
      totalBalls: partnershipBalls,
      scoreWhenBroke: score,
      wicketNumber,
    };

    setPartnershipHistory((prev) => [...prev, data]);
  };

  /* ================= RESET AFTER WICKET ================= */
  const resetPartnership = () => {
    setPartnershipRuns(0);
    setPartnershipBalls(0);
    setStriker1Contribution(0);
    setStriker2Contribution(0);
  };

  /* ================= RESTORE (FOR UNDO) ================= */
  const restorePartnershipState = (snap) => {
    setPartnershipRuns(snap.partnershipRuns);
    setPartnershipBalls(snap.partnershipBalls);
    setStriker1Contribution(snap.striker1Contribution);
    setStriker2Contribution(snap.striker2Contribution);
    setPartnershipHistory(JSON.parse(JSON.stringify(snap.partnershipHistory || [])));
  };

  return {
    partnershipRuns,
    partnershipBalls,
    partnershipHistory,
    showPartnershipHistory,
    setShowPartnershipHistory,
    striker1Contribution,
    striker2Contribution,
    startPartnership,
    addRunsToPartnership,
    addExtraToPartnership,
    addBallToPartnership,
    savePartnership,
    resetPartnership,
    restorePartnershipState,
  };
}