import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search,
  Users,
  X,
  ArrowLeft,
  Calendar,
  Plus,
  Filter,
  EllipsisVertical,
  FileInput,
  Download
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Input } from "../components/ui/input";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { useToast } from "../hooks/use-toast";
import { useDispatch, useSelector } from "react-redux";
import { fetchBills, searchBills } from "../redux/slices/SellBillSlice";
import ExportDataDlg from "../components/custom/mirgration/ExportDataDlg";

export default function SalesTransactions() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const isInitialDebounceEffectRun = useRef(true);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Get data from Redux
  const { bills } = useSelector((state) => state.bill);

  // Local state for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("invoice");

  // Get params from URL or use defaults
  const urlDateFilter = searchParams.get("dateFilter") || "today";
  const urlFromDate = searchParams.get("from");
  const urlToDate = searchParams.get("to");

  const [saleTypeFilter, setSaleTypeFilter] = useState("all");
  const [dateFilterType, setDateFilterType] = useState(urlDateFilter);
  const [dateRange, setDateRange] = useState({
    from: urlFromDate ? new Date(urlFromDate) : new Date(),
    to: urlToDate ? new Date(urlToDate) : new Date(),
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle debounced search
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      if (!isInitialDebounceEffectRun.current) {
        fetchBillsData({
          startDate: dateRange.from,
          endDate: dateRange.to,
        });
      }
      return;
    }

    const handleSearch = async () => {
      try {
        await dispatch(searchBills({
          query: debouncedSearchQuery,
          searchType
        })).unwrap();
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to search bills",
          variant: "destructive",
        });
      }
    };

    handleSearch();
    isInitialDebounceEffectRun.current = false;
  }, [debouncedSearchQuery, searchType, dispatch]);

  const fetchBillsData = useCallback(async (params) => {
    try {
      await dispatch(fetchBills({
        startDate: format(params.startDate, "yyyy-MM-dd"),
        endDate: format(params.endDate, "yyyy-MM-dd"),
        filter: saleTypeFilter !== "all" ? saleTypeFilter : undefined
      })).unwrap();
    } catch (err) {
      toast({
        title: "Error fetching bills",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [dispatch, saleTypeFilter]);

  // Initialize with URL parameters or defaults
  useEffect(() => {
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const dateFilterParam = searchParams.get("dateFilter");

    // If no params, set to today's date
    if (!fromParam || !toParam) {
      const today = new Date();
      const todayFormatted = format(today, "yyyy-MM-dd");
      
      setSearchParams(prev => {
        prev.set("from", todayFormatted);
        prev.set("to", todayFormatted);
        prev.set("dateFilter", "today");
        return prev;
      });

      setDateRange({ from: today, to: today });
      setDateFilterType("today");
      
      fetchBillsData({
        startDate: today,
        endDate: today
      });
      return;
    }

    try {
      const fromDate = new Date(fromParam);
      const toDate = new Date(toParam);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new Error("Invalid date in URL parameters");
      }

      setDateRange({ from: fromDate, to: toDate });
      
      if (dateFilterParam) {
        setDateFilterType(dateFilterParam);
      }

      fetchBillsData({
        startDate: fromDate,
        endDate: toDate
      });
    } catch (err) {
      const today = new Date();
      const todayFormatted = format(today, "yyyy-MM-dd");
      
      setSearchParams(prev => {
        prev.set("from", todayFormatted);
        prev.set("to", todayFormatted);
        prev.set("dateFilter", "today");
        return prev;
      });

      setDateRange({ from: today, to: today });
      setDateFilterType("today");
      
      fetchBillsData({
        startDate: today,
        endDate: today
      });

      toast({
        title: "Invalid date parameters",
        description: "Reset to today's date",
        variant: "destructive",
      });
    }
  }, []);

  const handleDateSelect = useCallback((range) => {
    if (range?.from && range?.to) {
      try {
        const fromDate = new Date(range.from);
        const toDate = new Date(range.to);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
          throw new Error("Invalid date selection");
        }

        const newFromDate = format(fromDate, "yyyy-MM-dd");
        const newToDate = format(toDate, "yyyy-MM-dd");
        
        setDateRange({ from: fromDate, to: toDate });
        setDateFilterType("custom");
        
        setSearchParams(prev => {
          prev.set("from", newFromDate);
          prev.set("to", newToDate);
          prev.set("dateFilter", "custom");
          return prev;
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Invalid date selection",
          variant: "destructive",
        });
      }
    }
  }, [setSearchParams, toast]);

  const handleDateFilterChange = useCallback((value) => {
    setDateFilterType(value);

    if (value === "custom") {
      return;
    }

    let newRange = { from: new Date(), to: new Date() };

    try {
      switch (value) {
        case "today":
          newRange = { from: new Date(), to: new Date() };
          break;
        case "yesterday": {
          const yesterday = subDays(new Date(), 1);
          newRange = { from: yesterday, to: yesterday };
          break;
        }
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

      const newFromDate = format(newRange.from, "yyyy-MM-dd");
      const newToDate = format(newRange.to, "yyyy-MM-dd");
      
      setDateRange(newRange);

      setSearchParams(prev => {
        prev.set("from", newFromDate);
        prev.set("to", newToDate);
        prev.set("dateFilter", value);
        return prev;
      });

      fetchBillsData({
        startDate: newRange.from,
        endDate: newRange.to,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Error setting date range",
        variant: "destructive",
      });
    }
  }, [fetchBillsData, setSearchParams]);

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  // Filter bills based on sale type
  const filteredBills = useMemo(() => {
    if (!bills) return [];
    if (saleTypeFilter === "all") return bills;
    return bills.filter((bill) =>
      saleTypeFilter === "sales"
        ? bill.saleType !== "return"
        : bill.saleType === "return"
    );
  }, [bills, saleTypeFilter]);

  const handleSaleTypeFilterChange = (value) => {
    setSaleTypeFilter(value);
  };

  // Calculate summary
  const summary = useMemo(() => {
    return (filteredBills || []).reduce(
      (acc, bill) => {
        if (!bill) return acc;
        acc.count++;
        acc.salesAmount += bill.billSummary?.grandTotal || 0;
        acc.amountPaid += bill.amountPaid || 0;
        return acc;
      },
      { count: 0, salesAmount: 0, amountPaid: 0 }
    );
  }, [filteredBills]);

  return (
    <div className="relative p-4 space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-9 w-[120px] border-0 bg-transparent hover:bg-slate-100 focus:ring-0 focus:ring-offset-0 justify-start px-3"
                  >
                    {searchType === "invoice" ? "Invoice No" : "Customer"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[120px]">
                  <DropdownMenuItem onSelect={() => setSearchType("invoice")}>
                    Invoice No
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setSearchType("customer")}>
                    Customer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex-1 relative flex items-center">
              <div className="absolute left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                className="w-full h-9 pl-10 pr-10 border-0 focus-visible:ring-0 placeholder:text-slate-400"
                placeholder={`Search by ${
                  searchType === "invoice" ? "invoice number" : "customer name"
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
                      fetchBillsData({
                        startDate: dateRange.from,
                        endDate: dateRange.to,
                      });
                    }}
                  >
                    <X className="h-4 w-4 text-blue-500" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[150px]">
              <Calendar className="mr-2 h-4 w-4" />
              {dateFilterType === "today"
                ? "Today"
                : dateFilterType === "yesterday"
                ? "Yesterday"
                : dateFilterType === "thisWeek"
                ? "This Week"
                : dateFilterType === "thisMonth"
                ? "This Month"
                : "Custom"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => handleDateFilterChange("today")}>
              Today
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => handleDateFilterChange("yesterday")}
            >
              Yesterday
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => handleDateFilterChange("thisWeek")}
            >
              This Week
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => handleDateFilterChange("thisMonth")}
            >
              This Month
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleDateFilterChange("custom")}>
              Custom
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {dateFilterType === "custom" && (
          <div className="relative w-[300px]">
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onSelect={handleDateSelect}
              onSearch={() => {
                fetchBillsData({
                  startDate: dateRange.from,
                  endDate: dateRange.to,
                });
              }}
              onCancel={() => {
                setDateRange({ from: new Date(), to: new Date() });
                setDateFilterType("today");
                setSearchParams((prev) => {
                  prev.delete("from");
                  prev.delete("to");
                  prev.delete("dateFilter");
                  prev.delete("filter");
                  return prev;
                });
              }}
              className="border border-slate-200 rounded-md hover:border-slate-300 transition-colors"
            />
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[120px]">
              <Filter className="mr-2 h-4 w-4" />
              {saleTypeFilter === "all"
                ? "All"
                : saleTypeFilter === "sales"
                ? "Sales"
                : "Returns"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={() => handleSaleTypeFilterChange("all")}
            >
              All
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => handleSaleTypeFilterChange("sales")}
            >
              Sales
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => handleSaleTypeFilterChange("returns")}
            >
              Returns
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/sales/create-sell-invoice`)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Sales Invoice
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileInput className="mr-2 h-4 w-4" />
                Import
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative overflow-x-auto border-t">
        {filteredBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 mb-4 text-gray-400" />
                <p className="text-lg">
                  No sales bills found for "{searchQuery}"
                </p>
                <p className="text-sm">
                  Try searching with a different invoice number or customer name
                </p>
              </>
            ) : (
              <>
                <Users className="h-12 w-12 mb-4 text-gray-400" />
                <p className="text-lg">No sales bills found</p>
                <p className="text-sm">
                  Create a new sales invoice to get started
                </p>
              </>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">S.NO</TableHead>
                <TableHead>INVOICE NO</TableHead>
                <TableHead>CUSTOMER Name</TableHead>
                <TableHead>INVOICE DATE</TableHead>
                {/* <TableHead>GST</TableHead> */}
                <TableHead>BILLED ON</TableHead>
                <TableHead>BILL TOTAL</TableHead>
                <TableHead>Due Amt</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="border">
              {filteredBills.map((bill, index) => (
                <TableRow
                  key={bill?._id}
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
                    {bill?.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium capitalize">{bill?.customerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {bill?.mob}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <p>
                      {new Date(bill?.invoiceDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      By : {bill?.createdByName}
                    </p>
                  </TableCell>
                  {/* <TableCell>
                    {bill.withGst ? "With GST" : "Without GST"}
                  </TableCell> */}
                  <TableCell>
                    <div className="font-medium">
                    <p>
                      {new Date(bill?.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                      })}
                    </p>
                      <span className="text-xs text-gray-500">
                        {format(new Date(bill?.createdAt), "hh:mm a")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(bill?.billSummary?.grandTotal || 0)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(
                        (bill?.billSummary?.grandTotal || 0) -
                          (bill?.amountPaid || 0)
                      )}
                    </div>
                    {bill?.paymentDueDate && (
                      <div className="text-sm text-muted-foreground">
                        {new Date(bill?.paymentDueDate).toLocaleDateString(
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
                      <Badge
                        variant={
                          bill?.paymentStatus === "paid"
                            ? "success"
                            : "destructive"
                        }
                      >
                        {bill?.paymentStatus === "paid" ? "Paid" : "Due"}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ExportDataDlg
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        data={filteredBills}
        columns={[
          { header: "Invoice No", field: "invoiceNumber", width: 15 },
          { header: "Customer Name", field: "customerName", width: 25 },
          { header: "Mobile", field: "mob", width: 15 },
          { header: "Invoice Date", field: "invoiceDate", width: 15 },
          { header: "Created By", field: "createdByName", width: 20 },
          { header: "Bill Total", field: "billSummary.grandTotal", width: 15, format: "currency", addTotal: true },
          { header: "Amount Paid", field: "amountPaid", width: 15, format: "currency", addTotal: true },
          { header: "Due Amount", field: "dueAmount", width: 15, format: "currency", addTotal: true },
          { header: "Payment Status", field: "paymentStatus", width: 15 }
        ]}
        formatters={{
          "Invoice Date": (value) => new Date(value).toLocaleDateString("en-IN"),
          "Due Amount": (value, row) => (row.billSummary?.grandTotal || 0) - (row.amountPaid || 0),
          "Payment Status": (value) => value?.charAt(0).toUpperCase() + value?.slice(1) || "-"
        }}
        fileName="sales_transactions"
        title="Export Sales Transactions"
      />
    </div>
  );
}
