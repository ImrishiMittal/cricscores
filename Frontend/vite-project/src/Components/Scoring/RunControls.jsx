import styles from "./scoring.module.css";

function RunControls({ onRun, disabled }) {
  return (
    <div className={styles.runPanel}>
      {[0,1,2,3,4,5,6].map(r => (
        <button disabled={disabled} key={r} onClick={() => onRun(r)}>{r}</button>
      ))}
    </div>
  );
}

export default RunControls;
