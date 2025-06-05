import React from "react";
import { Card } from "../../../components/ui/card";
import { cn } from "../../../lib/utils";

const ReportSelection = ({
  activeTab,
  reportTypes,
  selectedReportType,
  handleReportTypeChange,
}) => {
  const reports = reportTypes[activeTab] || [];

  return (
    <div className="flex gap-2">
      {reports.map((report) => {
        const isSelected = selectedReportType[activeTab] === report.id;
        return (
          <Card
            key={report.id}
            className={cn(
              "cursor-pointer transition-all duration-200 overflow-hidden group flex-1",
              "hover:shadow-lg hover:border-pink-300",
              isSelected
                ? "ring-2 ring-pink-400 bg-pink-400 text-white shadow-md"
                : "bg-white border border-gray-200 hover:bg-gray-50 shadow-sm"
            )}
            onClick={() => handleReportTypeChange(report.id)}
          >
            <div className="flex flex-col items-center justify-center text-center p-3 h-full">
              <h3
                className={cn(
                  "text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis max-w-full transition-colors duration-200",
                  isSelected
                    ? "text-white"
                    : "text-pink-600 group-hover:text-pink-700"
                )}
              >
                {report.name}
              </h3>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ReportSelection;
