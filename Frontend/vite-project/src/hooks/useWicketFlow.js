import { useState } from "react";

function useWicketFlow() {
  const [showWicketTypeModal, setShowWicketTypeModal] = useState(false);
  const [showFielderInputModal, setShowFielderInputModal] = useState(false);

  const [selectedWicketType, setSelectedWicketType] = useState(null);

  const [pendingRunoutRuns, setPendingRunoutRuns] = useState(null);
  const [waitingForRunoutRun, setWaitingForRunoutRun] = useState(false);

  const [runoutBatsmanChoice, setRunoutBatsmanChoice] = useState(null);
  const [showRunoutChoiceModal, setShowRunoutChoiceModal] = useState(false);

  // start wicket
  const startWicketFlow = (isFreeHit) => {
    // allow modal to open even on free hit
    setShowWicketTypeModal(true);
    return true;
  };

  // select wicket type
  const handleWicketTypeSelect = (wicketType, isFreeHit) => {
    // ❌ not allowed on free hit
    if (
      isFreeHit &&
      wicketType !== "runout" &&
      wicketType !== "stumped"
    ) {
      alert(
        "Only Run Out or Stumping allowed on Free Hit!"
      );
      return;
    }
  
    setShowWicketTypeModal(false);
    setSelectedWicketType(wicketType);
  
    if (wicketType === "runout") {
      setWaitingForRunoutRun(true);
      return;
    }
  
    if (wicketType === "hitwicket") {
      return;
    }
  
    setShowFielderInputModal(true);
  };

  // runout runs selected
  const handleRunoutWithRuns = (runs) => {
    setPendingRunoutRuns(runs);
    setWaitingForRunoutRun(false);

    // show striker / non striker modal
    setShowRunoutChoiceModal(true);
  };

  // cancel
  const cancelWicketFlow = () => {
    setShowWicketTypeModal(false);
    setShowFielderInputModal(false);
    setShowRunoutChoiceModal(false);

    setSelectedWicketType(null);
    setPendingRunoutRuns(null);
    setWaitingForRunoutRun(false);
    setRunoutBatsmanChoice(null);
  };

  // complete
  const completeWicketFlow = () => {
    setShowWicketTypeModal(false);
    setShowFielderInputModal(false);
    setShowRunoutChoiceModal(false);

    setSelectedWicketType(null);
    setPendingRunoutRuns(null);
    setWaitingForRunoutRun(false);
    setRunoutBatsmanChoice(null);
  };

  return {
    showWicketTypeModal,
    showFielderInputModal,
    showRunoutChoiceModal,

    selectedWicketType,
    pendingRunoutRuns,
    waitingForRunoutRun,
    runoutBatsmanChoice,

    startWicketFlow,
    handleWicketTypeSelect,
    handleRunoutWithRuns,

    cancelWicketFlow,
    completeWicketFlow,

    setShowWicketTypeModal,
    setShowFielderInputModal,
    setShowRunoutChoiceModal,

    setSelectedWicketType,
    setPendingRunoutRuns,
    setWaitingForRunoutRun,
    setRunoutBatsmanChoice,
  };
}

export default useWicketFlow;