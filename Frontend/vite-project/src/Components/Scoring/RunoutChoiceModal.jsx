import styles from "./NewBatsmanModal.module.css";

export default function RunoutChoiceModal({
  striker,
  nonStriker,
  onSelect,
  onClose,
}) {
  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}> Who is out?</h2>

        <p
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "#9ca3af",
            marginBottom: "16px",
          }}
        >
          Select the batsman who got run out
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginBottom: "10px",
          }}
        >
          <button
            className={styles.confirmBtn}
            onClick={() => onSelect("striker")}
            style={{
              minWidth: "120px",
            }}
          >
            {striker}
          </button>

          <button
            className={styles.confirmBtn}
            onClick={() => onSelect("nonStriker")}
            style={{
              minWidth: "120px",
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
            }}
          >
            {nonStriker}
          </button>
        </div>

        <div className={styles.buttonRow}>
          <button
            className={styles.confirmBtn}
            onClick={onClose}
            style={{
              background: "linear-gradient(135deg, #374151, #4b5563)",
              color: "#fff",
              minWidth: "120px",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
