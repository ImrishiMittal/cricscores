import styles from "./scoring.module.css";

function BatsmenRow({ striker, nonStriker, partnershipRuns, partnershipBalls}) {
  if (!striker || !nonStriker) return null;

  return (
    <>
     <div className={styles.batsmenRow}>
  
  <div className={styles.batsmanBlock}>
    <h3>{striker.name} *</h3>
    <p>{striker.runs} ({striker.balls})</p>
  </div>

  <div className={styles.partnershipBox}>
  PARTNERSHIP: {partnershipRuns}({partnershipBalls})*
</div>



  <div className={styles.batsmanBlock}>
    <h3>{nonStriker.name}</h3>
    <p>{nonStriker.runs} ({nonStriker.balls})</p>
  </div>
  

</div>

    </>
  );
}

export default BatsmenRow;


