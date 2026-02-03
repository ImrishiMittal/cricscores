import styles from "./scoring.module.css";
import { useState } from "react";

export default function StartInningsModal({ onStart }) {
  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [bowler, setBowler] = useState("");

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBox}>
        <h2>Start Innings</h2>
        <input placeholder="Striker Name" onChange={(e)=>setStriker(e.target.value)} />
        <input placeholder="Non-Striker Name" onChange={(e)=>setNonStriker(e.target.value)} />
        <input placeholder="Opening Bowler" onChange={(e)=>setBowler(e.target.value)} />
        <button onClick={() => onStart(striker, nonStriker, bowler)}>
          Start Match
        </button>
      </div>
    </div>
  );
}
