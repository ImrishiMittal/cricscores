import { useLocation } from "react-router-dom";
import { useState } from "react";
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

  // ---------------- SCORE STATE ----------------
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [overs, setOvers] = useState(0);
  const [ballHistory, setBallHistory] = useState([]);

  // ---------------- PLAYERS ----------------
  const [players, setPlayers] = useState([]);
  const [strikerIndex, setStrikerIndex] = useState(0);
  const [nonStrikerIndex, setNonStrikerIndex] = useState(1);

  // ---------------- BOWLERS ----------------
  const [bowlers, setBowlers] = useState([]);
  const [currentBowlerIndex, setCurrentBowlerIndex] = useState(0);
  const [isNewBowlerPending, setIsNewBowlerPending] = useState(false);

  // ---------------- MODALS ----------------
  const [showDialog, setShowDialog] = useState(true);
  const [isWicketPending, setIsWicketPending] = useState(false);
  const [outBatsman, setOutBatsman] = useState(null);

  // ---------------- PARTNERSHIP ----------------
  const [partnershipRuns, setPartnershipRuns] = useState(0);
  const [partnershipBalls, setPartnershipBalls] = useState(0);

  // ---------------- FREE HIT ----------------
  const [isFreeHit, setIsFreeHit] = useState(false);

  const formatOvers = () => `${overs}.${balls}`;

  const calculateRunRate = () => {
    const totalOvers = overs + balls / 6;
    return totalOvers === 0 ? "0.00" : (score / totalOvers).toFixed(2);
  };

  const swapStrike = () => {
    setStrikerIndex((prev) => {
      setNonStrikerIndex(prev);
      return prev === 0 ? 1 : 0;
    });
  };

  // ================= RUN HANDLER =================
  const handleRun = (runs) => {
    if (isFreeHit) setIsFreeHit(false);

    setScore((prev) => prev + runs);
    setPartnershipRuns((prev) => prev + runs);
    setPartnershipBalls((prev) => prev + 1);

    setPlayers((prev) => {
      const updated = [...prev];
      updated[strikerIndex].runs += runs;
      updated[strikerIndex].balls += 1;
      return updated;
    });

    let newBall = balls + 1;

    if (runs % 2 === 1) swapStrike();

    if (newBall === 6) {
      setOvers((prev) => prev + 1);
      setBalls(0);
      swapStrike();
      setIsNewBowlerPending(true);
    } else {
      setBalls(newBall);
    }

    setBallHistory((prev) => [...prev, { runs }]);

    // Bowler stats
    setBowlers((prev) => {
      const updated = [...prev];
      updated[currentBowlerIndex].runs += runs;
      updated[currentBowlerIndex].balls += 1;
      return updated;
    });
  };

  // ================= WICKET HANDLER =================
  const handleWicket = () => {
    if (isFreeHit) {
      setBallHistory((prev) => [...prev, { type: "FH" }]);
      setIsFreeHit(false);
      return;
    }

    setWickets((prev) => prev + 1);
    setOutBatsman(strikerIndex);
    setIsWicketPending(true);
    setPartnershipRuns(0);
    setPartnershipBalls(0);

    let newBall = balls + 1;

    if (newBall === 6) {
      setOvers((prev) => prev + 1);
      setBalls(0);
      swapStrike();
      setIsNewBowlerPending(true);
    } else {
      setBalls(newBall);
    }

    setBallHistory((prev) => [...prev, { type: "W" }]);

    setBowlers((prev) => {
      const updated = [...prev];
      updated[currentBowlerIndex].wickets += 1;
      return updated;
    });
  };

  // ================= EXTRAS =================
  const handleWide = () => {
    if (!rules.wide) return;
    setScore((prev) => prev + 1);
    setBallHistory((prev) => [...prev, { type: "WD" }]);
  };

  const handleNoBall = () => {
    if (!rules.noBall) return;
    setScore((prev) => prev + 1);
    setIsFreeHit(true);
    setBallHistory((prev) => [...prev, { type: "NB" }]);
  };

  // ================= NEW BATSMAN =================
  const handleNewBatsman = (name) => {
    const updated = [...players];
    updated[outBatsman] = { name, runs: 0, balls: 0 };
    setPlayers(updated);
    setIsWicketPending(false);
  };

  // ================= NEW BOWLER =================
  const handleNewBowler = (name) => {
    setBowlers((prev) => [
      ...prev,
      { name, overs: 0, balls: 0, runs: 0, wickets: 0 },
    ]);
    setCurrentBowlerIndex((prev) => prev + 1);
    setIsNewBowlerPending(false);
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
            setShowDialog(false);
          }}
        />
      )}

      {!showDialog && (
        <>
          <BrandTitle size="small" />
          <ScoreHeader team={matchData.battingFirst} score={score} wickets={wickets} />

          <InfoStrip
            overs={formatOvers()}
            bowler={`${bowlers[currentBowlerIndex]?.name} ${bowlers[currentBowlerIndex]?.wickets}-${bowlers[currentBowlerIndex]?.runs}`}
            runRate={calculateRunRate()}
            isFreeHit={isFreeHit}
          />

          <OverBalls history={ballHistory} />

          {players.length >= 2 && (
            <BatsmenRow
              striker={players[strikerIndex]}
              nonStriker={players[nonStrikerIndex]}
              partnershipRuns={partnershipRuns}
              partnershipBalls={partnershipBalls}
            />
          )}

          <RunControls
            onRun={handleRun}
            onWide={handleWide}
            onNoBall={handleNoBall}
            onWicket={handleWicket} 
            disabled={isWicketPending}
          />
        </>
      )}

      {isWicketPending && <NewBatsmanModal onConfirm={handleNewBatsman} />}
      {isNewBowlerPending && <NewBowlerModal onConfirm={handleNewBowler} />}
    </div>
  );
}

export default ScoringPage;
