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
import styles from "../Components/Scoring/scoring.module.css";

import useMatchEngine from "../hooks/useMatchEngine";
import usePlayersAndBowlers from "../hooks/usePlayersAndBowlers";
import usePartnerships from "../hooks/usePartnerships";

function ScoringPage() {
  const location = useLocation();
  const matchData = location.state || {};

  /* ================= HOOKS ================= */
  const playersHook = usePlayersAndBowlers();
  const partnershipsHook = usePartnerships();

  const {
    players,
    strikerIndex,
    nonStrikerIndex,
    bowlers,
    currentBowlerIndex,
    isWicketPending,
    isNewBowlerPending,
    startInnings,
    swapStrike,
    addRunsToStriker,
    registerWicket,
    confirmNewBatsman,
    confirmNewBowler,
    requestNewBowler,
    restorePlayersState,
    restoreBowlersState,
    setOutBatsman,
    setIsWicketPending,
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

  const engine = useMatchEngine(matchData, swapStrike);

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
  } = engine;

  /* ================= UI STATE ================= */
  const [showStartModal, setShowStartModal] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [showInningsHistory, setShowInningsHistory] = useState(false);
  const [historyStack, setHistoryStack] = useState([]);

  // ✅ Track if we should save snapshot
  const shouldSaveSnapshot = useRef(false);

  /* ================= SAVE INITIAL STATE ================= */
  /* ================= SAVE INITIAL STATE ================= */
  useEffect(() => {
    // Save initial state when match starts (after modal closes)
    if (!showStartModal && historyStack.length === 0 && players.length > 0) {
      const initialSnapshot = {
        score: 0,
        wickets: 0,
        balls: 0,
        overs: 0,
        currentOver: [],
        players: JSON.parse(JSON.stringify(players)),
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
      };

      setHistoryStack([initialSnapshot]);
    }
  }, [showStartModal, players, bowlers]); // ✅ ADD bowlers dependency

  /* ================= AUTO-SAVE SNAPSHOT AFTER STATE UPDATES ================= */
  useEffect(() => {
    if (shouldSaveSnapshot.current && !showStartModal) {
      const snapshot = {
        // Engine state
        score,
        wickets,
        balls,
        overs,
        currentOver: [...currentOver],

        // Players state
        players: JSON.parse(JSON.stringify(players)),
        strikerIndex,
        nonStrikerIndex,
        isWicketPending,

        // Partnership state
        partnershipRuns,
        partnershipBalls,
        striker1Contribution,
        striker2Contribution,
        partnershipHistory: JSON.parse(JSON.stringify(partnershipHistory)),
        // Bowler state ✅ ADD THESE
        bowlers: JSON.parse(JSON.stringify(bowlers)),
        currentBowlerIndex,
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
  ]); // ✅ ADD dependencies

  /* ================= UNDO ================= */
  const undoLastBall = () => {
    if (historyStack.length === 0) {
      alert("No balls to undo!");
      return;
    }

    const last = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));

    // ✅ Restore ALL state including bowlers
    restoreState(last);
    restorePlayersState(last);
    restorePartnershipState(last);
    restoreBowlersState(last); // ✅ ADD THIS
  };
  /* ================= HANDLE WICKET EVENT ================= */
  useEffect(() => {
    if (wicketEvent) {
      setOutBatsman(strikerIndex);
      setIsWicketPending(true);
      shouldSaveSnapshot.current = true;
      setWicketEvent(null);
    }
  }, [wicketEvent]);

  /* ================= HANDLE OVER COMPLETE ================= */
  useEffect(() => {
    if (overCompleteEvent && !matchOver) {
      const maxWickets =
        innings === 1
          ? Number(matchData.teamAPlayers || 11) - 1
          : Number(matchData.teamBPlayers || 11) - 1;

      if (wickets < maxWickets) {
        requestNewBowler();
      }
      setOverCompleteEvent(null);
    }
  }, [overCompleteEvent]);

  /* ================= SHOW SUMMARY ON MATCH END ================= */
  useEffect(() => {
    if (matchOver) setShowSummary(true);
  }, [matchOver]);

  const firstBattingTeam = matchData.battingFirst || matchData.teamA;
  const secondBattingTeam =
    firstBattingTeam === matchData.teamA ? matchData.teamB : matchData.teamA;

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

      <ScoreHeader
        team={innings === 1 ? firstBattingTeam : secondBattingTeam}
        score={score}
        wickets={wickets}
      />

      <InfoStrip
        overs={`${overs}.${balls}`}
        bowler={bowlers[currentBowlerIndex]?.name}
        isFreeHit={isFreeHit}
      />

      <OverBalls history={currentOver} />

      {players.length >= 2 && (
        <BatsmenRow
          striker={players[strikerIndex]}
          nonStriker={players[nonStrikerIndex]}
          partnershipRuns={partnershipRuns}
          partnershipBalls={partnershipBalls}
        />
      )}

      {!matchOver && (
        <RunControls
          onRun={(r) => {
            shouldSaveSnapshot.current = true;
            addRunsToStriker(r);
            addRunsToPartnership(r, players[strikerIndex].name);
            handleRun(r);
          }}
          onWide={() => {
            shouldSaveSnapshot.current = true;
            addExtraToPartnership(1);
            handleWide();
          }}
          onNoBall={() => {
            shouldSaveSnapshot.current = true;
            addExtraToPartnership(1);
            handleNoBall();
          }}
          onBye={(r) => {
            shouldSaveSnapshot.current = true;
            addExtraToPartnership(r);
            addBallToPartnership();
            handleBye(r);
          }}
          onWicket={() => {
            if (isFreeHit) {
              handleWicket();
              return;
            }
          
            addBallToPartnership();
          
            savePartnership(score, wickets + 1);
            resetPartnership();
            registerWicket();
            handleWicket();
            
            // ✅ Save snapshot AFTER wicket is processed but BEFORE modal
            setTimeout(() => {
              shouldSaveSnapshot.current = true;
            }, 0);
          }}
          onSwapStrike={swapStrike}
          onUndo={undoLastBall}
        />
      )}

      {partnershipHistory.length > 0 && (
        <button
          className={styles.partnershipHistoryBtn}
          onClick={() => setShowPartnershipHistory(true)}
        >
          📊 Previous Partnerships ({partnershipHistory.length})
        </button>
      )}

      <button
        className={styles.inningsHistoryBtn}
        onClick={() => setShowInningsHistory(true)}
      >
        📋 Innings History
      </button>

      {isWicketPending && (
        <NewBatsmanModal
          onConfirm={(name) => {
            confirmNewBatsman(name);
            startPartnership(players[0].name, players[1].name);
          }}
        />
      )}

      {isNewBowlerPending && <NewBowlerModal onConfirm={confirmNewBowler} />}

      {showPartnershipHistory && (
        <PartnershipHistory
          history={partnershipHistory}
          onClose={() => setShowPartnershipHistory(false)}
        />
      )}

      {showSummary && (
        <MatchSummary
          team1={firstBattingTeam}
          team2={secondBattingTeam}
          winner={winner}
          onClose={() => setShowSummary(false)}
        />
      )}

      {showInningsHistory && (
        <InningsHistory
          history={completeHistory}
          onClose={() => setShowInningsHistory(false)}
        />
      )}
    </div>
  );
}

export default ScoringPage;
