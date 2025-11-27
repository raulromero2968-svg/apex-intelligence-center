import React from "react";

const DigitalScroll = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="digital-scroll p-4 my-8">
      {children}
    </div>
  );
};

export default DigitalScroll;
