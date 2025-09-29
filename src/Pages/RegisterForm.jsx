import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Auth.module.css";

export default function RegisterForm() {
  const [formData, setFormData] = useState({ Email: "", Password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.Email,
        formData.Password
      );
      const user = userCredential.user;
      alert(`Account created for ${user.email}`);
      navigate("/home");
    } catch (error) {
      alert(`Registration failed: ${error.message}`);
    }
  };

  return (
    <div className={styles.authContainer}>
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <h2 className={styles.authHeading}>PrepVault Register</h2>

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

        <button type="submit" className={styles.authButton}>Register</button>

        <p className={styles.authLink}>
          Already have an account? <Link to="/">Login</Link>
        </p>
      </form>
    </div>
  );
}