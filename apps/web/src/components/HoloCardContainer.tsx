import React from "react";

const HoloCardContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative p-[2px] my-8 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 bg-[length:200%_100%] animate-[prismatic-border_3s_linear_infinite]">
      <div className="bg-black/40 backdrop-blur-md rounded-xl p-4">
        {children}
      </div>
    </div>
  );
};

export default HoloCardContainer;
