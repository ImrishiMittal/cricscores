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

function ScoringPage() {
  const location = useLocation();
  const matchData = location.state || {};

  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [overs, setOvers] = useState(0);
  const [ballHistory, setBallHistory] = useState([]);

  const [showDialog, setShowDialog] = useState(true);
  const [strikerName, setStrikerName] = useState("");
  const [nonStrikerName, setNonStrikerName] = useState("");
  const [bowler, setBowler] = useState("");
  const formatOvers = () => `${overs}.${balls}`;

  const [players, setPlayers] = useState([]);
  const [strikerIndex, setStrikerIndex] = useState(0);
  const [nonStrikerIndex, setNonStrikerIndex] = useState(1);

  const calculateRunRate = () => {
    const totalOvers = overs + balls / 6;
    if (totalOvers === 0) return "0.00";
    return (score / totalOvers).toFixed(2);
  };
  const swapStrike = () => {
    setStrikerIndex(prev => (prev === 0 ? 1 : 0));
    setNonStrikerIndex(prev => (prev === 0 ? 1 : 0));
  };
  
  const handleRun = (runs) => {
    setScore(prev => prev + runs);
  
    const updated = [...players];
    updated[strikerIndex].runs += runs;
    updated[strikerIndex].balls += 1;
    setPlayers(updated);
  
    let newBall = balls + 1;
  
    // 🟢 Odd runs → swap strike
    if (runs % 2 === 1) {
      swapStrike();
    }
  
    // 🟢 Over complete
    if (newBall === 6) {
      setOvers(prev => prev + 1);
      setBalls(0);
  
      // swap strike at end of over
      swapStrike();
    } else {
      setBalls(newBall);
    }
  
    setBallHistory(prev => [...prev, { runs }]);
  };
  

  const handleWicket = () => {
    setWickets((prev) => prev + 1);

    let newBall = balls + 1;

    if (newBall === 6) {
      setOvers((prev) => prev + 1);
      setBalls(0);
    } else {
      setBalls(newBall);
    }

    setBallHistory((prev) => [...prev, { type: "wicket", runs: 0 }]);
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
            setBowler(b);
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
            bowler={bowler}
            runRate={calculateRunRate()}
          />

          <OverBalls history={ballHistory} />
          <BatsmenRow
            striker={players[strikerIndex]}
            nonStriker={players[nonStrikerIndex]}
          />

          <RunControls onRun={handleRun} />
          <WicketButton onWicket={handleWicket} />
        </>
      )}
    </div>
  );
}

export default ScoringPage;
