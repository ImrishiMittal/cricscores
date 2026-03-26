import React from "react";
import StartInningsModal from "./StartInningsModal";
import NewBatsmanModal from "./NewBatsmanModal";
import NewBowlerModal from "./NewBowlerModal";
import WicketTypeModal from "./WicketTypeModal";
import FielderInputModal from "./FielderInputModal";
import PartnershipHistory from "./PartnershipHistory";
import MatchSummary from "./MatchSummary";
import TabbedInningsHistory from "./TabbedInningsHistory";
import TabbedInningsSummary from "./TabbedInningsSummary";
import ComparisonGraph from "./ComparisonGraph";
import MoreOptionsMenu from "./MoreOptionsMenu";
import ChangePlayersModal from "./ChangePlayersModal";
import ChangeOversModal from "./ChangeOversModal";
import ChangeBowlerLimitModal from "./ChangeBowlerLimitModal";
import DLSCalculator from "./DLSCalculator";
import WinProbabilityModal from "./WinProbabilityModal";
import RetiredHurtModal from "./RetiredHurtModal";
import DismissBowlerModal from "./DismissBowlerModal";
import NoResultModal from "./NoResultModal";
import RenameModal from "./RenameModal";
import PlayerStatsModal from "./PlayerStatsModal";
import BowlerStatsModal from "./BowlerStatsModal"; // ✅ NEW
import usePlayerStats from "../../hooks/usePlayerStats";
import useBowlerStats from "../../hooks/useBowlerStats"; // ✅ NEW
import RunoutChoiceModal from "./RunoutChoiceModal";
import PlayerDatabaseModal from "./PlayerDatabaseModal";

