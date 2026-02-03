import styles from "./scoring.module.css";

function BatsmenRow({ striker, nonStriker }) {
  return (
    <div className={styles.batsmenRow}>
      <div>
        <h3>{striker.name} *</h3>
        <p>{striker.runs} ({striker.balls})</p>
      </div>
      <div>
        <h3>{nonStriker.name}</h3>
        <p>{nonStriker.runs} ({nonStriker.balls})</p>
      </div>
    </div>
  );
}

export default BatsmenRow;

