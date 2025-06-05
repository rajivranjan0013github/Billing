import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import {
  Search,
  ArrowLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  X,
  FileInput,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchPayments, searchPayments } from "../redux/slices/paymentSlice";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { DateRangePicker } from "../components/ui/date-range-picker";
import { useToast } from "../hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Card, CardContent } from "../components/ui/card";
import ExportDataDlg from "../components/custom/mirgration/ExportDataDlg";

const Payments = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const dispatch = useDispatch();
  const isInitialDebounceEffectRun = useRef(true);

  // Get Redux state
  const { payments } = useSelector((state) => state.payment);

  // Get params from URL or use defaults
  const urlDateFilter = searchParams.get("dateFilter") || "today";
  const urlFromDate = searchParams.get("from");
  const urlToDate = searchParams.get("to");

  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [dateFilterType, setDateFilterType] = useState(urlDateFilter);
  const [dateRange, setDateRange] = useState({
    from: urlFromDate ? new Date(urlFromDate) : new Date(),
    to: urlToDate ? new Date(urlToDate) : new Date(),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("invoice");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPaymentsData = useCallback(async (params) => {
    try {
      await dispatch(fetchPayments({
        startDate: format(params.startDate, 'yyyy-MM-dd'),
        endDate: format(params.endDate, 'yyyy-MM-dd'),
        filter: paymentTypeFilter !== "all" ? paymentTypeFilter : undefined
      })).unwrap();
    } catch (err) {
      toast({
        title: "Error fetching payments",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [dispatch, paymentTypeFilter, toast]);

  // Handle debounced search
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      if (!isInitialDebounceEffectRun.current) {
        fetchPaymentsData({
          startDate: dateRange.from,
          endDate: dateRange.to,
        });
      }
      return;
    }

    const handleSearch = async () => {
      try {
        await dispatch(searchPayments({
          query: debouncedSearchQuery,
          searchType
        })).unwrap();
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to search payments",
          variant: "destructive",
        });
      }
    };

    handleSearch();
    isInitialDebounceEffectRun.current = false;
  }, [debouncedSearchQuery, searchType, dispatch]);

  // Initialize with URL parameters or defaults
  useEffect(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const dateFilterParam = searchParams.get('dateFilter');

    // If no params, set to today's date
    if (!fromParam || !toParam) {
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
      
      fetchPaymentsData({
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

      fetchPaymentsData({
        startDate: fromDate,
        endDate: toDate
      });
    } catch (err) {
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
      
      fetchPaymentsData({
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

        const newFromDate = format(fromDate, 'yyyy-MM-dd');
        const newToDate = format(toDate, 'yyyy-MM-dd');
        
        setDateRange({ from: fromDate, to: toDate });
        setDateFilterType("custom");
        
        setSearchParams(prev => {
          prev.set('from', newFromDate);
          prev.set('to', newToDate);
          prev.set('dateFilter', 'custom');
          return prev;
        });

        fetchPaymentsData({
          startDate: fromDate,
          endDate: toDate,
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Invalid date selection",
          variant: "destructive",
        });
      }
    }
  }, [fetchPaymentsData, setSearchParams]);

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

      const newFromDate = format(newRange.from, 'yyyy-MM-dd');
      const newToDate = format(newRange.to, 'yyyy-MM-dd');
      
      setDateRange(newRange);

      setSearchParams(prev => {
        prev.set('from', newFromDate);
        prev.set('to', newToDate);
        prev.set('dateFilter', value);
        return prev;
      });

      fetchPaymentsData({
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
  }, [fetchPaymentsData, setSearchParams]);

  const handleFilterChange = useCallback((value) => {
    setPaymentTypeFilter(value);
    fetchPaymentsData({
      startDate: dateRange.from,
      endDate: dateRange.to,
    });
  }, [fetchPaymentsData, dateRange]);

  // Filter payments based on payment type
  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    if (paymentTypeFilter === "all") return payments;
    return payments.filter(
      (payment) => payment.paymentType === paymentTypeFilter
    );
  }, [payments, paymentTypeFilter]);

  // Calculate totals based on filtered payments
  const totalPaymentIn = useMemo(() => {
    return filteredPayments
      .filter((payment) => payment.paymentType === "Payment In")
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
  }, [filteredPayments]);

  const totalPaymentOut = useMemo(() => {
    return filteredPayments
      .filter((payment) => payment.paymentType === "Payment Out")
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
  }, [filteredPayments]);

  const netTotal = useMemo(
    () => totalPaymentIn - totalPaymentOut,
    [totalPaymentIn, totalPaymentOut]
  );

  // Calculate payment method breakdowns with memoization
  const calculatePaymentMethodTotals = useCallback((payments) => {
    return payments.reduce((acc, payment) => {
      const method = payment.paymentMethod || "Other";
      acc[method] = (acc[method] || 0) + (payment.amount || 0);
      return acc;
    }, {});
  }, []);

  const paymentInMethodTotals = useMemo(() => {
    return calculatePaymentMethodTotals(
      filteredPayments.filter((payment) => payment.paymentType === "Payment In")
    );
  }, [filteredPayments, calculatePaymentMethodTotals]);

  const paymentOutMethodTotals = useMemo(() => {
    return calculatePaymentMethodTotals(
      filteredPayments.filter(
        (payment) => payment.paymentType === "Payment Out"
      )
    );
  }, [filteredPayments, calculatePaymentMethodTotals]);

  const netMethodTotals = useMemo(() => {
    return Object.keys({
      ...paymentInMethodTotals,
      ...paymentOutMethodTotals,
    }).reduce((acc, method) => {
      acc[method] =
        (paymentInMethodTotals[method] || 0) -
        (paymentOutMethodTotals[method] || 0);
      return acc;
    }, {});
  }, [paymentInMethodTotals, paymentOutMethodTotals]);

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  return (
    <div className="w-full p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">All Payments</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MessageSquare className="h-5 w-5" />
          </Button> */}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex items-center bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden">
            <div className="relative flex items-center border-r border-slate-200">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-9 w-[120px] border-0 bg-transparent hover:bg-slate-100 focus:ring-0 focus:ring-offset-0 justify-start px-3"
                  >
                    {searchType === "invoice" ? "Payment No" : "Name"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[120px]">
                  <DropdownMenuItem onSelect={() => setSearchType("invoice")}>
                    Payment No
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setSearchType("name")}>
                    Name
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
                  searchType === "invoice" ? "payment number" : "name"
                }...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <div className="absolute right-3 flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-slate-100 rounded-full"
                    onClick={() => {
                      setSearchQuery("");
                      fetchPaymentsData({
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
          <Select value={paymentTypeFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="Payment In">Payment In</SelectItem>
              <SelectItem value="Payment Out">Payment Out</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilterType} onValueChange={handleDateFilterChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select date filter" />
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
                onSearch={handleDateSelect}
                onCancel={() => {
                  setDateRange({ from: new Date(), to: new Date() });
                  setDateFilterType("today");
                }}
                className="border border-slate-200 rounded-md hover:border-slate-300 transition-colors"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsExportDialogOpen(true)}
            disabled={filteredPayments.length === 0}
          >
            <FileInput className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/payment/create-payment")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Payment
          </Button>
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Total Payment In</span>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {
                      filteredPayments.filter(
                        (p) => p.paymentType === "Payment In"
                      ).length
                    }{" "}
                    payments
                  </span>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-600">
                +₹ {totalPaymentIn.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3 overflow-x-auto font-semibold">
              {Object.entries(paymentInMethodTotals).map(([method, amount]) => (
                <div
                  key={method}
                  className="flex items-center gap-2 text-sm whitespace-nowrap"
                >
                  <span className="text-muted-foreground">{method}:</span>
                  <span className="font-medium text-green-600">
                    +₹ {amount.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Total Payment Out</span>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {
                      filteredPayments.filter(
                        (p) => p.paymentType === "Payment Out"
                      ).length
                    }{" "}
                    payments
                  </span>
                </div>
              </div>
              <span className="text-2xl font-bold text-red-600">
                -₹ {totalPaymentOut.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3 overflow-x-auto font-semibold">
              {Object.entries(paymentOutMethodTotals).map(
                ([method, amount]) => (
                  <div
                    key={method}
                    className="flex items-center gap-2 text-sm whitespace-nowrap"
                  >
                    <span className="text-muted-foreground">{method}:</span>
                    <span className="font-medium text-red-600">
                      -₹ {amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Net Total</span>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {filteredPayments.length} total payments
                  </span>
                </div>
              </div>
              <span
                className={`text-2xl font-bold ${
                  netTotal >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {netTotal >= 0 ? "+" : "-"}₹{" "}
                {Math.abs(netTotal).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3 overflow-x-auto font-semibold">
              {Object.entries(netMethodTotals).map(([method, amount]) => (
                <div
                  key={method}
                  className="flex items-center gap-2 text-sm whitespace-nowrap"
                >
                  <span className="text-muted-foreground">{method}:</span>
                  <span
                    className={`font-medium ${
                      amount >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {amount >= 0 ? "+" : "-"}₹{" "}
                    {Math.abs(amount).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-3">S.NO</TableHead>
              <TableHead className="w-[150px]">Date & Time</TableHead>
              <TableHead>Payment Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Payment Type</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment, index) => (
              <TableRow
                key={payment._id}
                className="cursor-pointer hover:bg-muted/50 px-10 h-12"
                onClick={() => navigate(`/payment/${payment._id}`)}
              >
                <TableCell className="pl-5">{index + 1}</TableCell>
                <TableCell className='uppercase'>
                  {format(new Date(payment.paymentDate), "MM MMM")} {format(new Date(payment.paymentDate), "hh:mm a")}
                </TableCell>
                <TableCell>{payment?.paymentNumber}</TableCell>
                <TableCell className="font-semibold">
                  {payment?.distributorName || payment?.customerName || "--"}
                </TableCell>
                <TableCell>
                  <Badge variant={payment?.paymentType === "Payment In" ? "success" : "destructive"}>
                    {payment?.paymentType}
                  </Badge>
                </TableCell>
                <TableCell>{payment?.paymentMethod}</TableCell>
                <TableCell>{payment?.remarks || "-"}</TableCell>
                <TableCell
                  className={`text-right font-bold ${
                    payment?.paymentType === "Payment In"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {payment?.paymentType === "Payment In" ? "+" : "-"}₹{" "}
                  {payment?.amount?.toLocaleString("en-IN")}
                </TableCell>
              </TableRow>
            ))}
            {filteredPayments.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No payments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ExportDataDlg
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        data={filteredPayments}
        columns={[
          { header: "Date", field: "paymentDate", width: 15 },
          { header: "Payment Number", field: "paymentNumber", width: 20 },
          { header: "Name", field: "distributorName", width: 25 },
          { header: "Payment Type", field: "paymentType", width: 15 },
          { header: "Payment Method", field: "paymentMethod", width: 15 },
          { header: "Remarks", field: "remarks", width: 30 },
          { header: "Amount", field: "amount", width: 15, format: "currency", addTotal: true }
        ]}
        formatters={{
          "Date": (value) => new Date(value).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          "Name": (value) => value || "-",
          "Remarks": (value) => value || "-",
          "Amount": (value) => value || 0
        }}
        fileName="payments"
        title="Export Payments Data"
      />
    </div>
  );
};

export default Payments;
