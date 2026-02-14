import styles from "./MoreOptionsMenu.module.css";

function MoreOptionsMenu({ 
  innings, 
  onClose, 
  onOpenDLS, 
  onOpenChangePlayers,
  onOpenChangeOvers,
  onOpenChangeBowlerLimit
}) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>⚙ Match Controls</h2>

        <div className={styles.optionList}>
          <button
            className={styles.optionBtn}
            onClick={() => {
              onClose();
              onOpenChangePlayers();
            }}
          >
            👥 Change Number of Players
          </button>

          {/* Only show in Innings 1 */}
          {innings === 1 && (
            <>
              <button 
                className={styles.optionBtn}
                onClick={() => {
                  onClose();
                  onOpenChangeOvers();
                }}
              >
                🏏 Change Total Overs
              </button>

              <button 
                className={styles.optionBtn}
                onClick={() => {
                  onClose();
                  onOpenChangeBowlerLimit();
                }}
              >
                🎯 Change Bowler Over Limit
              </button>
            </>
          )}

          {/* Only show in Innings 2 */}
          {innings === 2 && (
            <>
              <button
                className={styles.optionBtn}
                onClick={() => {
                  onClose();
                  onOpenDLS();
                }}
              >
                🌧 DLS Calculator
              </button>

              <button className={styles.optionBtn}>📊 Win Probability</button>
            </>
          )}
        </div>

        <button className={styles.closeBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default MoreOptionsMenu;
