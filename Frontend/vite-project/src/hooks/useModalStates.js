import { useState } from 'react';

function useModalStates() {
  // Start Innings Modal
  const [showStartModal, setShowStartModal] = useState(false);

  // Wicket Flow Modals
  const [showWicketTypeModal, setShowWicketTypeModal] = useState(false);
  const [showFielderInputModal, setShowFielderInputModal] = useState(false);

  // Partnership History
  const [showPartnershipHistory, setShowPartnershipHistory] = useState(false);

  // Match Summary
  const [showSummary, setShowSummary] = useState(false);

  // Innings History
  const [showInningsHistory, setShowInningsHistory] = useState(false);

  // Innings Summary
  const [showInningsSummary, setShowInningsSummary] = useState(false);

  // Comparison Graph
  const [showComparisonGraph, setShowComparisonGraph] = useState(false);

  // More Options Menu
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Change Players Modal
  const [showChangePlayersModal, setShowChangePlayersModal] = useState(false);

  // Change Overs Modal
  const [showChangeOversModal, setShowChangeOversModal] = useState(false);

  // Change Bowler Limit Modal
  const [showChangeBowlerLimitModal, setShowChangeBowlerLimitModal] = useState(false);

  // DLS Calculator
  const [showDLSCalculator, setShowDLSCalculator] = useState(false);

  // Win Probability Modal ✅ NEW
  const [showWinProbability, setShowWinProbability] = useState(false);

  return {
    // Start Innings
    showStartModal,
    setShowStartModal,

    // Wicket Flow
    showWicketTypeModal,
    setShowWicketTypeModal,
    showFielderInputModal,
    setShowFielderInputModal,

    // Partnership History
    showPartnershipHistory,
    setShowPartnershipHistory,

    // Match Summary
    showSummary,
    setShowSummary,

    // Innings History
    showInningsHistory,
    setShowInningsHistory,

    // Innings Summary
    showInningsSummary,
    setShowInningsSummary,

    // Comparison Graph
    showComparisonGraph,
    setShowComparisonGraph,

    // More Options Menu
    showMoreMenu,
    setShowMoreMenu,

    // Change Players
    showChangePlayersModal,
    setShowChangePlayersModal,

    // Change Overs
    showChangeOversModal,
    setShowChangeOversModal,

    // Change Bowler Limit
    showChangeBowlerLimitModal,
    setShowChangeBowlerLimitModal,

    // DLS Calculator
    showDLSCalculator,
    setShowDLSCalculator,

    // Win Probability ✅ NEW
    showWinProbability,
    setShowWinProbability,
  };
}

export default useModalStates;