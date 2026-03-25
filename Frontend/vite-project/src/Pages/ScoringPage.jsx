import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import BrandTitle from "../Components/BrandTitle";
import ScoreHeader from "../Components/Scoring/ScoreHeader";
import InfoStrip from "../Components/Scoring/InfoStrip";
import OverBalls from "../Components/Scoring/OverBalls";
import BatsmenRow from "../Components/Scoring/BatsmenRow";
import RunControls from "../Components/Scoring/RunControls";
import ModalManager from "../Components/Scoring/ModalManager";
import HatTrickBanner from "../Components/Scoring/HatTrickBanner";
import styles from "../Components/Scoring/scoring.module.css";

import useMatchEngine from "../hooks/useMatchEngine";
import usePlayersAndBowlers from "../hooks/usePlayersAndBowlers";
import usePartnerships from "../hooks/usePartnerships";
import useModalStates from "../hooks/useModalStates";
import useWicketFlow from "../hooks/useWicketFlow";
import useInningsData from "../hooks/useInningsData";
import useHistorySnapshot from "../hooks/useHistorySnapshot";
import useHatTrick from "../hooks/useHatTrick";
import SuperOverModal from "../Components/Scoring/SuperOverModal";
import FullScorecard from "../Components/Scoring/FullScorecard";

