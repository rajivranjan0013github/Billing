import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Backend_URL } from "../assets/Data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { DateRangePicker } from "../components/ui/date-range-picker";
import { format, subDays } from "date-fns";
import { Search, X } from "lucide-react";
import { cn } from "../lib/utils";
import { useToast } from "../hooks/use-toast";

const SalesReturnList = () => {
  const [returns, setReturns] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchReturns = async () => {
    try {
      setLoading(true);
      let url = `${Backend_URL}/api/sales/returns`;
      if (dateRange.from && dateRange.to) {
        url += `?startDate=${new Date(dateRange.from)
          .toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .split("/")
          .reverse()
          .join("-")}&endDate=${new Date(dateRange.to)
          .toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .split("/")
          .reverse()
          .join("-")}`;
      }

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sales returns");
      }

      const data = await response.json();
      setReturns(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [dateRange]);

  const handleSearch = async (value) => {
    setSearchQuery(value);

    if (!value.trim()) {
      fetchReturns();
      return;
    }

    try {
      const response = await fetch(
        `${Backend_URL}/api/sales/returns/search?query=${value}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      setReturns(data);
    } catch (error) {
      console.error("Error searching returns:", error);
    }
  };

  const handleDateSelect = (range) => {
    setDateRange(range);
  };

  const handleDateCancel = () => {
    setDateRange({
      from: subDays(new Date(), 7),
      to: new Date(),
    });
  };

  const summary = returns.reduce(
    (acc, ret) => {
      acc.count++;
      acc.totalAmount += ret.billSummary?.grandTotal || 0;
      acc.totalQuantity += ret.billSummary?.totalQuantity || 0;
      return acc;
    },
    { count: 0, totalAmount: 0, totalQuantity: 0 }
  );

  return (
    <div className="relative p-6 rounded-lg space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Sales Returns</h1>
          <p className="text-muted-foreground">
            View list of all your sales returns here
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-right">
          <div>
            <div className="font-semibold">{summary.count}</div>
            <div className="text-sm text-muted-foreground">Returns Count</div>
          </div>
          <div>
            <div className="font-semibold">
              ₹{summary.totalAmount.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Total Amount</div>
          </div>
          <div>
            <div className="font-semibold">{summary.totalQuantity}</div>
            <div className="text-sm text-muted-foreground">Total Quantity</div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <div className="relative flex items-center bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden">
            <div className="relative flex items-center h-11 px-3 border-r border-slate-200 bg-slate-50">
              <span className="text-sm text-slate-500">RETURN NO</span>
            </div>

            <div className="flex-1 relative flex items-center">
              <div className="absolute left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                className="w-full pl-10 pr-10 h-11 border-0 focus-visible:ring-0 placeholder:text-slate-400"
                placeholder="Search by return number..."
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
                      fetchReturns();
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
            onSearch={fetchReturns}
            onCancel={handleDateCancel}
            className="border border-slate-200 rounded-md hover:border-slate-300 transition-colors"
          />
        </div>

        <div className="relative w-[200px]">
          <Button
            className="w-full justify-start text-left"
            onClick={() => navigate("/sales/return")}
          >
            Create Sales Return
          </Button>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        {returns.length === 0 ? (
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
            <p>No sales returns found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RETURN NO</TableHead>
                <TableHead>RETURN DATE</TableHead>
                <TableHead>CUSTOMER</TableHead>
                <TableHead>ORIGINAL INVOICE</TableHead>
                <TableHead>TOTAL ITEMS</TableHead>
                <TableHead>TOTAL AMOUNT</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.map((returnItem) => (
                <TableRow
                  key={returnItem._id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/sales/return/${returnItem._id}`)}
                >
                  <TableCell>{returnItem.returnNumber}</TableCell>
                  <TableCell>
                    {format(new Date(returnItem.returnDate), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <div>{returnItem.distributorName || "Cash Customer"}</div>
                  </TableCell>
                  <TableCell>
                    {returnItem.originalInvoiceNumber || "-"}
                  </TableCell>
                  <TableCell>{returnItem.billSummary.productCount}</TableCell>
                  <TableCell>
                    ₹{returnItem.billSummary.grandTotal.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                        {
                          "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20":
                            returnItem.status === "completed",
                          "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20":
                            returnItem.status === "pending",
                        }
                      )}
                    >
                      {returnItem.status
                        ? returnItem.status.charAt(0).toUpperCase() +
                          returnItem.status.slice(1)
                        : "Pending"}
                    </span>
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
          Create New Return - <span className="font-medium">F2</span> | Move Up
          or Down - <span className="font-medium">Arrow Keys</span> | To Open -{" "}
          <span className="font-medium">Enter</span>
        </div>
      </div>
    </div>
  );
};

export default SalesReturnList;
