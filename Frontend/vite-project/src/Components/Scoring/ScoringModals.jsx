import SuperOverModal from "./SuperOverModal";
import FullScorecard from "./FullScorecard";
import HatTrickBanner from "./HatTrickBanner";

function ScoringModals({
  hatTrickHook,
  modalStates,
  matchData,
  secondBattingTeam,
  firstBattingTeam,
  handleStartSuperOver,
  handleSkipSuperOver,
  realMatchInnings1DataRef,
  realMatchInnings2DataRef,
  inningsDataHook,
  engine,
}) {
  return (
    <>
      {hatTrickHook.showHatTrick && (
        <HatTrickBanner bowlerName={hatTrickHook.hatTrickBowler} onClose={hatTrickHook.closeHatTrick} />
      )}
      {modalStates.showSuperOverModal && (
        <SuperOverModal
          teamA={matchData.teamA} teamB={matchData.teamB}
          battingFirst={secondBattingTeam}
          superOverNumber={modalStates.superOverNumber}
          onStart={handleStartSuperOver} onSkip={handleSkipSuperOver}
        />
      )}
      {modalStates.showFullScorecard && (
        <FullScorecard
          matchData={matchData}
          mainMatchData={{
            innings1Data: realMatchInnings1DataRef.current ?? inningsDataHook.innings1Data,
            innings2Data: realMatchInnings2DataRef.current ?? inningsDataHook.innings2Data,
            realInnings1Score: engine.realMatchInnings1Score,
            realInnings2Score: engine.realMatchInnings2Score,
          }}
          superOverData={engine.superOverHistory}
          firstBattingTeam={firstBattingTeam}
          secondBattingTeam={secondBattingTeam}
          onClose={() => modalStates.setShowFullScorecard(false)}
        />
      )}
    </>
  );
}

export default ScoringModals;