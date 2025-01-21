import React, { useState, useEffect } from "react";
import { Input } from "../components/ui/input";
import axios from "axios";

const PharmacyInfo = () => {
  const [pharmacyData, setPharmacyData] = useState({
    name: "",
    logo: "",
    address: "",
    contactNumber: "",
    email: "",
    website: "",
    hospitalId: "",
    itemExpiryThreshold: 3,
    itemCategories: [],
  });

  useEffect(() => {
    // Fetch pharmacy data when component mounts
    const fetchPharmacyData = async () => {
      try {
        const response = await axios.get("/api/hospital/getHospital");
        setPharmacyData(response.data);
      } catch (error) {
        console.error("Error fetching pharmacy data:", error);
      }
    };
    fetchPharmacyData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPharmacyData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `/api/hospital/${pharmacyData.hospitalId}`,
        pharmacyData
      );
      alert("Pharmacy information updated successfully!");
    } catch (error) {
      console.error("Error updating pharmacy info:", error);
      alert("Error updating pharmacy information");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pharmacy Information</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Name</label>
          <Input
            name="name"
            value={pharmacyData.name}
            onChange={handleInputChange}
            placeholder="Pharmacy Name"
          />
        </div>

        <div>
          <label className="block mb-1">Logo URL</label>
          <Input
            name="logo"
            value={pharmacyData.logo}
            onChange={handleInputChange}
            placeholder="Logo URL"
          />
        </div>

        <div>
          <label className="block mb-1">Address</label>
          <Input
            name="address"
            value={pharmacyData.address}
            onChange={handleInputChange}
            placeholder="Address"
          />
        </div>

        <div>
          <label className="block mb-1">Contact Number</label>
          <Input
            name="contactNumber"
            value={pharmacyData.contactNumber}
            onChange={handleInputChange}
            placeholder="Contact Number"
          />
        </div>

        <div>
          <label className="block mb-1">Email</label>
          <Input
            name="email"
            type="email"
            value={pharmacyData.email}
            onChange={handleInputChange}
            placeholder="Email"
          />
        </div>

        <div>
          <label className="block mb-1">Website</label>
          <Input
            name="website"
            value={pharmacyData.website}
            onChange={handleInputChange}
            placeholder="Website"
          />
        </div>

        <div>
          <label className="block mb-1">Hospital ID</label>
          <Input
            name="hospitalId"
            value={pharmacyData.hospitalId}
            onChange={handleInputChange}
            placeholder="Hospital ID"
            disabled
          />
        </div>

        <div>
          <label className="block mb-1">Item Expiry Threshold (months)</label>
          <Input
            name="itemExpiryThreshold"
            type="number"
            value={pharmacyData.itemExpiryThreshold}
            onChange={handleInputChange}
            min="0"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default PharmacyInfo;
