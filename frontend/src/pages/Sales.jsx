import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBills } from "../redux/slices/SellBillSlice";
import { Backend_URL } from "../assets/Data";
import { Calendar, ChevronDown, Filter, Search, X, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";
import { format, subDays } from "date-fns";
import { DateRangePicker } from "../components/ui/date-range-picker";

export default function Sales() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bills: initialBills } = useSelector((state) => state.bill);
  const [bills, setBills] = useState(initialBills);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const handleDateSelect = (range) => {
    setDateRange(range);
  };

  const handleDateSearch = () => {
    fetchBillsHere();
  };

  const fetchBillsHere = () => {
    dispatch(
      fetchBills({
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
  };

  const handleDateCancel = () => {
    setDateRange({
      from: subDays(new Date(), 7),
      to: new Date(),
    });
  };

  useEffect(() => {
    fetchBillsHere();
  }, []);

  useEffect(() => {
    setBills(initialBills);
  }, [initialBills]);

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
      try {
        const response = await fetch(
          `${Backend_URL}/api/sales/search?query=${value}`,
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();
        setBills(data);
      } catch (error) {
        console.error("Error searching bills:", error);
      }
    } else {
      setBills(localResults);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace(/^(\D+)/, "₹");
  };

  const summary = bills.reduce(
    (acc, bill) => {
      acc.count++;
      acc.salesAmount += bill.grandTotal || 0;
      acc.amountPaid += bill.amountPaid || 0;
      return acc;
    },
    { count: 0, salesAmount: 0, amountPaid: 0 }
  );

  return (
    <div className="relative p-4 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Sales Transactions</h1>
        </div>
        <div className="grid grid-cols-4 gap-4 text-right">
          <div>
            <div className="font-semibold">{summary.count}</div>
            <div className="text-sm text-muted-foreground">Sales Count</div>
          </div>
          <div>
            <div className="font-semibold">
              {formatCurrency(summary.salesAmount)}
            </div>
            <div className="text-sm text-muted-foreground">Sales Amount</div>
          </div>
          <div>
            <div className="font-semibold">
              {formatCurrency(summary.amountPaid)}
            </div>
            <div className="text-sm text-muted-foreground">Amount Paid</div>
          </div>
          <div>
            <div className="font-semibold text-pink-500">
              {formatCurrency(summary.salesAmount - summary.amountPaid)}
            </div>
            <div className="text-sm text-muted-foreground">To Receive</div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <div className="relative flex items-center bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden">
            <div className="relative flex items-center px-3 border-r border-slate-200">
              <span className="text-sm text-slate-500">INVOICE NO</span>
            </div>

            <div className="flex-1 relative flex items-center">
              <div className="absolute left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                className="w-full pl-10 pr-10 border-0 focus-visible:ring-0 placeholder:text-slate-400"
                placeholder="Search by invoice number..."
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

        <div className="flex gap-2">
          <Button
            className="w-[200px]"
            onClick={() => navigate("/sales/create-sell-invoice")}
          >
            Create Sales Invoice
          </Button>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        {bills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <svg
              className="h-12 w-12 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>No sales transactions found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>INVOICE NO</TableHead>
                <TableHead>CUSTOMER</TableHead>
                <TableHead>BILLED ON</TableHead>
                <TableHead>INV AMT</TableHead>
                <TableHead>RECEIVABLE</TableHead>
                <TableHead>BALANCE</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow
                  key={bill._id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/sale/${bill._id}`)}
                >
                  <TableCell>{bill.invoiceNumber}</TableCell>
                  <TableCell>
                    <div>{bill.distributorName || "Cash Sale"}</div>
                    <div className="text-sm text-muted-foreground">
                      {bill.mob || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {new Date(bill.invoiceDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                      })}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(bill.grandTotal)}</TableCell>
                  <TableCell>{formatCurrency(bill.grandTotal)}</TableCell>
                  <TableCell>
                    {formatCurrency(bill.grandTotal - bill.amountPaid)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                          {
                            "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20":
                              bill.amountPaid >= bill.grandTotal,
                            "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20":
                              bill.amountPaid > 0 &&
                              bill.amountPaid < bill.grandTotal,
                            "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20":
                              bill.amountPaid === 0,
                          }
                        )}
                      >
                        {bill.amountPaid >= bill.grandTotal
                          ? "Paid"
                          : bill.amountPaid > 0
                          ? "Partial"
                          : "Unpaid"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="opacity-0 group-hover:opacity-100 text-pink-500 transition-opacity">
                      →
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="fixed bottom-2 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Create New Sale - <span className="font-medium">F2</span> | Move Up or
          Down - <span className="font-medium">Arrow Keys</span> | To Open -{" "}
          <span className="font-medium">Enter</span>
        </div>
      </div>
    </div>
  );
}
