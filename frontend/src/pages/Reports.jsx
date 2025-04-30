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
  ChevronDown,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import MonthPicker from "../components/ui/month_picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { cn } from "../lib/utils";
import {
  fetchSalesReport,
  clearReport,
  setDateRange as setReduxDateRange,
  setSingleDate as setReduxSingleDate,
  setSelectedMonth as setReduxSelectedMonth,
} from "../redux/slices/reportSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import SelectInventory from "../components/custom/inventory/SelectInventory";

const Reports = () => {
  const dispatch = useDispatch();

  // Get report state and date filters from Redux
  const {
    data: reportData,
    status: reportStatus,
    error: reportError,
    dateRange,
    singleDate,
    selectedMonth,
  } = useSelector((state) => state.report);

  // Convert ISO strings back to Date objects for components
  const localDateRange = {
    from: dateRange.from ? new Date(dateRange.from) : null,
    to: dateRange.to ? new Date(dateRange.to) : null,
  };
  const localSingleDate = singleDate ? new Date(singleDate) : null;
  const localSelectedMonth = selectedMonth ? new Date(selectedMonth) : null;

  // Add error state
  const [localError, setLocalError] = useState(null);

  // State for date filters - REMOVED
  // const [dateRange, setDateRange] = useState({
  //   from: null,
  //   to: null,
  // });
  //
  // // State for daily report
  // const [singleDate, setSingleDate] = useState();
  //
  // // State for monthly report - using Date object for MonthPicker
  // const [selectedMonth, setSelectedMonth] = useState(null);

  // State for active tab
  const [activeTab, setActiveTab] = useState("sales");

  // State for filters
  const [filters, setFilters] = useState({
    manufacturer: "",
    distributor: "all",
    customer: "all",
    product: "",
  });

  // Get data from Redux store
  const salesData = useSelector((state) => state.bill.bills);
  const purchaseData = useSelector((state) => state.purchaseBill.bills);
  const inventoryData = useSelector((state) => state.inventory.items);
  const distributors = useSelector((state) => state.distributor.distributors);
  const customers = useSelector((state) => state.customers.customers);

  // Add state for selected product
  const [selectedProduct, setSelectedProduct] = useState(null);
  console.log(selectedProduct);
  // Replace product dialog state with search state
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

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

  // Get the currently selected report
  const getSelectedReport = () => {
    return reportTypes[activeTab]?.find(
      (r) => r.id === selectedReportType[activeTab]
    );
  };

  // Clear report data when changing report type
  const handleReportTypeChange = (newType) => {
    setSelectedReportType({
      ...selectedReportType,
      [activeTab]: newType,
    });
    // Reset filters to initial state to avoid carrying over irrelevant filters
    setFilters({
      manufacturer: "",
      distributor: "all",
      customer: "all",
      product: "",
    });
    // Reset selected product state as well
    setSelectedProduct(null);
    // Clear the report data
    dispatch(clearReport());
    // Clear any local errors
    setLocalError(null);
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

  // Function to handle product selection
  const handleProductSelect = (product) => {
    console.log("Selected product in handler:", product);
    // Close the dialog
    setIsProductDialogOpen(false);
    // Set the selected product
    setSelectedProduct(product);
    // Update filters with the product name - use productName instead of name
    handleFilterChange("product", product?.name || "");
  };

  // Get inventory items from Redux store
  const inventoryItems = useSelector((state) => state.inventory.items);

  // Filter inventory items based on search query
  const filteredProducts = productSearch
    ? inventoryItems?.filter((item) =>
        item.productName.toLowerCase().includes(productSearch.toLowerCase())
      )
    : inventoryItems;

  // Function to clear product selection
  const clearProductSelection = (e) => {
    e.stopPropagation();
    setSelectedProduct(null);
    handleFilterChange("product", "");
  };

  // Function to handle date range changes - Dispatch to Redux
  const handleDateRangeChange = (field, value) => {
    // Dispatch action to update Redux state
    const newRange = {
      ...localDateRange,
      [field]: value ? new Date(value) : null,
    };
    dispatch(setReduxDateRange(newRange));
  };

  // Function to generate report
  const generateReport = async () => {
    try {
      // Get the selected report details
      const selectedReport = getSelectedReport();

      // Clear any previous errors
      setLocalError(null);

      // Validate date range if required (using Redux state)
      if (isFilterRequired("dateRange")) {
        if (!dateRange.from || !dateRange.to) {
          // Use Redux state
          setLocalError("Please select both From and To dates");
          return;
        }
      }

      // Validate single date if required (using Redux state)
      if (isFilterRequired("singleDate") && !singleDate) {
        // Use Redux state
        setLocalError("Please select a date");
        return;
      }

      // Validate month if required (using Redux state)
      if (isFilterRequired("month") && !selectedMonth) {
        // Use Redux state
        setLocalError("Please select a month");
        return;
      }

      // For product-wise report, enforce product filter
      if (selectedReportType[activeTab] === "product-wise") {
        if (!filters.product || filters.product.trim() === "") {
          setLocalError(
            "Please select a product to generate product-wise report"
          );
          return;
        }
      }

      // Prepare filter parameters - ensure all values are serializable
      let params = {
        reportType: selectedReportType[activeTab],
      };

      // Add date range filters - convert dates to ISO strings from Redux state
      if (isFilterRequired("dateRange") && dateRange.from && dateRange.to) {
        params.startDate = format(new Date(dateRange.from), "yyyy-MM-dd"); // Use Redux state
        params.endDate = format(new Date(dateRange.to), "yyyy-MM-dd"); // Use Redux state
      }

      // Add single date filter - convert date to ISO string from Redux state
      if (isFilterRequired("singleDate") && singleDate) {
        params.date = format(new Date(singleDate), "yyyy-MM-dd"); // Use Redux state
      }

      // Add month filter - convert date to string from Redux state
      if (isFilterRequired("month") && selectedMonth) {
        params.month = format(new Date(selectedMonth), "yyyy-MM"); // Use Redux state
      }

      // Add other filters - ensure all values are strings or primitives
      if (filters.customer !== "all") params.customerId = filters.customer;
      if (filters.distributor !== "all")
        params.distributorId = filters.distributor;
      if (filters.manufacturer) params.manufacturer = filters.manufacturer;
      if (filters.product) params.product = filters.product;

      // Dispatch the appropriate action based on the active tab
      switch (activeTab) {
        case "sales":
          await dispatch(fetchSalesReport(params)).unwrap();
          break;
        // Add cases for purchase and inventory when implementing those
        default:
          throw new Error("Invalid report type");
      }
    } catch (err) {
      setLocalError(err.message || "Failed to generate report");
      console.error("Report generation failed:", err);
    }
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
            <div className="flex items-center space-x-1">
              <div className="relative">
                <Input
                  type="date"
                  value={
                    localDateRange.from
                      ? format(localDateRange.from, "yyyy-MM-dd")
                      : ""
                  }
                  onChange={(e) =>
                    handleDateRangeChange("from", e.target.value)
                  }
                  className="h-8 text-sm py-0 px-2 pr-8" // Added pr-8 for potential icon space
                  placeholder="From Date"
                  aria-label="From Date"
                />
              </div>
              <span className="text-gray-500">-</span>
              <div className="relative">
                <Input
                  type="date"
                  value={
                    localDateRange.to
                      ? format(localDateRange.to, "yyyy-MM-dd")
                      : ""
                  }
                  onChange={(e) => handleDateRangeChange("to", e.target.value)}
                  min={
                    localDateRange.from
                      ? format(localDateRange.from, "yyyy-MM-dd")
                      : undefined
                  } // Prevent selecting 'to' date before 'from' date
                  className="h-8 text-sm py-0 px-2 pr-8" // Added pr-8 for potential icon space
                  placeholder="To Date"
                  aria-label="To Date"
                />
              </div>
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
                {({ setOpen }) => (
                  <>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-sm py-0 px-2 w-full"
                      >
                        <CalendarIcon className="mr-1 h-3.5 w-3.5 opacity-70" />
                        {localSingleDate
                          ? format(localSingleDate, "PP")
                          : "Select Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={localSingleDate}
                        onSelect={(date) => {
                          dispatch(setReduxSingleDate(date));
                          setOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </>
                )}
              </Popover>
            </div>
          )}

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
                {({ setOpen }) => (
                  <>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-sm py-0 px-2 w-full"
                      >
                        <CalendarIcon className="mr-1 h-3.5 w-3.5 opacity-70" />
                        {localSelectedMonth
                          ? format(localSelectedMonth, "MMMM yyyy")
                          : "Select Month"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <MonthPicker
                        currentMonth={
                          localSelectedMonth || startOfMonth(new Date())
                        }
                        onMonthChange={(value) => {
                          dispatch(setReduxSelectedMonth(value));
                          setOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </>
                )}
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
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-sm py-0 px-2 w-full flex justify-between items-center"
                onClick={() => setIsProductDialogOpen(true)}
              >
                <span className="flex items-center truncate">
                  <Package className="mr-2 h-3.5 w-3.5 opacity-70" />
                  {filters.product || "Select Product"}
                </span>
                {filters.product && (
                  <X
                    className="h-3.5 w-3.5 opacity-70 hover:opacity-100"
                    onClick={clearProductSelection}
                  />
                )}
              </Button>

              <SelectInventory
                open={isProductDialogOpen}
                onOpenChange={setIsProductDialogOpen}
                onSelect={handleProductSelect}
                search={productSearch}
                setSearch={setProductSearch}
              />
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
              disabled={reportStatus === "loading"}
            >
              {reportStatus === "loading" ? (
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
              onClick={() => handleReportTypeChange(report.id)}
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

  // Function to render the report results
  const renderReportResults = () => {
    // Get the selected report details
    const selectedReport = getSelectedReport();

    // If no report is selected, return early
    if (!selectedReport) {
      return null;
    }

    // Function to check if the fetched data is empty
    const isDataEmpty = (data, tab, type) => {
      if (!data) return true; // Should be caught by !reportData check, but safe regardless

      const reportId = type[tab];
      switch (tab) {
        case "sales":
          switch (reportId) {
            case "all-sales":
              return !data.sales || data.sales.length === 0;
            case "customer-wise":
              return !data.customerSummary || data.customerSummary.length === 0;
            case "manufacturer-wise":
              return (
                !data.manufacturerSummary ||
                data.manufacturerSummary.length === 0
              );
            case "product-wise":
              return !data.productSummary || data.productSummary.length === 0;
            case "daily-sales":
              return !data.hourlyData || data.hourlyData.length === 0; // Assuming daily sales data is checked this way
            case "monthly-sales":
              return !data.dailyData || data.dailyData.length === 0; // Assuming monthly sales data is checked this way
            default:
              return Object.keys(data).length === 0; // Fallback check for sales tab
          }
        // Add cases for 'purchase' and 'inventory' tabs when implemented
        // case 'purchase':
        //   // Add specific checks for purchase report types
        //   return Object.keys(data).length === 0;
        // case 'inventory':
        //   // Add specific checks for inventory report types
        //   return Object.keys(data).length === 0;
        default:
          // General fallback check if tab is unknown or not handled yet
          return !data || Object.keys(data).length === 0;
      }
    };

    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
          {/* Header Section (Icon, Title, Date Range, Export Button) */}
          <div className="flex items-center">
            <div className="p-1.5 rounded-md bg-gray-100 mr-3">
              <selectedReport.icon className="h-5 w-5 text-gray-800" />
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-800">
                {selectedReport.name || "Report"}
              </h3>
              {isFilterRequired("dateRange") &&
                dateRange.from &&
                dateRange.to && (
                  <p className="text-sm text-gray-500">
                    {format(new Date(dateRange.from), "MMM d, yyyy")} -{" "}
                    {format(new Date(dateRange.to), "MMM d, yyyy")}
                  </p>
                )}
              {isFilterRequired("singleDate") && singleDate && (
                <p className="text-sm text-gray-500">
                  {format(new Date(singleDate), "MMMM d, yyyy")}
                </p>
              )}
              {isFilterRequired("month") && selectedMonth && (
                <p className="text-sm text-gray-500">
                  {format(new Date(selectedMonth), "MMMM yyyy")}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={
              reportStatus === "loading" ||
              !reportData ||
              isDataEmpty(reportData, activeTab, selectedReportType)
            } // Disable export if no data
            className="h-8 text-sm"
          >
            <DownloadIcon className="mr-1 h-3.5 w-3.5" />
            Export
          </Button>
        </div>

        {/* Content Section (Error, Loading, No Data Yet, No Data Found, Results) */}
        {localError || reportError ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-600">
            <p className="text-base font-medium">{localError || reportError}</p>
          </div>
        ) : reportStatus === "loading" ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-10 w-10 rounded-full border-2 border-t-black border-r-black border-b-gray-300 border-l-gray-300 animate-spin mb-4"></div>
            <p className="text-base font-medium text-gray-800">
              Generating report...
            </p>
            <p className="text-sm text-gray-600 mt-1">This may take a moment</p>
          </div>
        ) : !reportData ? (
          // Initial state: No report generated yet
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-3 rounded-full bg-gray-100 mb-3">
              <selectedReport.icon className="h-6 w-6 text-gray-800" />
            </div>
            <p className="text-base font-medium text-gray-800 mb-1">
              Your {selectedReport.name} will appear here
            </p>
            <p className="text-sm text-gray-600 mb-3 text-center max-w-sm">
              {selectedReport.filters?.length > 0
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
        ) : isDataEmpty(reportData, activeTab, selectedReportType) ? (
          // Report generated, but no data found for the criteria
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-3 rounded-full bg-gray-100 mb-3">
              <selectedReport.icon className="h-6 w-6 text-gray-600" />
            </div>
            <p className="text-base font-medium text-gray-700 mb-1">
              No data found for the selected criteria.
            </p>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              Try adjusting the filters or changing the date range.
            </p>
          </div>
        ) : (
          // Report generated and data exists
          <div className="space-y-4">
            <div className="overflow-x-auto">
              {activeTab === "sales" && renderSalesTable()}
              {/* TODO: Add rendering for purchase and inventory tabs */}
              {/* {activeTab === "purchase" && renderPurchaseTable()} */}
              {/* {activeTab === "inventory" && renderInventoryTable()} */}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Function to render the sales table based on report type
  const renderSalesTable = () => {
    if (!reportData) return null;

    switch (selectedReportType[activeTab]) {
      case "all-sales":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>INVOICE NO</TableHead>
                <TableHead>INVOICE DATE</TableHead>
                <TableHead>CUSTOMER</TableHead>
                <TableHead>TOTAL ITEMS</TableHead>
                <TableHead>SUBTOTAL</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>TOTAL</TableHead>
                <TableHead>STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.sales?.map((sale) => (
                <TableRow key={sale._id}>
                  <TableCell>{sale.invoiceNumber}</TableCell>
                  <TableCell>
                    {format(new Date(sale.invoiceDate), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <div>{sale.distributorName}</div>
                    <div className="text-sm text-muted-foreground">
                      {sale.mob}
                    </div>
                  </TableCell>
                  <TableCell>{sale.billSummary.productCount}</TableCell>
                  <TableCell>₹{sale.billSummary.subtotal.toFixed(2)}</TableCell>
                  <TableCell>
                    ₹{sale.billSummary.gstAmount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    ₹{sale.billSummary.grandTotal.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                        {
                          "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20":
                            sale.paymentStatus === "paid",
                          "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20":
                            sale.paymentStatus === "due",
                        }
                      )}
                    >
                      {sale.paymentStatus === "paid" ? "Paid" : "Due"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "customer-wise":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CUSTOMER</TableHead>
                <TableHead>TOTAL BILLS</TableHead>
                <TableHead>TOTAL AMOUNT</TableHead>
                <TableHead>AVERAGE BILL VALUE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.customerSummary?.map((customer) => (
                <TableRow key={customer.customerId}>
                  <TableCell>{customer.customerName}</TableCell>
                  <TableCell>{customer.totalSales}</TableCell>
                  <TableCell>₹{customer.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    ₹{(customer.totalAmount / customer.totalSales).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "manufacturer-wise":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MANUFACTURER</TableHead>
                <TableHead>PRODUCTS SOLD</TableHead>
                <TableHead>TOTAL QUANTITY</TableHead>
                <TableHead>TOTAL AMOUNT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.manufacturerSummary?.map((mfr) => (
                <TableRow key={mfr.manufacturer}>
                  <TableCell>{mfr.manufacturer}</TableCell>
                  <TableCell>{mfr.uniqueProducts}</TableCell>
                  <TableCell>{mfr.totalQuantity}</TableCell>
                  <TableCell>₹{mfr.totalAmount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "product-wise":
        return (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PRODUCT</TableHead>
                  <TableHead>BATCH</TableHead>
                  <TableHead>MANUFACTURER</TableHead>
                  <TableHead>QUANTITY SOLD</TableHead>
                  <TableHead>TOTAL AMOUNT</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.productSummary?.map((product) => {
                  const productKey = `${product.productName}-${product.batchNumber}`;
                  const isSelected = selectedProduct === productKey;

                  return (
                    <React.Fragment key={productKey}>
                      <TableRow
                        className={cn(
                          "cursor-pointer hover:bg-gray-50",
                          isSelected && "bg-gray-50"
                        )}
                        onClick={() =>
                          setSelectedProduct(isSelected ? null : productKey)
                        }
                      >
                        <TableCell>{product.productName}</TableCell>
                        <TableCell>{product.batchNumber}</TableCell>
                        <TableCell>{product.manufacturer}</TableCell>
                        <TableCell>{product.quantitySold}</TableCell>
                        <TableCell>₹{product.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(
                                isSelected ? null : productKey
                              );
                            }}
                          >
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform",
                                isSelected && "transform rotate-180"
                              )}
                            />
                          </Button>
                        </TableCell>
                      </TableRow>

                      {isSelected && reportData.productSales[productKey] && (
                        <TableRow>
                          <TableCell colSpan={6} className="p-0">
                            <div className="bg-gray-50 p-4">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs">
                                      INVOICE NO
                                    </TableHead>
                                    <TableHead className="text-xs">
                                      DATE
                                    </TableHead>
                                    <TableHead className="text-xs">
                                      CUSTOMER
                                    </TableHead>
                                    <TableHead className="text-xs">
                                      QUANTITY
                                    </TableHead>
                                    <TableHead className="text-xs">
                                      RATE
                                    </TableHead>
                                    <TableHead className="text-xs">
                                      AMOUNT
                                    </TableHead>
                                    <TableHead className="text-xs">
                                      GST
                                    </TableHead>
                                    <TableHead className="text-xs">
                                      TOTAL
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {reportData.productSales[productKey].map(
                                    (sale, index) => (
                                      <TableRow
                                        key={`${sale.invoiceNumber}-${index}`}
                                      >
                                        <TableCell className="text-xs">
                                          {sale.invoiceNumber}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          {format(
                                            new Date(sale.invoiceDate),
                                            "dd/MM/yyyy"
                                          )}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          {sale.customerName}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          {sale.quantity}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          ₹{sale.rate.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          ₹{sale.amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          {sale.gst}%
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          ₹{sale.totalAmount.toFixed(2)}
                                        </TableCell>
                                      </TableRow>
                                    )
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        );

      case "daily-sales":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Total Sales
                </h3>
                <p className="text-2xl font-semibold">
                  ₹{reportData.dailySummary.totalSales.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Total Bills
                </h3>
                <p className="text-2xl font-semibold">
                  {reportData.dailySummary.totalBills}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Average Bill Value
                </h3>
                <p className="text-2xl font-semibold">
                  ₹{reportData.dailySummary.averageBillValue.toFixed(2)}
                </p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>HOUR</TableHead>
                  <TableHead>BILLS</TableHead>
                  <TableHead>SALES AMOUNT</TableHead>
                  <TableHead>TOTAL AMOUNT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.hourlyData.map((hour) => (
                  <TableRow key={hour.hour}>
                    <TableCell>{`${hour.hour
                      .toString()
                      .padStart(2, "0")}:00 - ${(hour.hour + 1)
                      .toString()
                      .padStart(2, "0")}:00`}</TableCell>
                    <TableCell>{hour.billCount}</TableCell>
                    <TableCell>₹{hour.totalSales.toFixed(2)}</TableCell>
                    <TableCell>₹{hour.totalAmount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case "monthly-sales":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Total Sales
                </h3>
                <p className="text-2xl font-semibold">
                  ₹{reportData.monthlySummary.totalSales.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Total Bills
                </h3>
                <p className="text-2xl font-semibold">
                  {reportData.monthlySummary.totalBills}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Average Bill Value
                </h3>
                <p className="text-2xl font-semibold">
                  ₹{reportData.monthlySummary.averageBillValue.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Average Daily Sales
                </h3>
                <p className="text-2xl font-semibold">
                  ₹{reportData.monthlySummary.averageDailySales.toFixed(2)}
                </p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DATE</TableHead>
                  <TableHead>BILLS</TableHead>
                  <TableHead>SALES AMOUNT</TableHead>
                  <TableHead>TOTAL AMOUNT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.dailyData.map((day) => (
                  <TableRow key={day.day}>
                    <TableCell>
                      {format(
                        new Date(
                          reportData.monthlySummary.month +
                            `-${day.day.toString().padStart(2, "0")}`
                        ),
                        "dd MMM yyyy"
                      )}
                    </TableCell>
                    <TableCell>{day.billCount}</TableCell>
                    <TableCell>₹{day.totalSales.toFixed(2)}</TableCell>
                    <TableCell>₹{day.totalAmount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      default:
        return null;
    }
  };

  // Handle tab change
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    // Clear the report data when changing tabs
    dispatch(clearReport());
    // Clear any local errors
    setLocalError(null);
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
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="w-full border-b border-gray-200 rounded-none p-0 h-10 bg-gray-50">
            <TabsTrigger
              value="sales"
              className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none h-10 text-sm font-medium"
              onClick={() => handleTabChange("sales")}
            >
              Sales
            </TabsTrigger>
            <TabsTrigger
              value="purchase"
              className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none h-10 text-sm font-medium"
              onClick={() => handleTabChange("purchase")}
            >
              Purchase
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none h-10 text-sm font-medium"
              onClick={() => handleTabChange("inventory")}
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
