import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import {
  MessageSquare,
  Search,
  Settings,
  ArrowLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchPayments,
  setDateRange,
  setSelectedPreset,
} from "../redux/slices/paymentSlice";
import { useEffect, useState } from "react";
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

const Payments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { payments, paymentsStatus, dateRange, selectedPreset } = useSelector(
    (state) => state.payment
  );
  const dispatch = useDispatch();
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");

  // Convert ISO strings to Date objects for the component
  const displayDateRange = {
    from: dateRange.from ? new Date(dateRange.from) : null,
    to: dateRange.to ? new Date(dateRange.to) : null,
  };

  const handleDateSelect = (range) => {
    if (range?.from && range?.to) {
      dispatch(setDateRange(range));
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

    dispatch(setDateRange(newRange));
    dispatch(
      fetchPayments({
        startDate: newRange.from
          .toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .split("/")
          .reverse()
          .join("-"),
        endDate: newRange.to
          .toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .split("/")
          .reverse()
          .join("-"),
      })
    );
  };

  const handleDateSearch = () => {
    if (!displayDateRange.to) {
      const updatedRange = { ...displayDateRange, to: displayDateRange.from };
      dispatch(setDateRange(updatedRange));
    }
    dispatch(
      fetchPayments({
        startDate: displayDateRange.from
          .toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .split("/")
          .reverse()
          .join("-"),
        endDate: displayDateRange.to
          .toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .split("/")
          .reverse()
          .join("-"),
      })
    );
  };

  const handleDateCancel = () => {
    const newRange = {
      from: subDays(new Date(), 7),
      to: new Date(),
    };
    dispatch(setDateRange(newRange));
    dispatch(setSelectedPreset("thisWeek"));
  };

  const filteredPayments = payments.filter((payment) => {
    if (paymentTypeFilter === "all") return true;
    return payment.paymentType === paymentTypeFilter;
  });

  useEffect(() => {
    if (paymentsStatus === "idle") {
      handleDateSearch();
    }
  }, [dispatch, paymentsStatus]);

  // Calculate totals
  const totalPaymentIn = filteredPayments
    .filter((payment) => payment.paymentType === "Payment In")
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

  const totalPaymentOut = filteredPayments
    .filter((payment) => payment.paymentType === "Payment Out")
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

  const netTotal = totalPaymentIn - totalPaymentOut;

  // Calculate payment method breakdowns
  const calculatePaymentMethodTotals = (payments) => {
    return payments.reduce((acc, payment) => {
      const method = payment.paymentMethod || "Other";
      acc[method] = (acc[method] || 0) + (payment.amount || 0);
      return acc;
    }, {});
  };

  const paymentInMethodTotals = calculatePaymentMethodTotals(
    filteredPayments.filter((payment) => payment.paymentType === "Payment In")
  );

  const paymentOutMethodTotals = calculatePaymentMethodTotals(
    filteredPayments.filter((payment) => payment.paymentType === "Payment Out")
  );

  const netMethodTotals = Object.keys({
    ...paymentInMethodTotals,
    ...paymentOutMethodTotals,
  }).reduce((acc, method) => {
    acc[method] =
      (paymentInMethodTotals[method] || 0) -
      (paymentOutMethodTotals[method] || 0);
    return acc;
  }, {});

  return (
    <div className="w-full p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">All Payments</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search payments..." />
          </div>
          <Select
            value={paymentTypeFilter}
            onValueChange={setPaymentTypeFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="Payment In">Payment In</SelectItem>
              <SelectItem value="Payment Out">Payment Out</SelectItem>
            </SelectContent>
          </Select>
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
                from={displayDateRange.from}
                to={displayDateRange.to}
                onSelect={handleDateSelect}
                onSearch={handleDateSearch}
                onCancel={handleDateCancel}
                className="border border-slate-200 rounded-md hover:border-slate-300 transition-colors"
              />
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create Payment
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigate("/sales/create-payment-in")}
            >
              Payment In
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/purchase/create-payment-out")}
            >
              Payment Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                  <span className="text-xs text-muted-foreground">
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
            <div className="mt-2 flex items-center gap-3 overflow-x-auto">
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
                  <span className="text-xs text-muted-foreground">
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
            <div className="mt-2 flex items-center gap-3 overflow-x-auto">
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
                  <span className="text-xs text-muted-foreground">
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
            <div className="mt-2 flex items-center gap-3 overflow-x-auto">
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
              <TableHead className="w-[150px]">Date</TableHead>
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
                onClick={() =>
                  navigate(
                    `/${
                      payment.paymentType === "Payment In"
                        ? "sales"
                        : "purchase"
                    }/payment-${
                      payment.paymentType === "Payment In" ? "in" : "out"
                    }/${payment._id}`
                  )
                }
              >
                <TableCell className="pl-5">{index + 1}</TableCell>
                <TableCell>
                  {new Date(payment.paymentDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>{payment?.paymentNumber}</TableCell>
                <TableCell className="font-semibold">
                  {payment?.distributorName || payment?.customerName || "--"}
                </TableCell>
                <TableCell>{payment?.paymentType}</TableCell>
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
    </div>
  );
};

export default Payments;