function ModalManager({
  modalStates,
  wicketFlow,
  players,
  allPlayers,
  retiredPlayers,
  bowlers,
  currentBowlerIndex,
  isWicketPending,
  isNewBowlerPending,
  strikerIndex,
  nonStrikerIndex,
  partnershipHistory,
  innings1Data,
  innings2Data,
  innings1Score,
  innings2Score,
  innings1HistoryRef,
  matchData,
  updatedMatchData,
  firstBattingTeam,
  secondBattingTeam,
  currentBattingTeam,
  winner,
  score,
  wickets,
  overs,
  balls,
  innings1History,
  innings2History,
  completeHistory,
  innings,
  onStartInnings,
  onConfirmNewBatsman,
  onConfirmNewBowler,
  onWicketTypeSelect,
  onFielderConfirm,
  onFielderCancel,
  onChangePlayersConfirm,
  onChangeOversConfirm,
  onChangeBowlerLimitConfirm,
  onRetiredHurtConfirm,
  onReturnRetiredConfirm,
  onDismissBowlerConfirm,
  onNoResultConfirm,
  onRenameConfirm,
  onRenameBowlerConfirm, // ✅ NEW
  liveExtras,
  onStatsClick,
  initialStrikerPlayerId,
  initialNonStrikerPlayerId,
  isSuperOver,
  superOverNumber,
  playerDB,
  onOpenPlayerDatabase,
  activePlayers = [],
}) {
  // Stats for the currently selected batsman
  const statsForPlayer = usePlayerStats(
    modalStates.statsTarget,
    completeHistory
  );

  // ✅ Stats for the currently selected bowler
  const statsForBowler = useBowlerStats(
    modalStates.bowlerStatsTarget,
    completeHistory
  );

  return (
    <>
      {modalStates.showStartModal && (
        <StartInningsModal onStart={onStartInnings} playerDB={playerDB} />
      )}

      {wicketFlow.showWicketTypeModal && (
        <WicketTypeModal
          onSelect={onWicketTypeSelect}
          onClose={() => wicketFlow.cancelWicketFlow()}
        />
      )}
      {wicketFlow.showFielderInputModal && (
        <FielderInputModal
          wicketType={wicketFlow.selectedWicketType}
          onConfirm={onFielderConfirm}
          onCancel={onFielderCancel}
        />
      )}
      {isWicketPending &&
        !wicketFlow.showFielderInputModal &&
        !wicketFlow.waitingForRunoutRun &&
        wicketFlow.pendingRunoutRuns === null && (
          <NewBatsmanModal
               onConfirm={onConfirmNewBatsman}
               retiredPlayers={retiredPlayers || []}
               onReturnRetired={onReturnRetiredConfirm}
               playerDB={playerDB}
               activePlayers={activePlayers}
             />
          
        )}

      {isNewBowlerPending && (
        <NewBowlerModal
          onConfirm={onConfirmNewBowler}
          existingBowlers={bowlers}
          playerDB={playerDB}
        />
      )}

      {modalStates.showDismissBowlerModal && (
        <DismissBowlerModal
          dismissedBowlerName={
            bowlers[currentBowlerIndex]?.displayName || "Current Bowler"
          }
          existingBowlers={bowlers}
          onConfirm={onDismissBowlerConfirm}
          onClose={() => modalStates.setShowDismissBowlerModal(false)}
        />
      )}
      {modalStates.showNoResultModal && (
        <NoResultModal
          onConfirm={onNoResultConfirm}
          onClose={() => modalStates.setShowNoResultModal(false)}
        />
      )}
      {modalStates.showPartnershipHistory && (
        <PartnershipHistory
          history={partnershipHistory}
          onClose={() => modalStates.setShowPartnershipHistory(false)}
          matchData={updatedMatchData}
          battingTeam={currentBattingTeam}
        />
      )}
      {modalStates.showSummary && (innings1Data || innings2Data) && (
        <MatchSummary
          team1={firstBattingTeam}
          team2={secondBattingTeam}
          winner={winner}
          innings1Data={innings1Data}
          innings2Data={innings2Data}
          innings1Score={innings1Score}
          innings2Score={innings2Score}
          matchData={updatedMatchData}
          onClose={() => modalStates.setShowSummary(false)}
          isSuperOver={isSuperOver}
          superOverNumber={superOverNumber}
        />
      )}
      {modalStates.showInningsHistory && (
        <TabbedInningsHistory
          innings1History={innings1History}
          innings2History={innings2History}
          currentInnings={innings}
          onClose={() => modalStates.setShowInningsHistory(false)}
        />
      )}
      {modalStates.showInningsSummary && (
        <TabbedInningsSummary
          innings1Data={innings1Data}
          innings2Data={innings2Data}
          players={players}
          allPlayers={allPlayers.filter(
            (ap) => !players.some((p) => p.playerId === ap.playerId)
          )}
          bowlers={bowlers}
          score={score}
          wickets={wickets}
          overs={overs}
          balls={balls}
          currentInnings={innings}
          liveExtras={liveExtras}
          onClose={() => modalStates.setShowInningsSummary(false)}
        />
      )}
      {modalStates.showComparisonGraph && (
        <ComparisonGraph
          team1Name={firstBattingTeam}
          team2Name={secondBattingTeam}
          innings1Data={innings1Data}
          innings2Data={innings2Data}
          innings1Score={
            innings1Score || (innings === 1 ? { score, wickets } : null)
          }
          innings2Score={
            innings2Score || (innings === 2 ? { score, wickets } : null)
          }
          innings1History={
            innings === 1
              ? completeHistory
              : innings1HistoryRef.current || innings1Data?.history || []
          }
          innings2History={innings === 2 ? completeHistory : []}
          matchData={updatedMatchData}
          currentInnings={innings}
          onClose={() => modalStates.setShowComparisonGraph(false)}
        />
      )}
      {modalStates.showChangePlayersModal && (
        <ChangePlayersModal
          matchData={updatedMatchData}
          currentInnings={innings}
          players={players}
          allPlayers={allPlayers}
          bowlers={bowlers}
          onConfirm={onChangePlayersConfirm}
          onClose={() => modalStates.setShowChangePlayersModal(false)}
        />
      )}
      {modalStates.showChangeOversModal && (
        <ChangeOversModal
          matchData={updatedMatchData}
          currentOvers={overs}
          currentBalls={balls}
          onConfirm={onChangeOversConfirm}
          onClose={() => modalStates.setShowChangeOversModal(false)}
        />
      )}
      {modalStates.showChangeBowlerLimitModal && (
        <ChangeBowlerLimitModal
          matchData={updatedMatchData}
          onConfirm={onChangeBowlerLimitConfirm}
          onClose={() => modalStates.setShowChangeBowlerLimitModal(false)}
        />
      )}
      {modalStates.showDLSCalculator && innings === 2 && (
        <DLSCalculator
          onClose={() => modalStates.setShowDLSCalculator(false)}
          matchData={updatedMatchData}
          currentScore={score}
          currentWickets={wickets}
          currentOvers={overs}
          currentBalls={balls}
          team1Score={innings1Score?.score || 0}
          team1Wickets={innings1Score?.wickets || 0}
          team1Overs={innings1Score?.overs || 0}
          team1Balls={innings1Score?.balls || 0}
        />
      )}
      {modalStates.showWinProbability && innings === 2 && (
        <WinProbabilityModal
          onClose={() => modalStates.setShowWinProbability(false)}
          matchData={updatedMatchData}
          innings1Score={innings1Score?.score || 0}
          innings1Wickets={innings1Score?.wickets || 0}
          currentScore={score}
          currentWickets={wickets}
          currentOvers={overs}
          currentBalls={balls}
        />
      )}
      {modalStates.showRetiredHurtModal && players.length >= 2 && (
        <RetiredHurtModal
          strikerName={players[strikerIndex]?.displayName || "Striker"}
          onConfirm={onRetiredHurtConfirm}
          onClose={() => modalStates.setShowRetiredHurtModal(false)}
        />
      )}
      {modalStates.showMoreMenu && (
        <MoreOptionsMenu
          innings={innings}
          onClose={() => modalStates.setShowMoreMenu(false)}
          onOpenDLS={() => modalStates.setShowDLSCalculator(true)}
          onOpenChangePlayers={() =>
            modalStates.setShowChangePlayersModal(true)
          }
          onOpenChangeOvers={() => modalStates.setShowChangeOversModal(true)}
          onOpenChangeBowlerLimit={() =>
            modalStates.setShowChangeBowlerLimitModal(true)
          }
          onOpenWinProbability={() => modalStates.setShowWinProbability(true)}
          onOpenPlayerDatabase={onOpenPlayerDatabase}
        />
      )}
      {/* Rename modal — shared for both batsmen and bowlers */}
      {modalStates.showRenameModal && modalStates.renameTarget && (
        <RenameModal
          playerId={modalStates.renameTarget.playerId}
          currentName={modalStates.renameTarget.displayName}
          onConfirm={(playerId, newName) => {
            // ✅ Route to the correct rename handler based on context
            if (modalStates.renameTarget.isBowler) {
              onRenameBowlerConfirm(playerId, newName);
            } else {
              onRenameConfirm(playerId, newName);
            }
          }}
          onClose={modalStates.closeRenameModal}
        />
      )}
      {/* Batsman Stats Modal */}
      {modalStates.showPlayerStats && modalStates.statsTarget && (
        <PlayerStatsModal
          player={modalStates.statsTarget}
          stats={statsForPlayer}
          onRename={(playerId, displayName) => {
            modalStates.closePlayerStats();
            modalStates.openRenameModal(playerId, displayName);
          }}
          onClose={modalStates.closePlayerStats}
        />
      )}
      {/* ✅ NEW: Bowler Stats Modal */}
      {modalStates.showBowlerStats && modalStates.bowlerStatsTarget && (
        <BowlerStatsModal
          bowler={modalStates.bowlerStatsTarget}
          stats={statsForBowler}
          onRename={(playerId, displayName) => {
            modalStates.closeBowlerStats();
            // ✅ Tag the renameTarget as a bowler so ModalManager routes correctly
            modalStates.openRenameModal(playerId, displayName);
            // We patch the target after opening so isBowler flag is set
            // Use a tiny helper instead — see note below
            modalStates.setRenameTarget({
              playerId,
              displayName,
              isBowler: true,
            });
            modalStates.setShowRenameModal(true);
          }}
          onClose={modalStates.closeBowlerStats}
        />
      )}
      {wicketFlow.showRunoutChoiceModal && (
        <RunoutChoiceModal
          striker={players[strikerIndex]?.displayName}
          nonStriker={players[nonStrikerIndex]?.displayName}
          onSelect={(who) => {
            wicketFlow.setRunoutBatsmanChoice(who);
            wicketFlow.setShowRunoutChoiceModal(false);
            wicketFlow.setShowFielderInputModal(true);
          }}
          onClose={() => wicketFlow.setShowRunoutChoiceModal(false)}
        />
      )}
      {modalStates.showPlayerDatabase && (
        <PlayerDatabaseModal
          playerDB={playerDB}
          onClose={() => modalStates.setShowPlayerDatabase(false)}
        />
      )}
    </>
  );
}

export default ModalManager;
