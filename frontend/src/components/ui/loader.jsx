import React from "react";

const Loader = ({ text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-t-indigo-600 border-r-indigo-600 border-b-indigo-200 border-l-indigo-200 animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="h-8 w-8 rounded-full border-4 border-t-transparent border-r-transparent border-b-indigo-600 border-l-indigo-600 animate-spin"></div>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-600 animate-pulse">{text}</p>
    </div>
  );
};

export default Loader; 