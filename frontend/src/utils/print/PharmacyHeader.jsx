import React from "react";
import { useSelector } from "react-redux";

const PharmacyHeader = () => {
  const { hospitalInfo } = useSelector((state) => state.hospital);

  return (
    <div>
      <h1 className="text-2xl font-bold text-center">{hospitalInfo.pharmacyName}</h1>
      <p className="text-center">{hospitalInfo.pharmacyAddress}</p>
      <p className="text-center">Mobile: {hospitalInfo.pharmacyContactNumber}</p>
    </div>
  );
};

export default PharmacyHeader;
