import { useLocation } from "react-router-dom";
import { useState } from "react";
import BrandTitle from "../Components/BrandTitle";

import ScoreHeader from "../Components/Scoring/ScoreHeader";
import InfoStrip from "../Components/Scoring/InfoStrip";
import OverBalls from "../Components/Scoring/OverBalls";
import BatsmenRow from "../Components/Scoring/BatsmenRow";
import RunControls from "../Components/Scoring/RunControls";
import WicketButton from "../Components/Scoring/WicketButton";

function ScoringPage() {
  const location = useLocation();
  const matchData = location.state || {};

  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [overs, setOvers] = useState(0);
  const [ballHistory, setBallHistory] = useState([]);

  const formatOvers = () => `${overs}.${balls}`;

  return (
    <div>
      <BrandTitle size="small" />
      <ScoreHeader team={matchData.battingFirst} score={score} wickets={wickets} />
      <InfoStrip overs={formatOvers()} bowler="Bowler Name" />
      <OverBalls history={ballHistory} />
      <BatsmenRow striker={{}} nonStriker={{}} />
      <RunControls onRun={(r) => {}} />
      <WicketButton onWicket={() => {}} />
    </div>
  );
}

export default ScoringPage;
