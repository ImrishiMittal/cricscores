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

function ScoringPage() {
  const location = useLocation();
  const matchData = location.state || {};
  const rules = matchData.rules || {};
  // ============= FIX: Correct property names =============
  const teamA = matchData.teamA || "Team 1"; // ✅ Changed from teamAName
  const teamB = matchData.teamB || "Team 2"; // ✅ Changed from teamBName
  const firstBattingTeam = matchData.battingFirst;
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
  const [ballHistory, setBallHistory] = useState([]);

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
    if (innings === 1) {
      setTarget(score + 1);
      setInnings(2);

      // Reset only scoring, NOT teams
      setScore(0);
      setWickets(0);
      setBalls(0);
      setOvers(0);
      setBallHistory([]);
      setPartnershipRuns(0);
      setPartnershipBalls(0);
      setIsFreeHit(false);

      setShowDialog(true); // ask new batsmen + bowler
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

    setPlayers((prev) => {
      const updated = [...prev];
      updated[strikerIndex].runs += runs;
      updated[strikerIndex].balls += 1;
      return updated;
    });

    let nextBalls = balls + 1;
    let nextOvers = overs;

    if (runs % 2 === 1) swapStrike();

    if (nextBalls === 6) {
      nextOvers++;
      nextBalls = 0;
      swapStrike();

      // Ask new bowler ONLY if innings still alive
      if (nextOvers * 6 < totalBalls && wickets < maxWickets) {
        setIsNewBowlerPending(true);
      }
    }

    setBalls(nextBalls);
    setOvers(nextOvers);
    setBallHistory((prev) => [...prev, { runs }]);

    checkMatchStatus(newScore, wickets, nextBalls, nextOvers);
  };

  /* ================= WICKET ================= */
  const handleWicket = () => {
    if (matchOver) return;
    if (isFreeHit) {
      setBallHistory((prev) => [...prev, { type: "FH" }]);
      setIsFreeHit(false);
      return;
    }

    const nextWickets = wickets + 1;
    let nextBalls = balls + 1;
    let nextOvers = overs;

    if (nextBalls === 6) {
      nextOvers++;
      nextBalls = 0;
      swapStrike();
    }

    setBalls(nextBalls);
    setOvers(nextOvers);
    setWickets(nextWickets);
    setBallHistory((prev) => [...prev, { type: "W" }]);
    setPartnershipRuns(0);
    setPartnershipBalls(0);

    if (!checkMatchStatus(score, nextWickets, nextBalls, nextOvers)) {
      setOutBatsman(strikerIndex);
      setIsWicketPending(true);
    }
  };

  const handleWide = () => {
    if (!rules.wide || matchOver) return;
    setScore((prev) => prev + 1);
    setBallHistory((prev) => [...prev, { type: "WD" }]);
  };

  const handleNoBall = () => {
    if (!rules.noBall || matchOver) return;
    setScore((prev) => prev + 1);
    setIsFreeHit(true);
    setBallHistory((prev) => [...prev, { type: "NB" }]);
  };

  const ballsBowled = overs * 6 + balls;
  const ballsLeft = innings === 2 ? totalBalls - ballsBowled : 0;
  const runsNeeded = innings === 2 && target ? target - score : 0;
  const requiredRR =
    innings === 2 && ballsLeft > 0
      ? ((runsNeeded / ballsLeft) * 6).toFixed(2)
      : "0.00";

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
            setShowDialog(false);
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

          <OverBalls history={ballHistory} />
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
              onRun={handleRun}
              onWide={handleWide}
              onNoBall={handleNoBall}
              onWicket={handleWicket}
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
          }}
        />
      )}
    </div>
  );
}

export default ScoringPage;
