import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import BrandTitle from "../Components/BrandTitle";
import ScoreHeader from "../Components/Scoring/ScoreHeader";
import InfoStrip from "../Components/Scoring/InfoStrip";
import OverBalls from "../Components/Scoring/OverBalls";
import BatsmenRow from "../Components/Scoring/BatsmenRow";
import RunControls from "../Components/Scoring/RunControls";
import ModalManager from "../Components/Scoring/ModalManager";
import styles from "../Components/Scoring/scoring.module.css";

// Custom Hooks
import useMatchEngine from "../hooks/useMatchEngine";
import usePlayersAndBowlers from "../hooks/usePlayersAndBowlers";
import usePartnerships from "../hooks/usePartnerships";
import useModalStates from "../hooks/useModalStates";
import useWicketFlow from "../hooks/useWicketFlow";
import useInningsData from "../hooks/useInningsData";
import useHistorySnapshot from "../hooks/useHistorySnapshot";

function ScoringPage() {
  const location = useLocation();
  const matchData = location.state || {};
  const [updatedMatchData, setUpdatedMatchData] = useState(matchData);

  /* ================= CUSTOM HOOKS ================= */
  const modalStates = useModalStates();
  const wicketFlow = useWicketFlow();
  
  const playersHook = usePlayersAndBowlers(updatedMatchData);
  const partnershipsHook = usePartnerships();
  const engine = useMatchEngine(updatedMatchData, playersHook.swapStrike);

  const inningsDataHook = useInningsData(
    engine.completeHistory,
    playersHook.players,
    playersHook.allPlayers,
    playersHook.bowlers,
    engine.score,
    engine.wickets,
    engine.overs,
    engine.balls,
    engine.innings,
    engine.inningsChangeEvent,
    engine.setInningsChangeEvent,
    engine.matchOver,
    partnershipsHook.partnershipRuns,
    partnershipsHook.partnershipBalls,
    playersHook.strikerIndex,
    playersHook.nonStrikerIndex,
    partnershipsHook.savePartnership,
    playersHook.restorePlayersState,
    playersHook.restoreBowlersState,
    partnershipsHook.restorePartnershipState,
    modalStates.setShowStartModal,
    engine.innings1Score,
    engine.innings2Score,
    engine.innings1History  // ✅ captured inside engine before reset
  );
  
  const historySnapshotHook = useHistorySnapshot(
    modalStates.showStartModal,
    playersHook.players,
    playersHook.allPlayers,
    playersHook.bowlers,
    engine.score,
    engine.wickets,
    engine.balls,
    engine.overs,
    engine.currentOver,
    engine.completeHistory,
    playersHook.strikerIndex,
    playersHook.nonStrikerIndex,
    partnershipsHook.partnershipRuns,
    partnershipsHook.partnershipBalls,
    partnershipsHook.striker1Contribution,
    partnershipsHook.striker2Contribution,
    playersHook.currentBowlerIndex,
    partnershipsHook.partnershipHistory,
    playersHook.isWicketPending,
    playersHook.outBatsman
  );

  /* ================= SHOW START INNINGS MODAL ON MOUNT ================= */
  useEffect(() => {
    // Show the start innings modal when page loads (if no players selected yet)
    if (playersHook.players.length === 0) {
      modalStates.setShowStartModal(true);
    }
  }, []);

  /* ================= OVER COMPLETE HANDLER ================= */
  useEffect(() => {
    if (!engine.overCompleteEvent) return;
    
    const lastBowlerIndex = playersHook.currentBowlerIndex;
    playersHook.requestNewBowler(lastBowlerIndex);
    engine.setOverCompleteEvent(null);
  }, [engine.overCompleteEvent, playersHook.currentBowlerIndex]);

  /* ================= TEAM NAMES ================= */
  const firstBattingTeam = matchData.battingFirst;
  const secondBattingTeam =
    matchData.battingFirst === matchData.teamA
      ? matchData.teamB
      : matchData.teamA;
  const currentBattingTeam =
    engine.innings === 1 ? firstBattingTeam : secondBattingTeam;

  /* ================= HANDLE RUN CLICK ================= */
  const handleRunClick = (r) => {
    // Handle runout
    if (wicketFlow.waitingForRunoutRun) {
      wicketFlow.handleRunoutWithRuns(r);
  
      if (r > 0) {
        playersHook.addRunsToStriker(r);
        playersHook.addRunsToBowler(r);
        playersHook.addBallToBowler();
        
        if (playersHook.strikerIndex >= 0 && playersHook.players[playersHook.strikerIndex]) {
          partnershipsHook.addRunsToPartnership(
            r,
            playersHook.players[playersHook.strikerIndex].name
          );
        }
        
        // ✅ FIX: Add score to scoreboard for run-outs with runs
        engine.addScore(r);
        
        // ✅ ADD THIS: Manually add the run to currentOver
        engine.addRunToCurrentOver(r);
        
        // Swap strike if odd runs
        if (r % 2 !== 0) {
          playersHook.swapStrike();
        }
      } else {
        playersHook.addBallToBowler();
        partnershipsHook.addBallToPartnership();
      }
  
      playersHook.registerWicket();
      return;
    }  

    // Normal run
    if (engine.innings === 2 && engine.score + r >= engine.target) {
      const finalData = inningsDataHook.captureCurrentInningsData();
      finalData.battingStats[playersHook.strikerIndex].runs += r;
      finalData.battingStats[playersHook.strikerIndex].balls += 1;
      inningsDataHook.setInnings2Data(finalData);
    }

    historySnapshotHook.triggerSnapshot();
    playersHook.addRunsToStriker(r);
    playersHook.addRunsToBowler(r);
    playersHook.addBallToBowler();
    
    // ✅ Safe check before accessing striker
    if (playersHook.strikerIndex >= 0 && playersHook.players[playersHook.strikerIndex]) {
      partnershipsHook.addRunsToPartnership(
        r,
        playersHook.players[playersHook.strikerIndex].name
      );
    }
    
    engine.handleRun(r);
  };

  /* ================= HANDLE FIELDER CONFIRM ================= */
  const handleFielderConfirm = ({ fielder, newBatsman }) => {
    const bowlerName =
      playersHook.bowlers[playersHook.currentBowlerIndex]?.name || "Unknown";
    const currentOutBatsman = playersHook.strikerIndex;

    console.log("✅ Fielder/New Batsman confirmed:", {
      fielder,
      newBatsman,
      selectedWicketType: wicketFlow.selectedWicketType,
      currentWickets: engine.wickets,
    });

    const currentBattingTeam =
      engine.innings === 1 ? "teamAPlayers" : "teamBPlayers";
    const currentTeamSize = Number(matchData[currentBattingTeam] || 11);
    const currentMaxWickets = currentTeamSize - 1;
    const nextWickets = engine.wickets + 1;

    const uniqueBatsmenCount = new Set([
      ...playersHook.players.map((p) => p.name),
      newBatsman,
    ]).size;

    // Step 1: Set dismissal info
    playersHook.setDismissal(
      wicketFlow.selectedWicketType,
      fielder,
      bowlerName,
      currentOutBatsman
    );

    // Step 2: Update bowler stats
    if (wicketFlow.selectedWicketType !== "runout") {
      playersHook.addWicketToBowler();
    } else if (
      wicketFlow.pendingRunoutRuns === null ||
      wicketFlow.pendingRunoutRuns === 0
    ) {
      playersHook.addBallToBowler();
    }

    // Step 3: Handle partnership
    if (
      wicketFlow.pendingRunoutRuns === null ||
      wicketFlow.pendingRunoutRuns === 0
    ) {
      partnershipsHook.addBallToPartnership();
    }

    partnershipsHook.savePartnership(engine.score, nextWickets);
    partnershipsHook.resetPartnership();

    // Step 4: Call handleWicket
    engine.handleWicket();

    const allWicketsFallen = nextWickets >= currentMaxWickets;

    // If all wickets fallen, don't add new batsman
    if (allWicketsFallen) {
      console.log("🚫 All wickets fallen - innings will end");
      wicketFlow.completeWicketFlow();
      setTimeout(() => historySnapshotHook.triggerSnapshot(), 100);
      return;
    }

    // Check team size constraint
    if (uniqueBatsmenCount > currentTeamSize) {
      alert(
        `❌ Cannot add new batsman! Team only has ${currentTeamSize} players.`
      );
      wicketFlow.completeWicketFlow();
      return;
    }

    // Replace batsman
    setTimeout(() => {
      playersHook.replaceBatsman(currentOutBatsman, newBatsman);
    }, 50);

    // Start new partnership
    setTimeout(() => {
      const nonStrikerName =
        playersHook.players[playersHook.nonStrikerIndex]?.name || "Unknown";
      partnershipsHook.startPartnership(newBatsman, nonStrikerName);
    }, 150);

    wicketFlow.completeWicketFlow();
    playersHook.setIsWicketPending(false);
    setTimeout(() => historySnapshotHook.triggerSnapshot(), 200);
  };

  /* ================= UNDO LAST BALL ================= */
  const undoLastBall = () => {
    const last = historySnapshotHook.getLastSnapshot();
    
    if (!last) {
      alert("No balls to undo!");
      return;
    }

    console.log("↩️ Undoing to state");
    historySnapshotHook.popSnapshot();

    engine.restoreState(last);
    playersHook.restorePlayersState(last);
    partnershipsHook.restorePartnershipState(last);
    playersHook.restoreBowlersState(last);

    wicketFlow.cancelWicketFlow();
    playersHook.setIsWicketPending(false);
  };

  /* ================= HANDLE CHANGE PLAYERS ================= */
  const handleChangePlayersConfirm = ({
    team,
    isBattingTeam,
    newCount,
    oldCount,
  }) => {
    const updated = { ...updatedMatchData };

    if (engine.innings === 1) {
      if (isBattingTeam) {
        updated.teamAPlayers = newCount;
      } else {
        updated.teamBPlayers = newCount;
      }
    } else {
      if (isBattingTeam) {
        updated.teamBPlayers = newCount;
      } else {
        updated.teamAPlayers = newCount;
      }
    }

    setUpdatedMatchData(updated);
    localStorage.setItem("matchData", JSON.stringify(updated));
    modalStates.setShowChangePlayersModal(false);
    alert(`✅ ${team} player count changed from ${oldCount} to ${newCount}`);
  };

  /* ================= HANDLE CHANGE OVERS ================= */
  const handleChangeOversConfirm = ({ newOvers, oldOvers }) => {
    const updated = { ...updatedMatchData };
    updated.overs = newOvers;

    setUpdatedMatchData(updated);
    localStorage.setItem("matchData", JSON.stringify(updated));
    modalStates.setShowChangeOversModal(false);
    alert(`✅ Total overs changed from ${oldOvers} to ${newOvers}`);
  };

  /* ================= HANDLE CHANGE BOWLER LIMIT ================= */
  const handleChangeBowlerLimitConfirm = ({ newLimit, oldLimit }) => {
    const updated = { ...updatedMatchData };
    updated.maxOversPerBowler = newLimit;

    setUpdatedMatchData(updated);
    localStorage.setItem("matchData", JSON.stringify(updated));
    modalStates.setShowChangeBowlerLimitModal(false);
    alert(`✅ Bowler limit changed from ${oldLimit} to ${newLimit} overs`);
  };

  return (
    <div className={styles.container}>
      <BrandTitle size="small" />

      {!modalStates.showSummary && (
        <>
          <ScoreHeader
            innings={engine.innings}
            teamName={
              engine.innings === 1 ? firstBattingTeam : secondBattingTeam
            }
            score={engine.score}
            wickets={engine.wickets}
            overs={engine.overs}
            balls={engine.balls}
            totalOvers={updatedMatchData.overs}
            target={engine.target}
          />

          <InfoStrip
            overs={engine.overs}
            balls={engine.balls}
            bowler={
              playersHook.bowlers[playersHook.currentBowlerIndex]?.name
            }
            bowlers={playersHook.bowlers}
            currentBowlerIndex={playersHook.currentBowlerIndex}
            score={engine.score}
            target={engine.target}
            innings={engine.innings}
            totalOvers={updatedMatchData.overs}
            isFreeHit={engine.isFreeHit}
            matchData={updatedMatchData}
            currentTeam={currentBattingTeam}
          />

          <OverBalls history={engine.currentOver} />

          {playersHook.players.length >= 2 && (
            <BatsmenRow
              striker={playersHook.players[playersHook.strikerIndex]}
              nonStriker={playersHook.players[playersHook.nonStrikerIndex]}
              partnershipRuns={partnershipsHook.partnershipRuns}
              partnershipBalls={partnershipsHook.partnershipBalls}
              matchData={updatedMatchData}
              currentTeam={currentBattingTeam}
              wickets={engine.wickets}
            />
          )}

          {!engine.matchOver && (
            <RunControls
              onRun={handleRunClick}
              onWide={() => {
                historySnapshotHook.triggerSnapshot();
                playersHook.addRunsToBowler(1);
                partnershipsHook.addExtraToPartnership(1);
                engine.handleWide();
              }}
              onNoBall={() => {
                historySnapshotHook.triggerSnapshot();
                playersHook.addRunsToBowler(1);
                partnershipsHook.addExtraToPartnership(1);
                engine.handleNoBall();
              }}
              onBye={(r) => {
                historySnapshotHook.triggerSnapshot();
                playersHook.addBallToBowler();
                partnershipsHook.addExtraToPartnership(r);
                partnershipsHook.addBallToPartnership();
                engine.handleBye(r);
              }}
              onWicket={() => wicketFlow.startWicketFlow(engine.isFreeHit)}
              onSwapStrike={playersHook.swapStrike}
              onUndo={undoLastBall}
            />
          )}
        </>
      )}

      <div className={styles.utilityRow}>
        {partnershipsHook.partnershipHistory.length > 0 && (
          <button
            className={styles.utilityBtn}
            onClick={() => modalStates.setShowPartnershipHistory(true)}
          >
            📊 Previous Partnerships (
            {partnershipsHook.partnershipHistory.length})
          </button>
        )}

        <button
          className={styles.utilityBtn}
          onClick={() => modalStates.setShowInningsHistory(true)}
        >
          📋 Innings History
        </button>

        <button
          className={styles.utilityBtn}
          onClick={() => modalStates.setShowInningsSummary(true)}
        >
          📄 Innings Summary
        </button>

        <button
          className={styles.utilityBtn}
          onClick={() => modalStates.setShowComparisonGraph(true)}
        >
          📈 Comparison Graph
        </button>

        <button
          className={styles.utilityBtn}
          onClick={() => modalStates.setShowMoreMenu(true)}
        >
          ⚙ MORE
        </button>

        {inningsDataHook.matchCompleted && (
          <button
            className={styles.utilityBtn}
            onClick={() => modalStates.setShowSummary(true)}
          >
            🏆 Match Summary
          </button>
        )}
      </div>

      <ModalManager
        modalStates={modalStates}
        wicketFlow={wicketFlow}
        players={playersHook.players}
        allPlayers={playersHook.allPlayers}
        bowlers={playersHook.bowlers}
        isWicketPending={playersHook.isWicketPending}
        isNewBowlerPending={playersHook.isNewBowlerPending}
        partnershipHistory={partnershipsHook.partnershipHistory}
        innings1Data={inningsDataHook.innings1Data}
        innings2Data={inningsDataHook.innings2Data}
        innings1Score={engine.innings1Score}
        innings2Score={engine.innings2Score}
        innings1HistoryRef={inningsDataHook.innings1HistoryRef}
        matchData={matchData}
        updatedMatchData={updatedMatchData}
        firstBattingTeam={firstBattingTeam}
        secondBattingTeam={secondBattingTeam}
        currentBattingTeam={currentBattingTeam}
        winner={engine.winner}
        score={engine.score}
        wickets={engine.wickets}
        overs={engine.overs}
        balls={engine.balls}
        completeHistory={engine.completeHistory}
        innings={engine.innings}
        onStartInnings={(s, ns, b) => {
          playersHook.startInnings(s, ns, b);
          partnershipsHook.startPartnership(s, ns);
          modalStates.setShowStartModal(false);
        }}
        onConfirmNewBatsman={(name) => {
          playersHook.confirmNewBatsman(name);
          partnershipsHook.startPartnership(
            playersHook.players[0].name,
            playersHook.players[1].name
          );
        }}
        onConfirmNewBowler={playersHook.confirmNewBowler}
        onWicketTypeSelect={wicketFlow.handleWicketTypeSelect}
        onFielderConfirm={handleFielderConfirm}
        onFielderCancel={wicketFlow.cancelWicketFlow}
        onChangePlayersConfirm={handleChangePlayersConfirm}
        onChangeOversConfirm={handleChangeOversConfirm}
        onChangeBowlerLimitConfirm={handleChangeBowlerLimitConfirm}
      />
    </div>
  );
}

export default ScoringPage;