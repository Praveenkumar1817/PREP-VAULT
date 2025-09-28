import React from "react";
import styles from "./Input.module.css";

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`${styles.input} ${className}`}
      {...props}
    />
  );
}