import { useState, useEffect } from "react";
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
    players, strikerIndex, nonStrikerIndex, bowlers,
    currentBowlerIndex, isWicketPending, isNewBowlerPending,
    startInnings, swapStrike, addRunsToStriker,
    registerWicket, confirmNewBatsman, confirmNewBowler
  } = playersHook;

  const {
    partnershipRuns, partnershipBalls, partnershipHistory,
    showPartnershipHistory, setShowPartnershipHistory,
    startPartnership, addRunsToPartnership,
    addExtraToPartnership, addBallToPartnership,
    savePartnership, resetPartnership
  } = partnershipsHook;

  const engine = useMatchEngine(matchData, swapStrike);

  const {
    score, wickets, balls, overs,
    currentOver, completeHistory,
    matchOver, winner, target, innings, isFreeHit,
    handleRun, handleWicket, handleWide,
    handleNoBall, handleBye, restoreState
  } = engine;

  /* ================= UI STATE ================= */
  const [showStartModal, setShowStartModal] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [showInningsHistory, setShowInningsHistory] = useState(false);
  const [historyStack, setHistoryStack] = useState([]);

  /* ================= UNDO SYSTEM ================= */
  const saveSnapshot = () => {
    setHistoryStack(prev => [...prev, {
      score, wickets, balls, overs,
      currentOver: [...currentOver]
    }]);
  };

  const undoLastBall = () => {
    if (historyStack.length === 0) return;
    const last = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, -1));
    restoreState(last);
  };

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

      <InfoStrip overs={`${overs}.${balls}`} bowler={bowlers[currentBowlerIndex]?.name} isFreeHit={isFreeHit} />

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
          onRun={(r) => { saveSnapshot(); addRunsToStriker(r); addRunsToPartnership(r, players[strikerIndex].name); handleRun(r); }}
          onWide={() => { saveSnapshot(); addExtraToPartnership(1); handleWide(); }}
          onNoBall={() => { saveSnapshot(); addExtraToPartnership(1); handleNoBall(); }}
          onBye={(r) => { saveSnapshot(); addExtraToPartnership(r); addBallToPartnership(); handleBye(r); }}
          onWicket={() => {
            if (isFreeHit) { handleWicket(); return; }
            saveSnapshot();
            savePartnership(score, wickets + 1);
            resetPartnership();
            registerWicket();
            handleWicket();
          }}
          onSwapStrike={swapStrike}
          onUndo={undoLastBall}
        />
      )}

      <button className={styles.inningsHistoryBtn} onClick={() => setShowInningsHistory(true)}>
        Innings History
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
        <PartnershipHistory history={partnershipHistory} onClose={() => setShowPartnershipHistory(false)} />
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
        <InningsHistory history={completeHistory} onClose={() => setShowInningsHistory(false)} />
      )}

    </div>
  );
}

export default ScoringPage;
