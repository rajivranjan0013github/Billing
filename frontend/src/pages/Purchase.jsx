import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Search, Users, X, ArrowLeft, Plus, EllipsisVertical, Download } from "lucide-react";
import { Badge } from "../components/ui/badge";
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
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPurchaseBills,
  searchPurchaseBills,
} from "../redux/slices/PurchaseBillSlice";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import ExportDataDlg from "../components/custom/mirgration/ExportDataDlg";

export default function PurchasesTransactions() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const isInitialDebounceEffectRun = useRef(true);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Get data from Redux
  const { purchaseBills: initialPurchaseBills, fetchStatus, searchStatus, error } = useSelector((state) => state.purchaseBill);

  // Local state for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("invoice");
  const [purchaseBills, setPurchaseBills] = useState(initialPurchaseBills);

  // Get params from URL or use defaults
  const urlDateFilter = searchParams.get('dateFilter') || 'today';
  const urlFromDate = searchParams.get('from');
  const urlToDate = searchParams.get('to');

  const [dateFilterType, setDateFilterType] = useState(urlDateFilter);
  const [dateRange, setDateRange] = useState({
    from: urlFromDate ? new Date(urlFromDate) : new Date(),
    to: urlToDate ? new Date(urlToDate) : new Date()
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
    const handleDebouncedSearch = async () => {
      if (isInitialDebounceEffectRun.current) {
        isInitialDebounceEffectRun.current = false;
        if (!debouncedSearchQuery.trim()) {
          return;
        }
      }

      if (!debouncedSearchQuery.trim()) {
        await fetchPurchaseBillsData({
          startDate: dateRange.from,
          endDate: dateRange.to,
        });
        return;
      }

      try {
        await dispatch(searchPurchaseBills({
          query: debouncedSearchQuery,
          searchType: searchType
        })).unwrap();
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to search purchase bills",
          variant: "destructive",
        });
      }
    };

    handleDebouncedSearch();
  }, [debouncedSearchQuery, searchType]);

  const fetchPurchaseBillsData = async (params) => {
    try {
      await dispatch(fetchPurchaseBills({
        startDate: format(params.startDate, 'yyyy-MM-dd'),
        endDate: format(params.endDate, 'yyyy-MM-dd')
      })).unwrap();
    } catch (err) {
      toast({
        title: "Error fetching purchase bills",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Update purchaseBills when Redux state changes
  useEffect(() => {
    setPurchaseBills(initialPurchaseBills);
  }, [initialPurchaseBills]);

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  const handleDateSelect = (range) => {
    if (range?.from && range?.to) {
      try {
        const fromDate = new Date(range.from);
        const toDate = new Date(range.to);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
          throw new Error("Invalid date selection");
        }

        const newFromDate = format(fromDate, 'yyyy-MM-dd');
        const newToDate = format(toDate, 'yyyy-MM-dd');
        
        setDateRange({ from: fromDate, to: toDate });
        setDateFilterType("custom");
        
        // Update URL with date range and filter
        setSearchParams(prev => {
          prev.set('from', newFromDate);
          prev.set('to', newToDate);
          prev.set('dateFilter', 'custom');
          return prev;
        });

        dispatch(fetchPurchaseBills({
          startDate: fromDate,
          endDate: toDate,
        })).unwrap()
        .catch(err => {
          toast({
            title: "Error fetching purchase bills",
            description: err.message,
            variant: "destructive",
          });
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Invalid date selection",
          variant: "destructive",
        });
      }
    }
  };

  const handleDateFilterChange = (value) => {
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

      const newFromDate = format(newRange.from, 'yyyy-MM-dd');
      const newToDate = format(newRange.to, 'yyyy-MM-dd');
      
      setDateRange(newRange);

      // Update URL with date range and filter
      setSearchParams(prev => {
        prev.set('from', newFromDate);
        prev.set('to', newToDate);
        prev.set('dateFilter', value);
        return prev;
      });

      dispatch(fetchPurchaseBills({
        startDate: newRange.from,
        endDate: newRange.to,
      })).unwrap()
      .catch(err => {
        toast({
          title: "Error fetching purchase bills",
          description: err.message,
          variant: "destructive",
        });
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Error setting date range",
        variant: "destructive",
      });
    }
  };

  // Initialize with URL parameters or defaults
  useEffect(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const dateFilterParam = searchParams.get('dateFilter');

    // If no params, set to today's date
    if (!fromParam || !toParam) {
      const today = new Date();
      const todayFormatted = format(today, 'yyyy-MM-dd');
      
      // Update URL with today's date
      setSearchParams(prev => {
        prev.set('from', todayFormatted);
        prev.set('to', todayFormatted);
        prev.set('dateFilter', 'today');
        return prev;
      });

      setDateRange({ from: today, to: today });
      setDateFilterType('today');
      
      dispatch(fetchPurchaseBills({
        startDate: today,
        endDate: today
      })).unwrap()
      .catch(err => {
        toast({
          title: "Error fetching purchase bills",
          description: err.message,
          variant: "destructive",
        });
      });
      return;
    }

    try {
      // Parse dates and validate them
      const fromDate = new Date(fromParam);
      const toDate = new Date(toParam);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new Error("Invalid date in URL parameters");
      }

      const paramRange = {
        from: fromDate,
        to: toDate
      };

      setDateRange(paramRange);
      
      if (dateFilterParam) {
        setDateFilterType(dateFilterParam);
      }

      dispatch(fetchPurchaseBills({
        startDate: fromDate,
        endDate: toDate
      })).unwrap()
      .catch(err => {
        toast({
          title: "Error fetching purchase bills",
          description: err.message,
          variant: "destructive",
        });
      });
    } catch (err) {
      // If dates are invalid, reset to today
      const today = new Date();
      const todayFormatted = format(today, 'yyyy-MM-dd');
      
      setSearchParams(prev => {
        prev.set('from', todayFormatted);
        prev.set('to', todayFormatted);
        prev.set('dateFilter', 'today');
        return prev;
      });

      setDateRange({ from: today, to: today });
      setDateFilterType('today');
      
      dispatch(fetchPurchaseBills({
        startDate: today,
        endDate: today
      })).unwrap()
      .catch(err => {
        toast({
          title: "Error fetching purchase bills",
          description: err.message,
          variant: "destructive",
        });
      });

      toast({
        title: "Invalid date parameters",
        description: "Reset to today's date",
        variant: "destructive",
      });
    }
  }, []);

  const handleDateSearch = () => {
    if (!dateRange.to) {
      // If 'to' date is missing, we only update the Redux state.
      // The useEffect will handle fetching if needed based on the updated state.
      const updatedRange = {
        from: dateRange.from.toISOString(),
        to: dateRange.from.toISOString(), // Set 'to' date same as 'from'
      };
      dispatch(setDateRange(updatedRange));
    } else {
      // If both dates exist, we also just update the Redux state.
      // The useEffect will handle fetching.
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
  };

  // Wrap fetchBills in useCallback to stabilize its reference for useEffect dependency array
  const fetchBills = useCallback(
    (rangeToFetch) => {
      if (!rangeToFetch?.from || !rangeToFetch?.to) {
        console.error("fetchBills called with invalid range:", rangeToFetch);
        return; // Don't fetch if range is invalid
      }

      const fromDate = rangeToFetch.from;
      const toDate = rangeToFetch.to;

      dispatch(
        fetchPurchaseBills({
          startDate: format(fromDate, "yyyy-MM-dd"), // Use date-fns format
          endDate: format(toDate, "yyyy-MM-dd"), // Use date-fns format
        })
      )
        .unwrap() // Use unwrap to handle promise resolution/rejection more easily
        .then((payload) => {
          setPurchaseBills(payload);
          // IMPORTANT: Set lastFetchedRange with the exact range object used for this fetch
          setDateRange(rangeToFetch);
        })
        .catch((error) => {
          console.error("Failed to fetch purchase bills:", error);
          // Optionally: Display an error message to the user
        });
    },
    [dispatch]
  ); // Depend on dispatch

  useEffect(() => {
    // Ensure we have valid, stable date objects from useMemo
    if (!dateRange.from || !dateRange.to) {
      return; // Don't proceed if dates are not valid
    }

    // Compare based on time. Use optional chaining for safety.
    const rangeChanged =
      !dateRange ||
      dateRange.from?.getTime() !== dateRange.from.getTime() ||
      dateRange.to?.getTime() !== dateRange.to.getTime();

    if (rangeChanged) {
      fetchBills(dateRange); // Pass the stable dateRange object
    }
    // Depend on the stable dateRange object and lastFetchedRange
  }, [dateRange, fetchBills]); // Add fetchBills to dependency array

  const summary = (purchaseBills || []).reduce(
    (acc, bill) => {
      if (!bill) return acc; // Skip null/undefined bills

      acc.count++;
      acc.purchaseAmount += bill.billSummary?.grandTotal || 0;
      acc.amountPaid += bill.amountPaid || 0;
      return acc;
    },
    { count: 0, purchaseAmount: 0, amountPaid: 0 }
  );

  const getFilteredBills = () => {
    if (!searchQuery.trim()) {
      return purchaseBills || []; // Return empty array if purchaseBills is null/undefined
    }

    const query = searchQuery.toLowerCase();

    return (purchaseBills || []).filter((bill) => {
      if (!bill) return false; // Skip null/undefined bills

      switch (searchType) {
        case "invoice":
          return bill.invoiceNumber?.toLowerCase().includes(query);
        case "distributor":
          // Assuming distributor name is in bill.distributorName
          return bill.distributorName?.toLowerCase().includes(query);
        default:
          return false;
      }
    });
  };

  return (
    <div className="relative p-4 space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Purchases Transactions</h1>
        </div>
        <div className="grid grid-cols-4 gap-4 text-right">
          <div>
            <div className="font-semibold">{summary.count}</div>
            <div className="text-sm text-muted-foreground">Purc Count</div>
          </div>
          <div>
            <div className="font-semibold">
              {formatCurrency(summary.purchaseAmount)}
            </div>
            <div className="text-sm text-muted-foreground">Purc Amount</div>
          </div>
          <div>
            <div className="font-semibold">
              {formatCurrency(summary.amountPaid)}
            </div>
            <div className="text-sm text-muted-foreground">Amount Paid</div>
          </div>
          <div>
            <div className="font-semibold text-pink-500">
              {formatCurrency(summary.purchaseAmount - summary.amountPaid)}
            </div>
            <div className="text-sm text-muted-foreground">To Pay</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <div className="relative">
          <div className="relative flex items-center bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden">
            <div className="relative flex items-center border-r border-slate-200">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-9 w-[120px] border-0 bg-transparent hover:bg-slate-100 focus:ring-0 focus:ring-offset-0 justify-start px-3"
                  >
                    {searchType === "invoice"
                      ? "Invoice No"
                      : "Distributor"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[120px]">
                  <DropdownMenuItem onSelect={() => setSearchType("invoice")}>
                    Invoice No
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setSearchType("distributor")}>
                    Distributor
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
                  searchType === "invoice"
                    ? "invoice number"
                    : "distributor name"
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
                      fetchPurchaseBillsData({
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

        <Select value={dateFilterType} onValueChange={handleDateFilterChange}>
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

        {dateFilterType === "custom" && (
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

        <div className="flex-1 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/purchase/create-purchase-invoice`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Purchase Invoice
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        {purchaseBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 mb-4 text-gray-400" />
                <p className="text-lg">No purchase bills found for "{searchQuery}"</p>
                <p className="text-sm">Try searching with a different invoice number or distributor name</p>
              </>
            ) : (
              <>
                <Users className="h-12 w-12 mb-4" />
                <p className="text-lg">No purchase bills found</p>
                <p className="text-sm">Create a new purchase invoice to get started</p>
              </>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">S.NO</TableHead>
                <TableHead>INVOICE NO</TableHead>
                <TableHead>DISTRIBUTOR / GSTIN</TableHead>
                <TableHead>INVOICE DATE</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>BILLED ON</TableHead>
                <TableHead>BILL TOTAL</TableHead>
                <TableHead>Due Amt</TableHead>
                <TableHead>STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="border">
              {getFilteredBills().map((bill, index) => (
                <TableRow
                  key={bill._id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/purchase/${bill._id}`)}
                >
                  <TableCell className="font-medium pl-5">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {bill.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{bill.distributorName}</div>
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
                     <p className="uppercase">{format(new Date(bill.createdAt), "dd-MM-yyyy")}</p> {format(new Date(bill.createdAt), "hh:mm a")}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(bill.billSummary?.grandTotal || 0)}
                  </TableCell>

                  {/* <TableCell className="font-medium">
                    {formatCurrency(bill.payableAmount || bill.grandTotal)}
                  </TableCell> */}
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
                      <Badge
                        variant={
                          bill.paymentStatus === "paid"
                            ? "success"
                            : "destructive"
                        }
                            
                      >
                        {bill.paymentStatus === "paid" ? "Paid" : "Due"}
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
        data={getFilteredBills()}
        columns={[
          { header: "Invoice No", field: "invoiceNumber", width: 15 },
          { header: "Distributor Name", field: "distributorName", width: 25 },
          { header: "Mobile", field: "mob", width: 15 },
          { header: "Invoice Date", field: "invoiceDate", width: 15 },
          { header: "Created By", field: "createdByName", width: 20 },
          { header: "GST Type", field: "withGst", width: 15 },
          { header: "Bill Total", field: "billSummary.grandTotal", width: 15, format: "currency", addTotal: true },
          { header: "Amount Paid", field: "amountPaid", width: 15, format: "currency", addTotal: true },
          { header: "Due Amount", field: "dueAmount", width: 15, format: "currency", addTotal: true },
          { header: "Payment Status", field: "paymentStatus", width: 15 }
        ]}
        formatters={{
          "Invoice Date": (value) => new Date(value).toLocaleDateString("en-IN"),
          "GST Type": (value) => value ? "With GST" : "Without GST",
          "Due Amount": (value, row) => (row.billSummary?.grandTotal || 0) - (row.amountPaid || 0),
          "Payment Status": (value) => value?.charAt(0).toUpperCase() + value?.slice(1) || "-"
        }}
        fileName="purchase_transactions"
        title="Export Purchase Transactions"
      />
    </div>
  );
}
