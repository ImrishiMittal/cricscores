import { useNavigate } from "react-router-dom";
import styles from "./Auth.module.css";

function SignupPage() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // later: validation + backend API
    console.log("Signup submitted");
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.badge}>SIGN UP</div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.input}
            placeholder="Username"
            required
          />
          <input
            className={styles.input}
            placeholder="Email"
            type="email"
            required
          />
          <input
            className={styles.input}
            placeholder="Password"
            type="password"
            required
          />

          <button type="submit" className={styles.submitBtn}>
            Sign Up
          </button>
        </form>

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

