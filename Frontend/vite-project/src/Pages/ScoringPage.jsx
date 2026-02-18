import { useState, useEffect, useRef } from "react";
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

  // ✅ FIX: Use a ref for the counter AND a ref for the current innings value.
  // This completely eliminates stale closure problems — refs are always live.
  const innings2SnapshotCountRef = useRef(0);
  const currentInningsRef = useRef(1); // mirrors engine.innings, always current

  /* ================= CUSTOM HOOKS ================= */
  const modalStates = useModalStates();
  const wicketFlow = useWicketFlow();

  const playersHook = usePlayersAndBowlers(updatedMatchData);
  const partnershipsHook = usePartnerships();
  const engine = useMatchEngine(updatedMatchData, playersHook.swapStrike);

  // ✅ Keep currentInningsRef in sync with engine.innings on every render
  currentInningsRef.current = engine.innings;

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
    engine.innings1History
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
    playersHook.outBatsman,
    playersHook.retiredPlayers,
    engine.innings,
  );

  // Reset counter when innings transitions back to 1
  useEffect(() => {
    if (engine.innings === 1) {
      innings2SnapshotCountRef.current = 0;
    }
  }, [engine.innings]);

  /* ================= SHOW START INNINGS MODAL ON MOUNT ================= */
  useEffect(() => {
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

  /* ================= SNAPSHOT HELPER ================= */
  // ✅ FIX: Reads innings from currentInningsRef.current (always live, never stale)
  // instead of engine.innings (which is a closure-captured value and can be stale).
  const triggerSnapshotWithTracking = () => {
    historySnapshotHook.triggerSnapshot();
    if (currentInningsRef.current === 2) {
      innings2SnapshotCountRef.current += 1;
      console.log(`📸 Innings2 snapshot count: ${innings2SnapshotCountRef.current}`);
    }
  };

  /* ================= HANDLE RUN CLICK ================= */
  const handleRunClick = (r) => {
    // ── Runout path ──────────────────────────────────────────────────────────
    if (wicketFlow.waitingForRunoutRun) {
      wicketFlow.handleRunoutWithRuns(r);

      if (r > 0) {
        playersHook.addRunsToStriker(r);
        playersHook.addRunsToBowler(r);
        playersHook.addBallToBowler();

        if (
          playersHook.strikerIndex >= 0 &&
          playersHook.players[playersHook.strikerIndex]
        ) {
          partnershipsHook.addRunsToPartnership(
            r,
            playersHook.players[playersHook.strikerIndex].name
          );
        }

        engine.addScore(r);
        // ✅ isWicket=true so OverBalls renders "W+1" not "1"
        engine.addRunToCurrentOver(r, true);

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

    // ── Innings 2 win condition ───────────────────────────────────────────────
    // ✅ try/catch so a crash in captureCurrentInningsData NEVER blocks engine.handleRun()
    if (currentInningsRef.current === 2 && engine.score + r >= engine.target) {
      try {
        const finalData = inningsDataHook.captureCurrentInningsData();
        if (
          finalData &&
          finalData.battingStats &&
          finalData.battingStats[playersHook.strikerIndex]
        ) {
          finalData.battingStats[playersHook.strikerIndex].runs += r;
          finalData.battingStats[playersHook.strikerIndex].balls += 1;
          inningsDataHook.setInnings2Data(finalData);
        }
      } catch (e) {
        console.warn("⚠️ captureCurrentInningsData failed on winning run:", e.message);
      }
      // Intentional fall-through — engine.handleRun() must still execute below
    }

    // ── Normal run ───────────────────────────────────────────────────────────
    triggerSnapshotWithTracking();
    playersHook.addRunsToStriker(r);
    playersHook.addRunsToBowler(r);
    playersHook.addBallToBowler();

    if (
      playersHook.strikerIndex >= 0 &&
      playersHook.players[playersHook.strikerIndex]
    ) {
      partnershipsHook.addRunsToPartnership(
        r,
        playersHook.players[playersHook.strikerIndex].name
      );
    }

    engine.handleRun(r);
  };

  /* ================= HANDLE RETIRED HURT ================= */
  const handleRetiredHurt = () => {
    if (playersHook.players.length < 2) return;
    modalStates.setShowRetiredHurtModal(true);
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

    const currentBattingTeamKey =
      currentInningsRef.current === 1 ? "teamAPlayers" : "teamBPlayers";
    const currentTeamSize = Number(matchData[currentBattingTeamKey] || 11);
    const currentMaxWickets = currentTeamSize - 1;
    const nextWickets = engine.wickets + 1;

    const uniqueBatsmenCount = new Set([
      ...playersHook.players.map((p) => p.name),
      newBatsman,
    ]).size;

    playersHook.setDismissal(
      wicketFlow.selectedWicketType,
      fielder,
      bowlerName,
      currentOutBatsman
    );

    if (wicketFlow.selectedWicketType !== "runout") {
      playersHook.addWicketToBowler();
    } else if (
      wicketFlow.pendingRunoutRuns === null ||
      wicketFlow.pendingRunoutRuns === 0
    ) {
      playersHook.addBallToBowler();
    }

    if (
      wicketFlow.pendingRunoutRuns === null ||
      wicketFlow.pendingRunoutRuns === 0
    ) {
      partnershipsHook.addBallToPartnership();
    }

    partnershipsHook.savePartnership(engine.score, nextWickets);
    partnershipsHook.resetPartnership();

    engine.handleWicket(wicketFlow.selectedWicketType === "runout");

    const allWicketsFallen = nextWickets >= currentMaxWickets;

    if (allWicketsFallen) {
      console.log("🚫 All wickets fallen - innings will end");
      wicketFlow.completeWicketFlow();
      setTimeout(() => triggerSnapshotWithTracking(), 100);
      return;
    }

    if (uniqueBatsmenCount > currentTeamSize) {
      alert(`❌ Cannot add new batsman! Team only has ${currentTeamSize} players.`);
      wicketFlow.completeWicketFlow();
      return;
    }

    setTimeout(() => {
      const isReturnedPlayer = playersHook.retiredPlayersRef.current.some(
        (p) => p.name.toLowerCase().trim() === newBatsman.toLowerCase().trim()
      );
      if (isReturnedPlayer) {
        console.log(`🏥 Returning retired-hurt player via fielder confirm: ${newBatsman}`);
        playersHook.returnRetiredBatsman(newBatsman, currentOutBatsman);
      } else {
        playersHook.replaceBatsman(currentOutBatsman, newBatsman);
      }
    }, 50);

    setTimeout(() => {
      const nonStrikerName =
        playersHook.players[playersHook.nonStrikerIndex]?.name || "Unknown";
      partnershipsHook.startPartnership(newBatsman, nonStrikerName);
    }, 150);

    wicketFlow.completeWicketFlow();
    playersHook.setIsWicketPending(false);
    setTimeout(() => triggerSnapshotWithTracking(), 200);
  };

  /* ================= UNDO LAST BALL ================= */
  const undoLastBall = () => {
    // ✅ FIX: Use currentInningsRef.current (live) not engine.innings (stale closure)
    if (currentInningsRef.current === 2 && innings2SnapshotCountRef.current === 0) {
      alert("⚠️ Cannot undo — no balls have been bowled yet in this innings.");
      return;
    }

    const last = historySnapshotHook.getLastSnapshot();

    if (!last) {
      alert("No balls to undo!");
      return;
    }

    console.log("↩️ Undoing to state:", last);

    historySnapshotHook.popSnapshot();

    if (currentInningsRef.current === 2) {
      innings2SnapshotCountRef.current = Math.max(
        0,
        innings2SnapshotCountRef.current - 1
      );
      console.log(`↩️ Innings2 snapshot count after undo: ${innings2SnapshotCountRef.current}`);
    }

    engine.restoreState(last);
    playersHook.restorePlayersState(last);
    playersHook.restoreBowlersState(last);
    partnershipsHook.restorePartnershipState(last);

    wicketFlow.cancelWicketFlow();
    playersHook.setIsWicketPending(false);
  };

  /* ================= HANDLE CHANGE PLAYERS ================= */
  const handleChangePlayersConfirm = ({ team, isBattingTeam, newCount, oldCount }) => {
    const updated = { ...updatedMatchData };
    if (engine.innings === 1) {
      updated[isBattingTeam ? "teamAPlayers" : "teamBPlayers"] = newCount;
    } else {
      updated[isBattingTeam ? "teamBPlayers" : "teamAPlayers"] = newCount;
    }
    setUpdatedMatchData(updated);
    localStorage.setItem("matchData", JSON.stringify(updated));
    modalStates.setShowChangePlayersModal(false);
    alert(`✅ ${team} player count changed from ${oldCount} to ${newCount}`);
  };

  /* ================= HANDLE CHANGE OVERS ================= */
  const handleChangeOversConfirm = ({ newOvers, oldOvers }) => {
    const updated = { ...updatedMatchData, overs: newOvers };
    setUpdatedMatchData(updated);
    localStorage.setItem("matchData", JSON.stringify(updated));
    modalStates.setShowChangeOversModal(false);
    alert(`✅ Total overs changed from ${oldOvers} to ${newOvers}`);
  };

  /* ================= HANDLE CHANGE BOWLER LIMIT ================= */
  const handleChangeBowlerLimitConfirm = ({ newLimit, oldLimit }) => {
    const updated = { ...updatedMatchData, maxOversPerBowler: newLimit };
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
            teamName={engine.innings === 1 ? firstBattingTeam : secondBattingTeam}
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
            bowler={playersHook.bowlers[playersHook.currentBowlerIndex]?.name}
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
                triggerSnapshotWithTracking();
                playersHook.addRunsToBowler(1);
                partnershipsHook.addExtraToPartnership(1);
                engine.handleWide();
              }}
              onNoBall={() => {
                triggerSnapshotWithTracking();
                playersHook.addRunsToBowler(1);
                partnershipsHook.addExtraToPartnership(1);
                engine.handleNoBall();
              }}
              onBye={(r) => {
                triggerSnapshotWithTracking();
                playersHook.addBallToBowler();
                partnershipsHook.addExtraToPartnership(r);
                partnershipsHook.addBallToPartnership();
                engine.handleBye(r);
              }}
              onWicket={() => wicketFlow.startWicketFlow(engine.isFreeHit)}
              onSwapStrike={playersHook.swapStrike}
              onUndo={undoLastBall}
              onRetiredHurt={handleRetiredHurt}
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
            📊 Previous Partnerships ({partnershipsHook.partnershipHistory.length})
          </button>
        )}
        <button className={styles.utilityBtn} onClick={() => modalStates.setShowInningsHistory(true)}>
          📋 Innings History
        </button>
        <button className={styles.utilityBtn} onClick={() => modalStates.setShowInningsSummary(true)}>
          📄 Innings Summary
        </button>
        <button className={styles.utilityBtn} onClick={() => modalStates.setShowComparisonGraph(true)}>
          📈 Comparison Graph
        </button>
        <button className={styles.utilityBtn} onClick={() => modalStates.setShowMoreMenu(true)}>
          ⚙ MORE
        </button>
        {inningsDataHook.matchCompleted && (
          <button className={styles.utilityBtn} onClick={() => modalStates.setShowSummary(true)}>
            🏆 Match Summary
          </button>
        )}
      </div>

      <ModalManager
        modalStates={modalStates}
        wicketFlow={wicketFlow}
        players={playersHook.players}
        allPlayers={playersHook.allPlayers}
        retiredPlayers={playersHook.retiredPlayers}
        bowlers={playersHook.bowlers}
        isWicketPending={playersHook.isWicketPending}
        isNewBowlerPending={playersHook.isNewBowlerPending}
        strikerIndex={playersHook.strikerIndex}
        partnershipHistory={partnershipsHook.partnershipHistory}
        innings1Data={inningsDataHook.innings1Data}
        innings2Data={inningsDataHook.innings2Data}
        innings1Score={engine.innings1Score}
        innings2Score={engine.innings2Score}
        innings1HistoryRef={inningsDataHook.innings1HistoryRef}
        innings1History={
          engine.innings === 1
            ? engine.completeHistory
            : engine.innings1History || engine.innings1HistoryRef?.current || []
        }
        innings2History={engine.innings === 2 ? engine.completeHistory : []}
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
          const isReturnedPlayer = playersHook.retiredPlayersRef.current.some(
            (p) => p.name.toLowerCase().trim() === name.toLowerCase().trim()
          );
          if (isReturnedPlayer) {
            console.log(`🏥 Returning retired-hurt player via new batsman modal: ${name}`);
            playersHook.returnRetiredBatsman(name, playersHook.outBatsman);
            playersHook.setIsWicketPending(false);
            setTimeout(() => {
              partnershipsHook.startPartnership(
                playersHook.players[0]?.name || "",
                playersHook.players[1]?.name || ""
              );
            }, 50);
          } else {
            playersHook.confirmNewBatsman(name);
            partnershipsHook.startPartnership(
              playersHook.players[0].name,
              playersHook.players[1].name
            );
          }
        }}
        onRetiredHurtConfirm={(newBatsmanName) => {
          playersHook.retireBatsman(newBatsmanName);
          modalStates.setShowRetiredHurtModal(false);
          setTimeout(() => {
            partnershipsHook.startPartnership(
              playersHook.players[playersHook.strikerIndex]?.name || newBatsmanName,
              playersHook.players[playersHook.nonStrikerIndex]?.name || ""
            );
          }, 50);
        }}
        onReturnRetiredConfirm={(retiredPlayerName) => {
          playersHook.returnRetiredBatsman(retiredPlayerName, playersHook.outBatsman);
          playersHook.setIsWicketPending(false);
          setTimeout(() => {
            partnershipsHook.startPartnership(
              playersHook.players[0]?.name || "",
              playersHook.players[1]?.name || ""
            );
          }, 50);
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
