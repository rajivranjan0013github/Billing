import React, { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
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
  XCircle,
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
import ReportSelection from "./reports/components/ReportSelection";
import ReportFilters from "./reports/components/ReportFilters";
import ReportResults from "./reports/components/ReportResults";

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

        filters: ["dateRange"],
      },
      {
        id: "product-wise",
        name: "Product Wise",

        filters: ["dateRange", "product"],
      },
      {
        id: "manufacturer-wise",
        name: "Manufacturer Wise",

        filters: ["dateRange", "manufacturer"],
      },
      {
        id: "group-wise",
        name: "Group Wise",
        filters: ["dateRange"],
      },
    ],
    purchase: [
      {
        id: "all-purchases",
        name: "All Purchases",

        filters: ["dateRange"],
      },
      {
        id: "distributor-wise",
        name: "Distributor Wise",

        filters: ["dateRange", "distributor"],
      },
      {
        id: "product-wise",
        name: "Product Wise",

        filters: ["dateRange", "product"],
      },
      {
        id: "manufacturer-wise",
        name: "Manufacturer Wise",

        filters: ["dateRange", "manufacturer"],
      },
      {
        id: "group-wise",
        name: "Group Wise",
        filters: ["dateRange"],
      },
    ],
    inventory: [
      { id: "low-stock", name: "Low Stock Items", filters: [] },
      {
        id: "expiry-alert",
        name: "Near Expiry",
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

  // Handle tab change
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    // Clear the report data when changing tabs
    dispatch(clearReport());
    // Clear any local errors
    setLocalError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-full mx-auto space-y-1">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h2 className="text-xl md:text-xl font-bold text-gray-800 tracking-tight">
              Reports Dashboard
            </h2>
            <p className="text-sm md:text-md text-gray-600 mt-1">
              Analyze sales, purchases, and inventory data.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 mt-3 sm:mt-0 text-sm font-medium shadow-sm hover:bg-gray-100 border-gray-300"
          >
            <RefreshCcw className="mr-2 h-4 w-4 text-gray-600" />
            Refresh Data
          </Button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <Tabs
            defaultValue="sales"
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="w-full border-b-2 border-gray-200 rounded-none p-0 h-10 bg-gray-50">
              <TabsTrigger
                value="sales"
                className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-pink-400 data-[state=active]:shadow-none h-10 px-6 text-sm font-semibold text-gray-700 data-[state=active]:text-pink-600 transition-all hover:bg-gray-100 data-[state=active]:hover:bg-white"
                onClick={() => handleTabChange("sales")}
              >
                <BarChart className="w-5 h-4 mr-2" />
                Sales Reports
              </TabsTrigger>
              <TabsTrigger
                value="purchase"
                className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-pink-400 data-[state=active]:shadow-none h-10 px-6 text-sm font-semibold text-gray-700 data-[state=active]:text-pink-600 transition-all hover:bg-gray-100 data-[state=active]:hover:bg-white"
                onClick={() => handleTabChange("purchase")}
              >
                <Package className="w-5 h-4 mr-2" />
                Purchase Reports
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-pink-400 data-[state=active]:shadow-none h-10 px-6 text-sm font-semibold text-gray-700 data-[state=active]:text-pink-600 transition-all hover:bg-gray-100 data-[state=active]:hover:bg-white"
                onClick={() => handleTabChange("inventory")}
              >
                <Store className="w-5 h-4 mr-2" />
                Inventory Reports
              </TabsTrigger>
            </TabsList>

            <div className=" bg-gray-50/40 ">
              <TabsContent value="sales" className="mt-0 space-y-4">
                <div className="bg-white rounded-xl p-2 shadow-sm ">
                  {/* {renderReportSelection()} */}
                  <ReportSelection
                    activeTab={activeTab}
                    reportTypes={reportTypes}
                    selectedReportType={selectedReportType}
                    handleReportTypeChange={handleReportTypeChange}
                  />
                </div>
                {/* {renderFilters()} */}
                <ReportFilters
                  isFilterRequired={isFilterRequired}
                  selectedReportType={selectedReportType}
                  activeTab={activeTab}
                  localDateRange={localDateRange}
                  handleDateRangeChange={handleDateRangeChange}
                  localSingleDate={localSingleDate}
                  dispatch={dispatch}
                  setReduxSingleDate={setReduxSingleDate}
                  localSelectedMonth={localSelectedMonth}
                  setReduxSelectedMonth={setReduxSelectedMonth}
                  filters={filters}
                  handleFilterChange={handleFilterChange}
                  distributors={distributors}
                  customers={customers}
                  setIsProductDialogOpen={setIsProductDialogOpen}
                  clearProductSelection={clearProductSelection}
                  setIsManufacturerDialogOpen={setIsManufacturerDialogOpen}
                  clearManufacturerSelection={clearManufacturerSelection}
                  generateReport={generateReport}
                  reportStatus={reportStatus}
                />
                {/* {renderReportResults()} */}
                <ReportResults
                  reportData={reportData}
                  reportStatus={reportStatus}
                  reportError={reportError}
                  localError={localError}
                  activeTab={activeTab}
                  selectedReportType={selectedReportType}
                  getSelectedReport={getSelectedReport}
                  isFilterRequired={isFilterRequired}
                  dateRange={dateRange}
                  singleDate={singleDate}
                  selectedMonth={selectedMonth}
                  generateReport={generateReport}
                  selectedProduct={selectedProduct}
                  setSelectedProduct={setSelectedProduct}
                />
              </TabsContent>

              <TabsContent value="purchase" className="mt-0 space-y-4">
                <div className="bg-white rounded-xl  p-2 shadow-sm">
                  {/* {renderReportSelection()} */}
                  <ReportSelection
                    activeTab={activeTab}
                    reportTypes={reportTypes}
                    selectedReportType={selectedReportType}
                    handleReportTypeChange={handleReportTypeChange}
                  />
                </div>
                {/* {renderFilters()} */}
                <ReportFilters
                  isFilterRequired={isFilterRequired}
                  selectedReportType={selectedReportType}
                  activeTab={activeTab}
                  localDateRange={localDateRange}
                  handleDateRangeChange={handleDateRangeChange}
                  localSingleDate={localSingleDate}
                  dispatch={dispatch}
                  setReduxSingleDate={setReduxSingleDate}
                  localSelectedMonth={localSelectedMonth}
                  setReduxSelectedMonth={setReduxSelectedMonth}
                  filters={filters}
                  handleFilterChange={handleFilterChange}
                  distributors={distributors}
                  customers={customers}
                  setIsProductDialogOpen={setIsProductDialogOpen}
                  clearProductSelection={clearProductSelection}
                  setIsManufacturerDialogOpen={setIsManufacturerDialogOpen}
                  clearManufacturerSelection={clearManufacturerSelection}
                  generateReport={generateReport}
                  reportStatus={reportStatus}
                />
                {/* {renderReportResults()} */}
                <ReportResults
                  reportData={reportData}
                  reportStatus={reportStatus}
                  reportError={reportError}
                  localError={localError}
                  activeTab={activeTab}
                  selectedReportType={selectedReportType}
                  getSelectedReport={getSelectedReport}
                  isFilterRequired={isFilterRequired}
                  dateRange={dateRange}
                  singleDate={singleDate}
                  selectedMonth={selectedMonth}
                  generateReport={generateReport}
                  selectedProduct={selectedProduct}
                  setSelectedProduct={setSelectedProduct}
                />
              </TabsContent>

              <TabsContent value="inventory" className="mt-0 space-y-4">
                <div className="bg-white rounded-xl p-2 shadow-sm">
                  {/* {renderReportSelection()} */}
                  <ReportSelection
                    activeTab={activeTab}
                    reportTypes={reportTypes}
                    selectedReportType={selectedReportType}
                    handleReportTypeChange={handleReportTypeChange}
                  />
                </div>
                {/* {renderFilters()} */}
                <ReportFilters
                  isFilterRequired={isFilterRequired}
                  selectedReportType={selectedReportType}
                  activeTab={activeTab}
                  localDateRange={localDateRange}
                  handleDateRangeChange={handleDateRangeChange}
                  localSingleDate={localSingleDate}
                  dispatch={dispatch}
                  setReduxSingleDate={setReduxSingleDate}
                  localSelectedMonth={localSelectedMonth}
                  setReduxSelectedMonth={setReduxSelectedMonth}
                  filters={filters}
                  handleFilterChange={handleFilterChange}
                  distributors={distributors}
                  customers={customers}
                  setIsProductDialogOpen={setIsProductDialogOpen}
                  clearProductSelection={clearProductSelection}
                  setIsManufacturerDialogOpen={setIsManufacturerDialogOpen}
                  clearManufacturerSelection={clearManufacturerSelection}
                  generateReport={generateReport}
                  reportStatus={reportStatus}
                />
                {/* {renderReportResults()} */}
                <ReportResults
                  reportData={reportData}
                  reportStatus={reportStatus}
                  reportError={reportError}
                  localError={localError}
                  activeTab={activeTab}
                  selectedReportType={selectedReportType}
                  getSelectedReport={getSelectedReport}
                  isFilterRequired={isFilterRequired}
                  dateRange={dateRange}
                  singleDate={singleDate}
                  selectedMonth={selectedMonth}
                  generateReport={generateReport}
                  selectedProduct={selectedProduct}
                  setSelectedProduct={setSelectedProduct}
                />
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
