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

function ModalManager({
  modalStates,
  wicketFlow,
  players,
  allPlayers,
  bowlers,
  isWicketPending,
  isNewBowlerPending,
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
}) {
  return (
    <>
      {modalStates.showStartModal && (
        <StartInningsModal onStart={onStartInnings} />
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

      {isWicketPending && !wicketFlow.showFielderInputModal && (
        <NewBatsmanModal onConfirm={onConfirmNewBatsman} />
      )}

      {isNewBowlerPending && (
        <NewBowlerModal
          onConfirm={onConfirmNewBowler}
          existingBowlers={bowlers}
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

      {modalStates.showSummary && innings1Data && innings2Data && (
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
        />
      )}

      {modalStates.showInningsHistory && (
        <TabbedInningsHistory
          innings1History={innings1HistoryRef.current || innings1Data?.history || []}
          innings2History={innings === 2 ? completeHistory : []}
          currentInnings={innings}
          onClose={() => modalStates.setShowInningsHistory(false)}
        />
      )}

      {modalStates.showInningsSummary && (
        <TabbedInningsSummary
          innings1Data={innings1Data}
          innings2Data={innings2Data}
          players={players}
          allPlayers={allPlayers}
          bowlers={bowlers}
          score={score}
          wickets={wickets}
          overs={overs}
          balls={balls}
          currentInnings={innings}
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

      {modalStates.showMoreMenu && (
        <MoreOptionsMenu
          innings={innings}
          onClose={() => modalStates.setShowMoreMenu(false)}
          onOpenDLS={() => modalStates.setShowDLSCalculator(true)}
          onOpenChangePlayers={() => modalStates.setShowChangePlayersModal(true)}
          onOpenChangeOvers={() => modalStates.setShowChangeOversModal(true)}
          onOpenChangeBowlerLimit={() => modalStates.setShowChangeBowlerLimitModal(true)}
          onOpenWinProbability={() => modalStates.setShowWinProbability(true)}
        />
      )}
    </>
  );
}

export default ModalManager;