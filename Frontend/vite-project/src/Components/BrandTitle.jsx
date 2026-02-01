import styles from "./BrandTitle.module.css";

function BrandTitle({ size = "large" }) {
  return (
    <h1 className={`${styles.title} ${styles[size]}`}>
      Cric<span>Scores</span>
    </h1>
  );
}

export default BrandTitle;
