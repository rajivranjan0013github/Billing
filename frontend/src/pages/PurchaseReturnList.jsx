import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, X, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Backend_URL } from "../assets/Data";
import { Input } from "../components/ui/input";
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
import { format, subDays } from "date-fns";
import { DateRangePicker } from "../components/ui/date-range-picker";
import { cn } from "../lib/utils";
import { useToast } from "../hooks/use-toast";
import { formatCurrency } from "../utils/Helper";

const PurchaseReturnList = () => {
  const [returns, setReturns] = useState([]);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("debitNote");

  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchReturns = async () => {
    try {
      setLoading(true);
      let url = `${Backend_URL}/api/purchase/returns`;
      if (dateRange.from && dateRange.to) {
        const fromDate = format(dateRange.from, "yyyy-MM-dd");
        const toDate = format(dateRange.to, "yyyy-MM-dd");
        url += `?startDate=${fromDate}&endDate=${toDate}`;
      }

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch purchase returns");
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
  }, []);

  const handleDateSelect = (range) => {
    setDateRange(range);
  };

  const handleDateSearch = () => {
    fetchReturns();
  };

  const handleDateCancel = () => {
    setDateRange({
      from: subDays(new Date(), 7),
      to: new Date(),
    });
  };

  const summary = returns.reduce(
    (acc, returnItem) => {
      acc.count++;
      acc.totalAmount += returnItem.billSummary.grandTotal || 0;
      acc.completedAmount +=
        returnItem.paymentStatus === "completed"
          ? returnItem.billSummary.grandTotal
          : 0;
      return acc;
    },
    { count: 0, totalAmount: 0, completedAmount: 0 }
  );

  const getFilteredReturns = () => {
    if (!searchQuery) return returns;

    return returns.filter((returnItem) => {
      const searchValue = searchQuery.toLowerCase();
      switch (searchType) {
        case "debitNote":
          return returnItem.debitNoteNumber.toLowerCase().includes(searchValue);
        case "distributor":
          return returnItem.distributorName.toLowerCase().includes(searchValue);
        case "invoice":
          return returnItem.originalInvoiceNumber
            .toLowerCase()
            .includes(searchValue);
        default:
          return true;
      }
    });
  };

  return (
    <div className="relative p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Purchase Returns</h1>
        </div>
        <div className="grid grid-cols-3 gap-4 text-right">
          <div>
            <div className="font-semibold">{summary.count}</div>
            <div className="text-sm text-muted-foreground">Total Returns</div>
          </div>
          <div>
            <div className="font-semibold">
              {formatCurrency(summary.totalAmount)}
            </div>
            <div className="text-sm text-muted-foreground">Total Amount</div>
          </div>
          <div>
            <div className="font-semibold">
              {formatCurrency(summary.completedAmount)}
            </div>
            <div className="text-sm text-muted-foreground">
              Completed Amount
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <div className="relative flex items-center bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden">
            <div className="relative flex items-center px-3 border-r border-slate-200">
              <Select
                defaultValue="debitNote"
                onValueChange={(value) => setSearchType(value)}
              >
                <SelectTrigger className="h-9 w-[120px] border-0 bg-transparent hover:bg-slate-100 focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Search by" />
                </SelectTrigger>
                <SelectContent align="start" className="w-[120px]">
                  <SelectItem value="debitNote" className="text-sm">
                    Debit Note
                  </SelectItem>
                  <SelectItem value="distributor" className="text-sm">
                    Distributor
                  </SelectItem>
                  <SelectItem value="invoice" className="text-sm">
                    Invoice No
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
                  searchType === "debitNote"
                    ? "debit note number"
                    : searchType === "distributor"
                    ? "distributor name"
                    : "invoice number"
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
                    onClick={() => setSearchQuery("")}
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

        <Button
          className="w-[200px]"
          onClick={() => navigate("/purchase/return/create")}
        >
          Create Return
        </Button>
      </div>

      <div className="relative overflow-x-auto">
        {returns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mb-4" />
            <p className="text-lg">No purchase returns found</p>
            <p className="text-sm">
              Create a new purchase return to get started
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DEBIT NOTE NO.</TableHead>
                <TableHead>DISTRIBUTOR</TableHead>
                <TableHead>RETURN DATE</TableHead>
                <TableHead>ORIGINAL INVOICE</TableHead>
                <TableHead>TOTAL ITEMS</TableHead>
                <TableHead>TOTAL AMOUNT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredReturns().map((returnItem) => (
                <TableRow
                  key={returnItem._id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/purchase/return/${returnItem._id}`)}
                >
                  <TableCell className="font-medium">
                    {returnItem.debitNoteNumber}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {returnItem.distributorName}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(returnItem.returnDate), "dd/MMM/yy")}
                  </TableCell>
                  <TableCell>{returnItem.originalInvoiceNumber}</TableCell>
                  <TableCell>{returnItem.billSummary.productCount}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(returnItem.billSummary.grandTotal)}
                  </TableCell>
                </TableRow>
              ))}
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default PurchaseReturnList;
