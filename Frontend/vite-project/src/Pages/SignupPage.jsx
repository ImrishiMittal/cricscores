import { useNavigate } from "react-router-dom";
import styles from "./Auth.module.css";

function SignupPage() {
    const navigate = useNavigate();
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.badge}>SIGN UP</div>

        <input className={styles.input} placeholder="Username" />
        <input className={styles.input} placeholder="Email" />
        <input
          className={styles.input}
          placeholder="Password"
          type="password"
        />

        <div className={styles.or}>OR</div>

        <div className={styles.socials}>
          <i className="fa-brands fa-google"></i>
          <i className="fa-solid fa-envelope"></i>
          <i className="fa-brands fa-x-twitter"></i>
        </div>

        <div className={styles.linkText}>
          Already have an account?
          <span onClick={() => navigate("/login")}> Log In</span>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
