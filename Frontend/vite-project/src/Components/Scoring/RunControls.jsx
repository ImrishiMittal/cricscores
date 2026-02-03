import styles from "./scoring.module.css";

function RunControls({ onRun }) {
  return (
    <div className={styles.runPanel}>
      {[0,1,2,3,4,5,6].map(r => (
        <button key={r} onClick={() => onRun(r)}>{r}</button>
      ))}
    </div>
  );
}

export default RunControls;
