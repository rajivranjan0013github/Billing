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
import { MessageSquare, Search, Settings, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchPayments,
  setDateRange,
  setSelectedPreset,
} from "../redux/slices/paymentSlice";
import { useEffect } from "react";
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

export default function PaymentOut() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { payments, paymentsStatus, dateRange, selectedPreset } = useSelector(
    (state) => state.payment
  );
  const dispatch = useDispatch();

  const paymentOut =
    payments?.filter((payment) => payment.paymentType === "Payment Out") || [];

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

  useEffect(() => {
    if (paymentsStatus === "idle") {
      handleDateSearch();
    }
  }, [dispatch, paymentsStatus]);

  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Payment Out</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="font-semibold">{paymentOut.length}</span>
            <span className="text-sm text-muted-foreground">
              Total Payments
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-semibold">
              ₹{" "}
              {paymentOut
                .reduce((sum, payment) => sum + (payment.amount || 0), 0)
                .toLocaleString("en-IN")}
            </span>
            <span className="text-sm text-muted-foreground">Total Amount</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search payments..." />
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
        <Button onClick={() => navigate("/purchase/create-payment-out")}>
          Create Payment Out
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Date</TableHead>
              <TableHead>Payment Number</TableHead>
              <TableHead>Distributor Name</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentOut.map((payment) => (
              <TableRow
                key={payment._id}
                className="cursor-pointer hover:bg-muted/50 h-12"
                onClick={() => navigate(`/purchase/payment-out/${payment._id}`)}
              >
                <TableCell>
                  {new Date(payment.paymentDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>{payment?.paymentNumber}</TableCell>
                <TableCell>{payment?.distributorName}</TableCell>
                <TableCell>{payment?.paymentMethod}</TableCell>
                <TableCell>{payment?.remarks || "-"}</TableCell>
                <TableCell className="text-right">
                  ₹ {payment?.amount?.toLocaleString("en-IN")}
                </TableCell>
              </TableRow>
            ))}
            {paymentOut.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
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
}
