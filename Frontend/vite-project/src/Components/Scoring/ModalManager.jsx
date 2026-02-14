import React from "react";
import StartInningsModal from "./StartInningsModal";
import NewBatsmanModal from "./NewBatsmanModal";
import NewBowlerModal from "./NewBowlerModal";
import WicketTypeModal from "./WicketTypeModal";
import FielderInputModal from "./FielderInputModal";
import PartnershipHistory from "./PartnershipHistory";
import MatchSummary from "./MatchSummary";
import InningsHistory from "./InningsHistory";
import InningsSummary from "./InningsSummary";
import ComparisonGraph from "./ComparisonGraph";
import MoreOptionsMenu from "./MoreOptionsMenu";
import ChangePlayersModal from "./ChangePlayersModal";
import DLSCalculator from "./DLSCalculator";
import ChangeOversModal from "./ChangeOversModal";
import ChangeBowlerLimitModal from "./ChangeBowlerLimitModal";

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
      {/* Start Innings Modal */}
      {modalStates.showStartModal && (
        <StartInningsModal onStart={onStartInnings} />
      )}

      {/* Wicket Type Modal */}
      {wicketFlow.showWicketTypeModal && (
        <WicketTypeModal
          onSelect={onWicketTypeSelect}
          onClose={() => wicketFlow.cancelWicketFlow()}
        />
      )}

      {/* Fielder Input Modal */}
      {wicketFlow.showFielderInputModal && (
        <FielderInputModal
          wicketType={wicketFlow.selectedWicketType}
          onConfirm={onFielderConfirm}
          onCancel={onFielderCancel}
        />
      )}

      {/* New Batsman Modal */}
      {isWicketPending && !wicketFlow.showFielderInputModal && (
        <NewBatsmanModal onConfirm={onConfirmNewBatsman} />
      )}

      {/* New Bowler Modal */}
      {isNewBowlerPending && (
        <NewBowlerModal
          onConfirm={onConfirmNewBowler}
          existingBowlers={bowlers}
        />
      )}

      {/* Partnership History Modal */}
      {modalStates.showPartnershipHistory && (
        <PartnershipHistory
          history={partnershipHistory}
          onClose={() => modalStates.setShowPartnershipHistory(false)}
          matchData={updatedMatchData}
          battingTeam={currentBattingTeam}
        />
      )}

      {/* Match Summary Modal */}
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

      {/* Innings History Modal */}
      {modalStates.showInningsHistory && (
        <InningsHistory
          history={completeHistory}
          onClose={() => modalStates.setShowInningsHistory(false)}
        />
      )}

      {/* Innings Summary Modal */}
      {modalStates.showInningsSummary && (
        <InningsSummary
          players={players}
          allPlayers={allPlayers}
          bowlers={bowlers}
          score={score}
          wickets={wickets}
          overs={overs}
          balls={balls}
          onClose={() => modalStates.setShowInningsSummary(false)}
        />
      )}

      {/* Comparison Graph Modal */}
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

      {/* Change Players Modal */}
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

      {/* Change Overs Modal */}
      {modalStates.showChangeOversModal && (
        <ChangeOversModal
          matchData={updatedMatchData}
          currentOvers={overs}
          currentBalls={balls}
          onConfirm={onChangeOversConfirm}
          onClose={() => modalStates.setShowChangeOversModal(false)}
        />
      )}

      {/* Change Bowler Limit Modal */}
      {modalStates.showChangeBowlerLimitModal && (
        <ChangeBowlerLimitModal
          matchData={updatedMatchData}
          onConfirm={onChangeBowlerLimitConfirm}
          onClose={() => modalStates.setShowChangeBowlerLimitModal(false)}
        />
      )}

      {/* DLS Calculator Modal */}
      {modalStates.showDLSCalculator && innings === 2 && (
        <DLSCalculator
          onClose={() => modalStates.setShowDLSCalculator(false)}
          matchData={updatedMatchData}
          currentScore={score}
          currentWickets={wickets}
          currentOvers={overs + balls / 6}
          team1Score={innings1Score?.score || 0}
          team1Wickets={innings1Score?.wickets || 0}
          team1Overs={
            (innings1Score?.overs || 0) + (innings1Score?.balls || 0) / 6
          }
        />
      )}

      {/* More Options Menu */}
      {modalStates.showMoreMenu && (
        <MoreOptionsMenu
          innings={innings}
          onClose={() => modalStates.setShowMoreMenu(false)}
          onOpenDLS={() => modalStates.setShowDLSCalculator(true)}
          onOpenChangePlayers={() =>
            modalStates.setShowChangePlayersModal(true)
          }
          onOpenChangeOvers={() =>
            modalStates.setShowChangeOversModal(true)
          }
          onOpenChangeBowlerLimit={() =>
            modalStates.setShowChangeBowlerLimitModal(true)
          }
        />
      )}
    </>
  );
}

export default ModalManager;
