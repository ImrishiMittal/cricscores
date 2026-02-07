import { useState } from "react";

export default function usePartnerships() {
  const [partnershipRuns, setPartnershipRuns] = useState(0);
  const [partnershipBalls, setPartnershipBalls] = useState(0);

  const [striker1Contribution, setStriker1Contribution] = useState(0);
  const [striker2Contribution, setStriker2Contribution] = useState(0);
  const [currentPartnershipBatsmen, setCurrentPartnershipBatsmen] = useState([]);

  const [partnershipHistory, setPartnershipHistory] = useState([]);
  const [showPartnershipHistory, setShowPartnershipHistory] = useState(false);

  /* ================= START NEW PARTNERSHIP ================= */
  const startPartnership = (b1, b2) => {
    setCurrentPartnershipBatsmen([b1, b2]);
    setPartnershipRuns(0);
    setPartnershipBalls(0);
    setStriker1Contribution(0);
    setStriker2Contribution(0);
  };

  /* ================= ADD RUN ================= */
  const addRunsToPartnership = (runs, strikerName) => {
    setPartnershipRuns((p) => p + runs);
    setPartnershipBalls((p) => p + 1);

    if (strikerName === currentPartnershipBatsmen[0]) {
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
    if (partnershipBalls === 0) return;

    const data = {
      batsman1: currentPartnershipBatsmen[0],
      batsman1Runs: striker1Contribution,
      batsman2: currentPartnershipBatsmen[1],
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

  return {
    partnershipRuns,
    partnershipBalls,
    partnershipHistory,
    showPartnershipHistory,
    setShowPartnershipHistory,
    startPartnership,
    addRunsToPartnership,
    addExtraToPartnership,
    addBallToPartnership,
    savePartnership,
    resetPartnership,
  };
}
