// components/ui/select.tsx
import React from "react";

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
);

export const SelectItem: React.FC<React.OptionHTMLAttributes<HTMLOptionElement>> = (props) => (
  <option {...props} />
);
