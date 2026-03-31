import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import BrandTitle from "../Components/BrandTitle";
import ScoreHeader from "../Components/Scoring/ScoreHeader";
import InfoStrip from "../Components/Scoring/InfoStrip";
import OverBalls from "../Components/Scoring/OverBalls";
import BatsmenRow from "../Components/Scoring/BatsmenRow";
import RunControls from "../Components/Scoring/RunControls";
import ModalManager from "../Components/Scoring/ModalManager";
import styles from "../Components/Scoring/scoring.module.css";
import UtilityBar from "../Components/Scoring/UtilityBar";
import NoResultBanner from "../Components/Scoring/NoResultBanner";
import ScoringModals from "../Components/Scoring/ScoringModals";
import useMatchEngine from "../hooks/useMatchEngine";
import usePlayersAndBowlers from "../hooks/usePlayersAndBowlers";
import usePartnerships from "../hooks/usePartnerships";
import useModalStates from "../hooks/useModalStates";
import useWicketFlow from "../hooks/useWicketFlow";
import useInningsData from "../hooks/useInningsData";
import useHistorySnapshot from "../hooks/useHistorySnapshot";
import useHatTrick from "../hooks/useHatTrick";
import usePlayerDatabase from "../hooks/usePlayerDatabase";

function ScoringPage() {
  const location = useLocation();
  const matchData = location.state || {};
  const navigate = useNavigate();
  const [updatedMatchData, setUpdatedMatchData] = useState(matchData);

  const innings2SnapshotCountRef = useRef(0);
  const currentInningsRef = useRef(1);
  const initialStrikerRef = useRef(null);
  const initialNonStrikerRef = useRef(null);
  const realMatchInnings1DataRef = useRef(null);
  const realMatchInnings2DataRef = useRef(null);
  const soInnings1SavedRef = useRef(false);
  const soCompleteSavedRef = useRef(false);

  // ✅ PATCH 1: Per-innings jersey tracking Sets (replaces matchTeamLockRef)
  const teamABattersRef = useRef(new Set()); // jerseys that batted for Team A
  const teamBBattersRef = useRef(new Set()); // jerseys that batted for Team B
  const teamABowlersRef = useRef(new Set()); // jerseys that bowled/fielded for Team A
  const teamBBowlersRef = useRef(new Set());
  const dismissedPlayersRef = useRef(new Set());

  const modalStates = useModalStates();
  const wicketFlow = useWicketFlow();
  const hatTrickHook = useHatTrick();
  const playerDBHook = usePlayerDatabase();
  const playersHook = usePlayersAndBowlers(updatedMatchData, playerDBHook);
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

  // ✅ PATCH 2: Reset jersey Sets on every innings change
  useEffect(() => {
    if (engine.innings === 1) {
      innings2SnapshotCountRef.current = 0;
    } else if (engine.innings === 2) {
      hatTrickHook.resetTracker();
    }
    dismissedPlayersRef.current = new Set(); // ← keep this, wickets reset each innings
  }, [engine.innings]);

  useEffect(() => {
    if (playersHook.players.length === 0) modalStates.setShowStartModal(true);
  }, []);

  useEffect(() => {
    if (!engine.overCompleteEvent) return;
    const lastBowlerIndex = playersHook.currentBowlerIndex;
    engine.setOverCompleteEvent(null);
    playersHook.requestNewBowler(lastBowlerIndex);
  }, [engine.overCompleteEvent]);

  useEffect(() => {
    if (
      !engine.inningsChangeEvent?.superOver ||
      engine.innings !== 2 ||
      soInnings1SavedRef.current
    )
      return;
    soInnings1SavedRef.current = true;
    const soInnings1Data = inningsDataHook.innings1DataRef?.current;
    if (soInnings1Data) engine.saveSuperOverInnings1Data(soInnings1Data);
  }, [engine.inningsChangeEvent, engine.innings]);

  useEffect(() => {
    if (!engine.matchOver || !engine.isSuperOver || soCompleteSavedRef.current)
      return;
    soCompleteSavedRef.current = true;
    const soInnings2Data = inningsDataHook.captureCurrentInningsData(
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
    engine.saveSuperOverComplete(engine.superOverNumber, soInnings2Data);
  }, [engine.matchOver, engine.isSuperOver, engine.superOverNumber]);

  useEffect(() => {
    if (!engine.matchOver || !playerDBHook) return;
    [...playersHook.players, ...playersHook.allPlayers].forEach((p) => {
      if (!p?.playerId) return;
      playerDBHook.updatePlayerStats(p.playerId, {
        runs: p.runs || 0,
        balls: p.balls || 0,
        fours: p.fours || 0,
        sixes: p.sixes || 0,
        matches: 1,

        // ✅ ADD THESE
        thirties: (p.runs || 0) >= 30 ? 1 : 0,
        fifties: (p.runs || 0) >= 50 ? 1 : 0,
        hundreds: (p.runs || 0) >= 100 ? 1 : 0,
        ducks: (p.runs || 0) === 0 && p.dismissal ? 1 : 0,
        dotBalls: p.dotBalls || 0,
        ones: p.ones || 0,
        twos: p.twos || 0,
        threes: p.threes || 0,
      });
    });
    playersHook.bowlers.forEach((b) => {
      if (!b?.playerId) return;
      playerDBHook.updatePlayerStats(b.playerId, {
        wickets: b.wickets || 0,
        ballsBowled: (b.overs || 0) * 6 + (b.balls || 0),
        runsGiven: b.runs || 0,
        matches: 1,
      });
    });
  }, [engine.matchOver]);

  useEffect(() => {
    if (!engine.tieDetected) return;
    modalStates.openSuperOverModal(
      engine.isSuperOver ? engine.superOverNumber + 1 : 1
    );
    engine.setTieDetected(false);
  }, [engine.tieDetected]);

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

  // ✅ PATCH 3: Two focused helpers instead of lockJerseysToTeam
  const addBatterJersey = (jersey) => {
    if (!jersey) return;
    // Batting team in innings 1 = firstBattingTeam = teamA side
    if (engine.innings === 1) teamABattersRef.current.add(String(jersey));
    else teamBBattersRef.current.add(String(jersey));
  };

  const addBowlerJersey = (jersey) => {
    if (!jersey) return;
    // Bowling team in innings 1 = secondBattingTeam = teamB side
    if (engine.innings === 1) teamBBowlersRef.current.add(String(jersey));
    else teamABowlersRef.current.add(String(jersey));
  };

  const triggerSnapshotWithTracking = () => {
    historySnapshotHook.triggerSnapshot();
    if (currentInningsRef.current === 2) innings2SnapshotCountRef.current += 1;
  };

  const captureCurrentData = () =>
    inningsDataHook.captureCurrentInningsData(
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

  const startPartnershipFromPlayers = (p, fallback1 = "", fallback2 = "") => {
    partnershipsHook.startPartnership(
      p[0]
        ? { playerId: p[0].playerId, displayName: p[0].displayName }
        : { playerId: "", displayName: fallback1 },
      p[1]
        ? { playerId: p[1].playerId, displayName: p[1].displayName }
        : { playerId: "", displayName: fallback2 }
    );
  };

  const handleRunClick = (r) => {
    if (wicketFlow.waitingForRunoutRun) {
      wicketFlow.handleRunoutWithRuns(r);
      engine.handleWicket(
        true, // runout
        false,
        playersHook.players[playersHook.strikerIndex]?.playerId,
        true
      );
      if (r > 0) {
        playersHook.addRunsToStriker(r);

        const striker = playersHook.players[playersHook.strikerIndex];

        // ✅ FIRST BALL FACED
        if (striker && !striker.hasBatted) {
          striker.hasBatted = true;

          if (striker.playerId) {
            playerDBHook.updatePlayerStats(striker.playerId, {
              innings: 1,
            });
          }
        }
        if (r === 4 && striker) striker.fours = (striker.fours || 0) + 1;
        if (r === 6 && striker) striker.sixes = (striker.sixes || 0) + 1;

        if (striker?.playerId) {
          const runStats = {};
          if (r === 0) runStats.dotBalls = 1;
          else if (r === 1) runStats.ones = 1;
          else if (r === 2) runStats.twos = 1;
          else if (r === 3) runStats.threes = 1;
          if (Object.keys(runStats).length > 0) {
            playerDBHook.updatePlayerStats(striker.playerId, runStats);
          }
        }
        // ✅ ADD THIS (CRITICAL FIX)
        const bowler = playersHook.bowlers[playersHook.currentBowlerIndex];

        if (bowler && !bowler.hasBowled) {
          bowler.hasBowled = true;

          if (bowler.playerId) {
            playerDBHook.updatePlayerStats(bowler.playerId, {
              bowlingInnings: 1,
            });
          }
        }
        playersHook.addRunsToBowler(r);
        if (
          playersHook.strikerIndex >= 0 &&
          playersHook.players[playersHook.strikerIndex]
        )
          partnershipsHook.addRunsToPartnership(
            r,
            playersHook.players[playersHook.strikerIndex].playerId
          );
        engine.addScore(r);
        engine.addRunToCurrentOver(r, true);
        if (r % 2 !== 0) playersHook.swapStrike();
      } else {
        const bowler = playersHook.bowlers[playersHook.currentBowlerIndex];

        // ✅ FIRST BALL OF MATCH FOR THIS BOWLER
        if (bowler && !bowler.hasBowled) {
          bowler.hasBowled = true;

          if (bowler.playerId) {
            playerDBHook.updatePlayerStats(bowler.playerId, {
              bowlingInnings: 1,
            });
          }
        }
        playersHook.addBallToBowler();
        const striker = playersHook.players[playersHook.strikerIndex];

        if (striker?.playerId) {
          playerDBHook.updatePlayerStats(striker.playerId, {
            dotBalls: 1,
          });
        }

        if (bowler?.playerId && r === 0) {
          playerDBHook.updatePlayerStats(bowler.playerId, {
            dotBallsBowled: 1,
          });
        }
        partnershipsHook.addBallToPartnership();
      }
      engine.addRunToCurrentOver("W", false);
      playersHook.registerWicket();
      return;
    }

    if (currentInningsRef.current === 2 && engine.score + r >= engine.target) {
      try {
        const finalData = captureCurrentData();
        if (finalData?.battingStats?.[playersHook.strikerIndex]) {
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
    const striker = playersHook.players[playersHook.strikerIndex];
    // ✅ ADD THIS (MOST IMPORTANT FIX)
    if (striker && !striker.hasBatted) {
      striker.hasBatted = true;

      if (striker.playerId) {
        playerDBHook.updatePlayerStats(striker.playerId, {
          innings: 1,
        });
      }
    }

    if (striker?.playerId) {
      let stats = {
        ones: 0,
        twos: 0,
        threes: 0,
        dotBalls: 0,
        fours: 0, // ✅ ADD
        sixes: 0, // ✅ ADD
      };

      if (r === 1) stats.ones = 1;
      else if (r === 2) stats.twos = 1;
      else if (r === 3) stats.threes = 1;
      else if (r === 0) stats.dotBalls = 1;
      else if (r === 4) stats.fours = 1; // ✅ ADD
      else if (r === 6) stats.sixes = 1; // ✅ ADD

      playerDBHook.updatePlayerStats(striker.playerId, stats);
    }
    // ✅ ADD THIS BLOCK (FINAL FIX)
    const bowler = playersHook.bowlers[playersHook.currentBowlerIndex];

    if (bowler && !bowler.hasBowled) {
      bowler.hasBowled = true;

      if (bowler.playerId) {
        playerDBHook.updatePlayerStats(bowler.playerId, {
          bowlingInnings: 1,
        });
      }
    }
    playersHook.addRunsToBowler(r);
    playersHook.addBallToBowler();
    // AFTER playersHook.addBallToBowler(); in the normal run path, ADD:
    if (r === 0) {
      const bowler = playersHook.bowlers[playersHook.currentBowlerIndex];
      if (bowler?.playerId) {
        playerDBHook.updatePlayerStats(bowler.playerId, { dotBallsBowled: 1 });
      }
    }
    if (
      playersHook.strikerIndex >= 0 &&
      playersHook.players[playersHook.strikerIndex]
    )
      partnershipsHook.addRunsToPartnership(
        r,
        playersHook.players[playersHook.strikerIndex].playerId
      );
    engine.handleRun(
      r,
      playersHook.players[playersHook.strikerIndex]?.playerId
    );
    hatTrickHook.trackBall(
      playersHook.bowlers[playersHook.currentBowlerIndex]?.displayName ||
        "Unknown",
      false,
      false
    );
  };

  const handleRetiredHurt = () => {
    if (playersHook.players.length < 2 || playersHook.isWicketPending) return;
    modalStates.setShowRetiredHurtModal(true);
  };

  const handleDismissBowler = () => {
    if (!playersHook.bowlers[playersHook.currentBowlerIndex]) return;
    modalStates.setShowDismissBowlerModal(true);
  };

  // ✅ PATCH 8: Use addBowlerJersey
  const handleDismissBowlerConfirm = (bowlerData) => {
    const name = typeof bowlerData === "string" ? bowlerData : bowlerData.name;
    if (bowlerData?.jersey) addBowlerJersey(bowlerData.jersey);
    playersHook.dismissCurrentBowler(name);
    modalStates.setShowDismissBowlerModal(false);
  };

  const handleNoResultConfirm = () => {
    modalStates.setShowNoResultModal(false);
    engine.endMatchNoResult();
    setTimeout(() => {
      inningsDataHook.setInnings2Data(captureCurrentData());
      inningsDataHook.setMatchCompleted(true);
      modalStates.setShowSummary(true);
    }, 150);
  };

  // ✅ PATCH 9: Use per-innings batter set for fielder validation
  // ✅ IN ScoringPage.jsx, UPDATE handleFielderConfirm function:

  const handleFielderConfirm = ({ fielder, fielderJersey }) => {
    const bowlerName =
      playersHook.bowlers[playersHook.currentBowlerIndex]?.displayName ||
      "Unknown";
    const currentOutBatsman = playersHook.strikerIndex;
    const currentBattingTeamKey =
      currentInningsRef.current === 1 ? "teamAPlayers" : "teamBPlayers";
    const currentTeamSize = engine.isSuperOver
      ? 3
      : Number(matchData[currentBattingTeamKey] || 11);
    const currentMaxWickets = engine.isSuperOver ? 2 : currentTeamSize - 1;
    const nextWickets = engine.wickets + 1;

    // ✅ REMOVED: The batter validation from here
    // FielderInputModal already validates fielders can't be batters
    // This validation was BLOCKING BOWLERS from fielding (wrong!)

    // ✅ Add fielder's jersey to bowlers set
    if (fielderJersey) addBowlerJersey(fielderJersey);

    playersHook.setDismissal(
      wicketFlow.selectedWicketType,
      fielder,
      bowlerName,
      currentOutBatsman
    );

    const outPlayerId = playersHook.players[currentOutBatsman]?.playerId;
    if (outPlayerId) {
      dismissedPlayersRef.current.add(String(outPlayerId));
    }

    hatTrickHook.trackBall(
      bowlerName,
      true,
      wicketFlow.selectedWicketType === "runout"
    );

    if (wicketFlow.selectedWicketType !== "runout") {
      playersHook.addWicketToBowler();
    } else {
      playersHook.addBallToBowler();
    }

    partnershipsHook.addBallToPartnership();
    partnershipsHook.savePartnership(engine.score, nextWickets);
    partnershipsHook.resetPartnership();

    engine.handleWicket(
      wicketFlow.selectedWicketType === "runout",
      false,
      playersHook.players[currentOutBatsman]?.playerId,
      wicketFlow.pendingRunoutRuns !== null
    );

    if (fielderJersey) {
      playerDBHook.updateFieldingStats(
        fielderJersey,
        wicketFlow.selectedWicketType
      );
    }

    wicketFlow.setShowFielderInputModal(false);

    if (nextWickets >= currentMaxWickets) {
      wicketFlow.completeWicketFlow();
      playersHook.setIsWicketPending(false);
      setTimeout(() => triggerSnapshotWithTracking(), 100);
      return;
    }

    if (!engine.isSuperOver && playersHook.players.length >= currentTeamSize) {
      wicketFlow.completeWicketFlow();
      playersHook.setIsWicketPending(false);
      return;
    }

    playersHook.setOutBatsman(currentOutBatsman);
    playersHook.setIsWicketPending(true);

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
    if (currentInningsRef.current === 2)
      innings2SnapshotCountRef.current = Math.max(
        0,
        innings2SnapshotCountRef.current - 1
      );
    engine.restoreState(last);
    playersHook.restorePlayersState(last);
    playersHook.restoreBowlersState(last);
    partnershipsHook.restorePartnershipState(last);
    hatTrickHook.resetTracker();
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
    if (engine.innings === 1)
      updated[isBattingTeam ? "teamAPlayers" : "teamBPlayers"] = newCount;
    else updated[isBattingTeam ? "teamBPlayers" : "teamAPlayers"] = newCount;
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
    if (
      engine.isFreeHit &&
      wicketType !== "runout" &&
      wicketType !== "stumped"
    ) {
      alert("Only Run out or Stumping allowed on Free Hit");
      return;
    }
    wicketFlow.handleWicketTypeSelect(wicketType);
    if (wicketType !== "hitwicket") return;

    const bowlerName =
      playersHook.bowlers[playersHook.currentBowlerIndex]?.displayName ||
      "Unknown";
    const currentOutBatsman = playersHook.strikerIndex;
    const nextWickets = engine.wickets + 1;

    playersHook.setDismissal("hitwicket", null, bowlerName, currentOutBatsman);
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
  };

  const handleStartSuperOver = () => {
    modalStates.closeSuperOverModal();
    if (!realMatchInnings1DataRef.current)
      realMatchInnings1DataRef.current = inningsDataHook.innings1Data;
    if (!realMatchInnings2DataRef.current)
      realMatchInnings2DataRef.current = inningsDataHook.innings2Data;
    const result = engine.startSuperOver(modalStates.superOverNumber);
    if (result === "SUPER_OVER_STARTED") {
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

  const summaryInnings1Data = engine.isSuperOver
    ? realMatchInnings1DataRef.current
    : inningsDataHook.innings1Data;
  const summaryInnings2Data = engine.isSuperOver
    ? realMatchInnings2DataRef.current
    : inningsDataHook.innings2Data;
  const isNoResult = engine.winner === "NO RESULT";
  const activeBatterJerseys =
    engine.innings === 1 ? teamABattersRef.current : teamBBattersRef.current;
  const activeBowlerJerseys =
    engine.innings === 1 ? teamBBowlersRef.current : teamABowlersRef.current;

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

                const bowler =
                  playersHook.bowlers[playersHook.currentBowlerIndex];

                // ✅ BOWLING INNINGS FIX
                if (bowler && !bowler.hasBowled) {
                  bowler.hasBowled = true;

                  if (bowler.playerId) {
                    playerDBHook.updatePlayerStats(bowler.playerId, {
                      bowlingInnings: 1,
                    });
                  }
                }

                // ✅ BALL COUNT
                playersHook.addBallToBowler();

                // ✅ DB UPDATE
                if (bowler?.playerId) {
                  playerDBHook.updatePlayerStats(bowler.playerId, {
                    wides: 1,
                  });
                }

                playersHook.addRunsToBowler(1);
                partnershipsHook.addExtraToPartnership(1);
                engine.handleWide();
              }}
              onNoBall={() => {
                triggerSnapshotWithTracking();

                const bowler =
                  playersHook.bowlers[playersHook.currentBowlerIndex];

                // ✅ BOWLING INNINGS FIX
                if (bowler && !bowler.hasBowled) {
                  bowler.hasBowled = true;

                  if (bowler.playerId) {
                    playerDBHook.updatePlayerStats(bowler.playerId, {
                      bowlingInnings: 1,
                    });
                  }
                }

                // ✅ BALL COUNT
                playersHook.addBallToBowler();

                // ✅ DB UPDATE
                if (bowler?.playerId) {
                  playerDBHook.updatePlayerStats(bowler.playerId, {
                    noBalls: 1,
                  });
                }

                playersHook.addRunsToBowler(1);
                partnershipsHook.addExtraToPartnership(1);
                engine.handleNoBall();
              }}
              onBye={(r) => {
                triggerSnapshotWithTracking();

                const bowler =
                  playersHook.bowlers[playersHook.currentBowlerIndex];

                // ✅ BOWLING INNINGS FIX
                if (bowler && !bowler.hasBowled) {
                  bowler.hasBowled = true;

                  if (bowler.playerId) {
                    playerDBHook.updatePlayerStats(bowler.playerId, {
                      bowlingInnings: 1,
                    });
                  }
                }

                // ✅ ONLY ONE BALL (FIXED)
                playersHook.addBallToBowler();

                partnershipsHook.addExtraToPartnership(r);
                partnershipsHook.addBallToPartnership();

                engine.handleBye(r);
              }}
              onLegBye={(r) => {
                triggerSnapshotWithTracking();

                const bowler =
                  playersHook.bowlers[playersHook.currentBowlerIndex];

                // ✅ BOWLING INNINGS FIX
                if (bowler && !bowler.hasBowled) {
                  bowler.hasBowled = true;

                  if (bowler.playerId) {
                    playerDBHook.updatePlayerStats(bowler.playerId, {
                      bowlingInnings: 1,
                    });
                  }
                }

                // ✅ ONLY ONE BALL
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
              onNoResult={() => modalStates.setShowNoResultModal(true)}
            />
          )}
          {engine.matchOver && isNoResult && <NoResultBanner />}
        </>
      )}
      <UtilityBar
        partnershipHistory={partnershipsHook.partnershipHistory}
        matchCompleted={inningsDataHook.matchCompleted}
        onPartnership={() => modalStates.setShowPartnershipHistory(true)}
        onInningsHistory={() => modalStates.setShowInningsHistory(true)}
        onInningsSummary={() => modalStates.setShowInningsSummary(true)}
        onComparisonGraph={() => modalStates.setShowComparisonGraph(true)}
        onMore={() => modalStates.setShowMoreMenu(true)}
        onScorecard={() => modalStates.setShowFullScorecard(true)}
        onMatchSummary={() => modalStates.setShowSummary(true)}
      />
      {engine.matchOver && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "15px",
          }}
        >
          <button
            onClick={() => navigate("/home")}
            style={{
              background: "#22c55e",
              color: "white",
              padding: "12px 20px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            🏠 Go to Home
          </button>
        </div>
      )}
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
        onStartInnings={(strikerData, nonStrikerData, bowlerData) => {
          addBatterJersey(strikerData.jersey);
          addBatterJersey(nonStrikerData.jersey);
          addBowlerJersey(bowlerData.jersey);
          playersHook.startInnings(strikerData, nonStrikerData, bowlerData);
          setTimeout(() => {
            const p = playersHook.players;
            initialStrikerRef.current = p[0]?.playerId ?? null;
            initialNonStrikerRef.current = p[1]?.playerId ?? null;
            startPartnershipFromPlayers(
              p,
              strikerData.name,
              nonStrikerData.name
            );
          }, 50);
          modalStates.setShowStartModal(false);
        }}
        onConfirmNewBatsman={(batsmanData) => {
          if (batsmanData?.jersey) addBatterJersey(batsmanData.jersey);
          const name =
            typeof batsmanData === "string" ? batsmanData : batsmanData.name;
          const isReturnedPlayer = playersHook.retiredPlayersRef.current.some(
            (p) =>
              p.displayName.toLowerCase().trim() === name.toLowerCase().trim()
          );
          if (isReturnedPlayer)
            playersHook.returnRetiredBatsman(name, playersHook.outBatsman);
          else playersHook.replaceBatsman(playersHook.outBatsman, batsmanData);
          playersHook.setIsWicketPending(false);
          wicketFlow.completeWicketFlow();

          const outIdx = playersHook.outBatsman ?? playersHook.strikerIndex;
          const nonStrikerIdx = outIdx === 0 ? 1 : 0;
          const nonStriker = playersHook.players[nonStrikerIdx];
          setTimeout(() => {
            partnershipsHook.startPartnership(
              {
                playerId: batsmanData?.jersey
                  ? String(batsmanData.jersey)
                  : "new-" + Date.now(),
                displayName: name,
              },
              nonStriker
                ? {
                    playerId: nonStriker.playerId,
                    displayName: nonStriker.displayName,
                  }
                : { playerId: "", displayName: "" }
            );
          }, 50);
        }}
        onConfirmNewBowler={(bowlerData) => {
          if (bowlerData?.jersey) addBowlerJersey(bowlerData.jersey);
          const result = playersHook.confirmNewBowler(bowlerData);
          if (result?.success) playersHook.setIsNewBowlerPending(false);
        }}
        onRetiredHurtConfirm={(batsmanData) => {
          const name =
            typeof batsmanData === "string" ? batsmanData : batsmanData.name;
          if (batsmanData?.jersey) addBatterJersey(batsmanData.jersey);
          playersHook.retireBatsman(name);
          modalStates.setShowRetiredHurtModal(false);
          setTimeout(
            () => startPartnershipFromPlayers(playersHook.players, name, ""),
            50
          );
        }}
        onReturnRetiredConfirm={(retiredPlayerName) => {
          playersHook.returnRetiredBatsman(
            retiredPlayerName,
            playersHook.outBatsman
          );
          playersHook.setIsWicketPending(false);
          setTimeout(
            () => startPartnershipFromPlayers(playersHook.players),
            50
          );
        }}
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
        activePlayers={playersHook.players}
        playerDB={playerDBHook}
        onOpenPlayerDatabase={() => modalStates.setShowPlayerDatabase(true)}
        bowlerJerseys={activeBowlerJerseys}
        batterJerseys={activeBatterJerseys}
        dismissedPlayers={dismissedPlayersRef.current}
        currentBowlerJersey={
          playersHook.bowlers[playersHook.currentBowlerIndex]?.playerId
        } // ✅ ADD THIS
      />
      <ScoringModals
        hatTrickHook={hatTrickHook}
        modalStates={modalStates}
        matchData={matchData}
        secondBattingTeam={secondBattingTeam}
        firstBattingTeam={firstBattingTeam}
        handleStartSuperOver={handleStartSuperOver}
        handleSkipSuperOver={handleSkipSuperOver}
        realMatchInnings1DataRef={realMatchInnings1DataRef}
        realMatchInnings2DataRef={realMatchInnings2DataRef}
        inningsDataHook={inningsDataHook}
        engine={engine}
      />
    </div>
  );
}

export default ScoringPage;
