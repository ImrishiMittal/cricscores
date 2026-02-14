import { useState } from "react";

/**
 * Custom hook to manage wicket flow logic
 * Handles: wicket type selection, fielder input, runout handling
 */
function useWicketFlow() {
  const [showWicketTypeModal, setShowWicketTypeModal] = useState(false);
  const [showFielderInputModal, setShowFielderInputModal] = useState(false);
  const [selectedWicketType, setSelectedWicketType] = useState(null);
  const [pendingRunoutRuns, setPendingRunoutRuns] = useState(null);
  const [waitingForRunoutRun, setWaitingForRunoutRun] = useState(false);

  /**
   * Start the wicket flow
   */
  const startWicketFlow = (isFreeHit) => {
    if (isFreeHit) {
      alert("Cannot take a wicket on a Free Hit!");
      return false;
    }
    console.log("🎯 Wicket button clicked");
    setShowWicketTypeModal(true);
    return true;
  };

  /**
   * Handle wicket type selection
   */
  const handleWicketTypeSelect = (wicketType) => {
    console.log("🎯 Wicket type selected:", wicketType);
    
    setShowWicketTypeModal(false);
    setSelectedWicketType(wicketType);

    // For runout, wait for user to select runs first
    if (wicketType === "runout") {
      console.log("🏃 Runout selected - waiting for runs");
      setWaitingForRunoutRun(true);
      return;
    }

    // For other wicket types, show fielder input modal immediately
    console.log("📝 Showing fielder input modal for:", wicketType);
    setShowFielderInputModal(true);
  };

  /**
   * Handle runout with runs
   */
  const handleRunoutWithRuns = (runs) => {
    console.log("🏃 Run out with", runs, "runs");
    setPendingRunoutRuns(runs);
    setWaitingForRunoutRun(false);
    setShowFielderInputModal(true);
  };

  /**
   * Cancel wicket flow
   */
  const cancelWicketFlow = () => {
    setShowWicketTypeModal(false);
    setShowFielderInputModal(false);
    setSelectedWicketType(null);
    setPendingRunoutRuns(null);
    setWaitingForRunoutRun(false);
  };

  /**
   * Complete wicket flow (called after fielder confirm)
   */
  const completeWicketFlow = () => {
    setShowFielderInputModal(false);
    setSelectedWicketType(null);
    setPendingRunoutRuns(null);
    setWaitingForRunoutRun(false);
  };

  return {
    // State
    showWicketTypeModal,
    showFielderInputModal,
    selectedWicketType,
    pendingRunoutRuns,
    waitingForRunoutRun,

    // Actions
    startWicketFlow,
    handleWicketTypeSelect,
    handleRunoutWithRuns,
    cancelWicketFlow,
    completeWicketFlow,

    // Setters (for undo functionality)
    setShowWicketTypeModal,
    setShowFielderInputModal,
    setSelectedWicketType,
    setPendingRunoutRuns,
    setWaitingForRunoutRun,
  };
}

export default useWicketFlow;