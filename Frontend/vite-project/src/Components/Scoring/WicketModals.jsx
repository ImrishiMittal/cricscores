import WicketTypeModal from "./WicketTypeModal";
import FielderInputModal from "./FielderInputModal";
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
  onCancelNewBatsman, 
  onReturnRetiredConfirm,
  playerDB,
  activePlayers,
  dismissedPlayers,
  bowlerJerseys,
  batterJerseys,
  currentBowlerJersey,
  tournamentId,
  currentBattingTeam,
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
          batterJerseys={batterJerseys}
          currentBowlerJersey={currentBowlerJersey}
        />
      )}

      {isWicketPending &&
        !wicketFlow.showFielderInputModal &&
        !wicketFlow.waitingForRunoutRun && (
          <NewBatsmanModal
            onConfirm={onConfirmNewBatsman}
            onCancel={onCancelNewBatsman}     
            retiredPlayers={retiredPlayers || []}
            onReturnRetired={onReturnRetiredConfirm}
            playerDB={playerDB}
            activePlayers={activePlayers}
            bowlerJerseys={bowlerJerseys}
            dismissedPlayers={dismissedPlayers}
            currentBowlerJersey={currentBowlerJersey}
            tournamentId={tournamentId}    
            currentBattingTeam={currentBattingTeam}
          />
        )}

      {/* RunoutChoiceModal is intentionally NOT rendered here —        */}
      {/* ModalManager handles it directly so onCommitRunoutRun works. */}
    </>
  );
}

export default WicketModals;