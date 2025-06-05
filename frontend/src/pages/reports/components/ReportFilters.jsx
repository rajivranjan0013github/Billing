import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
import { Button } from "../../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Input } from "../../../components/ui/input";
import { format, startOfMonth } from "date-fns";
import {
  Calendar as CalendarIcon,
  FilterIcon,
  Package,
  Store,
  X,
} from "lucide-react";
import { Calendar } from "../../../components/ui/calendar";
import MonthPicker from "../../../components/ui/month_picker";

const ReportFilters = ({
  isFilterRequired,
  selectedReportType,
  activeTab,
  localDateRange,
  handleDateRangeChange,
  localSingleDate,
  dispatch,
  setReduxSingleDate,
  localSelectedMonth,
  setReduxSelectedMonth,
  filters,
  handleFilterChange,
  distributors,
  customers,
  setIsProductDialogOpen,
  clearProductSelection,
  setIsManufacturerDialogOpen,
  clearManufacturerSelection,
  generateReport,
  reportStatus,
}) => {
  const needsDateRange = isFilterRequired("dateRange");
  const needsSingleDate = isFilterRequired("singleDate");
  const needsMonth = isFilterRequired("month");
  const needsCustomerFilter = isFilterRequired("customer");
  const needsDistributorFilter = isFilterRequired("distributor");
  const needsManufacturerFilter = isFilterRequired("manufacturer");
  const needsProductFilter = isFilterRequired("product");
  const needsExpiryDurationFilter = isFilterRequired("expiryRange");
  const needsThresholdFilter = selectedReportType[activeTab] === "low-stock";

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
    <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm font-semibold">
      <div className=" flex items-center align-middle">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end items-center justify-center">
          <div className="flex flex-wrap gap-3 flex-grow items-center justify-center align-middle">
            {/* Date Range Filter */}
            <div className="flex items-center gap-2 justify-center align-middle">
              <FilterIcon className="h-5 w-5 text-gray-600" />
              <h3 className="text-md font-semibold text-gray-800">Filters</h3>
            </div>
            {needsDateRange && (
              <div className="flex flex-col gap-1 col-span-1 md:col-span-2 lg:col-span-1">
                <label className="text-xs font-medium text-gray-600">
                  Date Range
                </label>
                <div className="flex items-center gap-2">
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
                    className="h-9 text-sm flex-1 shadow-sm"
                    placeholder="From"
                  />
                  <span className="text-gray-500 text-sm">to</span>
                  <Input
                    type="date"
                    value={
                      localDateRange.to
                        ? format(localDateRange.to, "yyyy-MM-dd")
                        : ""
                    }
                    onChange={(e) =>
                      handleDateRangeChange("to", e.target.value)
                    }
                    className="h-9 text-sm flex-1 shadow-sm"
                    placeholder="To"
                  />
                </div>
              </div>
            )}

            {/* Single Date Filter */}
            {needsSingleDate && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">
                  Select Date
                </label>
                <Popover>
                  {({ open, setOpen }) => (
                    <>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 text-sm w-full justify-start font-normal shadow-sm"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-gray-600" />
                          {localSingleDate ? (
                            format(localSingleDate, "PPP")
                          ) : (
                            <span className="text-gray-500">Pick a date</span>
                          )}
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
              </div>
            )}

            {/* Month Filter */}
            {needsMonth && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">
                  Select Month
                </label>
                <Popover>
                  {({ open, setOpen }) => (
                    <>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 text-sm w-full justify-start font-normal shadow-sm"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-gray-600" />
                          {localSelectedMonth ? (
                            format(localSelectedMonth, "MMMM yyyy")
                          ) : (
                            <span className="text-gray-500">Select month</span>
                          )}
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
              </div>
            )}

            {/* Distributor Filter */}
            {needsDistributorFilter && (
              <div className="flex flex-col gap-1 font-semibold">
                <label className="text-xs font-medium text-gray-600">
                  Distributor
                </label>
                <Select
                  value={filters.distributor}
                  onValueChange={(value) =>
                    handleFilterChange("distributor", value)
                  }
                >
                  <SelectTrigger className="h-9 text-sm w-full font-normal shadow-sm">
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
              </div>
            )}

            {/* Customer Filter */}
            {needsCustomerFilter && (
              <div className="flex flex-col gap-1 font-semibold">
                <label className="text-xs font-medium text-gray-600">
                  Customer
                </label>
                <Select
                  value={filters.customer}
                  onValueChange={(value) =>
                    handleFilterChange("customer", value)
                  }
                >
                  <SelectTrigger className="h-9 text-sm w-full font-normal shadow-sm">
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
              </div>
            )}

            {/* Product Filter */}
            {needsProductFilter && (
              <div className="flex flex-col gap-1 font-semibold">
                <label className="text-xs font-medium text-gray-600">
                  Product
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-sm w-full justify-between  shadow-sm"
                  onClick={() => setIsProductDialogOpen(true)}
                >
                  <span className="flex items-center truncate">
                    <Package className="mr-2 h-4 w-4 text-gray-600" />
                    {filters.product || (
                      <span className="text-gray-500">Select product</span>
                    )}
                  </span>
                  {filters.product && (
                    <X
                      className="h-4 w-4 text-gray-500 hover:text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearProductSelection(e);
                      }}
                    />
                  )}
                </Button>
              </div>
            )}

            {/* Manufacturer Filter */}
            {needsManufacturerFilter && (
              <div className="flex flex-col gap-1 font-semibold">
                <label className="text-xs font-medium text-gray-600">
                  Manufacturer
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-sm w-full justify-between  shadow-sm"
                  onClick={() => setIsManufacturerDialogOpen(true)}
                >
                  <span className="flex items-center truncate">
                    <Store className="mr-2 h-4 w-4 text-gray-600" />
                    {filters.manufacturer || (
                      <span className="text-gray-500">Select manufacturer</span>
                    )}
                  </span>
                  {filters.manufacturer && (
                    <X
                      className="h-4 w-4 text-gray-500 hover:text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearManufacturerSelection(e);
                      }}
                    />
                  )}
                </Button>
              </div>
            )}

            {/* Expiry Range Filter */}
            {needsExpiryDurationFilter && (
              <div className="flex flex-col gap-1 font-semibold">
                <label className="text-xs font-medium text-gray-600">
                  Expiry Month
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 text-sm w-full flex items-center justify-start font-normal gap-2 shadow-sm"
                    >
                      <CalendarIcon className="h-4 w-4 text-gray-600" />
                      {filters.expiryRange.selectedMonth ? (
                        format(
                          new Date(filters.expiryRange.selectedMonth),
                          "MMMM yyyy"
                        )
                      ) : (
                        <span className="text-gray-500">
                          Select expiry month
                        </span>
                      )}
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

            {/* Threshold Filter */}
            {needsThresholdFilter && (
              <div className="flex flex-col gap-1 font-semibold">
                <label className="text-xs font-medium text-gray-600">
                  Low Stock Threshold
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={filters.threshold}
                    onChange={(e) =>
                      handleFilterChange("threshold", e.target.value)
                    }
                    className="h-9 text-sm w-24 shadow-sm"
                    placeholder="e.g. 10"
                  />
                  <span className="text-sm text-gray-600">packs</span>
                </div>
              </div>
            )}
          </div>
          <div className="w-full lg:w-auto">
            <Button
              onClick={generateReport}
              className="h-9  px-4 bg-pink-400 hover:bg-pink-500 text-white text-sm font-medium shadow-sm w-full"
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
      </div>
    </div>
  );
};

export default ReportFilters;
