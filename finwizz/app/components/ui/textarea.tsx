// components/ui/textarea.tsx
import React from "react";

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea
    {...props}
    className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
);
