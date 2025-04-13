import React from "react";

interface LabelProps {
  htmlFor: string;
  children: React.ReactNode; // Allow text or other elements as children
}

export const Label: React.FC<LabelProps> = ({ htmlFor, children }) => {
  return <label htmlFor={htmlFor}>{children}</label>;
};

