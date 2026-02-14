import { useState } from "react";

function useModalStates() {
  const [showStartModal, setShowStartModal] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [showInningsHistory, setShowInningsHistory] = useState(false);
  const [showInningsSummary, setShowInningsSummary] = useState(false);
  const [showComparisonGraph, setShowComparisonGraph] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showChangePlayersModal, setShowChangePlayersModal] = useState(false);
  const [showPartnershipHistory, setShowPartnershipHistory] = useState(false);
  const [showDLSCalculator, setShowDLSCalculator] = useState(false); // ✅ ADD THIS

  return {
    // Start modal
    showStartModal,
    setShowStartModal,
    
    // Summary modals
    showSummary,
    setShowSummary,
    showInningsSummary,
    setShowInningsSummary,
    
    // History modals
    showInningsHistory,
    setShowInningsHistory,
    showPartnershipHistory,
    setShowPartnershipHistory,
    
    // Analysis modals
    showComparisonGraph,
    setShowComparisonGraph,
    
    // Settings modals
    showMoreMenu,
    setShowMoreMenu,
    showChangePlayersModal,
    setShowChangePlayersModal,
    
    // DLS Calculator  ✅ ADD THIS
    showDLSCalculator,
    setShowDLSCalculator,
  };
}

export default useModalStates;