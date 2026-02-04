import styles from "./scoring.module.css";

function ExtrasControls({ onWide, onNoBall, onWicket }) {
  return (
    <div className={styles.extrasPanel}>
      <button onClick={onWide}>WD</button>
      <button onClick={onNoBall}>NB</button>
      <button onClick={onWicket} className={styles.wicketBtn}>WICKET</button>
    </div>
  );
}

export default ExtrasControls;
