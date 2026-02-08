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
  const [historyStack, setHistoryStack] = useState([]);

  const shouldSaveSnapshot = useRef(false);
  const innings2DataRef = useRef(null); // ✅ Store innings 2 data before match ends

  /* ================= HELPER: CAPTURE CURRENT INNINGS DATA ================= */
  const captureCurrentInningsData = () => {
    return {
      battingStats: players.map((p) => ({
        name: p.name,
        runs: p.runs || 0,
        balls: p.balls || 0,
        strikeRate: p.balls ? ((p.runs / p.balls) * 100).toFixed(1) : "0.0",
      })),
      bowlingStats: bowlers.map((b) => ({
        name: b.name,
        overs: b.overs || 0,
        balls: b.balls || 0,
        runs: b.runs || 0,
        wickets: b.wickets || 0,
        economy: b.overs > 0 ? (b.runs / b.overs).toFixed(2) : "0.00",
      })),
    };
  };

  /* ================= INNINGS CHANGE HANDLER ================= */
  useEffect(() => {
    if (inningsChangeEvent) {
      // 1. Capture 1st Innings Stats immediately
      const data = captureCurrentInningsData();
      setInnings1Data(data);

      // 2. Reset everything for 2nd Innings
      setTimeout(() => {
        restorePlayersState({ players: [], strikerIndex: 0, nonStrikerIndex: 1 });
        restoreBowlersState({ bowlers: [], currentBowlerIndex: 0 });
        restorePartnershipState({
          partnershipRuns: 0,
          partnershipBalls: 0,
          striker1Contribution: 0,
          striker2Contribution: 0,
          partnershipHistory: [],
        });
        setShowStartModal(true);
        setInningsChangeEvent(null);
      }, 50);
    }
  }, [inningsChangeEvent]);

  /* ================= SHOW SUMMARY ON MATCH END ================= */
  useEffect(() => {
    if (matchOver && !showSummary) {
      // Capture 2nd innings stats one last time
      const inn2Data = captureCurrentInningsData();
      setInnings2Data(inn2Data);
      setShowSummary(true);
    }
  }, [matchOver]);

  /* ================= SAVE INITIAL STATE ================= */
  useEffect(() => {
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
        players: JSON.parse(JSON.stringify(players)),
        strikerIndex,
        nonStrikerIndex,
        isWicketPending,
        partnershipRuns,
        partnershipBalls,
        striker1Contribution,
        striker2Contribution,
        partnershipHistory: JSON.parse(JSON.stringify(partnershipHistory)),
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
  ]);

  /* ================= UNDO ================= */
  const undoLastBall = () => {
    if (historyStack.length === 0) {
      alert("No balls to undo!");
      return;
    }

    const last = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));

    restoreState(last);
    restorePlayersState(last);
    restorePartnershipState(last);
    restoreBowlersState(last);
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

  /* ================= TEAM NAMES ================= */
  const firstBattingTeam = matchData.battingFirst || matchData.teamA;
  const secondBattingTeam =
    firstBattingTeam === matchData.teamA ? matchData.teamB : matchData.teamA;
  const currentBattingTeam =
    innings === 1 ? firstBattingTeam : secondBattingTeam;

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
        setInningsChangeEvent(null);
      }, 50);
  
      return; // 🚫 Stop here so reset code below doesn't run
    }
  
    // ================= INNINGS 1 END =================
    console.log("🔄 Innings 1 ending — capturing data");
  
    const inn1Data = captureCurrentInningsData();
    setInnings1Data(inn1Data);
  
    setTimeout(() => {
      restorePlayersState({
        players: [],
        strikerIndex: 0,
        nonStrikerIndex: 1,
        isWicketPending: false,
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
        partnershipHistory: [],
      });
  
      setShowStartModal(true);
      setInningsChangeEvent(null);
    }, 50);
  
  }, [inningsChangeEvent]);
  

  /* ================= SHOW SUMMARY ON MATCH END ================= */
  useEffect(() => {
    if (matchOver && !showSummary) {
      console.log("🏁 Match Over");

      // ✅ Use pre-captured data from ref if available
      if (innings2DataRef.current) {
        console.log("Using pre-captured innings 2 data:", innings2DataRef.current);
        setInnings2Data(innings2DataRef.current);
      } else {
        console.log("⚠️ No ref data, capturing now (might be empty)");
        const inn2Data = captureCurrentInningsData();
        console.log("Innings 2 data:", inn2Data);
        setInnings2Data(inn2Data);
      }

      setTimeout(() => {
        setShowSummary(true);
      }, 100);
    }
  }, [matchOver, showSummary]);

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
        team={innings === 1 ? firstBattingTeam : secondBattingTeam}
        score={score}
        wickets={wickets}
      />

      <InfoStrip
        overs={overs}
        balls={balls}
        bowler={bowlers[currentBowlerIndex]?.name}
        score={score}
        target={target}
        innings={innings}
        totalOvers={matchData.overs}
        isFreeHit={isFreeHit}
        matchData={matchData}
        currentTeam={currentBattingTeam}
      />

      <OverBalls history={currentOver} />

      {players.length >= 2 && (
        <BatsmenRow
          striker={players[strikerIndex]}
          nonStriker={players[nonStrikerIndex]}
          partnershipRuns={partnershipRuns}
          partnershipBalls={partnershipBalls}
          matchData={matchData}
          currentTeam={currentBattingTeam}
        />
      )}

      {!matchOver && (
        <RunControls
          onRun={(r) => {
            // ✅ Capture innings 2 data BEFORE run (in case target is reached)
            if (innings === 2 && score + r >= target) {
              const finalData = captureCurrentInningsData();
              // Manually update the striker/bowler for the final ball before saving
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
          }}
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
          onWicket={() => {
            if (isFreeHit) {
              handleWicket();
              return;
            }

            // ✅ Capture innings 2 data BEFORE wicket (in case match ends)
            if (innings === 2) {
              innings2DataRef.current = captureCurrentInningsData();
              console.log("📸 Pre-captured innings 2 data (wicket)");
            }

            addWicketToBowler();
            addBallToPartnership();
            savePartnership(score, wickets + 1);
            resetPartnership();
            registerWicket();
            handleWicket();

            setTimeout(() => {
              shouldSaveSnapshot.current = true;
            }, 0);
          }}
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
      </div>

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
          matchData={matchData}
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
          matchData={matchData}
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
