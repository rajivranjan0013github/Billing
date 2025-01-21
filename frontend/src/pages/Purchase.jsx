import React, { useState, useEffect } from "react";
import {
  Calendar,
  ChevronDown,
  Filter,
  Search,
  Users,
  X,
  SearchX,
} from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPurchaseBills,
  searchPurchaseBills,
} from "../redux/slices/PurchaseBillSlice";
import { format, subDays } from "date-fns";
import { DateRangePicker } from "../components/ui/date-range-picker";

export default function PurchasesTransactions() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { purchaseBills: initialPurchaseBills } = useSelector(
    (state) => state.purchaseBill
  );
  const [purchaseBills, setPurchaseBills] = useState(initialPurchaseBills);

  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("invoice");

  const handleDateSelect = (range) => {
    setDateRange(range);
  };

  const handleDateSearch = () => {
    fetchBills();
  };

  const handleDateCancel = () => {
    setDateRange({
      from: subDays(new Date(), 7),
      to: new Date(),
    });
  };

  const fetchBills = () => {
    dispatch(
      fetchPurchaseBills({
        startDate: dateRange.from,
        endDate: dateRange.to,
      })
    ).then((res) => {
      setPurchaseBills(res.payload);
    });
  };

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    setPurchaseBills(initialPurchaseBills);
  }, [initialPurchaseBills]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace(/^(\D+)/, "₹");
  };

  const summary = purchaseBills.reduce(
    (acc, bill) => {
      acc.count++;
      acc.purchaseAmount += bill.grandTotal || 0;
      acc.amountPaid += bill.amountPaid || 0;
      return acc;
    },
    { count: 0, purchaseAmount: 0, amountPaid: 0 }
  );

  const getFilteredBills = () => {
    if (!searchQuery) return purchaseBills;

    return purchaseBills.filter((bill) =>
      bill.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleSearch = async (value) => {
    setSearchQuery(value);

    if (!value.trim()) {
      setPurchaseBills(initialPurchaseBills);
      return;
    }

    const localResults = purchaseBills.filter((bill) =>
      bill.invoiceNumber.toLowerCase().includes(value.toLowerCase())
    );

    if (localResults.length === 0) {
      dispatch(
        searchPurchaseBills({
          query: value,
          startDate: dateRange.from,
          endDate: dateRange.to,
        })
      ).then((res) => {
        setPurchaseBills(res.payload);
      });
    }
  };

  return (
    <div className="relative p-6 rounded-lg space-y-6  ">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Purchases Transactions</h1>
          <p className="text-muted-foreground ">
            View List of all your Purchases Transactions here
          </p>
        </div>
        <div className="grid grid-cols-5 gap-4 text-right">
          <div>
            <div className="font-semibold">{summary.count}</div>
            <div className="text-sm text-muted-foreground">Purc Count</div>
          </div>
          <div>
            <div className="font-semibold">
              {formatCurrency(summary.purchaseAmount)}
            </div>
            <div className="text-sm text-muted-foreground">Purc Amt Sum</div>
          </div>
          <div>
            <div className="font-semibold">
              {formatCurrency(summary.amountPaid)}
            </div>
            <div className="text-sm text-muted-foreground">Payable Sum</div>
          </div>
          <div>
            <div className="font-semibold">
              {formatCurrency(summary.amountPaid)}
            </div>
            <div className="text-sm text-muted-foreground">Amt Paid Sum</div>
          </div>
         
        </div>
      </div>

      <div className="flex gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div className="relative flex-1">
          <div className="relative flex items-center bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden">
            <div className="relative flex items-center h-11 px-3 border-r border-slate-200 bg-slate-50">
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
                  <SelectItem value="distributor" className="text-sm">
                    Distributor
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
                className="w-full pl-10 pr-10 h-11 border-0 focus-visible:ring-0 placeholder:text-slate-400"
                placeholder={`Search by ${
                  searchType === "invoice"
                    ? "invoice number"
                    : searchType === "distributor"
                    ? "distributor name"
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
                      setPurchaseBills(initialPurchaseBills);
                    }}
                  >
                    <X className="h-3 w-3 text-slate-500" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Search Results Dropdown */}
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

        <div className="relative w-[200px]">
          <Button
            className="w-full justify-start text-left bg-primary hover:bg-primary/90 text-white"
            onClick={() => navigate(`/purchase/create-purchase-invoice`)}
          >
            Create Purchase Invoice
          </Button>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        {purchaseBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mb-4" />
            <p className="text-lg">No purchase bills found</p>
            <p className="text-sm">
              Create a new purchase invoice to get started
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>INVOICE NO</TableHead>
                <TableHead>DISTRIBUTOR / GSTIN</TableHead>
                <TableHead>INVOICE DATE</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>BILLED ON</TableHead>
                <TableHead>AMOUNT</TableHead>
                
                <TableHead>BALANCE</TableHead>
                <TableHead>PAID / DUE</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredBills().map((bill) => (
                <TableRow
                  key={bill._id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/purchase/${bill._id}`)}
                >
                  <TableCell className="font-medium">
                    {bill.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{bill.partyName}</div>
                    <div className="text-sm text-muted-foreground">
                      {bill.mob}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {new Date(bill.invoiceDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                    })}
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
                    {formatCurrency(bill.billSummary?.grandTotal||0)}
                  </TableCell>
                 
                  <TableCell className="font-medium">
                    {formatCurrency(bill.payableAmount || bill.grandTotal)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(bill.grandTotal - (bill.amountPaid || 0))}
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
                          "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
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

      <div className="fixed  bottom-2 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Create New Purchases - <span className="font-medium">F2</span> | Move
          Up or Down - <span className="font-medium">Arrow Keys</span> | To Open
          - <span className="font-medium">Enter</span>
        </div>
      </div>
    </div>
  );
}
