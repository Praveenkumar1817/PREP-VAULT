import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css";

export default function AdminLoginForm() {
  const [formData, setFormData] = useState({ Email: "", Password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.Email,
        formData.Password
      );
      const user = userCredential.user;
      
      // Check if user is admin after login
      const adminEmails = ["admin@prepvault.com", "praveenkumar1817@gmail.com"];
      const isUserAdmin = adminEmails.includes(user.email);
      
      if (isUserAdmin) {
        alert(`Welcome Admin ${user.email}!`);
        navigate("/admin/analytics");
      } else {
        alert("Access denied. Admin credentials required.");
        await auth.signOut();
      }
    } catch (error) {
      alert(`Admin login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <h2 className={styles.authHeading}>PrepVault Admin Login</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
          Administrator Access Only
        </p>

        <label className={styles.authLabel}>Admin Email:</label>
        <input
          type="email"
          name="Email"
          value={formData.Email}
          onChange={handleChange}
          required
          className={styles.authInput}
          placeholder="admin@prepvault.com"
        />

        <label className={styles.authLabel}>Admin Password:</label>
        <input
          type="password"
          name="Password"
          value={formData.Password}
          onChange={handleChange}
          required
          className={styles.authInput}
        />

        <button 
          type="submit" 
          className={styles.authButton}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Admin Login"}
        </button>

        <p className={styles.authLink}>
          Regular user? <Link to="/">User Login</Link>
        </p>
      </form>
    </div>
  );
}