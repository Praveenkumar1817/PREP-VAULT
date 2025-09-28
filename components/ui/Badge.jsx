import React from "react";
import clsx from "clsx";

export function Badge({ children, className, variant = "default" }) {
  const variants = {
    default: "bg-gray-200 text-gray-800",
    success: "bg-green-500 text-white",
    warning: "bg-yellow-500 text-white",
    error: "bg-red-500 text-white",
  };

  return (
    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", variants[variant], className)}>
      {children}
    </span>
  );
}
