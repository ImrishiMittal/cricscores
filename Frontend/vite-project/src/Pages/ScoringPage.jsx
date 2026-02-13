import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import BrandTitle from "../Components/BrandTitle";
import ScoreHeader from "../Components/Scoring/ScoreHeader";
import InfoStrip from "../Components/Scoring/InfoStrip";
import OverBalls from "../Components/Scoring/OverBalls";
import BatsmenRow from "../Components/Scoring/BatsmenRow";
import RunControls from "../Components/Scoring/RunControls";
import StartInningsModal from "../Components/Scoring/StartInningsModal";
import NewBatsmanModal from "../Components/Scoring/NewBatsmanModal";
import NewBowlerModal from "../Components/Scoring/NewBowlerModal";
import PartnershipHistory from "../Components/Scoring/PartnershipHistory";
import MatchSummary from "../Components/Scoring/MatchSummary";
import InningsHistory from "../Components/Scoring/InningsHistory";
import WicketTypeModal from "../Components/Scoring/WicketTypeModal";
import FielderInputModal from "../Components/Scoring/FielderInputModal";
import InningsSummary from "../Components/Scoring/InningsSummary";
import ComparisonGraph from "../Components/Scoring/ComparisonGraph";
import MoreOptionsMenu from "../Components/Scoring/MoreOptionsMenu";
import styles from "../Components/Scoring/scoring.module.css";

import useMatchEngine from "../hooks/useMatchEngine";
import usePlayersAndBowlers from "../hooks/usePlayersAndBowlers";
import usePartnerships from "../hooks/usePartnerships";

