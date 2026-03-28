import ChangePlayersModal from "./ChangePlayersModal";
import ChangeOversModal from "./ChangeOversModal";
import ChangeBowlerLimitModal from "./ChangeBowlerLimitModal";
import DismissBowlerModal from "./DismissBowlerModal";
import NoResultModal from "./NoResultModal";
import DLSCalculator from "./DLSCalculator";
import WinProbabilityModal from "./WinProbabilityModal";
import MoreOptionsMenu from "./MoreOptionsMenu";

function MatchSettingsModals({
  modalStates, bowlers, currentBowlerIndex, updatedMatchData,
  innings, score, wickets, overs, balls, innings1Score,
  onChangePlayersConfirm, onChangeOversConfirm, onChangeBowlerLimitConfirm,
  onDismissBowlerConfirm, onNoResultConfirm, onOpenPlayerDatabase,
  players, allPlayers, playerDB,
}) {
  return (
    <>
      {modalStates.showMoreMenu && (
        <MoreOptionsMenu
          innings={innings} onClose={() => modalStates.setShowMoreMenu(false)}
          onOpenDLS={() => modalStates.setShowDLSCalculator(true)}
          onOpenChangePlayers={() => modalStates.setShowChangePlayersModal(true)}
          onOpenChangeOvers={() => modalStates.setShowChangeOversModal(true)}
          onOpenChangeBowlerLimit={() => modalStates.setShowChangeBowlerLimitModal(true)}
          onOpenWinProbability={() => modalStates.setShowWinProbability(true)}
          onOpenPlayerDatabase={onOpenPlayerDatabase}
        />
      )}
      {modalStates.showChangePlayersModal && (
        <ChangePlayersModal
          matchData={updatedMatchData} currentInnings={innings}
          players={players} allPlayers={allPlayers} bowlers={bowlers}
          onConfirm={onChangePlayersConfirm}
          onClose={() => modalStates.setShowChangePlayersModal(false)}
        />
      )}
      {modalStates.showChangeOversModal && (
        <ChangeOversModal
          matchData={updatedMatchData} currentOvers={overs} currentBalls={balls}
          onConfirm={onChangeOversConfirm}
          onClose={() => modalStates.setShowChangeOversModal(false)}
        />
      )}
      {modalStates.showChangeBowlerLimitModal && (
        <ChangeBowlerLimitModal
          matchData={updatedMatchData} onConfirm={onChangeBowlerLimitConfirm}
          onClose={() => modalStates.setShowChangeBowlerLimitModal(false)}
        />
      )}
      {modalStates.showDismissBowlerModal && (
        <DismissBowlerModal
          dismissedBowlerName={bowlers[currentBowlerIndex]?.displayName || "Current Bowler"}
          existingBowlers={bowlers}
          onConfirm={onDismissBowlerConfirm}
          onClose={() => modalStates.setShowDismissBowlerModal(false)}
          playerDB={playerDB}
          activeBatters={players}
        />
      )}
      {modalStates.showNoResultModal && (
        <NoResultModal
          onConfirm={onNoResultConfirm}
          onClose={() => modalStates.setShowNoResultModal(false)}
        />
      )}
      {modalStates.showDLSCalculator && innings === 2 && (
        <DLSCalculator
          onClose={() => modalStates.setShowDLSCalculator(false)}
          matchData={updatedMatchData}
          currentScore={score} currentWickets={wickets}
          currentOvers={overs} currentBalls={balls}
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
          currentScore={score} currentWickets={wickets}
          currentOvers={overs} currentBalls={balls}
        />
      )}
    </>
  );
}

export default MatchSettingsModals;