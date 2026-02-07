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
import styles from "../Components/Scoring/scoring.module.css";

import useMatchEngine from "../hooks/useMatchEngine";
import usePlayersAndBowlers from "../hooks/usePlayersAndBowlers";
import usePartnerships from "../hooks/usePartnerships";

function ScoringPage() {
  const location = useLocation();
  const matchData = location.state || {};

  /* 🧠 Hooks */
  const playersHook = usePlayersAndBowlers();
  const partnershipsHook = usePartnerships();
  const [showStartModal, setShowStartModal] = useState(true);

  const engine = useMatchEngine(
    matchData,
    playersHook.players,
    playersHook.strikerIndex,
    playersHook.swapStrike
  );

  const {
    players,
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
    registerWicket,
    confirmNewBatsman,
    requestNewBowler,
    confirmNewBowler,
  } = playersHook;

  const {
    partnershipRuns,
    partnershipBalls,
    partnershipHistory,
    showPartnershipHistory,
    setShowPartnershipHistory,
    startPartnership,
    addRunsToPartnership,
    addExtraToPartnership,
    addBallToPartnership,
    savePartnership,
    resetPartnership,
  } = partnershipsHook;

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
    wicketEvent,
    setWicketEvent
  } = useMatchEngine(matchData, swapStrike)

  

  const firstBattingTeam = matchData.battingFirst || matchData.teamA;
  const secondBattingTeam =
    firstBattingTeam === matchData.teamA ? matchData.teamB : matchData.teamA;

  const formatOvers = () => `${overs}.${balls}`;
  const calculateRunRate = () =>
    overs + balls / 6 === 0 ? "0.00" : (score / (overs + balls / 6)).toFixed(2);

    useEffect(() => {
      if (wicketEvent) {
        setOutBatsman(strikerIndex); // UI knows striker
        setIsWicketPending(true);
      }
    }, [wicketEvent]);
    

  return (
    <div className={styles.container}>
      {showStartModal && (
  <StartInningsModal
    onStart={(s, ns, b) => {
      startInnings(s, ns, b);
      startPartnership(s, ns);
      setShowStartModal(false);  // 🔥 this closes the popup
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
        overs={formatOvers()}
        bowler={bowlers[currentBowlerIndex]?.name}
        runRate={calculateRunRate()}
        isFreeHit={isFreeHit}
      />

      {innings === 2 && !matchOver && (
        <div className={styles.chaseBox}>TARGET: {target}</div>
      )}

      <OverBalls history={currentOver} />

      {players.length >= 2 && (
        <>
          <BatsmenRow
            striker={players[strikerIndex]}
            nonStriker={players[nonStrikerIndex]}
            partnershipRuns={partnershipRuns}
            partnershipBalls={partnershipBalls}
          />

          {partnershipHistory.length > 0 && (
            <button
              className={styles.partnershipHistoryBtn}
              onClick={() => setShowPartnershipHistory(true)}
            >
              📊 Previous Partnerships ({partnershipHistory.length})
            </button>
          )}
        </>
      )}

{!matchOver && (
  <RunControls
    onRun={(r) => {
      addRunsToStriker(r);
      addRunsToPartnership(r, players[strikerIndex].name);
      handleRun(r);
    }}
    onWide={() => {
      addExtraToPartnership(1);
      handleWide();
    }}
    onNoBall={() => {
      addExtraToPartnership(1);
      handleNoBall();
    }}
    onBye={(r) => {
      addExtraToPartnership(r);
      addBallToPartnership();
      handleBye(r);
    }}
    onWicket={() => {
      // ✅ FIX: Check free hit FIRST
      if (isFreeHit) {
        handleWicket(); // Engine handles it properly
        return;
      }

      // 🔴 Real wicket - do everything
      savePartnership(score, wickets + 1);
      resetPartnership();
      registerWicket();
      handleWicket();
    }}
    onSwapStrike={swapStrike}
  />
)}

      {matchOver && (
        <div className={styles.resultBox}>🏆 {winner} WON THE MATCH</div>
      )}

{isWicketPending && (
  <NewBatsmanModal
    onConfirm={(name) => {
      confirmNewBatsman(name);      // replaces batsman
      startPartnership(players[0].name, players[1].name);

      setIsWicketPending(false);    // close modal
      setWicketEvent(null);         // 🔥 tell UI wicket handled
    }}
  />
)}


      {isNewBowlerPending && (
        <NewBowlerModal onConfirm={confirmNewBowler} />
      )}

      {showPartnershipHistory && (
        <PartnershipHistory
          history={partnershipHistory}
          onClose={() => setShowPartnershipHistory(false)}
        />
      )}
    </div>
  );
}

export default ScoringPage;
