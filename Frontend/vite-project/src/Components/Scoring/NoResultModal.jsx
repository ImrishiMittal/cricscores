import styles from "./NewBowlerModal.module.css";

/**
 * NoResultModal
 * Simple confirmation popup before declaring "No Result".
 */
function NoResultModal({ onConfirm, onClose }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🌧️ No Result</h2>
        <p style={{ textAlign: "center", color: "#ccc", marginBottom: "12px" }}>
          Are you sure you want to declare this match as <strong style={{ color: "#fff" }}>No Result</strong>?
        </p>
        <p style={{ textAlign: "center", color: "#aaa", fontSize: "13px", marginBottom: "20px" }}>
          The match will end immediately regardless of the current score or overs remaining.
        </p>
        <div className={styles.buttonRow}>
          <button
            className={styles.confirmBtn}
            style={{ background: "#888" }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={styles.confirmBtn}
            style={{ background: "#8e44ad" }}
            onClick={onConfirm}
          >
            Confirm No Result
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoResultModal;
