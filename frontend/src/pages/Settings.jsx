import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 gap-4 flex">
      <Button
        onClick={() => navigate("/settings/hospital-info")}
      >
        Pharmacy Info
      </Button>
      <Button
        onClick={() => navigate("/settings/config")}
      >
        Configure
      </Button>
    </div>
  );
};

export default Settings;
