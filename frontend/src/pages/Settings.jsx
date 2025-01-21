import React from "react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <button
        onClick={() => navigate("/settings/hospital-info")}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Pharmacy Info
      </button>
    </div>
  );
};

export default Settings;
