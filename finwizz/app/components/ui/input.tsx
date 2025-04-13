// components/ui/input.tsx
import React from "react";

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
);
