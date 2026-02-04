import { useState } from "react";
import styles from "./scoring.module.css";

function NewBatsmanModal({ onConfirm }) {
  const [name, setName] = useState("");

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBox}>
        <h2>New Batsman</h2>

        <input
          placeholder="Enter batsman name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={() => {
            if (name.trim()) onConfirm(name);
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

export default NewBatsmanModal;
