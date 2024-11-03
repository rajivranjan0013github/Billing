import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

export default function Settings() {
  const navigate = useNavigate();

  const handleAddStaff = () => {
    navigate("/addstaff");
  };

  const handleHospitalInfo = () => {
    navigate("/settings/hospital-info");
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Settings</h1>
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
        <Button onClick={handleAddStaff} className="w-full sm:w-auto">Add Staff</Button>
        <Button onClick={handleHospitalInfo} className="w-full sm:w-auto">Hospital Info</Button>
      </div>
    </div>
  );
}
