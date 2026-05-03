import React from "react";
import StartInningsModal from "./StartInningsModal";
import NewBowlerModal from "./NewBowlerModal";
import PartnershipHistory from "./PartnershipHistory";
import MatchSummary from "./MatchSummary";
import TabbedInningsHistory from "./TabbedInningsHistory";
import TabbedInningsSummary from "./TabbedInningsSummary";
import ComparisonGraph from "./ComparisonGraph";
import RetiredHurtModal from "./RetiredHurtModal";
import RenameModal from "./RenameModal";
import PlayerStatsModal from "./PlayerStatsModal";
import BowlerStatsModal from "./BowlerStatsModal";
import PlayerDatabaseModal from "./PlayerDatabaseModal";
import WicketModals from "./WicketModals";
import MatchSettingsModals from "./MatchSettingsModals";
import usePlayerStats from "../../hooks/usePlayerStats";
import useBowlerStats from "../../hooks/useBowlerStats";

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
  onRenameBowlerConfirm,
  liveExtras,
  onStatsClick,
  initialStrikerPlayerId,
  initialNonStrikerPlayerId,
  isSuperOver,
  superOverNumber,
  playerDB,
  onOpenPlayerDatabase,
  activePlayers = [],
  matchTeamLock = {},
  dismissedPlayers,
  // ✅ FIX: These three were used in JSX but missing from the function signature
  bowlerJerseys = new Set(),
  batterJerseys = new Set(),
  currentBowlerJersey,
}) {
  const statsForPlayer = usePlayerStats(
    modalStates.statsTarget,
    completeHistory
  );
  const statsForBowler = useBowlerStats(
    modalStates.bowlerStatsTarget,
    completeHistory
  );
  const bowlingTeam =
    currentBattingTeam === firstBattingTeam
      ? secondBattingTeam
      : firstBattingTeam;

  return (
    <>
      {modalStates.showStartModal && (
        <StartInningsModal
          onStart={onStartInnings}
          playerDB={playerDB}
          matchTeamLock={matchTeamLock}
          currentBattingTeam={currentBattingTeam}
          firstBattingTeam={firstBattingTeam}
          secondBattingTeam={secondBattingTeam}
          currentInnings={innings}
        />
      )}

      <WicketModals
        wicketFlow={wicketFlow}
        players={players}
        retiredPlayers={retiredPlayers}
        strikerIndex={strikerIndex}
        nonStrikerIndex={nonStrikerIndex}
        isWicketPending={isWicketPending}
        onWicketTypeSelect={onWicketTypeSelect}
        onFielderConfirm={onFielderConfirm}
        onFielderCancel={onFielderCancel}
        onConfirmNewBatsman={onConfirmNewBatsman}
        onReturnRetiredConfirm={onReturnRetiredConfirm}
        playerDB={playerDB}
        activePlayers={activePlayers}
        dismissedPlayers={dismissedPlayers}
        bowlerJerseys={bowlerJerseys}
        batterJerseys={batterJerseys}
        currentBowlerJersey={currentBowlerJersey}
      />

      {isNewBowlerPending && (
        <NewBowlerModal
          onConfirm={onConfirmNewBowler}
          activeBowlers={bowlers}
          playerDB={playerDB}
          batterJerseys={batterJerseys}
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
          innings1History={
            innings === 1
              ? completeHistory
              : innings1History?.length > 0
              ? innings1History
              : innings1HistoryRef?.current || []
          }
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
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.80)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9500,
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget)
              modalStates.setShowComparisonGraph(false);
          }}
        >
          <div
            style={{
              background: "#0a0e1a",
              border: "1px solid #1e293b",
              borderRadius: "14px",
              padding: "20px 16px 16px",
              width: "min(700px, 96vw)",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <span
                style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "15px" }}
              >
                📊 Run Rate Comparison
              </span>
              <button
                onClick={() => modalStates.setShowComparisonGraph(false)}
                style={{
                  background: "transparent",
                  border: "1px solid #374151",
                  borderRadius: "6px",
                  color: "#9ca3af",
                  fontSize: "16px",
                  cursor: "pointer",
                  padding: "2px 8px",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
            <ComparisonGraph
              team1Name={firstBattingTeam}
              team2Name={secondBattingTeam}
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
          </div>
        </div>
      )}

      {modalStates.showRetiredHurtModal && players.length >= 2 && (
        <RetiredHurtModal
          strikerName={players[strikerIndex]?.displayName || "Striker"}
          onConfirm={onRetiredHurtConfirm}
          onClose={() => modalStates.setShowRetiredHurtModal(false)}
          playerDB={playerDB}
        />
      )}

      <MatchSettingsModals
        modalStates={modalStates}
        bowlers={bowlers}
        currentBowlerIndex={currentBowlerIndex}
        updatedMatchData={updatedMatchData}
        innings={innings}
        score={score}
        wickets={wickets}
        overs={overs}
        balls={balls}
        innings1Score={innings1Score}
        players={players}
        allPlayers={allPlayers}
        onChangePlayersConfirm={onChangePlayersConfirm}
        onChangeOversConfirm={onChangeOversConfirm}
        onChangeBowlerLimitConfirm={onChangeBowlerLimitConfirm}
        onDismissBowlerConfirm={onDismissBowlerConfirm}
        onNoResultConfirm={onNoResultConfirm}
        onOpenPlayerDatabase={onOpenPlayerDatabase}
        playerDB={playerDB}
      />

      {modalStates.showRenameModal && modalStates.renameTarget && (
        <RenameModal
          playerId={modalStates.renameTarget.playerId}
          currentName={modalStates.renameTarget.displayName}
          onConfirm={(playerId, newName) =>
            modalStates.renameTarget.isBowler
              ? onRenameBowlerConfirm(playerId, newName)
              : onRenameConfirm(playerId, newName)
          }
          onClose={modalStates.closeRenameModal}
        />
      )}

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

      {modalStates.showBowlerStats && modalStates.bowlerStatsTarget && (
        <BowlerStatsModal
          bowler={modalStates.bowlerStatsTarget}
          stats={statsForBowler}
          onRename={(playerId, displayName) => {
            modalStates.closeBowlerStats();
            modalStates.openRenameModal(playerId, displayName);
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
