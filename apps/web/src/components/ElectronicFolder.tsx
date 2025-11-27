import React from "react";

const ElectronicFolder = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="electronic-folder p-4 my-8">
      {children}
    </div>
  );
};

export default ElectronicFolder;
