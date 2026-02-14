import styles from "./scoring.module.css";
import { useState } from "react";

export default function StartInningsModal({ onStart }) {
  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [bowler, setBowler] = useState("");
  const [error, setError] = useState("");

  const handleStart = () => {
    // ✅ Validation: Check if all fields are filled
    if (!striker.trim()) {
      setError("❌ Striker name is required");
      return;
    }
    if (!nonStriker.trim()) {
      setError("❌ Non-striker name is required");
      return;
    }
    if (!bowler.trim()) {
      setError("❌ Bowler name is required");
      return;
    }

    // ✅ Check if names are different
    if (striker.trim().toLowerCase() === nonStriker.trim().toLowerCase()) {
      setError("❌ Striker and non-striker must have different names");
      return;
    }

    // ✅ All validations passed - start innings
    setError("");
    onStart(striker.trim(), nonStriker.trim(), bowler.trim());
  };

  // ✅ Allow Enter key to start
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleStart();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBox}>
        <h2>🏏 Start Innings</h2>
        
        <input 
          placeholder="Striker Name" 
          value={striker}
          onChange={(e) => {
            setStriker(e.target.value);
            setError(""); // Clear error on input
          }}
          onKeyPress={handleKeyPress}
          autoFocus
        />
        
        <input 
          placeholder="Non-Striker Name" 
          value={nonStriker}
          onChange={(e) => {
            setNonStriker(e.target.value);
            setError(""); // Clear error on input
          }}
          onKeyPress={handleKeyPress}
        />
        
        <input 
          placeholder="Opening Bowler" 
          value={bowler}
          onChange={(e) => {
            setBowler(e.target.value);
            setError(""); // Clear error on input
          }}
          onKeyPress={handleKeyPress}
        />

        {/* ✅ Error message display */}
        {error && (
          <div style={{
            color: "#ef4444",
            fontSize: "13px",
            fontWeight: "600",
            marginTop: "8px",
            textAlign: "center",
            padding: "8px",
            background: "rgba(239, 68, 68, 0.1)",
            borderRadius: "6px"
          }}>
            {error}
          </div>
        )}

        <button 
          onClick={handleStart}
          disabled={!striker.trim() || !nonStriker.trim() || !bowler.trim()}
          style={{
            opacity: (!striker.trim() || !nonStriker.trim() || !bowler.trim()) ? 0.5 : 1,
            cursor: (!striker.trim() || !nonStriker.trim() || !bowler.trim()) ? "not-allowed" : "pointer"
          }}
        >
          Start Match
        </button>
      </div>
    </div>
  );
}
