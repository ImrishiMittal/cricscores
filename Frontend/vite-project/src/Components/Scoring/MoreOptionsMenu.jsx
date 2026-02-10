import styles from "./MoreOptionsMenu.module.css";

function MoreOptionsMenu({ innings, onClose, onOpenDLS }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>⚙ Match Controls</h2>

        <div className={styles.optionList}>
          <button className={styles.optionBtn}>
            👥 Change Number of Players
          </button>

          <button className={styles.optionBtn}>
            🏏 Change Total Overs
          </button>

          <button className={styles.optionBtn}>
            🎯 Change Bowler Over Limit
          </button>

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

              <button className={styles.optionBtn}>
                📊 Win Probability
              </button>
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

