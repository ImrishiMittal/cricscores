import { useLocation } from "react-router-dom";
import { useState } from "react";
import BrandTitle from "../Components/BrandTitle";

import ScoreHeader from "../Components/Scoring/ScoreHeader";
import InfoStrip from "../Components/Scoring/InfoStrip";
import OverBalls from "../Components/Scoring/OverBalls";
import BatsmenRow from "../Components/Scoring/BatsmenRow";
import RunControls from "../Components/Scoring/RunControls";
import WicketButton from "../Components/Scoring/WicketButton";
import styles from "../Components/Scoring/scoring.module.css";
import StartInningsModal from "../Components/Scoring/StartInningsModal";
import NewBatsmanModal from "../Components/Scoring/NewBatsmanModal";
import NewBowlerModal from "../Components/Scoring/NewBowlerModal";


function ScoringPage() {
  const location = useLocation();
  const matchData = location.state || {};

  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [overs, setOvers] = useState(0);
  const [ballHistory, setBallHistory] = useState([]);

  const [showDialog, setShowDialog] = useState(true);
  const [strikerIndex, setStrikerIndex] = useState(0);
  const [nonStrikerIndex, setNonStrikerIndex] = useState(1);
  const [bowler, setBowler] = useState("");
  const formatOvers = () => `${overs}.${balls}`;

  const [players, setPlayers] = useState([]);

  const [isWicketPending, setIsWicketPending] = useState(false);
  const [outBatsman, setOutBatsman] = useState(null);

  const [partnershipRuns, setPartnershipRuns] = useState(0);
  const [partnershipBalls, setPartnershipBalls] = useState(0);

  const [bowlers, setBowlers] = useState([]);
  const [currentBowlerIndex, setCurrentBowlerIndex] = useState(0);
  const [isNewBowlerPending, setIsNewBowlerPending] = useState(false);

  const [fallOfWickets, setFallOfWickets] = useState([]);

  const calculateRunRate = () => {
    const totalOvers = overs + balls / 6;
    if (totalOvers === 0) return "0.00";
    return (score / totalOvers).toFixed(2);
  };
  const swapStrike = () => {
    setStrikerIndex((prev) => {
      setNonStrikerIndex(prev);
      return prev === 0 ? 1 : 0;
    });
  };

  const handleRun = (runs) => {
    setPartnershipRuns((prev) => prev + runs);
    setPartnershipBalls((prev) => prev + 1);
    setScore((prev) => prev + runs);
    setPlayers((prev) => {
      const updated = [...prev];
      updated[strikerIndex] = {
        ...updated[strikerIndex],
        runs: updated[strikerIndex].runs + runs,
        balls: updated[strikerIndex].balls + 1,
      };
      return updated;
    });

    let newBall = balls + 1;

    // 🟢 Odd runs → swap strike
    if (runs % 2 === 1) {
      swapStrike();
    }

    // 🟢 Over complete
    if (newBall === 6) {
      setOvers((prev) => prev + 1);
      setBalls(0);

      // swap strike at end of over
      swapStrike();
    } else {
      setBalls(newBall);
    }

    setBallHistory((prev) => [...prev, { runs }]);

    setBowlers((prev) => {
      const updated = [...prev];
      updated[currentBowlerIndex].runs += runs;
      updated[currentBowlerIndex].balls += 1;

      if (updated[currentBowlerIndex].balls === 6) {
        updated[currentBowlerIndex].overs += 1;
        updated[currentBowlerIndex].balls = 0;
        setIsNewBowlerPending(true); // trigger modal
      }

      return updated;
    });
  };

  const handleWicket = () => {
    setFallOfWickets((prev) => [...prev, `${wickets + 1}-${score}`]);

    setPartnershipRuns(0);
    setPartnershipBalls(0);

    setWickets((prev) => prev + 1);

    let newBall = balls + 1;
    if (newBall === 6) {
      setOvers((prev) => prev + 1);
      setBalls(0);
      swapStrike(); // over finished → strike changes
    } else {
      setBalls(newBall);
    }

    setBallHistory((prev) => [...prev, { type: "W" }]);

    // mark striker index as out
    setOutBatsman(strikerIndex);
    setIsWicketPending(true);
    setBowlers((prev) => {
      const updated = [...prev];
      updated[currentBowlerIndex].wickets += 1;
      updated[currentBowlerIndex].balls += 1;

      if (updated[currentBowlerIndex].balls === 6) {
        updated[currentBowlerIndex].overs += 1;
        updated[currentBowlerIndex].balls = 0;
        setIsNewBowlerPending(true);
      }

      return updated;
    });
  };

  const handleNewBatsman = (name) => {
    const updated = [...players];

    updated[outBatsman] = {
      name,
      runs: 0,
      balls: 0,
    };

    setPlayers(updated);
    setIsWicketPending(false);
  };

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
          <ScoreHeader
            team={matchData.battingFirst}
            score={score}
            wickets={wickets}
          />
          <InfoStrip
            overs={formatOvers()}
            bowler={`${bowlers[currentBowlerIndex]?.name} ${bowlers[currentBowlerIndex]?.wickets}-${bowlers[currentBowlerIndex]?.runs}`}
            runRate={calculateRunRate()}
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

          <RunControls onRun={handleRun} disabled={isWicketPending} />

          <WicketButton onWicket={handleWicket} />
        </>
      )}
      {isWicketPending && <NewBatsmanModal onConfirm={handleNewBatsman} />}
      {isNewBowlerPending && <NewBowlerModal onConfirm={handleNewBowler} />}
    </div>
  );
}

export default ScoringPage;
