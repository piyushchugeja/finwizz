// components/ui/card.tsx
import React, { ReactNode } from "react";

export const Card: React.FC<{ className: string; children: ReactNode }> = ({ children, className }) => (
  <div className={`rounded-lg shadow-md bg-white p-4 ${className}`}>{children}</div>
);

export const CardHeader: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="border-b-2 pb-4">{children}</div>
);

export const CardBody: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="mt-4">{children}</div>
);

export const CardFooter: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="mt-4 pt-4 border-t-2">{children}</div>
);