function ScoringPage() {
  const location = useLocation();
  const matchData = location.state || {};
  const [updatedMatchData, setUpdatedMatchData] = useState(matchData);

  const innings2SnapshotCountRef = useRef(0);
  const currentInningsRef = useRef(1);
  const initialStrikerRef = useRef(null);
  const initialNonStrikerRef = useRef(null);

  // ✅ Real match data captured synchronously BEFORE super over resets anything
  const realMatchInnings1DataRef = useRef(null);
  const realMatchInnings2DataRef = useRef(null);

  // ✅ Guards to ensure SO data save effects fire exactly ONCE per super over
  const soInnings1SavedRef = useRef(false);
  const soCompleteSavedRef = useRef(false);

  const modalStates = useModalStates();
  const wicketFlow = useWicketFlow();
  const hatTrickHook = useHatTrick();

  const playersHook = usePlayersAndBowlers(updatedMatchData);
  const partnershipsHook = usePartnerships();
  const engine = useMatchEngine(updatedMatchData, playersHook.swapStrike);

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
    engine.innings1History,
    engine.winner,
    engine.extras,
    engine.innings1Extras
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
    engine.extras
  );

  useEffect(() => {
    if (engine.innings === 1) {
      innings2SnapshotCountRef.current = 0;
    } else if (engine.innings === 2) {
      hatTrickHook.resetTracker();
    }
  }, [engine.innings]);

  useEffect(() => {
    if (playersHook.players.length === 0) {
      modalStates.setShowStartModal(true);
    }
  }, []);

  useEffect(() => {
    if (!engine.overCompleteEvent) return;
    const lastBowlerIndex = playersHook.currentBowlerIndex;
    playersHook.requestNewBowler(lastBowlerIndex);
    engine.setOverCompleteEvent(null);
  }, [engine.overCompleteEvent, playersHook.currentBowlerIndex]);

  // ✅ FIX: Capture SO innings 1 data exactly once when inningsChangeEvent.superOver fires
  useEffect(() => {
    if (!engine.inningsChangeEvent?.superOver) return;
    if (engine.innings !== 2) return;
    if (soInnings1SavedRef.current) return; // guard: only once per SO

    soInnings1SavedRef.current = true;
    const soInnings1Data = inningsDataHook.innings1DataRef?.current;
    if (soInnings1Data) {
      engine.saveSuperOverInnings1Data(soInnings1Data);
      console.log("📸 SO innings 1 data saved for scorecard");
    }
  }, [engine.inningsChangeEvent, engine.innings]); // ✅ specific primitive deps, not whole objects

  // ✅ FIX: Capture SO innings 2 data exactly once when matchOver fires during a super over
  useEffect(() => {
    if (!engine.matchOver) return;
    if (!engine.isSuperOver) return;
    if (soCompleteSavedRef.current) return; // guard: only once per SO

    soCompleteSavedRef.current = true;
    const soInnings2Data = inningsDataHook.innings2Data;
    engine.saveSuperOverComplete(engine.superOverNumber, soInnings2Data);
    console.log(
      `📸 SO ${engine.superOverNumber} innings 2 data saved for scorecard`
    );
  }, [engine.matchOver, engine.isSuperOver, engine.superOverNumber]); // ✅ specific primitive deps

  const firstBattingTeam = matchData.battingFirst;
  const secondBattingTeam =
    matchData.battingFirst === matchData.teamA
      ? matchData.teamB
      : matchData.teamA;

  const currentBattingTeam = engine.isSuperOver
    ? engine.innings === 1
      ? secondBattingTeam
      : firstBattingTeam
    : engine.innings === 1
    ? firstBattingTeam
    : secondBattingTeam;

  const triggerSnapshotWithTracking = () => {
    historySnapshotHook.triggerSnapshot();
    if (currentInningsRef.current === 2) {
      innings2SnapshotCountRef.current += 1;
    }
  };

  const handleRunClick = (r) => {
    if (wicketFlow.waitingForRunoutRun) {
      wicketFlow.handleRunoutWithRuns(r);

      if (r > 0) {
        playersHook.addRunsToStriker(r);
        playersHook.addRunsToBowler(r);

        if (
          playersHook.strikerIndex >= 0 &&
          playersHook.players[playersHook.strikerIndex]
        ) {
          partnershipsHook.addRunsToPartnership(
            r,
            playersHook.players[playersHook.strikerIndex].playerId
          );
        }

        engine.addScore(r);
        engine.addRunToCurrentOver(r, true);

        if (r % 2 !== 0) playersHook.swapStrike();
      } else {
        playersHook.addBallToBowler();
        partnershipsHook.addBallToPartnership();
      }

      playersHook.registerWicket();
      return;
    }

    if (currentInningsRef.current === 2 && engine.score + r >= engine.target) {
      try {
        const finalData = inningsDataHook.captureCurrentInningsData(
          playersHook.players,
          playersHook.allPlayers,
          playersHook.bowlers,
          engine.completeHistory,
          engine.score,
          engine.wickets,
          engine.overs,
          engine.balls,
          engine.extras
        );
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
        console.warn(
          "⚠️ captureCurrentInningsData failed on winning run:",
          e.message
        );
      }
    }

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
        playersHook.players[playersHook.strikerIndex].playerId
      );
    }

    engine.handleRun(
      r,
      playersHook.players[playersHook.strikerIndex]?.playerId
    );

    const bowlerName =
      playersHook.bowlers[playersHook.currentBowlerIndex]?.displayName ||
      "Unknown";
    hatTrickHook.trackBall(bowlerName, false, false);
  };

  const handleRetiredHurt = () => {
    if (playersHook.players.length < 2) return;
    if (playersHook.isWicketPending) return;
    modalStates.setShowRetiredHurtModal(true);
  };

  const handleDismissBowler = () => {
    if (!playersHook.bowlers[playersHook.currentBowlerIndex]) return;
    modalStates.setShowDismissBowlerModal(true);
  };

  const handleDismissBowlerConfirm = (newBowlerName) => {
    playersHook.dismissCurrentBowler(newBowlerName);
    modalStates.setShowDismissBowlerModal(false);
  };

  const handleNoResult = () => {
    modalStates.setShowNoResultModal(true);
  };

  const handleNoResultConfirm = () => {
    modalStates.setShowNoResultModal(false);
    engine.endMatchNoResult();
    setTimeout(() => {
      const liveData = inningsDataHook.captureCurrentInningsData(
        playersHook.players,
        playersHook.allPlayers,
        playersHook.bowlers,
        engine.completeHistory,
        engine.score,
        engine.wickets,
        engine.overs,
        engine.balls,
        engine.extras
      );
      inningsDataHook.setInnings2Data(liveData);
      inningsDataHook.setMatchCompleted(true);
      modalStates.setShowSummary(true);
    }, 150);
  };

  const handleFielderConfirm = ({ fielder, newBatsman }) => {
    const bowlerName =
      playersHook.bowlers[playersHook.currentBowlerIndex]?.displayName ||
      "Unknown";
    let currentOutBatsman = playersHook.strikerIndex;

    if (wicketFlow.selectedWicketType === "runout") {
      // default striker, but may change later
      currentOutBatsman = playersHook.strikerIndex;
    }

    const currentBattingTeamKey =
      currentInningsRef.current === 1 ? "teamAPlayers" : "teamBPlayers";
    const currentTeamSize = engine.isSuperOver
      ? 3
      : Number(matchData[currentBattingTeamKey] || 11);
    const currentMaxWickets = engine.isSuperOver ? 2 : currentTeamSize - 1;
    const nextWickets = engine.wickets + 1;

    const uniqueBatsmenCount = new Set([
      ...playersHook.players.map((p) => p.displayName),
      newBatsman,
    ]).size;

    playersHook.setDismissal(
      wicketFlow.selectedWicketType,
      fielder,
      bowlerName,
      currentOutBatsman
    );

    const isRunout = wicketFlow.selectedWicketType === "runout";
    hatTrickHook.trackBall(bowlerName, true, isRunout);

    if (wicketFlow.selectedWicketType !== "runout") {
      playersHook.addWicketToBowler();
    }

    playersHook.addBallToBowler();

    partnershipsHook.addBallToPartnership();

    partnershipsHook.savePartnership(engine.score, nextWickets);
    partnershipsHook.resetPartnership();

    engine.handleWicket(
      wicketFlow.selectedWicketType === "runout",
      false,
      playersHook.players[currentOutBatsman]?.playerId,
      wicketFlow.pendingRunoutRuns !== null
    );

    const allWicketsFallen = nextWickets >= currentMaxWickets;

    if (allWicketsFallen) {
      wicketFlow.completeWicketFlow();
      setTimeout(() => triggerSnapshotWithTracking(), 100);
      return;
    }

    if (!engine.isSuperOver && uniqueBatsmenCount > currentTeamSize) {
      alert(
        `❌ Cannot add new batsman! Team only has ${currentTeamSize} players.`
      );
      wicketFlow.completeWicketFlow();
      return;
    }

    setTimeout(() => {
      const isReturnedPlayer = playersHook.retiredPlayersRef.current.some(
        (p) =>
          p.displayName.toLowerCase().trim() === newBatsman.toLowerCase().trim()
      );
      if (isReturnedPlayer) {
        playersHook.returnRetiredBatsman(newBatsman, currentOutBatsman);
      } else {
        playersHook.replaceBatsman(currentOutBatsman, newBatsman);
      }
    }, 50);

    setTimeout(() => {
      const nonStriker = playersHook.players[playersHook.nonStrikerIndex];
      partnershipsHook.startPartnership(
        { playerId: "new-" + Date.now(), displayName: newBatsman },
        nonStriker
          ? {
              playerId: nonStriker.playerId,
              displayName: nonStriker.displayName,
            }
          : { playerId: "", displayName: "Unknown" }
      );
    }, 150);

    wicketFlow.completeWicketFlow();
    playersHook.setIsWicketPending(false);
    setTimeout(() => triggerSnapshotWithTracking(), 200);
  };

  const undoLastBall = () => {
    if (
      currentInningsRef.current === 2 &&
      innings2SnapshotCountRef.current === 0
    ) {
      alert("⚠️ Cannot undo — no balls have been bowled yet in this innings.");
      return;
    }

    const last = historySnapshotHook.getLastSnapshot();
    if (!last) {
      alert("No balls to undo!");
      return;
    }

    historySnapshotHook.popSnapshot();

    if (currentInningsRef.current === 2) {
      innings2SnapshotCountRef.current = Math.max(
        0,
        innings2SnapshotCountRef.current - 1
      );
    }

    engine.restoreState(last);
    playersHook.restorePlayersState(last);
    playersHook.restoreBowlersState(last);
    partnershipsHook.restorePartnershipState(last);

    wicketFlow.cancelWicketFlow();
    playersHook.setIsWicketPending(false);
  };

  const handleChangePlayersConfirm = ({
    team,
    isBattingTeam,
    newCount,
    oldCount,
  }) => {
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

  const handleChangeOversConfirm = ({ newOvers, oldOvers }) => {
    const updated = { ...updatedMatchData, overs: newOvers };
    setUpdatedMatchData(updated);
    localStorage.setItem("matchData", JSON.stringify(updated));
    modalStates.setShowChangeOversModal(false);
    alert(`✅ Total overs changed from ${oldOvers} to ${newOvers}`);
  };

  const handleChangeBowlerLimitConfirm = ({ newLimit, oldLimit }) => {
    const updated = { ...updatedMatchData, maxOversPerBowler: newLimit };
    setUpdatedMatchData(updated);
    localStorage.setItem("matchData", JSON.stringify(updated));
    modalStates.setShowChangeBowlerLimitModal(false);
    alert(`✅ Bowler limit changed from ${oldLimit} to ${newLimit} overs`);
  };

  const handleWicketTypeSelectWithHitWicket = (wicketType) => {
    // ✅ FREE HIT RULE
    if (
      engine.isFreeHit &&
      wicketType !== "runout" &&
      wicketType !== "stumped"
    ) {
      alert("Only Run out or Stumping allowed on Free Hit");
      return;
    }

    wicketFlow.handleWicketTypeSelect(wicketType);

    if (wicketType === "hitwicket") {
      const bowlerName =
        playersHook.bowlers[playersHook.currentBowlerIndex]?.displayName ||
        "Unknown";

      let currentOutBatsman = playersHook.strikerIndex;

      if (wicketFlow.selectedWicketType === "runout") {
        if (wicketFlow.runoutBatsmanChoice === "nonStriker") {
          currentOutBatsman = playersHook.nonStrikerIndex;
        }
      }

      const nextWickets = engine.wickets + 1;

      playersHook.setDismissal(
        "hitwicket",
        null,
        bowlerName,
        currentOutBatsman
      );

      hatTrickHook.trackBall(bowlerName, true, false);

      playersHook.addWicketToBowler();

      partnershipsHook.addBallToPartnership();
      partnershipsHook.savePartnership(engine.score, nextWickets);
      partnershipsHook.resetPartnership();

      engine.handleWicket(
        false,
        true,
        playersHook.players[currentOutBatsman]?.playerId
      );

      playersHook.setOutBatsman(currentOutBatsman);
      playersHook.setIsWicketPending(true);

      triggerSnapshotWithTracking();
    }
  };

  const isNoResult = engine.winner === "NO RESULT";

  useEffect(() => {
    if (!engine.tieDetected) return;

    const nextSuperOverNumber = engine.isSuperOver
      ? engine.superOverNumber + 1
      : 1;

    console.log(
      `🏏 Tie detected — opening Super Over modal for SO ${nextSuperOverNumber}`
    );
    modalStates.openSuperOverModal(nextSuperOverNumber);
    engine.setTieDetected(false);
  }, [engine.tieDetected]);

  // ✅ FIX: Capture real match innings data SYNCHRONOUSLY before startSuperOver
  // resets any state. This is done inside handleStartSuperOver, not a useEffect.
  const handleStartSuperOver = () => {
    modalStates.closeSuperOverModal();

    // ✅ Snapshot real match data BEFORE engine.startSuperOver() wipes state
    if (!realMatchInnings1DataRef.current) {
      realMatchInnings1DataRef.current = inningsDataHook.innings1Data;
    }
    if (!realMatchInnings2DataRef.current) {
      realMatchInnings2DataRef.current = inningsDataHook.innings2Data;
    }

    const result = engine.startSuperOver(modalStates.superOverNumber);
    if (result === "SUPER_OVER_STARTED") {
      // ✅ Reset per-SO guards so the save effects can fire for the new SO
      soInnings1SavedRef.current = false;
      soCompleteSavedRef.current = false;

      playersHook.resetForNewInnings();
      partnershipsHook.resetPartnership();
      partnershipsHook.restorePartnershipState({
        partnershipRuns: 0,
        partnershipBalls: 0,
        striker1Contribution: 0,
        striker2Contribution: 0,
        partnershipHistory: [],
      });
      hatTrickHook.resetTracker();

      // ✅ Delay modal open so useInningsData's inningsChangeEvent effect
      // doesn't race and close the modal before it opens
      setTimeout(() => {
        engine.setInningsChangeEvent(null);
        modalStates.setShowStartModal(true);
      }, 100);
    }
  };

  const handleSkipSuperOver = () => {
    modalStates.closeSuperOverModal();
    engine.setTieDetected(false);
    engine.endMatchNoResult();
  };

  // ✅ For the scorecard summary: show real match data, not super over data
  const summaryInnings1Data = engine.isSuperOver
    ? realMatchInnings1DataRef.current
    : inningsDataHook.innings1Data;
  const summaryInnings2Data = engine.isSuperOver
    ? realMatchInnings2DataRef.current
    : inningsDataHook.innings2Data;

  return (
    <div className={styles.container}>
      <BrandTitle size="small" />

      {!modalStates.showSummary && (
        <>
          <ScoreHeader
            innings={engine.innings}
            teamName={currentBattingTeam}
            score={engine.score}
            wickets={engine.wickets}
            overs={engine.overs}
            balls={engine.balls}
            totalOvers={engine.isSuperOver ? 1 : updatedMatchData.overs}
            target={engine.target}
            isSuperOver={engine.isSuperOver}
            superOverNumber={engine.superOverNumber}
            toss={`${matchData.tossWinner} elected to ${
              matchData.battingFirst === matchData.tossWinner ? "bat" : "bowl"
            }`}
          />

          <InfoStrip
            overs={engine.overs}
            balls={engine.balls}
            bowler={
              playersHook.bowlers[playersHook.currentBowlerIndex]?.displayName
            }
            bowlers={playersHook.bowlers}
            currentBowlerIndex={playersHook.currentBowlerIndex}
            score={engine.score}
            target={engine.target}
            innings={engine.innings}
            totalOvers={engine.isSuperOver ? 1 : updatedMatchData.overs}
            isFreeHit={engine.isFreeHit}
            matchData={updatedMatchData}
            currentTeam={currentBattingTeam}
            onBowlerClick={modalStates.openBowlerStats}
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
              onStatsClick={modalStates.openPlayerStats}
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
              onLegBye={(r) => {
                triggerSnapshotWithTracking();
                playersHook.addBallToBowler();
                partnershipsHook.addExtraToPartnership(r);
                partnershipsHook.addBallToPartnership();
                engine.handleLegBye(r);
              }}
              onWicket={() => wicketFlow.startWicketFlow(engine.isFreeHit)}
              onSwapStrike={playersHook.swapStrike}
              onUndo={undoLastBall}
              onRetiredHurt={handleRetiredHurt}
              isWicketPending={playersHook.isWicketPending}
              onDismissBowler={handleDismissBowler}
              onNoResult={handleNoResult}
            />
          )}

          {engine.matchOver && isNoResult && (
            <div
              style={{
                textAlign: "center",
                marginTop: "24px",
                padding: "20px",
                background: "#1a0a2e",
                borderRadius: "12px",
                border: "2px solid #8e44ad",
              }}
            >
              <p
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#8e44ad",
                  margin: 0,
                }}
              >
                🌧️ NO RESULT
              </p>
              <p style={{ color: "#ccc", marginTop: "8px" }}>
                Match ended without a result
              </p>
            </div>
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
            onClick={() => modalStates.setShowFullScorecard(true)}
            style={{ background: "#1db954", color: "#000", fontWeight: "700" }}
          >
            📊 SCORECARD
          </button>
        )}
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
        retiredPlayers={playersHook.retiredPlayers}
        bowlers={playersHook.bowlers}
        currentBowlerIndex={playersHook.currentBowlerIndex}
        isWicketPending={playersHook.isWicketPending}
        isNewBowlerPending={playersHook.isNewBowlerPending}
        strikerIndex={playersHook.strikerIndex}
        partnershipHistory={partnershipsHook.partnershipHistory}
        innings1Data={summaryInnings1Data}
        innings2Data={summaryInnings2Data}
        innings1Score={engine.realMatchInnings1Score ?? engine.innings1Score}
        innings2Score={engine.realMatchInnings2Score ?? engine.innings2Score}
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
        liveExtras={engine.extras}
        isSuperOver={engine.isSuperOver}
        superOverNumber={engine.superOverNumber}
        onStartInnings={(s, ns, b) => {
          playersHook.startInnings(s, ns, b);
          setTimeout(() => {
            const p = playersHook.players;
            initialStrikerRef.current = p[0]?.playerId ?? null;
            initialNonStrikerRef.current = p[1]?.playerId ?? null;
            partnershipsHook.startPartnership(
              p[0]
                ? { playerId: p[0].playerId, displayName: p[0].displayName }
                : { playerId: "", displayName: s },
              p[1]
                ? { playerId: p[1].playerId, displayName: p[1].displayName }
                : { playerId: "", displayName: ns }
            );
          }, 50);
          modalStates.setShowStartModal(false);
        }}
        onConfirmNewBatsman={(name) => {
          const isReturnedPlayer = playersHook.retiredPlayersRef.current.some(
            (p) =>
              p.displayName.toLowerCase().trim() === name.toLowerCase().trim()
          );
          if (isReturnedPlayer) {
            playersHook.returnRetiredBatsman(name, playersHook.outBatsman);
            playersHook.setIsWicketPending(false);
            setTimeout(() => {
              const p = playersHook.players;
              partnershipsHook.startPartnership(
                p[0]
                  ? { playerId: p[0].playerId, displayName: p[0].displayName }
                  : { playerId: "", displayName: "" },
                p[1]
                  ? { playerId: p[1].playerId, displayName: p[1].displayName }
                  : { playerId: "", displayName: "" }
              );
            }, 50);
          } else {
            playersHook.replaceBatsman(playersHook.outBatsman, name);
            playersHook.setIsWicketPending(false);
            setTimeout(() => {
              const p = playersHook.players;
              partnershipsHook.startPartnership(
                p[0]
                  ? { playerId: p[0].playerId, displayName: p[0].displayName }
                  : { playerId: "", displayName: "" },
                p[1]
                  ? { playerId: p[1].playerId, displayName: p[1].displayName }
                  : { playerId: "", displayName: "" }
              );
            }, 50);
          }
        }}
        onRetiredHurtConfirm={(newBatsmanName) => {
          playersHook.retireBatsman(newBatsmanName);
          modalStates.setShowRetiredHurtModal(false);
          setTimeout(() => {
            const p = playersHook.players;
            const striker = p[playersHook.strikerIndex];
            const nonStriker = p[playersHook.nonStrikerIndex];
            partnershipsHook.startPartnership(
              striker
                ? {
                    playerId: striker.playerId,
                    displayName: striker.displayName,
                  }
                : { playerId: "", displayName: newBatsmanName },
              nonStriker
                ? {
                    playerId: nonStriker.playerId,
                    displayName: nonStriker.displayName,
                  }
                : { playerId: "", displayName: "" }
            );
          }, 50);
        }}
        onReturnRetiredConfirm={(retiredPlayerName) => {
          playersHook.returnRetiredBatsman(
            retiredPlayerName,
            playersHook.outBatsman
          );
          playersHook.setIsWicketPending(false);
          setTimeout(() => {
            const p = playersHook.players;
            partnershipsHook.startPartnership(
              p[0]
                ? { playerId: p[0].playerId, displayName: p[0].displayName }
                : { playerId: "", displayName: "" },
              p[1]
                ? { playerId: p[1].playerId, displayName: p[1].displayName }
                : { playerId: "", displayName: "" }
            );
          }, 50);
        }}
        onConfirmNewBowler={playersHook.confirmNewBowler}
        onWicketTypeSelect={handleWicketTypeSelectWithHitWicket}
        onFielderConfirm={handleFielderConfirm}
        onFielderCancel={wicketFlow.cancelWicketFlow}
        onChangePlayersConfirm={handleChangePlayersConfirm}
        onChangeOversConfirm={handleChangeOversConfirm}
        onChangeBowlerLimitConfirm={handleChangeBowlerLimitConfirm}
        onDismissBowlerConfirm={handleDismissBowlerConfirm}
        onNoResultConfirm={handleNoResultConfirm}
        onRenameConfirm={(playerId, newName) =>
          playersHook.renamePlayer(playerId, newName)
        }
        onRenameBowlerConfirm={(playerId, newName) =>
          playersHook.renameBowler(playerId, newName)
        }
        renameModalState={modalStates}
        onStatsClick={modalStates.openPlayerStats}
        initialStrikerPlayerId={initialStrikerRef.current}
        initialNonStrikerPlayerId={initialNonStrikerRef.current}
        nonStrikerIndex={playersHook.nonStrikerIndex}
      />

      {/* Hat-trick celebration banner */}
      {hatTrickHook.showHatTrick && (
        <HatTrickBanner
          bowlerName={hatTrickHook.hatTrickBowler}
          onClose={hatTrickHook.closeHatTrick}
        />
      )}

      {/* Super Over modal */}
      {modalStates.showSuperOverModal && (
        <SuperOverModal
          teamA={matchData.teamA}
          teamB={matchData.teamB}
          battingFirst={secondBattingTeam}
          superOverNumber={modalStates.superOverNumber}
          onStart={handleStartSuperOver}
          onSkip={handleSkipSuperOver}
        />
      )}

      {/* Full Scorecard */}
      {modalStates.showFullScorecard && (
        <FullScorecard
          matchData={matchData}
          mainMatchData={{
            innings1Data:
              realMatchInnings1DataRef.current ?? inningsDataHook.innings1Data,
            innings2Data:
              realMatchInnings2DataRef.current ?? inningsDataHook.innings2Data,
            realInnings1Score: engine.realMatchInnings1Score,
            realInnings2Score: engine.realMatchInnings2Score,
          }}
          superOverData={engine.superOverHistory}
          firstBattingTeam={firstBattingTeam}
          secondBattingTeam={secondBattingTeam}
          onClose={() => modalStates.setShowFullScorecard(false)}
        />
      )}
    </div>
  );
}

export default ScoringPage;
