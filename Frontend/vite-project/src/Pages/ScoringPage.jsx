import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import BrandTitle from "../Components/BrandTitle";
import ScoreHeader from "../Components/Scoring/ScoreHeader";
import InfoStrip from "../Components/Scoring/InfoStrip";
import OverBalls from "../Components/Scoring/OverBalls";
import BatsmenRow from "../Components/Scoring/BatsmenRow";
import RunControls from "../Components/Scoring/RunControls";
import styles from "../Components/Scoring/scoring.module.css";
import StartInningsModal from "../Components/Scoring/StartInningsModal";
import NewBatsmanModal from "../Components/Scoring/NewBatsmanModal";
import NewBowlerModal from "../Components/Scoring/NewBowlerModal";
import PartnershipHistory from "../Components/Scoring/PartnershipHistory";

function ScoringPage() {
  const location = useLocation();
  const matchData = location.state || {};
  const rules = matchData.rules || {};
  const teamA = matchData.teamA || "Team 1";
  const teamB = matchData.teamB || "Team 2";
  const firstBattingTeam = matchData.battingFirst || teamA;
  const secondBattingTeam = firstBattingTeam === teamA ? teamB : teamA;

  /* ================= MATCH CONFIG ================= */
  const totalOvers = Number(matchData.overs) || 10;
  const totalBalls = totalOvers * 6;

  /* ================= MATCH STATE ================= */
  const [innings, setInnings] = useState(1);
  const [target, setTarget] = useState(null);
  const [matchOver, setMatchOver] = useState(false);
  const [winner, setWinner] = useState("");

  const maxWickets =
    innings === 1
      ? Number(matchData.teamAPlayers || 11) - 1
      : Number(matchData.teamBPlayers || 11) - 1;

  /* ================= SCORE ================= */
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [overs, setOvers] = useState(0);
  const [currentOver, setCurrentOver] = useState([]); // ✅ Last 6 balls only
  const [completeHistory, setCompleteHistory] = useState([]); // ✅ Full innings data

  /* ================= PLAYERS ================= */
  const [players, setPlayers] = useState([]);
  const [strikerIndex, setStrikerIndex] = useState(0);
  const [nonStrikerIndex, setNonStrikerIndex] = useState(1);

  /* ================= BOWLERS ================= */
  const [bowlers, setBowlers] = useState([]);
  const [currentBowlerIndex, setCurrentBowlerIndex] = useState(0);
  const [isNewBowlerPending, setIsNewBowlerPending] = useState(false);

  /* ================= MODALS ================= */
  const [showDialog, setShowDialog] = useState(true);
  const [isWicketPending, setIsWicketPending] = useState(false);
  const [outBatsman, setOutBatsman] = useState(null);

  /* ================= PARTNERSHIP ================= */
  const [partnershipRuns, setPartnershipRuns] = useState(0);
  const [partnershipBalls, setPartnershipBalls] = useState(0);

  // ✅ NEW: Track individual batsman contributions in current partnership
  const [striker1Contribution, setStriker1Contribution] = useState(0);
  const [striker2Contribution, setStriker2Contribution] = useState(0);
  const [currentPartnershipBatsmen, setCurrentPartnershipBatsmen] = useState(
    []
  );

  /*==============NEW: Partnership History===================*/
  const [partnershipHistory, setPartnershipHistory] = useState([]);
  const [showPartnershipHistory, setShowPartnershipHistory] = useState(false);

  const [isFreeHit, setIsFreeHit] = useState(false);

  const formatOvers = () => `${overs}.${balls}`;
  const calculateRunRate = () =>
    overs + balls / 6 === 0 ? "0.00" : (score / (overs + balls / 6)).toFixed(2);

  const swapStrike = () => {
    setStrikerIndex((prev) => {
      setNonStrikerIndex(prev);
      return prev === 0 ? 1 : 0;
    });
  };

  /* ================= END MATCH ================= */
  const endMatch = (winningTeam) => {
    setMatchOver(true);
    setWinner(winningTeam);
    setIsNewBowlerPending(false);
    setIsWicketPending(false);
  };

  /* ================= END INNINGS ================= */
  const endInnings = () => {

    // ✅ Save final partnership (even 0 runs)
    if (partnershipBalls > 0) {
      setPartnershipHistory((prev) => [
        ...prev,
        {
          batsman1: currentPartnershipBatsmen[0],
          batsman1Runs: striker1Contribution,
          batsman2: currentPartnershipBatsmen[1],
          batsman2Runs: striker2Contribution,
          totalRuns: partnershipRuns,
          totalBalls: partnershipBalls,
          scoreWhenBroke: score,
          wicketNumber: wickets,
        },
      ]);
    }
  
    if (innings === 1) {
      setTarget(score + 1);
      setInnings(2);
  
      // Reset scoring only
      setScore(0);
      setWickets(0);
      setBalls(0);
      setOvers(0);
      setCurrentOver([]);
      setPartnershipRuns(0);
      setPartnershipBalls(0);
      setIsFreeHit(false);
  
      // Reset partnership tracking (NOT history)
      setCurrentPartnershipBatsmen([]);
      setStriker1Contribution(0);
      setStriker2Contribution(0);
  
      setShowDialog(true);
    }
  };
  
  const checkMatchStatus = (newScore, nextWickets, nextBalls, nextOvers) => {
    const ballsBowled = nextOvers * 6 + nextBalls;

    // 🎯 CHASE WON
    if (innings === 2 && newScore >= target) {
      endMatch(secondBattingTeam);
      return true;
    }

    // ❌ ALL OUT
    if (nextWickets >= maxWickets) {
      if (innings === 2) {
        endMatch(firstBattingTeam);
      } else {
        endInnings();
      }
      return true;
    }

    // ⏳ OVERS FINISHED
    if (ballsBowled >= totalBalls) {
      if (innings === 2) {
        // Failed to chase
        endMatch(firstBattingTeam);
      } else {
        endInnings();
      }
      return true;
    }

    return false;
  };

  /* ================= MASTER MATCH ENGINE ================= */
  useEffect(() => {
    if (matchOver || showDialog) return;

    const ballsBowled = overs * 6 + balls;

    if (innings === 2 && score >= target) {
      endMatch(secondBattingTeam);
      return;
    }

    if (innings === 2 && (wickets >= maxWickets || ballsBowled >= totalBalls)) {
      endMatch(firstBattingTeam);
      return;
    }

    if (innings === 1 && (wickets >= maxWickets || ballsBowled >= totalBalls)) {
      endInnings();
    }
  }, [overs, balls, wickets, score]);

  /* ================= RUN ================= */
  const handleRun = (runs) => {
    if (matchOver) return;
    if (isFreeHit) setIsFreeHit(false);

    const newScore = score + runs;
    setScore(newScore);
    setPartnershipRuns((p) => p + runs);
    setPartnershipBalls((p) => p + 1);

    const strikerName = players[strikerIndex].name;

    if (strikerName === currentPartnershipBatsmen[0]) {
      setStriker1Contribution((prev) => prev + runs);
    } else {
      setStriker2Contribution((prev) => prev + runs);
    }

    setPlayers((prev) => {
      const updated = [...prev];
      updated[strikerIndex].runs += runs;
      updated[strikerIndex].balls += 1;
      return updated;
    });

    let nextBalls = balls + 1;
    let nextOvers = overs;

    if (runs % 2 === 1) swapStrike();

    // ✅ ADD BALL FIRST (before checking if over is complete)
    setCurrentOver((prev) => [...prev, { runs }]);
    setCompleteHistory((prev) => [...prev, { runs }]);

    // ✅ THEN check if over is complete
    if (nextBalls === 6) {
      nextOvers++;
      nextBalls = 0;
      swapStrike();

      // ✅ Clear current over AFTER adding the 6th ball
      setCurrentOver([]);
      // Small delay so user sees the 6th ball

      // Ask new bowler ONLY if innings still alive
      if (nextOvers * 6 < totalBalls && wickets < maxWickets) {
        setIsNewBowlerPending(true);
      }
    }

    setBalls(nextBalls);
    setOvers(nextOvers);

    checkMatchStatus(newScore, wickets, nextBalls, nextOvers);
  };
  /* ================= WICKET ================= */
  const handleWicket = () => {
    if (matchOver) return;
  
    // 🟡 Free hit wicket doesn't count
    if (isFreeHit) {
      setCurrentOver((prev) => [...prev, { type: "FH" }]);
      setCompleteHistory((prev) => [...prev, { type: "FH" }]);
      setIsFreeHit(false);
      return;
    }
  
    const nextWickets = wickets + 1;
    let nextBalls = balls + 1;
    let nextOvers = overs;
  
    // ✅ Count wicket ball in partnership (local calc to avoid async bug)
    const updatedPartnershipBalls = partnershipBalls + 1;
  
    // Over complete?
    if (nextBalls === 6) {
      nextOvers++;
      nextBalls = 0;
      swapStrike();
    }
  
    // Update match state
    setBalls(nextBalls);
    setOvers(nextOvers);
    setWickets(nextWickets);
  
    setCurrentOver((prev) => [...prev, { type: "W" }]);
    setCompleteHistory((prev) => [...prev, { type: "W" }]);
  
    // 🧠 SAVE PARTNERSHIP (even 0 runs, 1 ball)
    if (updatedPartnershipBalls > 0) {
      const partnershipData = {
        batsman1: currentPartnershipBatsmen[0],
        batsman1Runs: striker1Contribution,
        batsman2: currentPartnershipBatsmen[1],
        batsman2Runs: striker2Contribution,
        totalRuns: partnershipRuns,
        totalBalls: updatedPartnershipBalls,
        scoreWhenBroke: score,
        wicketNumber: nextWickets,
      };
  
      setPartnershipHistory((prev) => [...prev, partnershipData]);
    }
  
    // Reset partnership tracking
    setPartnershipRuns(0);
    setPartnershipBalls(0);
    setStriker1Contribution(0);
    setStriker2Contribution(0);
  
    // Ask for new batsman if innings still alive
    if (!checkMatchStatus(score, nextWickets, nextBalls, nextOvers)) {
      setOutBatsman(strikerIndex);
      setIsWicketPending(true);
    }
  };
  

  const ballsBowled = overs * 6 + balls;
  const ballsLeft = innings === 2 ? totalBalls - ballsBowled : 0;
  const runsNeeded = innings === 2 && target ? target - score : 0;
  const requiredRR =
    innings === 2 && ballsLeft > 0
      ? ((runsNeeded / ballsLeft) * 6).toFixed(2)
      : "0.00";


/* ============ WIDE ================= */
const handleWide = () => {
  if (!rules.wide || matchOver) return;

  setScore(prev => prev + 1);
  setPartnershipRuns(prev => prev + 1);  
  setCurrentOver(prev => [...prev, { type: "WD" }]);
  setCompleteHistory(prev => [...prev, { type: "WD" }]);
};


/* ================== BYE ================ */
const handleBye = (runs = 1) => {
  if (!rules.byes || matchOver) return;

  setScore(prev => prev + runs);
  setPartnershipRuns(prev => prev + runs);   // ✅ FIX
  setPartnershipBalls(prev => prev + 1);

  let nextBalls = balls + 1;
  let nextOvers = overs;

  if (runs % 2 === 1) swapStrike();

  if (nextBalls === 6) {
    nextOvers++;
    nextBalls = 0;
    swapStrike();
  }

  setBalls(nextBalls);
  setOvers(nextOvers);

  setCurrentOver(prev => [...prev, { type: "BYE", runs }]);
  setCompleteHistory(prev => [...prev, { type: "BYE", runs }]);
};

const handleNoBall = () => {
  if (!rules.noBall || matchOver) return;

  setScore(prev => prev + 1);               // team score
  setPartnershipRuns(prev => prev + 1);     // partnership includes extras
  setIsFreeHit(true);

  setCurrentOver(prev => [...prev, { type: "NB" }]);
  setCompleteHistory(prev => [...prev, { type: "NB" }]);
};




  return (
    <div className={styles.container}>
      {showDialog && (
        <StartInningsModal
          onStart={(s, ns, b) => {
            setPlayers([
              { name: s, runs: 0, balls: 0 },
              { name: ns, runs: 0, balls: 0 },
            ]);
            setBowlers([{ name: b, overs: 0, balls: 0, runs: 0, wickets: 0 }]);
            setCurrentPartnershipBatsmen([s, ns]);
            setStriker1Contribution(0);
            setStriker2Contribution(0);
            setShowDialog(false);
            setPartnershipHistory([]);
          }}
        />
      )}

      {!showDialog && (
        <>
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
            <div className={styles.chaseBox}>
              TARGET: {target} | NEED: {runsNeeded} | BALLS LEFT: {ballsLeft} |
              RRR: {requiredRR}
            </div>
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

              {/* ✅ NEW: Previous Partnerships Button */}
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
              onRun={handleRun}
              onWide={handleWide}
              onNoBall={handleNoBall}
              onWicket={handleWicket}
              onBye={handleBye}   
              onSwapStrike={swapStrike}
              disabled={isWicketPending}
            />
          )}

          {matchOver && (
            <div className={styles.resultBox}>🏆 {winner} WON THE MATCH</div>
          )}
        </>
      )}

      {isWicketPending && (
        <NewBatsmanModal
          onConfirm={(name) => {
            const updated = [...players];
            updated[outBatsman] = { name, runs: 0, balls: 0 };
            setPlayers(updated);

            // ✅ NEW: Update partnership batsmen
            const newPartnership = [...players];
            newPartnership[outBatsman] = { name, runs: 0, balls: 0 };
            setCurrentPartnershipBatsmen([
              newPartnership[0].name,
              newPartnership[1].name,
            ]);

            setIsWicketPending(false);
          }}
        />
      )}

      {isNewBowlerPending && (
        <NewBowlerModal
          onConfirm={(name) => {
            setBowlers((prev) => [
              ...prev,
              { name, overs: 0, balls: 0, runs: 0, wickets: 0 },
            ]);
            setCurrentBowlerIndex((prev) => prev + 1);
            setIsNewBowlerPending(false);
            setCurrentOver([]);
          }}
        />
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
