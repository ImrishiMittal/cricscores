import { useState } from "react";

function useWicketFlow() {
  const [showWicketTypeModal, setShowWicketTypeModal] = useState(false);
  const [showFielderInputModal, setShowFielderInputModal] = useState(false);
  const [selectedWicketType, setSelectedWicketType] = useState(null);
  const [pendingRunoutRuns, setPendingRunoutRuns] = useState(null);
  const [waitingForRunoutRun, setWaitingForRunoutRun] = useState(false);

  const startWicketFlow = (isFreeHit) => {
    if (isFreeHit) {
      alert("Cannot take a wicket on a Free Hit!");
      return false;
    }
    console.log("🎯 Wicket button clicked");
    setShowWicketTypeModal(true);
    return true;
  };

  const handleWicketTypeSelect = (wicketType) => {
    console.log("🎯 Wicket type selected:", wicketType);

    setShowWicketTypeModal(false);
    setSelectedWicketType(wicketType);

    if (wicketType === "runout") {
      console.log("🏃 Runout selected - waiting for runs");
      setWaitingForRunoutRun(true);
      return;
    }

    // ✅ Hit wicket: no fielder needed — skip fielder modal, go straight to new batsman
    if (wicketType === "hitwicket") {
      console.log("🏏 Hit wicket — no fielder needed, proceeding directly");
      // showFielderInputModal stays false — ScoringPage handles it via isWicketPending
      return;
    }

    console.log("📝 Showing fielder input modal for:", wicketType);
    setShowFielderInputModal(true);
  };

  const handleRunoutWithRuns = (runs) => {
    console.log("🏃 Run out with", runs, "runs");
    setPendingRunoutRuns(runs);
    setWaitingForRunoutRun(false);
    setShowFielderInputModal(true);
  };

  const cancelWicketFlow = () => {
    setShowWicketTypeModal(false);
    setShowFielderInputModal(false);
    setSelectedWicketType(null);
    setPendingRunoutRuns(null);
    setWaitingForRunoutRun(false);
  };

  const completeWicketFlow = () => {
    setShowFielderInputModal(false);
    setSelectedWicketType(null);
    setPendingRunoutRuns(null);
    setWaitingForRunoutRun(false);
  };

  return {
    showWicketTypeModal,
    showFielderInputModal,
    selectedWicketType,
    pendingRunoutRuns,
    waitingForRunoutRun,
    startWicketFlow,
    handleWicketTypeSelect,
    handleRunoutWithRuns,
    cancelWicketFlow,
    completeWicketFlow,
    setShowWicketTypeModal,
    setShowFielderInputModal,
    setSelectedWicketType,
    setPendingRunoutRuns,
    setWaitingForRunoutRun,
  };
}

export default useWicketFlow;
