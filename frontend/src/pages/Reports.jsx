import React, { useState } from "react";
import { Card } from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { format, startOfMonth } from "date-fns";
import {
  Calendar as CalendarIcon,
  DownloadIcon,
  FilterIcon,
  BarChart,
  LineChart,
  FileText,
  Clock,
  Package,
  Store,
  RefreshCcw,
  Search,
  Users,
} from "lucide-react";
import { useSelector } from "react-redux";
import MonthPicker from "../components/ui/month_picker";

const Reports = () => {
  // Add loading state
  const [isLoading, setIsLoading] = useState(false);

  // State for date filters
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  // State for daily report
  const [singleDate, setSingleDate] = useState();

  // State for monthly report - using Date object for MonthPicker
  const [selectedMonth, setSelectedMonth] = useState(null);

  // State for active tab
  const [activeTab, setActiveTab] = useState("sales");

  // Get data from Redux store
  const salesData = useSelector((state) => state.bill.bills);
  const purchaseData = useSelector((state) => state.purchaseBill.bills);
  const inventoryData = useSelector((state) => state.inventory.items);
  const distributors = useSelector((state) => state.distributor.distributors);
  const customers = useSelector((state) => state.customers.customers);

  // Report metadata with icons - using a more subtle approach
  const reportTypes = {
    sales: [
      {
        id: "all-sales",
        name: "All Sales",
        icon: FileText,
        filters: ["dateRange"],
      },
      {
        id: "customer-wise",
        name: "Customer Wise",
        icon: Users,
        filters: ["dateRange", "customer"],
      },
      {
        id: "product-wise",
        name: "Product Wise",
        icon: Package,
        filters: ["dateRange", "product"],
      },
      {
        id: "manufacturer-wise",
        name: "Manufacturer Wise",
        icon: Store,
        filters: ["dateRange", "manufacturer"],
      },
      {
        id: "daily-sales",
        name: "Daily Summary",
        icon: BarChart,
        filters: ["singleDate"],
      },
      {
        id: "monthly-sales",
        name: "Monthly Summary",
        icon: LineChart,
        filters: ["month"],
      },
    ],
    purchase: [
      {
        id: "all-purchases",
        name: "All Purchases",
        icon: FileText,
        filters: ["dateRange"],
      },
      {
        id: "distributor-wise",
        name: "Distributor Wise",
        icon: Store,
        filters: ["dateRange", "distributor"],
      },
      {
        id: "product-wise",
        name: "Product Wise",
        icon: Package,
        filters: ["dateRange", "product"],
      },
      {
        id: "manufacturer-wise",
        name: "Manufacturer Wise",
        icon: Store,
        filters: ["dateRange", "manufacturer"],
      },
      {
        id: "daily-purchases",
        name: "Daily Summary",
        icon: BarChart,
        filters: ["singleDate"],
      },
      {
        id: "monthly-purchases",
        name: "Monthly Summary",
        icon: LineChart,
        filters: ["month"],
      },
    ],
    inventory: [
      { id: "stock-status", name: "Current Stock", icon: Package, filters: [] },
      { id: "low-stock", name: "Low Stock Items", icon: Package, filters: [] },
      {
        id: "expiry-alert",
        name: "Near Expiry",
        icon: Clock,
        filters: ["dateRange"],
      },
      {
        id: "stock-movement",
        name: "Stock Movement",
        icon: RefreshCcw,
        filters: ["dateRange"],
      },
      {
        id: "fast-moving",
        name: "Fast Moving",
        icon: Package,
        filters: ["dateRange", "manufacturer"],
      },
      {
        id: "slow-moving",
        name: "Slow Moving",
        icon: Package,
        filters: ["dateRange", "manufacturer"],
      },
    ],
  };

  // State for selected report type within each tab
  const [selectedReportType, setSelectedReportType] = useState({
    sales: "all-sales",
    purchase: "all-purchases",
    inventory: "stock-status",
  });

  // State for other filters
  const [filters, setFilters] = useState({
    manufacturer: "",
    distributor: "all",
    customer: "all",
    product: "",
  });

  // Get the currently selected report
  const getSelectedReport = () => {
    return reportTypes[activeTab]?.find(
      (r) => r.id === selectedReportType[activeTab]
    );
  };

  // Check if a specific filter is needed for the current report
  const isFilterRequired = (filterName) => {
    const selectedReport = getSelectedReport();
    return selectedReport?.filters?.includes(filterName) || false;
  };

  // Handler for changing filter values
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const generateReport = () => {
    // Set loading state to true
    setIsLoading(true);

    // Log the report parameters
    const selectedReport = getSelectedReport();
    let reportData = {
      reportType: selectedReportType[activeTab],
      filters: {
        ...filters,
        customer:
          filters.customer === "all" ? "All Customers" : filters.customer,
        distributor:
          filters.distributor === "all"
            ? "All Distributors"
            : filters.distributor,
      },
    };

    // Add appropriate date information based on report type
    if (selectedReport.filters.includes("dateRange")) {
      reportData.dateRange = dateRange;
    } else if (selectedReport.filters.includes("singleDate")) {
      reportData.date = singleDate;
    } else if (selectedReport.filters.includes("month")) {
      reportData.month = selectedMonth;
    }

    console.log("Generating report with:", reportData);

    // Simulate API call delay
    setTimeout(() => {
      // Set loading state back to false after "API call"
      setIsLoading(false);
    }, 1500);
  };

  // Function to render filters based on the active tab and report type
  const renderFilters = () => {
    const needsDateRange = isFilterRequired("dateRange");
    const needsSingleDate = isFilterRequired("singleDate");
    const needsMonth = isFilterRequired("month");
    const needsCustomerFilter = isFilterRequired("customer");
    const needsDistributorFilter = isFilterRequired("distributor");
    const needsManufacturerFilter = isFilterRequired("manufacturer");
    const needsProductFilter = isFilterRequired("product");

    // If no filters are required, don't render the filter section
    if (
      !needsDateRange &&
      !needsSingleDate &&
      !needsMonth &&
      !needsCustomerFilter &&
      !needsDistributorFilter &&
      !needsManufacturerFilter &&
      !needsProductFilter
    ) {
      return null;
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 mb-4 p-3">
        <p className="text-sm font-medium text-gray-700 mb-2">Filters</p>
        <div className="flex flex-wrap gap-x-2 gap-y-2">
          {/* Date range picker */}
          {needsDateRange && (
            <div
              className="flex items-center"
              style={{
                boxSizing: "border-box",
                columnGap: "8px",
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                fontFamily: "__Poppins_059fbd, __Poppins_Fallback_059fbd",
                fontStyle: "normal",
                height: "30px",
                maxWidth: "calc(100% - 100px)",
                rowGap: "8px",
                unicodeBidi: "isolate",
                width: "160px",
              }}
            >
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-sm py-0 px-2 mr-1"
                  >
                    <CalendarIcon className="mr-1 h-3.5 w-3.5 opacity-70" />
                    {dateRange.from ? format(dateRange.from, "PP") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) =>
                      setDateRange((prev) => ({ ...prev, from: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-sm py-0 px-2"
                  >
                    <CalendarIcon className="mr-1 h-3.5 w-3.5 opacity-70" />
                    {dateRange.to ? format(dateRange.to, "PP") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) =>
                      setDateRange((prev) => ({ ...prev, to: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Single date picker for daily reports */}
          {needsSingleDate && (
            <div
              className="flex items-center"
              style={{
                boxSizing: "border-box",
                display: "flex",
                fontFamily: "__Poppins_059fbd, __Poppins_Fallback_059fbd",
                fontStyle: "normal",
                height: "30px",
                maxWidth: "calc(100% - 100px)",
                unicodeBidi: "isolate",
                width: "160px",
              }}
            >
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-sm py-0 px-2 w-full"
                  >
                    <CalendarIcon className="mr-1 h-3.5 w-3.5 opacity-70" />
                    {singleDate ? format(singleDate, "PP") : "Select Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={singleDate}
                    onSelect={setSingleDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Month picker for monthly reports */}
          {needsMonth && (
            <div
              style={{
                boxSizing: "border-box",
                display: "flex",
                fontFamily: "__Poppins_059fbd, __Poppins_Fallback_059fbd",
                fontStyle: "normal",
                height: "30px",
                maxWidth: "calc(100% - 100px)",
                unicodeBidi: "isolate",
                width: "160px",
              }}
            >
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-sm py-0 px-2 w-full"
                  >
                    <CalendarIcon className="mr-1 h-3.5 w-3.5 opacity-70" />
                    {selectedMonth
                      ? format(selectedMonth, "MMMM yyyy")
                      : "Select Month"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <MonthPicker
                    currentMonth={selectedMonth || startOfMonth(new Date())}
                    onMonthChange={(value) => setSelectedMonth(value)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Distributor filter for purchase reports */}
          {needsDistributorFilter && (
            <div
              style={{
                boxSizing: "border-box",
                columnGap: "8px",
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                fontFamily: "__Poppins_059fbd, __Poppins_Fallback_059fbd",
                fontStyle: "normal",
                height: "30px",
                maxWidth: "calc(100% - 100px)",
                rowGap: "8px",
                unicodeBidi: "isolate",
                width: "160px",
              }}
            >
              <Select
                value={filters.distributor}
                onValueChange={(value) =>
                  handleFilterChange("distributor", value)
                }
              >
                <SelectTrigger className="h-8 text-sm py-0 px-2 w-full">
                  <SelectValue placeholder="Distributor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Distributors</SelectItem>
                  {distributors?.map((distributor) => (
                    <SelectItem key={distributor._id} value={distributor._id}>
                      {distributor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Customer filter for sales reports */}
          {needsCustomerFilter && (
            <div
              style={{
                boxSizing: "border-box",
                columnGap: "8px",
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                fontFamily: "__Poppins_059fbd, __Poppins_Fallback_059fbd",
                fontStyle: "normal",
                height: "30px",
                maxWidth: "calc(100% - 100px)",
                rowGap: "8px",
                unicodeBidi: "isolate",
                width: "160px",
              }}
            >
              <Select
                value={filters.customer}
                onValueChange={(value) => handleFilterChange("customer", value)}
              >
                <SelectTrigger className="h-8 text-sm py-0 px-2 w-full">
                  <SelectValue placeholder="Customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers?.map((customer) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Product filter */}
          {needsProductFilter && (
            <div
              style={{
                boxSizing: "border-box",
                columnGap: "8px",
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                fontFamily: "__Poppins_059fbd, __Poppins_Fallback_059fbd",
                fontStyle: "normal",
                height: "30px",
                maxWidth: "calc(100% - 100px)",
                rowGap: "8px",
                unicodeBidi: "isolate",
                width: "160px",
              }}
            >
              <div className="relative w-full">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 opacity-50" />
                <Input
                  placeholder="Product"
                  value={filters.product}
                  onChange={(e) =>
                    handleFilterChange("product", e.target.value)
                  }
                  className="pl-7 h-8 text-sm py-0 pr-2"
                />
              </div>
            </div>
          )}

          {/* Manufacturer filter */}
          {needsManufacturerFilter && (
            <div
              style={{
                boxSizing: "border-box",
                columnGap: "8px",
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                fontFamily: "__Poppins_059fbd, __Poppins_Fallback_059fbd",
                fontStyle: "normal",
                height: "30px",
                maxWidth: "calc(100% - 100px)",
                rowGap: "8px",
                unicodeBidi: "isolate",
                width: "160px",
              }}
            >
              <div className="relative w-full">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 opacity-50" />
                <Input
                  placeholder="Manufacturer"
                  value={filters.manufacturer}
                  onChange={(e) =>
                    handleFilterChange("manufacturer", e.target.value)
                  }
                  className="pl-7 h-8 text-sm py-0 pr-2"
                />
              </div>
            </div>
          )}

          <div
            style={{
              boxSizing: "border-box",
              height: "30px",
              width: "auto",
            }}
          >
            <Button
              onClick={generateReport}
              size="sm"
              className="h-8 py-0 px-4 text-sm bg-gray-900 hover:bg-black"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Generating...
                </>
              ) : (
                <>
                  <FilterIcon className="mr-1 h-3.5 w-3.5" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Function to render the report selection section
  const renderReportSelection = () => {
    const reports = reportTypes[activeTab] || [];

    return (
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        {reports.map((report) => {
          const ReportIcon = report.icon;
          return (
            <Card
              key={report.id}
              className={`cursor-pointer transition-all duration-200 overflow-hidden p-0 ${
                selectedReportType[activeTab] === report.id
                  ? `ring-1 ring-gray-900 bg-gray-50`
                  : "border border-gray-200 hover:border-gray-300"
              }`}
              onClick={() =>
                setSelectedReportType({
                  ...selectedReportType,
                  [activeTab]: report.id,
                })
              }
            >
              <div className="flex flex-col items-center text-center p-2">
                <ReportIcon className="h-4.5 w-4.5 mb-1 text-gray-800" />
                <h3 className="text-sm font-medium text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-1">
                  {report.name}
                </h3>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  // Placeholder for report results
  const renderReportResults = () => {
    // Get the selected report details
    const selectedReport = getSelectedReport();

    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center">
            {selectedReport?.icon && (
              <div className="p-1.5 rounded-md bg-gray-100 mr-3">
                <selectedReport.icon className="h-5 w-5 text-gray-800" />
              </div>
            )}
            <div>
              <h3 className="text-base font-medium text-gray-800">
                {selectedReport?.name || "Report"}
              </h3>
              {isFilterRequired("dateRange") &&
                dateRange.from &&
                dateRange.to && (
                  <p className="text-sm text-gray-500">
                    {format(dateRange.from, "MMM d, yyyy")} -{" "}
                    {format(dateRange.to, "MMM d, yyyy")}
                  </p>
                )}
              {isFilterRequired("singleDate") && singleDate && (
                <p className="text-sm text-gray-500">
                  {format(singleDate, "MMMM d, yyyy")}
                </p>
              )}
              {isFilterRequired("month") && selectedMonth && (
                <p className="text-sm text-gray-500">
                  {format(selectedMonth, "MMMM yyyy")}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="h-8 text-sm"
          >
            <DownloadIcon className="mr-1 h-3.5 w-3.5" />
            Export
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-10 w-10 rounded-full border-2 border-t-black border-r-black border-b-gray-300 border-l-gray-300 animate-spin mb-4"></div>
            <p className="text-base font-medium text-gray-800">
              Generating report...
            </p>
            <p className="text-sm text-gray-600 mt-1">This may take a moment</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-3 rounded-full bg-gray-100 mb-3">
              <selectedReport.icon className="h-6 w-6 text-gray-800" />
            </div>
            <p className="text-base font-medium text-gray-800 mb-1">
              Your {selectedReport?.name} will appear here
            </p>
            <p className="text-sm text-gray-600 mb-3 text-center max-w-sm">
              {selectedReport?.filters?.length > 0
                ? "Select your filters and click Generate to create your report"
                : "Click Generate to create your report"}
            </p>
            <Button
              onClick={generateReport}
              size="sm"
              className="bg-gray-900 hover:bg-black text-sm"
            >
              <FilterIcon className="mr-1 h-3.5 w-3.5" />
              Generate Report
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-3 bg-gray-50">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-xl font-medium text-gray-800">Reports</h1>
        <Button variant="outline" size="sm" className="h-8 text-sm">
          <RefreshCcw className="mr-1 h-3.5 w-3.5" />
          Refresh Data
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Tabs
          defaultValue="sales"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full border-b border-gray-200 rounded-none p-0 h-10 bg-gray-50">
            <TabsTrigger
              value="sales"
              className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none h-10 text-sm font-medium"
            >
              Sales
            </TabsTrigger>
            <TabsTrigger
              value="purchase"
              className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none h-10 text-sm font-medium"
            >
              Purchase
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none h-10 text-sm font-medium"
            >
              Inventory
            </TabsTrigger>
          </TabsList>

          <div className="p-3">
            <TabsContent value="sales" className="mt-0">
              {renderReportSelection()}
              {renderFilters()}
              {renderReportResults()}
            </TabsContent>

            <TabsContent value="purchase" className="mt-0">
              {renderReportSelection()}
              {renderFilters()}
              {renderReportResults()}
            </TabsContent>

            <TabsContent value="inventory" className="mt-0">
              {renderReportSelection()}
              {renderFilters()}
              {renderReportResults()}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;
