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

  return (
    <div className={styles.container}>
      {showDialog && (
        <StartInningsModal
          onStart={(s, ns, b) => {
            setStrikerName(s);
            setNonStrikerName(ns);
            setBowler(b);
            setShowDialog(false);
          }}
        />
      )}
  
      {!showDialog && (
        <>
          <BrandTitle size="small" />
          <ScoreHeader team={matchData.battingFirst} score={score} wickets={wickets} />
          <InfoStrip overs={formatOvers()} bowler={bowler} />
          <OverBalls history={ballHistory} />
          <BatsmenRow striker={{ name: strikerName }} nonStriker={{ name: nonStrikerName }} />
          <RunControls onRun={handleRun} />
          <WicketButton onWicket={handleWicket} />
        </>
      )}
    </div>
  );  
}

export default ScoringPage;