import ChangePlayersModal from "../Components/Scoring/ChangePlayersModal";
function ScoringPage() {
  const location = useLocation();
  const matchData = location.state || {};

  const [updatedMatchData, setUpdatedMatchData] = useState(matchData);
  /* ================= HOOKS ================= */
  const playersHook = usePlayersAndBowlers(updatedMatchData);
  const partnershipsHook = usePartnerships();

  const {
    players,
    allPlayers, // ✅ NEW: All batsmen who have played
    strikerIndex,
    nonStrikerIndex,
    bowlers,
    currentBowlerIndex,
    isWicketPending,
    isNewBowlerPending,
    outBatsman,
    startInnings,
    swapStrike,
    addRunsToStriker,
    addRunsToBowler,
    addBallToBowler,
    addWicketToBowler,
    registerWicket,
    confirmNewBatsman,
    confirmNewBowler,
    requestNewBowler,
    restorePlayersState,
    restoreBowlersState,
    setOutBatsman,
    setIsWicketPending,
    setDismissal,
    replaceBatsman,
    bowlerError,
    setBowlerError,
  } = playersHook;

  const {
    partnershipRuns,
    partnershipBalls,
    partnershipHistory,
    showPartnershipHistory,
    setShowPartnershipHistory,
    striker1Contribution,
    striker2Contribution,
    startPartnership,
    addRunsToPartnership,
    addExtraToPartnership,
    addBallToPartnership,
    savePartnership,
    resetPartnership,
    restorePartnershipState,
  } = partnershipsHook;

  const engine = useMatchEngine(updatedMatchData, swapStrike);

  const {
    score,
    wickets,
    balls,
    overs,
    currentOver,
    completeHistory,
    matchOver,
    winner,
    target,
    innings,
    isFreeHit,
    handleRun,
    handleWicket,
    handleWide,
    handleNoBall,
    handleBye,
    restoreState,
    wicketEvent,
    setWicketEvent,
    overCompleteEvent,
    setOverCompleteEvent,
    inningsChangeEvent,
    setInningsChangeEvent,
    innings1Score,
    innings2Score,
  } = engine;

  /* ================= UI STATE ================= */
  const [innings1Data, setInnings1Data] = useState(null);
  const [innings2Data, setInnings2Data] = useState(null);
  const [showStartModal, setShowStartModal] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [showInningsHistory, setShowInningsHistory] = useState(false);
  const [showInningsSummary, setShowInningsSummary] = useState(false);
  const [showComparisonGraph, setShowComparisonGraph] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showChangePlayersModal, setShowChangePlayersModal] = useState(false);

  const [historyStack, setHistoryStack] = useState([]);

  // ✅ Wicket type handling
  const [showWicketTypeModal, setShowWicketTypeModal] = useState(false);
  const [showFielderInputModal, setShowFielderInputModal] = useState(false);
  const [selectedWicketType, setSelectedWicketType] = useState(null);
  const [pendingRunoutRuns, setPendingRunoutRuns] = useState(null);
  const [waitingForRunoutRun, setWaitingForRunoutRun] = useState(false);

  // ✅ NEW: Track if match ended (added at end to preserve hook order)
  const [matchCompleted, setMatchCompleted] = useState(false);

  const shouldSaveSnapshot = useRef(false);
  const innings2DataRef = useRef(null);
  const innings1HistoryRef = useRef([]); // ✅ NEW: Store innings 1 history permanently

  /* ================= HELPER: CAPTURE CURRENT INNINGS DATA ================= */
  const captureCurrentInningsData = () => {
    return {
      battingStats: players.map((p) => ({
        name: p.name,
        runs: p.runs || 0,
        balls: p.balls || 0,
        strikeRate: p.balls ? ((p.runs / p.balls) * 100).toFixed(1) : "0.0",
        dismissal: p.dismissal || null,
      })),
      bowlingStats: bowlers.map((b) => ({
        name: b.name,
        overs: b.overs || 0,
        balls: b.balls || 0,
        runs: b.runs || 0,
        wickets: b.wickets || 0,
        economy: b.overs > 0 ? (b.runs / b.overs).toFixed(2) : "0.00",
      })),
      history: [...completeHistory],
    };
  };

  /* ================= INNINGS CHANGE HANDLER ================= */
  useEffect(() => {
    if (!inningsChangeEvent) return;

    // ================= MATCH END (2nd innings finished) =================
    if (inningsChangeEvent.matchEnd) {
      console.log("🏁 Match ended — capturing 2nd innings");

      const inn2Data = captureCurrentInningsData();
      setInnings2Data(inn2Data);

      setTimeout(() => {
        setShowSummary(true);
        setMatchCompleted(true); // ✅ Mark match as completed
        setInningsChangeEvent(null);
      }, 50);

      return;
    }

    // ================= INNINGS 1 END =================
    console.log("🔄 Innings 1 ending — capturing data");
    console.log(
      "📊 completeHistory length AT INNINGS END:",
      completeHistory.length
    );
    console.log(
      "📊 innings1HistoryRef BEFORE save:",
      innings1HistoryRef.current.length
    );

    // ✅ FIX: Save current partnership before reset
    if (partnershipRuns > 0 || partnershipBalls > 0) {
      const striker = players[strikerIndex]?.name || "Unknown";
      const nonStriker = players[nonStrikerIndex]?.name || "Unknown";
      console.log("💾 Saving final partnership of innings 1:", {
        striker,
        nonStriker,
        runs: partnershipRuns,
      });
      savePartnership(score, wickets + 1);
    }

    // ✅ CRITICAL: Capture innings 1 data with complete history
    const inn1Data = captureCurrentInningsData();
    console.log(
      "✅ Innings 1 data captured with history:",
      inn1Data.history.length
    );

    setInnings1Data(inn1Data);

    // ✅ Ref should already be updated by continuous effect, but ensure it's set
    if (
      innings1HistoryRef.current.length === 0 ||
      innings1HistoryRef.current.length < completeHistory.length
    ) {
      innings1HistoryRef.current = [...completeHistory];
      console.log(
        "⚠️ Ref was empty/short, updated to:",
        innings1HistoryRef.current.length
      );
    }

    console.log(
      "📊 FINAL CHECK - Ref has:",
      innings1HistoryRef.current.length,
      "balls"
    );

    setTimeout(() => {
      restorePlayersState({
        players: [],
        allPlayers: [], // ✅ Reset player history for new innings
        strikerIndex: 0,
        nonStrikerIndex: 1,
        isWicketPending: false,
        outBatsman: null,
      });

      restoreBowlersState({
        bowlers: [],
        currentBowlerIndex: 0,
      });

      restorePartnershipState({
        partnershipRuns: 0,
        partnershipBalls: 0,
        striker1Contribution: 0,
        striker2Contribution: 0,
        partnershipHistory: [], // ✅ Clear partnership history for new innings
      });

      setShowStartModal(true);
      setInningsChangeEvent(null);
    }, 50);
  }, [
    inningsChangeEvent,
    partnershipRuns,
    partnershipBalls,
    players,
    strikerIndex,
    nonStrikerIndex,
    savePartnership,
  ]);

  /* ================= SHOW SUMMARY ON MATCH END ================= */
  useEffect(() => {
    if (matchOver && !matchCompleted) {
      // ✅ Only run once
      console.log("🏁 Match Over");

      if (innings2DataRef.current) {
        console.log(
          "Using pre-captured innings 2 data:",
          innings2DataRef.current
        );
        setInnings2Data(innings2DataRef.current);
      } else {
        console.log("⚠️ No ref data, capturing now (might be empty)");
        const inn2Data = captureCurrentInningsData();
        console.log("Innings 2 data:", inn2Data);
        setInnings2Data(inn2Data);
      }

      setTimeout(() => {
        setShowSummary(true);
        setMatchCompleted(true); // ✅ Mark as completed
      }, 100);
    }
  }, [matchOver, matchCompleted]); // ✅ Add matchCompleted dependency

  /* ================= CONTINUOUSLY SAVE INNINGS 1 HISTORY ================= */
  useEffect(() => {
    // ✅ During innings 1, continuously save history to ref
    if (innings === 1 && completeHistory.length > 0) {
      innings1HistoryRef.current = [...completeHistory];
      console.log(
        "📊 Updating innings 1 history ref:",
        innings1HistoryRef.current.length,
        "balls"
      );
    }
  }, [innings, completeHistory]);

  /* ================= OVER COMPLETE HANDLER ================= */
  useEffect(() => {
    if (!overCompleteEvent) return;

    const lastBowlerIndex = currentBowlerIndex;

    // Ask for new bowler and pass last bowler index
    requestNewBowler(lastBowlerIndex);

    setOverCompleteEvent(null);
  }, [overCompleteEvent, currentBowlerIndex, requestNewBowler]);

  /* ================= SAVE INITIAL STATE ================= */
  useEffect(() => {
    if (!showStartModal && historyStack.length === 0 && players.length > 0) {
      const initialSnapshot = {
        score: 0,
        wickets: 0,
        balls: 0,
        overs: 0,
        currentOver: [],
        completeHistory: [],
        players: JSON.parse(JSON.stringify(players)),
        allPlayers: [], // ✅ NEW
        strikerIndex: 0,
        nonStrikerIndex: 1,
        partnershipRuns: 0,
        partnershipBalls: 0,
        striker1Contribution: 0,
        striker2Contribution: 0,
        bowlers: JSON.parse(JSON.stringify(bowlers)),
        currentBowlerIndex: 0,
        partnershipHistory: [],
        isWicketPending: false,
        outBatsman: null,
      };

      setHistoryStack([initialSnapshot]);
    }
  }, [showStartModal, players, bowlers]);

  /* ================= AUTO-SAVE SNAPSHOT AFTER STATE UPDATES ================= */
  useEffect(() => {
    if (shouldSaveSnapshot.current && !showStartModal) {
      const snapshot = {
        score,
        wickets,
        balls,
        overs,
        currentOver: [...currentOver],
        completeHistory: [...completeHistory],
        players: JSON.parse(JSON.stringify(players)),
        allPlayers: JSON.parse(JSON.stringify(allPlayers)), // ✅ NEW
        strikerIndex,
        nonStrikerIndex,
        isWicketPending,
        outBatsman,
        partnershipRuns,
        partnershipBalls,
        striker1Contribution,
        striker2Contribution,
        bowlers: JSON.parse(JSON.stringify(bowlers)),
        currentBowlerIndex,
        partnershipHistory: JSON.parse(JSON.stringify(partnershipHistory)),
      };

      setHistoryStack((prev) => [...prev, snapshot]);
      shouldSaveSnapshot.current = false;
    }
  }, [
    score,
    wickets,
    balls,
    overs,
    players,
    strikerIndex,
    nonStrikerIndex,
    partnershipRuns,
    partnershipBalls,
    striker1Contribution,
    striker2Contribution,
    bowlers,
    currentBowlerIndex,
    isWicketPending,
    outBatsman,
  ]);

  /* ================= UNDO LAST BALL ================= */
  const undoLastBall = () => {
    if (historyStack.length === 0) {
      alert("No balls to undo!");
      return;
    }

    const last = historyStack[historyStack.length - 1];

    console.log("⏮️ Undoing to state:", {
      score: last.score,
      wickets: last.wickets,
      balls: last.balls,
      overs: last.overs,
      historyLength: last.completeHistory?.length || 0,
    });

    setHistoryStack((prev) => prev.slice(0, -1));

    // Restore all state
    restoreState(last);
    restorePlayersState(last);
    restorePartnershipState(last);
    restoreBowlersState(last);

    // ✅ Also close any open modals
    setShowWicketTypeModal(false);
    setShowFielderInputModal(false);
    setIsWicketPending(false);
    setWaitingForRunoutRun(false);
    setSelectedWicketType(null);
    setPendingRunoutRuns(null);

    console.log("✅ Undone to previous state");
  };

  /* ================= TEAM NAMES ================= */
  const firstBattingTeam = matchData.battingFirst;

  const secondBattingTeam =
    matchData.battingFirst === matchData.teamA
      ? matchData.teamB
      : matchData.teamA;

  const currentBattingTeam =
    innings === 1 ? firstBattingTeam : secondBattingTeam;

  /* ================= HANDLE WICKET CLICK ================= */
  const handleWicketClick = () => {
    if (isFreeHit) {
      alert("Cannot take a wicket on a Free Hit!");
      return;
    }

    console.log("🎯 Wicket button clicked");
    setShowWicketTypeModal(true);
  };

  /* ================= HANDLE WICKET TYPE SELECT ================= */
  const handleWicketTypeSelect = (wicketType) => {
    console.log("🎯 Wicket type selected:", wicketType);

    setShowWicketTypeModal(false);
    setSelectedWicketType(wicketType);

    // ✅ FIX 1: For runout, wait for user to select runs first
    if (wicketType === "runout") {
      console.log("🏃 Runout selected - waiting for runs");
      setWaitingForRunoutRun(true);
      return;
    }

    // ✅ For other wicket types, show fielder input modal immediately
    console.log("📝 Showing fielder input modal for:", wicketType);

    // Show the fielder input modal
    setShowFielderInputModal(true);
  };

  /* ================= HANDLE FIELDER CONFIRM ================= */
  const handleFielderConfirm = ({ fielder, newBatsman }) => {
    const bowlerName = bowlers[currentBowlerIndex]?.name || "Unknown";
    const currentOutBatsman = strikerIndex;

    console.log("✅ Fielder/New Batsman confirmed:", {
      fielder,
      newBatsman,
      selectedWicketType,
      currentWickets: wickets,
    });

    // ✅ Get CURRENT team size from matchData (this updates when user changes it)
    const currentBattingTeam = innings === 1 ? "teamAPlayers" : "teamBPlayers";
    const currentTeamSize = Number(matchData[currentBattingTeam] || 11);
    const currentMaxWickets = currentTeamSize - 1;

    // ✅ Calculate next wickets BEFORE any changes
    const nextWickets = wickets + 1;

    // ✅ Calculate how many unique batsmen have played (including the new one)
    const uniqueBatsmenCount = new Set([
      ...players.map((p) => p.name),
      newBatsman,
    ]).size;

    console.log("🔍 Wicket check:", {
      currentWickets: wickets,
      nextWickets,
      currentMaxWickets,
      currentTeamSize,
      uniqueBatsmenCount,
      willBeAllOut: nextWickets >= currentMaxWickets,
    });

    // ✅ Step 1: Set dismissal info FIRST
    setDismissal(selectedWicketType, fielder, bowlerName, currentOutBatsman);

    // ✅ Step 2: Update bowler stats
    if (selectedWicketType !== "runout") {
      addWicketToBowler();
    } else if (pendingRunoutRuns === null || pendingRunoutRuns === 0) {
      addBallToBowler();
    }

    // ✅ Step 3: Handle partnership
    if (pendingRunoutRuns === null || pendingRunoutRuns === 0) {
      addBallToPartnership();
    }

    console.log("💾 Saving partnership");
    savePartnership(score, nextWickets);
    resetPartnership();

    // ✅ Step 4: Call handleWicket (this increments wickets and handles match engine)
    handleWicket();

    // ✅ Step 5: Check if this was the last wicket
    const allWicketsFallen = nextWickets >= currentMaxWickets;

    console.log("🏏 After wicket:", {
      allWicketsFallen,
      nextWickets,
      currentMaxWickets,
    });

    // ✅ If all wickets have fallen, DON'T add new batsman
    if (allWicketsFallen) {
      console.log(
        "🚫 All wickets fallen - not adding new batsman, innings will end"
      );

      // Close modals
      setShowFielderInputModal(false);
      setIsWicketPending(false);
      setSelectedWicketType(null);
      setPendingRunoutRuns(null);
      setWaitingForRunoutRun(false);

      // Save snapshot
      setTimeout(() => {
        shouldSaveSnapshot.current = true;
      }, 100);

      return;
    }

    // ✅ Check if we can add this new batsman (team size constraint)
    if (uniqueBatsmenCount > currentTeamSize) {
      console.log("❌ Cannot add new batsman - team size exceeded");
      alert(
        `❌ Cannot add new batsman! Team only has ${currentTeamSize} players and all have batted.`
      );

      // Close modals
      setShowFielderInputModal(false);
      setIsWicketPending(false);
      setSelectedWicketType(null);
      setPendingRunoutRuns(null);
      setWaitingForRunoutRun(false);

      return;
    }

    // ✅ Step 6: Replace batsman (wickets still available)
    console.log(
      "🔄 Replacing batsman at index",
      currentOutBatsman,
      "with",
      newBatsman
    );

    setTimeout(() => {
      replaceBatsman(currentOutBatsman, newBatsman);
    }, 50);

    // ✅ Step 7: Start new partnership
    setTimeout(() => {
      const nonStrikerName = players[nonStrikerIndex]?.name || "Unknown";
      console.log("🤝 Starting new partnership:", {
        newBatsmanName: newBatsman,
        nonStrikerName,
      });
      startPartnership(newBatsman, nonStrikerName);
    }, 150);

    // ✅ Step 8: Close modals
    setShowFielderInputModal(false);
    setIsWicketPending(false);
    setSelectedWicketType(null);
    setPendingRunoutRuns(null);
    setWaitingForRunoutRun(false);

    // ✅ Step 9: Save snapshot
    setTimeout(() => {
      shouldSaveSnapshot.current = true;
    }, 200);
  };

  /* ================= HANDLE RUN (with runout support) ================= */
  const handleRunClick = (r) => {
    // ✅ FIX 2: Handle runout properly
    if (waitingForRunoutRun) {
      console.log("🏃 Run out with", r, "runs");

      setPendingRunoutRuns(r);
      setWaitingForRunoutRun(false);

      // Add runs and ball to stats
      if (r > 0) {
        addRunsToStriker(r);
        addRunsToBowler(r);
        addBallToBowler();
        addRunsToPartnership(r, players[strikerIndex].name);
        // handleRun(r);
      } else {
        // Even on 0 runs, we need to add a ball for runout
        addBallToBowler();
        addBallToPartnership();
      }

      // Register wicket in engine
      registerWicket();
      addWicketToBowler();
      handleWicket();

      // Show fielder input modal
      setShowFielderInputModal(true);
      return;
    }

    // Normal run
    if (innings === 2 && score + r >= target) {
      const finalData = captureCurrentInningsData();
      finalData.battingStats[strikerIndex].runs += r;
      finalData.battingStats[strikerIndex].balls += 1;
      setInnings2Data(finalData);
    }

    shouldSaveSnapshot.current = true;
    addRunsToStriker(r);
    addRunsToBowler(r);
    addBallToBowler();
    addRunsToPartnership(r, players[strikerIndex].name);
    handleRun(r);
  };

  const handleChangePlayersConfirm = ({
    team,
    isBattingTeam,
    newCount,
    oldCount,
  }) => {
    console.log("✅ Changing player count:", {
      team,
      isBattingTeam,
      newCount,
      oldCount,
    });

    // Update match data
    const updated = { ...updatedMatchData };

    if (innings === 1) {
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

    // Save to localStorage
    localStorage.setItem("matchData", JSON.stringify(updated));

    setShowChangePlayersModal(false);

    alert(`✅ ${team} player count changed from ${oldCount} to ${newCount}`);
  };

  return (
    <div className={styles.container}>
      {showStartModal && (
        <StartInningsModal
          onStart={(s, ns, b) => {
            startInnings(s, ns, b);
            startPartnership(s, ns);
            setShowStartModal(false);
          }}
        />
      )}

      <BrandTitle size="small" />

      {!showSummary && (
        <>
          <ScoreHeader
            innings={innings}
            teamName={innings === 1 ? firstBattingTeam : secondBattingTeam}
            score={score}
            wickets={wickets}
            overs={overs}
            balls={balls}
            totalOvers={updatedMatchData.overs}
            target={target}
          />

          <InfoStrip
            overs={overs}
            balls={balls}
            bowler={bowlers[currentBowlerIndex]?.name}
            bowlers={bowlers}
            currentBowlerIndex={currentBowlerIndex}
            score={score}
            target={target}
            innings={innings}
            totalOvers={updatedMatchData.overs}
            isFreeHit={isFreeHit}
            matchData={updatedMatchData}
            currentTeam={currentBattingTeam}
          />

          <OverBalls history={currentOver} />

          {players.length >= 2 && (
            <BatsmenRow
              striker={players[strikerIndex]}
              nonStriker={players[nonStrikerIndex]}
              partnershipRuns={partnershipRuns}
              partnershipBalls={partnershipBalls}
              matchData={updatedMatchData}
              currentTeam={currentBattingTeam}
              wickets={wickets} // ✅ ADD THIS LINE
            />
          )}

          {!matchOver && (
            <RunControls
              onRun={handleRunClick}
              onWide={() => {
                shouldSaveSnapshot.current = true;
                addRunsToBowler(1);
                addExtraToPartnership(1);
                handleWide();
              }}
              onNoBall={() => {
                shouldSaveSnapshot.current = true;
                addRunsToBowler(1);
                addExtraToPartnership(1);
                handleNoBall();
              }}
              onBye={(r) => {
                shouldSaveSnapshot.current = true;
                addBallToBowler();
                addExtraToPartnership(r);
                addBallToPartnership();
                handleBye(r);
              }}
              onWicket={handleWicketClick}
              onSwapStrike={swapStrike}
              onUndo={undoLastBall}
            />
          )}
        </>
      )}

      <div className={styles.utilityRow}>
        {partnershipHistory.length > 0 && (
          <button
            className={styles.utilityBtn}
            onClick={() => setShowPartnershipHistory(true)}
          >
            📊 Previous Partnerships ({partnershipHistory.length})
          </button>
        )}

        <button
          className={styles.utilityBtn}
          onClick={() => setShowInningsHistory(true)}
        >
          📋 Innings History
        </button>

        <button
          className={styles.utilityBtn}
          onClick={() => setShowInningsSummary(true)}
        >
          📄 Innings Summary
        </button>

        {/* ✅ Show comparison graph button from first ball of match */}
        <button
          className={styles.utilityBtn}
          onClick={() => setShowComparisonGraph(true)}
        >
          📈 Comparison Graph
        </button>
        <button
          className={styles.utilityBtn}
          onClick={() => setShowMoreMenu(true)}
        >
          ⚙ MORE
        </button>

        {/* ✅ NEW: Match Summary button - only visible after match ends */}
        {matchCompleted && (
          <button
            className={styles.utilityBtn}
            onClick={() => setShowSummary(true)}
          >
            🏆 Match Summary
          </button>
        )}
      </div>

      {/* ✅ Wicket Type Modal */}
      {showWicketTypeModal && (
        <WicketTypeModal
          onSelect={handleWicketTypeSelect}
          onClose={() => setShowWicketTypeModal(false)}
        />
      )}

      {/* ✅ Fielder Input Modal */}
      {showFielderInputModal && (
        <FielderInputModal
          wicketType={selectedWicketType}
          onConfirm={handleFielderConfirm}
          onCancel={() => {
            setShowFielderInputModal(false);
            setSelectedWicketType(null);
            setPendingRunoutRuns(null);
            setWaitingForRunoutRun(false);
            setIsWicketPending(false);
          }}
        />
      )}

      {/* ✅ Innings Summary Modal */}
      {showInningsSummary && (
        <InningsSummary
          players={players}
          allPlayers={allPlayers} // ✅ NEW: Pass all players history
          bowlers={bowlers}
          score={score}
          wickets={wickets}
          overs={overs}
          balls={balls}
          onClose={() => setShowInningsSummary(false)}
        />
      )}

      {/* ✅ FIX 3: Only show NewBatsmanModal if wicket is pending AND fielder modal is not showing */}
      {isWicketPending && !showFielderInputModal && (
        <NewBatsmanModal
          onConfirm={(name) => {
            confirmNewBatsman(name);
            startPartnership(players[0].name, players[1].name);
          }}
        />
      )}

      {isNewBowlerPending && (
        <NewBowlerModal
          onConfirm={confirmNewBowler}
          existingBowlers={bowlers}
        />
      )}

      {showPartnershipHistory && (
        <PartnershipHistory
          history={partnershipHistory}
          onClose={() => setShowPartnershipHistory(false)}
          matchData={updatedMatchData}
          battingTeam={currentBattingTeam}
        />
      )}

      {showSummary && innings1Data && innings2Data && (
        <MatchSummary
          team1={firstBattingTeam}
          team2={secondBattingTeam}
          winner={winner}
          innings1Data={innings1Data}
          innings2Data={innings2Data}
          innings1Score={innings1Score}
          innings2Score={innings2Score}
          matchData={updatedMatchData}
          onClose={() => setShowSummary(false)}
        />
      )}

      {showInningsHistory && (
        <InningsHistory
          history={completeHistory}
          onClose={() => setShowInningsHistory(false)}
        />
      )}

      {showComparisonGraph && (
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
          onClose={() => setShowComparisonGraph(false)}
        />
      )}

      {/* ✅ Change Players Modal */}
      {showChangePlayersModal && (
        <ChangePlayersModal
          matchData={updatedMatchData}
          currentInnings={innings}
          players={players}
          allPlayers={allPlayers}
          bowlers={bowlers}
          onConfirm={handleChangePlayersConfirm}
          onClose={() => setShowChangePlayersModal(false)}
        />
      )}

      {showMoreMenu && (
        <MoreOptionsMenu
          innings={innings}
          onClose={() => setShowMoreMenu(false)}
          onOpenDLS={() => setShowDLSCalculator(true)}
          onOpenChangePlayers={() => setShowChangePlayersModal(true)} // Add this
        />
      )}
    </div>
  );
}

export default ScoringPage;
