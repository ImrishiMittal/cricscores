import { useState, useRef } from "react";

export default function usePartnerships() {
  const [partnershipRuns, setPartnershipRuns] = useState(0);
  const [partnershipBalls, setPartnershipBalls] = useState(0);
  const [striker1Contribution, setStriker1Contribution] = useState(0);
  const [striker2Contribution, setStriker2Contribution] = useState(0);
  const [currentPartnershipBatsmen, setCurrentPartnershipBatsmen] = useState([]);
  const [partnershipHistory, setPartnershipHistory] = useState([]);
  const [showPartnershipHistory, setShowPartnershipHistory] = useState(false);

  // ✅ Ref mirrors the state — always has the latest value in closures
  const currentBatsmenRef = useRef([]);
  const striker1Ref = useRef(0);
  const striker2Ref = useRef(0);
  const runsRef = useRef(0);
  const ballsRef = useRef(0);

  const startPartnership = (b1, b2) => {
    currentBatsmenRef.current = [b1, b2];
    setCurrentPartnershipBatsmen([b1, b2]);
    runsRef.current = 0;
    ballsRef.current = 0;
    striker1Ref.current = 0;
    striker2Ref.current = 0;
    setPartnershipRuns(0);
    setPartnershipBalls(0);
    setStriker1Contribution(0);
    setStriker2Contribution(0);
  };

  const addRunsToPartnership = (runs, strikerId) => {
    runsRef.current += runs;
    ballsRef.current += 1;
    setPartnershipRuns((p) => p + runs);
    setPartnershipBalls((p) => p + 1);

    if (strikerId === currentBatsmenRef.current[0]?.playerId) {
      striker1Ref.current += runs;
      setStriker1Contribution((prev) => prev + runs);
    } else {
      striker2Ref.current += runs;
      setStriker2Contribution((prev) => prev + runs);
    }
  };

  const addExtraToPartnership = (runs = 1) => {
    runsRef.current += runs;
    setPartnershipRuns((p) => p + runs);
  };

  const addBallToPartnership = () => {
    ballsRef.current += 1;
    setPartnershipBalls((p) => p + 1);
  };

  // ✅ Reads from refs — always fresh, no stale closure issue
  const savePartnership = (currentScore, currentWickets) => {
    const name1 = currentBatsmenRef.current[0]?.displayName
      || currentBatsmenRef.current[0]?.name
      || "";
    const name2 = currentBatsmenRef.current[1]?.displayName
      || currentBatsmenRef.current[1]?.name
      || "";

    const entry = {
      batsman1: name1,
      batsman2: name2,
      batsman1Runs: striker1Ref.current,
      batsman2Runs: striker2Ref.current,
      totalRuns: runsRef.current,
      totalBalls: ballsRef.current,
      scoreWhenBroke: currentScore,
      wicketNumber: currentWickets,
    };

    setPartnershipHistory(prev => [...prev, entry]);
  };

  const resetPartnership = () => {
    runsRef.current = 0;
    ballsRef.current = 0;
    striker1Ref.current = 0;
    striker2Ref.current = 0;
    setPartnershipRuns(0);
    setPartnershipBalls(0);
    setStriker1Contribution(0);
    setStriker2Contribution(0);
  };

  const restorePartnershipState = (snap) => {
    const batsmen = snap.currentPartnershipBatsmen || [];
    currentBatsmenRef.current = batsmen;
    setCurrentPartnershipBatsmen(batsmen);
    runsRef.current = snap.partnershipRuns || 0;
    ballsRef.current = snap.partnershipBalls || 0;
    striker1Ref.current = snap.striker1Contribution || 0;
    striker2Ref.current = snap.striker2Contribution || 0;
    setPartnershipRuns(snap.partnershipRuns || 0);
    setPartnershipBalls(snap.partnershipBalls || 0);
    setStriker1Contribution(snap.striker1Contribution || 0);
    setStriker2Contribution(snap.striker2Contribution || 0);
    setPartnershipHistory(JSON.parse(JSON.stringify(snap.partnershipHistory || [])));
  };

  const resetAll = () => {
    currentBatsmenRef.current = [];
    runsRef.current = 0;
    ballsRef.current = 0;
    striker1Ref.current = 0;
    striker2Ref.current = 0;
    setPartnershipRuns(0);
    setPartnershipBalls(0);
    setStriker1Contribution(0);
    setStriker2Contribution(0);
    setPartnershipHistory([]);
    setCurrentPartnershipBatsmen([]);
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
    resetAll,
  };
}