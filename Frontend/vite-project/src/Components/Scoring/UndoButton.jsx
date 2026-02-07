import styles from "./scoring.module.css";

function UndoButton({ onUndo }) {
  return (
    <button className={`${styles.runBtn} ${styles.undo}`} onClick={onUndo}>
      UNDO
    </button>
  );
}

export default UndoButton;
