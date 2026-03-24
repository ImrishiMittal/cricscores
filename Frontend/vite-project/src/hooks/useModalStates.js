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
  const [showDismissBowlerModal, setShowDismissBowlerModal] = useState(false);
  const [showNoResultModal, setShowNoResultModal] = useState(false);

  // Rename Player modal
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

  // Player Stats modal
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [statsTarget, setStatsTarget] = useState(null); // player object

  const openPlayerStats = (player) => {
    setStatsTarget(player);
    setShowPlayerStats(true);
  };

  const closePlayerStats = () => {
    setShowPlayerStats(false);
    setStatsTarget(null);
  };

  // ✅ NEW: Super Over modal
  const [showSuperOverModal, setShowSuperOverModal] = useState(false);
  const [superOverNumber, setSuperOverNumber] = useState(1);

  const openSuperOverModal = (soNumber = 1) => {
    setSuperOverNumber(soNumber);
    setShowSuperOverModal(true);
  };

  const closeSuperOverModal = () => {
    setShowSuperOverModal(false);
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
    // Rename
    showRenameModal, setShowRenameModal,
    renameTarget,
    openRenameModal,
    closeRenameModal,
    // Stats
    showPlayerStats,
    statsTarget,
    openPlayerStats,
    closePlayerStats,
    // ✅ NEW: Super Over
    showSuperOverModal,
    superOverNumber,
    openSuperOverModal,
    closeSuperOverModal,
  };
}

export default useModalStates;