import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { IndianRupee } from "lucide-react";

const ReportSummary = ({ summary, activeTab }) => {
  if (!summary) {
    return null;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  return (
    <div className="flex flex-row gap-3 w-full">
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 flex-grow w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-3 pb-1">
          <CardTitle className="text-xs font-medium text-gray-600">
            {activeTab === "sales" ? " Sales Value" : " Purchase Amount"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-1">
          <div className="text-lg font-bold text-gray-800">
            {activeTab === "sales"
              ? formatCurrency(summary.totalSales)
              : formatCurrency(summary.totalPurchases)}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 flex-grow w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-3 pb-1">
          <CardTitle className="text-xs font-medium text-gray-600">
            GST
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-1">
          <div className="text-lg font-bold text-gray-800">
            {formatCurrency(summary.totalGST)}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 flex-grow w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-3 pb-1">
          <CardTitle className="text-xs font-medium text-gray-600">
            Bills
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-1">
          <div className="text-lg font-bold text-gray-800">
            {summary.totalBills || 0}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 flex-grow w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-3 pb-1">
          <CardTitle className="text-xs font-medium text-gray-600">
            {activeTab === "sales" ? "Quantity Sold" : "Quantity Purchased"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-1">
          <div className="text-lg font-bold text-gray-800">
            {activeTab === "sales"
              ? summary.totalQuantity || 0
              : summary.totalQuantity || 0}
          </div>
        </CardContent>
      </Card>

      {activeTab === "sales" && summary.averageBillValue && (
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 flex-grow w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-3 pb-1">
            <CardTitle className="text-xs font-medium text-gray-600">
              Avg. Bill Value
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-1">
            <div className="text-lg font-bold text-gray-800">
              {formatCurrency(summary.averageBillValue)}
            </div>
            <p className="text-xs text-gray-500 pt-1">
              Average value per bill.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportSummary;
