import React, { forwardRef } from "react";
import { cn } from "@/utils/cn";

const Badge = forwardRef(({ className, variant = "default", ...props }, ref) => {
const variants = {
    default: "bg-gray-100 text-gray-800",
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-yellow-100 text-yellow-800",
    interested: "bg-green-100 text-green-800",
    "not-interested": "bg-red-100 text-red-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    low: "bg-gray-100 text-gray-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-green-100 text-green-700",
    excellent: "bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 font-bold border-orange-200"
  };

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
});

Badge.displayName = "Badge";

export default Badge;