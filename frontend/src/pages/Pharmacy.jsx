import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import Sales from "./Sales";
import Purchase from "../components/custom/pharmacy/Purchase";
import PharmacyReports from "../components/custom/pharmacy/PharmacyReports";
import PharmacyDashboard from "../components/custom/pharmacy/PharmacyDashboard";
import Supplier from "../components/custom/pharmacy/Supplier";
import ItemsMaster from "../components/custom/pharmacy/ItemsMaster";

const Pharmacy = () => {
  const { tab } = useParams();
  const navigate = useNavigate();

  const handleTabChange = (value) => {
    navigate(`/pharmacy/${value}`);
  };

  return (
    <div className="flex flex-col flex-1 mt-1 h-[calc(100vh-52px)]">
      <Tabs value={tab || "sales"} onValueChange={handleTabChange} className="w-full h-full">
        <div className="overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <TabsList className="inline-flex md:flex w-max md:w-full justify-start">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger className="hidden md:block" value="supplier">Supplier</TabsTrigger>
            <TabsTrigger className="hidden md:block" value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="items-master">Items Master</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="dashboard"><PharmacyDashboard /></TabsContent>
        <TabsContent value="sales"><Sales /></TabsContent>
        <TabsContent value="supplier"><Supplier /></TabsContent>
        <TabsContent value="purchases"><Purchase /></TabsContent>
        <TabsContent value="reports"><PharmacyReports /></TabsContent>
        <TabsContent value="items-master"><ItemsMaster /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Pharmacy;
