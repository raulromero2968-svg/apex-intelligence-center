import React from "react";

const HoloCardContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="holo-card-container p-4 my-8">
      {children}
    </div>
  );
};

export default HoloCardContainer;
