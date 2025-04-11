import React, { useState, useEffect } from "react";
import { Search, Users, X, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { cn } from "../lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBills,
  searchBills,
  setDateRange,
  setSelectedPreset,
  setSaleTypeFilter,
  resetFilters,
} from "../redux/slices/SellBillSlice";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { DateRangePicker } from "../components/ui/date-range-picker";
import { formatCurrency } from "../utils/Helper";

export default function SalesTransactions() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const {
    bills: initialBills,
    dateRange: reduxDateRange,
    selectedPreset,
    saleTypeFilter,
  } = useSelector((state) => state.bill);
  const [bills, setBills] = useState(initialBills);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("invoice");
  const [lastFetchedRange, setLastFetchedRange] = useState(null);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Only reset if navigating away from sales routes
      if (!location.pathname.startsWith("/sales")) {
        dispatch(resetFilters());
      }
    };
  }, [location.pathname, dispatch]);

  // Convert ISO strings to Date objects for the component
  const dateRange = {
    from: reduxDateRange.from ? new Date(reduxDateRange.from) : null,
    to: reduxDateRange.to ? new Date(reduxDateRange.to) : null,
  };

  const handleDateSelect = (range) => {
    if (range?.from && range?.to) {
      // Serialize dates before dispatching
      const serializedRange = {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      };
      dispatch(setDateRange(serializedRange));
      dispatch(setSelectedPreset("custom"));
    }
  };

  const handleDatePresetChange = (value) => {
    dispatch(setSelectedPreset(value));

    if (value === "custom") {
      return;
    }

    let newRange = { from: new Date(), to: new Date() };

    switch (value) {
      case "today":
        newRange = { from: new Date(), to: new Date() };
        break;
      case "yesterday":
        const yesterday = subDays(new Date(), 1);
        newRange = { from: yesterday, to: yesterday };
        break;
      case "thisWeek":
        newRange = {
          from: startOfWeek(new Date(), { weekStartsOn: 1 }),
          to: endOfWeek(new Date(), { weekStartsOn: 1 }),
        };
        break;
      case "thisMonth":
        newRange = {
          from: startOfMonth(new Date()),
          to: endOfMonth(new Date()),
        };
        break;
      default:
        break;
    }

    // Serialize dates before dispatching
    const serializedRange = {
      from: newRange.from.toISOString(),
      to: newRange.to.toISOString(),
    };
    dispatch(setDateRange(serializedRange));
  };

  const handleDateSearch = () => {
    if (!dateRange.to) {
      const updatedRange = {
        from: dateRange.from.toISOString(),
        to: dateRange.from.toISOString(),
      };
      dispatch(setDateRange(updatedRange));
    }
  };

  const handleDateCancel = () => {
    const newRange = {
      from: subDays(new Date(), 7),
      to: new Date(),
    };
    // Serialize dates before dispatching
    const serializedRange = {
      from: newRange.from.toISOString(),
      to: newRange.to.toISOString(),
    };
    dispatch(setDateRange(serializedRange));
    dispatch(setSelectedPreset("thisWeek"));
  };

  // Debounce function to prevent multiple rapid calls
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Debounced version of fetchBillsData
  const debouncedFetchBills = React.useCallback(
    debounce((range) => {
      const fromDate =
        range.from instanceof Date ? range.from : new Date(range.from);
      const toDate = range.to instanceof Date ? range.to : new Date(range.to);

      dispatch(
        fetchBills({
          startDate: fromDate
            .toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
            .split("/")
            .reverse()
            .join("-"),
          endDate: toDate
            .toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
            .split("/")
            .reverse()
            .join("-"),
        })
      ).then((res) => {
        setBills(res.payload);
        setLastFetchedRange(range);
      });
    }, 300),
    []
  );

  // Update the useEffect to use the debounced function
  useEffect(() => {
    const shouldFetch =
      !lastFetchedRange ||
      lastFetchedRange.from?.getTime() !== dateRange.from?.getTime() ||
      lastFetchedRange.to?.getTime() !== dateRange.to?.getTime();

    if (shouldFetch && dateRange.from && dateRange.to) {
      debouncedFetchBills(dateRange);
    }
  }, [dateRange.from, dateRange.to, debouncedFetchBills, lastFetchedRange]);

  useEffect(() => {
    setBills(initialBills);
  }, [initialBills]);

  const summary = (bills || []).reduce(
    (acc, bill) => {
      if (!bill) return acc;

      acc.count++;
      acc.salesAmount += bill.billSummary?.grandTotal || 0;
      acc.amountPaid += bill.amountPaid || 0;
      return acc;
    },
    { count: 0, salesAmount: 0, amountPaid: 0 }
  );

  const getFilteredBills = () => {
    let filteredBills = bills;

    // Apply sale type filter
    if (saleTypeFilter !== "all") {
      filteredBills = filteredBills.filter((bill) => {
        if (saleTypeFilter === "sales") return bill.saleType !== "return";
        if (saleTypeFilter === "returns") return bill.saleType === "return";
        return true;
      });
    }

    // Apply search filter
    if (searchQuery) {
      filteredBills = filteredBills.filter((bill) =>
        bill.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filteredBills;
  };

  const handleSearch = async (value) => {
    setSearchQuery(value);

    if (!value.trim()) {
      setBills(initialBills);
      return;
    }

    const localResults = bills.filter((bill) =>
      bill.invoiceNumber.toLowerCase().includes(value.toLowerCase())
    );

    if (localResults.length === 0) {
      dispatch(
        searchBills({
          query: value,
          startDate: dateRange.from
            .toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
            .split("/")
            .reverse()
            .join("-"),
          endDate: dateRange.to
            .toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
            .split("/")
            .reverse()
            .join("-"),
        })
      ).then((res) => {
        setBills(res.payload);
      });
    }
  };

  return (
    <div className="relative p-4 space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Sales Transactions</h1>
        </div>
        <div className="grid grid-cols-4 gap-4 text-right">
          <div>
            <div className="">{summary.count}</div>
            <div className="text-sm text-muted-foreground">Sales Count</div>
          </div>
          <div>
            <div className="">{formatCurrency(summary.salesAmount)}</div>
            <div className="text-sm text-muted-foreground">Sales Amount</div>
          </div>
          <div>
            <div className="">{formatCurrency(summary.amountPaid)}</div>
            <div className="text-sm text-muted-foreground">Amount Paid</div>
          </div>
          <div>
            <div className=" text-red-500">
              {formatCurrency(summary.salesAmount - summary.amountPaid)}
            </div>
            <div className="text-sm text-muted-foreground">To Receive</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative">
          <div className="relative flex items-center bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden">
            <div className="relative flex items-center border-r border-slate-200">
              <Select
                defaultValue="invoice"
                onValueChange={(value) => setSearchType(value)}
              >
                <SelectTrigger className="h-9 w-[120px] border-0 bg-transparent hover:bg-slate-100 focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Search by" />
                </SelectTrigger>
                <SelectContent align="start" className="w-[120px]">
                  <SelectItem value="invoice" className="text-sm">
                    Invoice No
                  </SelectItem>
                  <SelectItem value="customer" className="text-sm">
                    Customer
                  </SelectItem>
                  <SelectItem value="grn" className="text-sm">
                    GRN No
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 relative flex items-center">
              <div className="absolute left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                className="w-full h-9 pl-10 pr-10 border-0 focus-visible:ring-0 placeholder:text-slate-400"
                placeholder={`Search by ${
                  searchType === "invoice"
                    ? "invoice number"
                    : searchType === "customer"
                    ? "customer name"
                    : "GRN number"
                }...`}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchQuery && (
                <div className="absolute right-3 flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-slate-100 rounded-full"
                    onClick={() => {
                      setSearchQuery("");
                      setBills(initialBills);
                    }}
                  >
                    <X className="h-3 w-3 text-slate-500" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <Select value={selectedPreset} onValueChange={handleDatePresetChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="thisWeek">This Week</SelectItem>
            <SelectItem value="thisMonth">This Month</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        {selectedPreset === "custom" && (
          <div className="relative w-[300px]">
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onSelect={handleDateSelect}
              onSearch={handleDateSearch}
              onCancel={handleDateCancel}
              className="border border-slate-200 rounded-md hover:border-slate-300 transition-colors"
            />
          </div>
        )}

        <Select
          value={saleTypeFilter}
          onValueChange={(value) => dispatch(setSaleTypeFilter(value))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="returns">Returns</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/sales/create-sell-invoice`)}
          >
            Create Sales Invoice
          </Button>
        </div>
      </div>

      <div className="relative overflow-x-auto border-t">
        {bills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mb-4" />
            <p className="text-lg">No sales bills found</p>
            <p className="text-sm">Create a new sales invoice to get started</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">S.NO</TableHead>
                <TableHead>INVOICE NO</TableHead>
                <TableHead>CUSTOMER Name</TableHead>
                <TableHead>INVOICE DATE</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>BILLED ON</TableHead>
                <TableHead>BILL TOTAL</TableHead>
                <TableHead>Due Amt</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="border">
              {getFilteredBills().map((bill, index) => (
                <TableRow
                  key={bill._id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/sales/${bill._id}`)}
                >
                  <TableCell className="font-medium pl-5">
                    {index + 1}{" "}
                    {bill?.saleType === "return" && (
                      <span className="text-red-500">R</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {bill.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{bill.customerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {bill.mob}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <p>
                      {new Date(bill.invoiceDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      By : {bill.createdByName}
                    </p>
                  </TableCell>
                  <TableCell>
                    {bill.withGst ? "With GST" : "Without GST"}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {new Date(bill.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(bill.billSummary?.grandTotal || 0)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(
                        (bill.billSummary?.grandTotal || 0) -
                          (bill.amountPaid || 0)
                      )}
                    </div>
                    {bill.paymentDueDate && (
                      <div className="text-sm text-muted-foreground">
                        {new Date(bill.paymentDueDate).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          }
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center  px-2 py-1 text-xs font-medium",
                          {
                            "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20":
                              bill.paymentStatus === "paid",
                            "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20":
                              bill.paymentStatus === "due",
                          }
                        )}
                      >
                        {bill.paymentStatus === "paid" ? "Paid" : "Due"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
