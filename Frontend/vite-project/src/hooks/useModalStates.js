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

  // ✅ Dismiss Bowler modal
  const [showDismissBowlerModal, setShowDismissBowlerModal] = useState(false);

  // ✅ No Result modal
  const [showNoResultModal, setShowNoResultModal] = useState(false);

  // ✅ NEW: Rename Player modal
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null); // { playerId, displayName }

  const openRenameModal = (playerId, displayName) => {
    setRenameTarget({ playerId, displayName });
    setShowRenameModal(true);
  };

  const closeRenameModal = () => {
    setShowRenameModal(false);
    setRenameTarget(null);
  };

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
    showDismissBowlerModal, setShowDismissBowlerModal,
    showNoResultModal, setShowNoResultModal,
    // ✅ NEW
    showRenameModal, setShowRenameModal,
    renameTarget,
    openRenameModal,
    closeRenameModal,
  };
}

export default useModalStates;
