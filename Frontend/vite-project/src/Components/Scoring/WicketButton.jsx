import styles from "./scoring.module.css";

function WicketButton({ onWicket }) {
  return (
    <button className={styles.wicketBtn} onClick={onWicket}>
      WICKET
    </button>
  );
}

export default WicketButton;
