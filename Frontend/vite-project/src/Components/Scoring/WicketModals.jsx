import WicketTypeModal from "./WicketTypeModal";
import FielderInputModal from "./FielderInputModal";
import RunoutChoiceModal from "./RunoutChoiceModal";
import NewBatsmanModal from "./NewBatsmanModal";

function WicketModals({
  wicketFlow,
  players,
  retiredPlayers,
  strikerIndex,
  nonStrikerIndex,
  isWicketPending,
  onWicketTypeSelect,
  onFielderConfirm,
  onFielderCancel,
  onConfirmNewBatsman,
  onReturnRetiredConfirm,
  playerDB,
  activePlayers,
  dismissedPlayers,
  bowlerJerseys,     // ✅ Bowlers this innings
  batterJerseys,      // ✅ Batters this innings
  currentBowlerJersey, // ✅ Current bowler's jersey
}) {
  return (
    <>
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
          playerDB={playerDB}
          batterJerseys={batterJerseys}           // ✅ Pass batters
          currentBowlerJersey={currentBowlerJersey} // ✅ Pass current bowler
        />
      )}

      {isWicketPending &&
        !wicketFlow.showFielderInputModal &&
        !wicketFlow.waitingForRunoutRun && (
          <NewBatsmanModal
            onConfirm={onConfirmNewBatsman}
            retiredPlayers={retiredPlayers || []}
            onReturnRetired={onReturnRetiredConfirm}
            playerDB={playerDB}
            activePlayers={activePlayers}
            bowlerJerseys={bowlerJerseys}      // ✅ Pass bowlers
            dismissedPlayers={dismissedPlayers}
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
    </>
  );
}

export default WicketModals;
