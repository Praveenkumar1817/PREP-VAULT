import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Auth.module.css";

export default function LoginForm() {
  const [formData, setFormData] = useState({ Email: "", Password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.Email,
        formData.Password
      );
      const user = userCredential.user;
      alert(`Welcome ${user.email}!`);
      navigate("/home");
    } catch (error) {
      alert(`Login failed: ${error.message}`);
    }
  };

  return (
    <div className={styles.authContainer}>
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <h2 className={styles.authHeading}>PrepVault Login</h2>

        <label className={styles.authLabel}>Email:</label>
        <input
          type="email"
          name="Email"
          value={formData.Email}
          onChange={handleChange}
          required
          className={styles.authInput}
        />

        <label className={styles.authLabel}>Password:</label>
        <input
          type="password"
          name="Password"
          value={formData.Password}
          onChange={handleChange}
          required
          className={styles.authInput}
        />

        <button type="submit" className={styles.authButton}>Login</button>

        <p className={styles.authLink}>
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}