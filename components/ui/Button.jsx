import React from "react";
import styles from "./Button.module.css";

export function Button({ 
  children, 
  className = "", 
  variant = "primary", 
  size = "md", 
  ...props 
}) {
  const baseClasses = [styles.base, styles[size]];
  
  if (variant === "primary") baseClasses.push(styles.primary);
  else if (variant === "secondary") baseClasses.push(styles.secondary);
  else if (variant === "danger") baseClasses.push(styles.danger);
  else if (variant === "outline") baseClasses.push(styles.outline);
  else if (variant === "ghost") baseClasses.push(styles.ghost);
  
  if (className) baseClasses.push(className);
  
  return (
    <button className={baseClasses.join(" ")} {...props}>
      {children}
    </button>
  );
}