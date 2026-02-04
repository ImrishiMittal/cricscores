import { useState } from "react";
import styles from "./scoring.module.css";

function NewBowlerModal({ onConfirm }) {
  const [name, setName] = useState("");

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBox}>
        <h2>New Bowler</h2>
        <input
          placeholder="Enter bowler name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={() => name.trim() && onConfirm(name)}>
          Start Over
        </button>
      </div>
    </div>
  );
}

export default NewBowlerModal;

