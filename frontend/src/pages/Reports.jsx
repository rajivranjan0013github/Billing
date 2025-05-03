import React, { useState, useEffect } from "react";
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
  fetchPurchaseReport,
  fetchInventoryReport,
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
import SelectManufacturer from "../components/custom/manufacturer/SelectManufacturer";
import { fetchDistributors } from "../redux/slices/distributorSlice";

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

  // Initialize date range with weekly range on component mount
  useEffect(() => {
    if (!dateRange.from && !dateRange.to) {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      dispatch(
        setReduxDateRange({
          from: sevenDaysAgo,
          to: today,
        })
      );
    }
  }, []);

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
    expiryRange: {
      selectedMonth: null,
    },
    threshold: "10",
  });

  // Get data from Redux store
  const salesData = useSelector((state) => state.bill.bills);
  const purchaseData = useSelector((state) => state.purchaseBill.bills);
  const inventoryData = useSelector((state) => state.inventory.items);
  const distributors = useSelector((state) => state.distributor.distributors);
  const distributorFetchStatus = useSelector(
    (state) => state.distributor.fetchStatus
  );
  const customers = useSelector((state) => state.customers.customers);

  // Add state for selected product
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Replace product dialog state with search state
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // Add state for manufacturer dialog
  const [isManufacturerDialogOpen, setIsManufacturerDialogOpen] =
    useState(false);
  const [manufacturerSearch, setManufacturerSearch] = useState("");

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
      { id: "low-stock", name: "Low Stock Items", icon: Package, filters: [] },
      {
        id: "expiry-alert",
        name: "Near Expiry",
        icon: Clock,
        filters: ["expiryRange"],
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

  // Handle report type change
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
      expiryRange: {
        selectedMonth: null,
      },
      threshold: "10",
    });
    // Reset selected product state as well
    setSelectedProduct(null);
    // Clear the report data
    dispatch(clearReport());
    // Clear any local errors
    setLocalError(null);

    // Fetch distributors data if distributor-wise report is selected and data not loaded
    if (
      newType === "distributor-wise" &&
      distributorFetchStatus !== "succeeded"
    ) {
      dispatch(fetchDistributors());
    }
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
    // Update filters with the product name
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

  // Add function to clear manufacturer selection
  const clearManufacturerSelection = (e) => {
    e.stopPropagation();
    handleFilterChange("manufacturer", "");
    setManufacturerSearch("");
  };

  // Function to handle manufacturer selection
  const handleManufacturerSelect = (manufacturer) => {
    // Close the dialog
    setIsManufacturerDialogOpen(false);
    // Update filters with the manufacturer
    handleFilterChange("manufacturer", manufacturer);
    setManufacturerSearch(manufacturer);
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

      // Validate threshold for low-stock report
      if (selectedReportType[activeTab] === "low-stock") {
        const thresholdValue = parseInt(filters.threshold);
        if (isNaN(thresholdValue) || thresholdValue <= 0) {
          setLocalError("Please enter a valid threshold value greater than 0");
          return;
        }
      }

      // Validate expiry range if custom is selected
      if (filters.expiryRange.selectedMonth) {
        // Format the selected month as mm/yy
        const selectedDate = new Date(filters.expiryRange.selectedMonth);
        filters.expiryRange.preset = "custom";
        filters.expiryRange.custom = true;
        filters.expiryRange.selectedMonth = selectedDate;
      }

      // Prepare filter parameters - ensure all values are serializable
      let params = {
        reportType: selectedReportType[activeTab],
      };

      // Add threshold parameter for low-stock report
      if (selectedReportType[activeTab] === "low-stock") {
        params.threshold = filters.threshold;
      }

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

      // Add expiry range filter
      if (filters.expiryRange) {
        if (filters.expiryRange.selectedMonth) {
          // Format the selected month as mm/yy
          const selectedDate = new Date(filters.expiryRange.selectedMonth);
          params.targetExpiry = `${String(selectedDate.getMonth() + 1).padStart(
            2,
            "0"
          )}/${String(selectedDate.getFullYear()).slice(-2)}`;
        }
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
        case "purchase":
          await dispatch(fetchPurchaseReport(params)).unwrap();
          break;
        case "inventory":
          await dispatch(fetchInventoryReport(params)).unwrap();
          break;
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
    const needsExpiryDurationFilter = isFilterRequired("expiryRange");
    const needsThresholdFilter = selectedReportType[activeTab] === "low-stock";
    console.log(needsExpiryDurationFilter);

    if (
      !needsDateRange &&
      !needsSingleDate &&
      !needsMonth &&
      !needsCustomerFilter &&
      !needsDistributorFilter &&
      !needsManufacturerFilter &&
      !needsProductFilter &&
      !needsExpiryDurationFilter &&
      !needsThresholdFilter
    ) {
      return null;
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-2">
          <FilterIcon className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">Filters</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Date Range Filter - Compact Version */}
          {needsDateRange && (
            <div className="flex items-center gap-2 min-w-[320px]">
              <Input
                type="date"
                value={
                  localDateRange.from
                    ? format(localDateRange.from, "yyyy-MM-dd")
                    : ""
                }
                onChange={(e) => handleDateRangeChange("from", e.target.value)}
                className="h-8 text-sm flex-1"
                placeholder="From"
              />
              <span className="text-gray-400">to</span>
              <Input
                type="date"
                value={
                  localDateRange.to
                    ? format(localDateRange.to, "yyyy-MM-dd")
                    : ""
                }
                onChange={(e) => handleDateRangeChange("to", e.target.value)}
                className="h-8 text-sm flex-1"
                placeholder="To"
              />
            </div>
          )}

          {/* Single Date Filter - Compact */}
          {needsSingleDate && (
            <Popover>
              {({ open, setOpen }) => (
                <>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-sm"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localSingleDate
                        ? format(localSingleDate, "PP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
          )}

          {/* Month Filter - Compact */}
          {needsMonth && (
            <Popover>
              {({ open, setOpen }) => (
                <>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-sm"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localSelectedMonth
                        ? format(localSelectedMonth, "MMM yyyy")
                        : "Select month"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
          )}

          {/* Distributor Filter - Compact */}
          {needsDistributorFilter && (
            <Select
              value={filters.distributor}
              onValueChange={(value) =>
                handleFilterChange("distributor", value)
              }
            >
              <SelectTrigger className="h-8 text-sm w-[200px]">
                <SelectValue placeholder="Select distributor" />
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
          )}

          {/* Customer Filter - Compact */}
          {needsCustomerFilter && (
            <Select
              value={filters.customer}
              onValueChange={(value) => handleFilterChange("customer", value)}
            >
              <SelectTrigger className="h-8 text-sm w-[200px]">
                <SelectValue placeholder="Select customer" />
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
          )}

          {/* Product Filter - Compact */}
          {needsProductFilter && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-sm w-[200px] justify-between"
              onClick={() => setIsProductDialogOpen(true)}
            >
              <span className="flex items-center truncate">
                <Package className="mr-2 h-4 w-4" />
                {filters.product || "Select product"}
              </span>
              {filters.product && (
                <X
                  className="h-4 w-4 opacity-70 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearProductSelection(e);
                  }}
                />
              )}
            </Button>
          )}

          {/* Manufacturer Filter - Compact */}
          {needsManufacturerFilter && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-sm w-[200px] justify-between"
              onClick={() => setIsManufacturerDialogOpen(true)}
            >
              <span className="flex items-center truncate">
                <Store className="mr-2 h-4 w-4" />
                {filters.manufacturer || "Select manufacturer"}
              </span>
              {filters.manufacturer && (
                <X
                  className="h-4 w-4 opacity-70 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearManufacturerSelection(e);
                  }}
                />
              )}
            </Button>
          )}

          {/* Expiry Range Filter - Compact */}
          {needsExpiryDurationFilter && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-sm flex items-center gap-2"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {filters.expiryRange.selectedMonth
                      ? format(
                          new Date(filters.expiryRange.selectedMonth),
                          "MMM yyyy"
                        )
                      : "Select expiry month"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <MonthPicker
                    currentMonth={
                      filters.expiryRange.selectedMonth || new Date()
                    }
                    onMonthChange={(date) => {
                      handleFilterChange("expiryRange", {
                        selectedMonth: date,
                      });
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Threshold Filter - Compact */}
          {needsThresholdFilter && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                value={filters.threshold}
                onChange={(e) =>
                  handleFilterChange("threshold", e.target.value)
                }
                className="h-8 text-sm w-20"
                placeholder="Threshold"
              />
              <span className="text-sm text-gray-500">packs</span>
            </div>
          )}

          {/* Generate Button - Always at the end */}
          <Button
            onClick={generateReport}
            className="h-8 px-4 bg-gray-900 hover:bg-black text-white ml-auto"
            disabled={reportStatus === "loading"}
          >
            {reportStatus === "loading" ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FilterIcon className="mr-2 h-4 w-4" />
                <span>Generate Report</span>
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Function to render the report selection section
  const renderReportSelection = () => {
    const reports = reportTypes[activeTab] || [];

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {reports.map((report) => {
          const ReportIcon = report.icon;
          const isSelected = selectedReportType[activeTab] === report.id;
          return (
            <Card
              key={report.id}
              className={cn(
                "cursor-pointer transition-all duration-200 overflow-hidden hover:scale-[1.02] hover:shadow-md",
                isSelected
                  ? "ring-2 ring-gray-900 bg-gray-900 text-white"
                  : "border border-gray-200 hover:border-gray-300"
              )}
              onClick={() => handleReportTypeChange(report.id)}
            >
              <div className="flex flex-col items-center text-center p-2">
                <ReportIcon
                  className={cn(
                    "h-5 w-5 mb-2",
                    isSelected ? "text-white" : "text-gray-800"
                  )}
                />
                <h3 className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
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
        case "purchase":
          switch (reportId) {
            case "all-purchases":
              return !data.purchases || data.purchases.length === 0;
            case "distributor-wise":
              return (
                !data.distributorSummary || data.distributorSummary.length === 0
              );
            case "manufacturer-wise":
              return (
                !data.manufacturerSummary ||
                data.manufacturerSummary.length === 0
              );
            case "product-wise":
              return !data.productSummary || data.productSummary.length === 0;
            default:
              return Object.keys(data).length === 0;
          }
        case "inventory":
          switch (reportId) {
            case "stock-status":
              return !data.items || data.items.length === 0;
            case "low-stock":
              return !data.lowStockItems || data.lowStockItems.length === 0;
            case "expiry-alert":
              return !data.expiryAlerts || data.expiryAlerts.length === 0;
            case "stock-movement":
              return !data.stockMovement || data.stockMovement.length === 0;
            case "fast-moving":
              return !data.fastMovingItems || data.fastMovingItems.length === 0;
            case "slow-moving":
              return !data.slowMovingItems || data.slowMovingItems.length === 0;
            default:
              return Object.keys(data).length === 0;
          }
        default:
          // General fallback check if tab is unknown or not handled yet
          return !data || Object.keys(data).length === 0;
      }
    };

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
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
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={
              reportStatus === "loading" ||
              !reportData ||
              isDataEmpty(reportData, activeTab, selectedReportType)
            }
            className="h-9 px-4"
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        <div className="p-5">
          {localError || reportError ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-600">
              <p className="text-base font-medium">
                {localError || reportError}
              </p>
            </div>
          ) : reportStatus === "loading" ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-10 w-10 rounded-full border-2 border-t-black border-r-black border-b-gray-300 border-l-gray-300 animate-spin mb-4"></div>
              <p className="text-base font-medium text-gray-800">
                Generating report...
              </p>
              <p className="text-sm text-gray-600 mt-1">
                This may take a moment
              </p>
            </div>
          ) : !reportData ? (
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
            <div className="space-y-4">
              <div className="overflow-x-auto">
                {activeTab === "sales" && renderSalesTable()}
                {activeTab === "purchase" && renderPurchaseTable()}
                {activeTab === "inventory" && renderInventoryTable()}
              </div>
            </div>
          )}
        </div>
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

  // Function to render the purchase table based on report type
  const renderPurchaseTable = () => {
    if (!reportData) return null;

    switch (selectedReportType[activeTab]) {
      case "all-purchases":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>INVOICE NO</TableHead>
                <TableHead>INVOICE DATE</TableHead>
                <TableHead>DISTRIBUTOR</TableHead>
                <TableHead>TOTAL ITEMS</TableHead>
                <TableHead>TAXABLE(₹)</TableHead>
                <TableHead>GST(₹)</TableHead>
                <TableHead>TOTAL(₹)</TableHead>
                <TableHead>STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.purchases?.map((purchase) => (
                <TableRow key={purchase._id}>
                  <TableCell>{purchase.invoiceNumber}</TableCell>
                  <TableCell>
                    {format(new Date(purchase.invoiceDate), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <div>{purchase.distributorName}</div>
                    <div className="text-sm text-muted-foreground">
                      {purchase.mob}
                    </div>
                  </TableCell>
                  <TableCell>{purchase.billSummary.productCount}</TableCell>
                  <TableCell>
                    {purchase.billSummary.taxableAmount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {purchase.billSummary.gstAmount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {purchase.billSummary.grandTotal.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                        {
                          "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20":
                            purchase.paymentStatus === "paid",
                          "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20":
                            purchase.paymentStatus === "due",
                        }
                      )}
                    >
                      {purchase.paymentStatus === "paid" ? "Paid" : "Due"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "distributor-wise":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DISTRIBUTOR</TableHead>
                <TableHead>TOTAL BILLS</TableHead>
                <TableHead>TOTAL AMOUNT</TableHead>
                <TableHead>AVERAGE BILL VALUE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.distributorSummary?.map((distributor) => (
                <TableRow key={distributor.distributorId}>
                  <TableCell>{distributor.distributorName}</TableCell>
                  <TableCell>{distributor.totalPurchases}</TableCell>
                  <TableCell>₹{distributor.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    ₹
                    {(
                      distributor.totalAmount / distributor.totalPurchases
                    ).toFixed(2)}
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
                <TableHead>PRODUCTS PURCHASED</TableHead>
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
                  <TableHead>QUANTITY PURCHASED</TableHead>
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
                        <TableCell>{product.quantityPurchased}</TableCell>
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

                      {isSelected &&
                        reportData.productPurchases[productKey] && (
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
                                        DISTRIBUTOR
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
                                    {reportData.productPurchases[
                                      productKey
                                    ].map((purchase, index) => (
                                      <TableRow
                                        key={`${purchase.invoiceNumber}-${index}`}
                                      >
                                        <TableCell className="text-xs">
                                          {purchase.invoiceNumber}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          {format(
                                            new Date(purchase.invoiceDate),
                                            "dd/MM/yyyy"
                                          )}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          {purchase.distributorName}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          {purchase.quantity}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          ₹{purchase.rate?.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          ₹{purchase.amount?.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          {purchase.gst}%
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          ₹{purchase.totalAmount?.toFixed(2)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
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

      default:
        return null;
    }
  };

  const renderInventoryTable = () => {
    if (!reportData) return null;

    switch (selectedReportType[activeTab]) {
      case "stock-status":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PRODUCT</TableHead>
                <TableHead>MANUFACTURER</TableHead>
                <TableHead>BATCH</TableHead>
                <TableHead>QUANTITY</TableHead>
                <TableHead>MRP</TableHead>
                <TableHead>EXPIRY</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.items?.map((item) => (
                <TableRow key={`${item.productName}-${item.batchNumber}`}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>{item.manufacturer}</TableCell>
                  <TableCell>{item.batchNumber}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>₹{item.mrp?.toFixed(2)}</TableCell>
                  <TableCell>{item.expiry}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "low-stock":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PRODUCT</TableHead>
                <TableHead>MANUFACTURER</TableHead>
                <TableHead>BATCH</TableHead>
                <TableHead>CURRENT STOCK</TableHead>
                <TableHead>EXPIRY</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.lowStockItems?.map((item) => {
                // Calculate packs and units
                const packs = Math.floor(item.currentStock / (item.pack || 1));
                const units = item.currentStock % (item.pack || 1);

                return (
                  <TableRow key={`${item.productName}-${item.batchNumber}`}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.manufacturer}</TableCell>
                    <TableCell>{item.batchNumber}</TableCell>
                    <TableCell>
                      {packs > 0 && `${packs} pack${packs > 1 ? "s" : ""}`}
                      {packs > 0 && units > 0 && " and "}
                      {units > 0 && `${units} unit${units > 1 ? "s" : ""}`}
                      {packs === 0 && units === 0 && "0 units"}
                      <span className="text-xs text-gray-500 block">
                        Total: {item.currentStock} units (Pack size:{" "}
                        {item.pack || 1})
                      </span>
                    </TableCell>
                    <TableCell>{item.expiry}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        );

      case "expiry-alert":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PRODUCT</TableHead>
                <TableHead>MANUFACTURER</TableHead>
                <TableHead>BATCH</TableHead>
                <TableHead>QUANTITY</TableHead>
                <TableHead>EXPIRY</TableHead>
                <TableHead>MRP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.expiryAlerts?.map((item) => (
                <TableRow key={`${item.productName}-${item.batchNumber}`}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>{item.manufacturer}</TableCell>
                  <TableCell>{item.batchNumber}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.expiry}</TableCell>
                  <TableCell>₹{item.mrp?.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-[1600px] mx-auto space-y-2">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500 mt-1">
              View and analyze your business data
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 hover:bg-gray-50 transition-colors"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Tabs
            defaultValue="sales"
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="w-full border-b border-gray-200 rounded-none p-0 h-12 bg-gray-50/50">
              <TabsTrigger
                value="sales"
                className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none h-12 px-6 text-sm font-medium transition-all"
                onClick={() => handleTabChange("sales")}
              >
                <BarChart className="w-4 h-4 mr-2" />
                Sales
              </TabsTrigger>
              <TabsTrigger
                value="purchase"
                className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none h-12 px-6 text-sm font-medium transition-all"
                onClick={() => handleTabChange("purchase")}
              >
                <Package className="w-4 h-4 mr-2" />
                Purchase
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none h-12 px-6 text-sm font-medium transition-all"
                onClick={() => handleTabChange("inventory")}
              >
                <Store className="w-4 h-4 mr-2" />
                Inventory
              </TabsTrigger>
            </TabsList>

            <div className="p-2">
              <TabsContent value="sales" className="mt-0 space-y-2">
                <div className="bg-gray-50/50 rounded-lg p-2">
                  {renderReportSelection()}
                </div>
                {renderFilters()}
                {renderReportResults()}
              </TabsContent>

              <TabsContent value="purchase" className="mt-0 space-y-2">
                <div className="bg-gray-50/50 rounded-lg p-2">
                  {renderReportSelection()}
                </div>
                {renderFilters()}
                {renderReportResults()}
              </TabsContent>

              <TabsContent value="inventory" className="mt-0 space-y-2">
                <div className="bg-gray-50/50 rounded-lg p-2">
                  {renderReportSelection()}
                </div>
                {renderFilters()}
                {renderReportResults()}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Product Selection Dialog */}
        <SelectInventory
          open={isProductDialogOpen}
          onOpenChange={setIsProductDialogOpen}
          onSelect={handleProductSelect}
          search={productSearch}
          setSearch={setProductSearch}
        />

        {/* Manufacturer Selection Dialog */}
        <SelectManufacturer
          open={isManufacturerDialogOpen}
          onOpenChange={setIsManufacturerDialogOpen}
          onSelect={handleManufacturerSelect}
          search={manufacturerSearch}
          setSearch={setManufacturerSearch}
        />
      </div>
    </div>
  );
};

export default Reports;
