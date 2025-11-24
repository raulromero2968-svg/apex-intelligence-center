"use client";

import React from "react";

interface DigitalScrollWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const DigitalScrollWrapper: React.FC<DigitalScrollWrapperProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`overflow-auto ${className}`}>
      {children}
    </div>
  );
};

export default DigitalScrollWrapper;
