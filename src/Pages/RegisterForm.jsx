import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

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
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.heading}>PrepVault Register</h2>

        <label style={styles.label}>Email:</label>
        <input
          type="email"
          name="Email"
          value={formData.Email}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <label style={styles.label}>Password:</label>
        <input
          type="password"
          name="Password"
          value={formData.Password}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <button type="submit" style={styles.button}>Register</button>

        <div style={styles.loginLinkContainer}>
          <p style={styles.loginText}>
            Already have an account?{" "}
            <Link to="/" style={styles.loginLink}>
              Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: { 
    display: "flex", 
    justifyContent: "center", 
    marginTop: "50px" 
  },
  form: { 
    display: "flex", 
    flexDirection: "column", 
    padding: "30px", 
    borderRadius: "10px", 
    width: "300px", 
    backgroundColor: "#000000" 
  },
  heading: { 
    textAlign: "center", 
    marginBottom: "20px", 
    color: "#fff" 
  },
  label: { 
    marginBottom: "5px", 
    fontWeight: "bold", 
    color: "#fff" 
  },
  input: { 
    padding: "8px", 
    marginBottom: "15px", 
    borderRadius: "4px", 
    border: "1px solid #96969f",
    backgroundColor: "#fff"
  },
  button: { 
    padding: "10px", 
    backgroundColor: "#28a745", 
    color: "#fff", 
    border: "none", 
    borderRadius: "5px", 
    cursor: "pointer", 
    fontWeight: "bold",
    fontSize: "16px"
  },
  loginLinkContainer: {
    marginTop: "15px",
    textAlign: "center"
  },
  loginText: {
    margin: 0,
    color: "#fff",
    fontSize: "14px"
  },
  loginLink: {
    color: "#007bff",
    textDecoration: "underline",
    cursor: "pointer"
  }
};