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
import ComparisonGraph from "../Components/Scoring/ComparisonGraph";
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
  const [showComparisonGraph, setShowComparisonGraph] = useState(false);

  // Ball-by-ball tracking for each innings
  const [inn1BallByBall, setInn1BallByBall] = useState([]);
  const [inn2BallByBall, setInn2BallByBall] = useState([]);
  const currentBallByBall = useRef(
    innings === 1 ? inn1BallByBall : inn2BallByBall
  );

  const shouldSaveSnapshot = useRef(false);

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
      history: [...completeHistory],
    };
  };

  /* ================= TRACK BALL-BY-BALL PROGRESSION ================= */
  const recordBall = (
    runsOnBall,
    isWicket = false,
    isBye = false,
    isExtra = false
  ) => {
    const ballData = {
      over: overs,
      ball: balls,
      totalOvers: overs + balls / 6,
      score,
      wickets,
      runsOnBall,
      isWicket,
      isBye,
      isExtra,
    };

    if (innings === 1) {
      setInn1BallByBall((prev) => [...prev, ballData]);
    } else {
      setInn2BallByBall((prev) => [...prev, ballData]);
    }
  };

  /* ================= UNIFIED INNINGS CHANGE HANDLER ================= */
  useEffect(() => {
    if (!inningsChangeEvent) return;

    console.log("📋 Innings Change Event:", inningsChangeEvent);

    // ================= MATCH END (2nd innings finished) =================
    if (inningsChangeEvent.matchEnd) {
      console.log("🏁 Match ended — capturing 2nd innings");
      const inn2Data = captureCurrentInningsData();
      setInnings2Data(inn2Data);

      setTimeout(() => {
        setShowSummary(true);
        setInningsChangeEvent(null);
      }, 50);

      return;
    }

    // ================= INNINGS 1 END (transition to Innings 2) =================
    console.log(
      "🔄 Innings 1 ending — capturing data and resetting for Innings 2"
    );

    // Capture 1st Innings Stats IMMEDIATELY
    const inn1Data = captureCurrentInningsData();
    console.log("📊 Innings 1 Data Captured:", inn1Data);
    setInnings1Data(inn1Data);

    // Reset everything for 2nd Innings
    setTimeout(() => {
      console.log("🔧 Resetting players and bowlers for Innings 2");
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
      console.log("🏁 Match Over - Showing Summary");
      console.log("Innings 1 Data:", innings1Data);
      console.log("Innings 2 Data:", innings2Data);

      if (!innings2Data) {
        const inn2Data = captureCurrentInningsData();
        setInnings2Data(inn2Data);
      }

      setTimeout(() => {
        setShowSummary(true);
      }, 100);
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
        completeHistory: [],
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
        completeHistory: [...completeHistory],
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
    completeHistory,
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

    // Remove last ball from ball-by-ball
    if (innings === 1) {
      setInn1BallByBall((prev) => prev.slice(0, -1));
    } else {
      setInn2BallByBall((prev) => prev.slice(0, -1));
    }
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
          {/* ✅ FIX #2: Pass bowlers and currentBowlerIndex to ScoreHeader */}
          <ScoreHeader
            innings={innings}
            team={innings === 1 ? firstBattingTeam : secondBattingTeam}
            score={score}
            wickets={wickets}
            overs={overs} 
            balls={balls} 
            totalOvers={matchData.overs} 
            target = {target}
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
                recordBall(r);
                shouldSaveSnapshot.current = true;
                addRunsToStriker(r);
                addRunsToBowler(r);
                addBallToBowler();
                addRunsToPartnership(r, players[strikerIndex].name);
                handleRun(r);
              }}
              onWide={() => {
                recordBall(1, false, false, true);
                shouldSaveSnapshot.current = true;
                addRunsToBowler(1);
                addExtraToPartnership(1);
                handleWide();
              }}
              onNoBall={() => {
                recordBall(1, false, false, true);
                shouldSaveSnapshot.current = true;
                addRunsToBowler(1);
                addExtraToPartnership(1);
                handleNoBall();
              }}
              onBye={(r) => {
                recordBall(r, false, true, false);
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

                recordBall(0, true);
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

        {innings === 2 && innings1Data && (
          <button
            className={styles.utilityBtn}
            onClick={() => setShowComparisonGraph(true)}
          >
            📈 Comparison Graph
          </button>
        )}
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

      {showComparisonGraph && innings1Data && (
        <ComparisonGraph
          team1Name={firstBattingTeam}
          team2Name={secondBattingTeam}
          innings1Data={innings1Data}
          innings2Data={innings2Data}
          innings1Score={innings1Score}
          innings2Score={innings2Score}
          innings1History={innings === 1 ? completeHistory : innings1Data?.history || []} // ✅ ADD
    innings2History={innings === 2 ? completeHistory : []} 
          matchData={matchData}
          onClose={() => setShowComparisonGraph(false)}
        />
      )}
    </div>
  );
}

export default ScoringPage;
