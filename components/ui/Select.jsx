import React from "react";
import styles from "./Input.module.css";

export function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`${styles.input} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}