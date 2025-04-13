// components/ui/button.tsx
import React from "react";

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button
    {...props}
    className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
  />
);
