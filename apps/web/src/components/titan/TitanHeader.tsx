"use client";

import React from "react";

interface TitanHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export const TitanHeader: React.FC<TitanHeaderProps> = ({
  title,
  subtitle,
  className = "",
}) => {
  return (
    <div className={className}>
      <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm opacity-80">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default TitanHeader;
