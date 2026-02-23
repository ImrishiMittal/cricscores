import { useState } from 'react';

function useModalStates() {
  const [showStartModal, setShowStartModal] = useState(false);
  const [showWicketTypeModal, setShowWicketTypeModal] = useState(false);
  const [showFielderInputModal, setShowFielderInputModal] = useState(false);
  const [showPartnershipHistory, setShowPartnershipHistory] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showInningsHistory, setShowInningsHistory] = useState(false);
  const [showInningsSummary, setShowInningsSummary] = useState(false);
  const [showComparisonGraph, setShowComparisonGraph] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showChangePlayersModal, setShowChangePlayersModal] = useState(false);
  const [showChangeOversModal, setShowChangeOversModal] = useState(false);
  const [showChangeBowlerLimitModal, setShowChangeBowlerLimitModal] = useState(false);
  const [showDLSCalculator, setShowDLSCalculator] = useState(false);
  const [showWinProbability, setShowWinProbability] = useState(false);
  const [showRetiredHurtModal, setShowRetiredHurtModal] = useState(false);

  // ✅ NEW: Dismiss Bowler modal
  const [showDismissBowlerModal, setShowDismissBowlerModal] = useState(false);

  // ✅ NEW: No Result modal
  const [showNoResultModal, setShowNoResultModal] = useState(false);

  return {
    showStartModal, setShowStartModal,
    showWicketTypeModal, setShowWicketTypeModal,
    showFielderInputModal, setShowFielderInputModal,
    showPartnershipHistory, setShowPartnershipHistory,
    showSummary, setShowSummary,
    showInningsHistory, setShowInningsHistory,
    showInningsSummary, setShowInningsSummary,
    showComparisonGraph, setShowComparisonGraph,
    showMoreMenu, setShowMoreMenu,
    showChangePlayersModal, setShowChangePlayersModal,
    showChangeOversModal, setShowChangeOversModal,
    showChangeBowlerLimitModal, setShowChangeBowlerLimitModal,
    showDLSCalculator, setShowDLSCalculator,
    showWinProbability, setShowWinProbability,
    showRetiredHurtModal, setShowRetiredHurtModal,
    // ✅ NEW
    showDismissBowlerModal, setShowDismissBowlerModal,
    showNoResultModal, setShowNoResultModal,
  };
}

export default useModalStates;
