import React, { useState, useEffect } from "react";
import { Search, Users, X, ArrowLeft,} from "lucide-react";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "../components/ui/table";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPurchaseBills, searchPurchaseBills, setDateRange, setSelectedPreset } from "../redux/slices/PurchaseBillSlice";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { DateRangePicker } from "../components/ui/date-range-picker";
import { formatCurrency } from "../utils/Helper";

export default function PurchasesTransactions() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { purchaseBills: initialPurchaseBills, dateRange, selectedPreset } = useSelector((state) => state.purchaseBill);
  const [purchaseBills, setPurchaseBills] = useState(initialPurchaseBills);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("invoice");
  const [lastFetchedRange, setLastFetchedRange] = useState(null);

  const handleDateSelect = (range) => {
    dispatch(setDateRange(range));
    dispatch(setSelectedPreset("custom"));
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
    fetchBills(newRange);
  };

  const handleDateSearch = () => {
    if(!dateRange.to) {
      const updatedRange = { ...dateRange, to: dateRange.from };
      dispatch(setDateRange(updatedRange));
      fetchBills(updatedRange);
    } else {
      fetchBills(dateRange);
    }
  };

  const handleDateCancel = () => {
    const newRange = {
      from: subDays(new Date(), 7),
      to: new Date(),
    };
    dispatch(setDateRange(newRange));
    dispatch(setSelectedPreset("thisWeek"));
    fetchBills(newRange);
  };

  const fetchBills = (range = dateRange) => {
    dispatch(
      fetchPurchaseBills({
        startDate: range.from.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).split("/").reverse().join("-"),
        endDate: range.to.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).split("/").reverse().join("-"),
      })
    ).then((res) => {
      setPurchaseBills(res.payload);
      setLastFetchedRange(range);
    });
  };

  useEffect(() => {
    // Only fetch if we have no data or if the date range has changed
    const shouldFetch = !lastFetchedRange || 
      lastFetchedRange.from?.getTime() !== dateRange.from?.getTime() || 
      lastFetchedRange.to?.getTime() !== dateRange.to?.getTime();

    if (shouldFetch && dateRange.from && dateRange.to) {
      fetchBills();
    }
  }, [dateRange.from, dateRange.to]);

  useEffect(() => {
    setPurchaseBills(initialPurchaseBills);
  }, [initialPurchaseBills]);

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
          startDate: dateRange.from.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).split("/").reverse().join("-"),
          endDate: dateRange.to.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).split("/").reverse().join("-"),
        })
      ).then((res) => {
        setPurchaseBills(res.payload);
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

      <div className="flex gap-2">
        <div className="relative ">
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
                className="w-full h-9 pl-10 pr-10 border-0 focus-visible:ring-0 placeholder:text-slate-400"
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

        <div className="flex-1 flex justify-end gap-2">
          <Button
          variant='outline'
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
                <TableHead className='pl-5'>S.NO</TableHead>
                <TableHead>INVOICE NO</TableHead>
                <TableHead>DISTRIBUTOR / GSTIN</TableHead>
                <TableHead>INVOICE DATE</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>BILLED ON</TableHead>
                <TableHead>BILL TOTAL</TableHead>
                <TableHead>Due Amt</TableHead>
                <TableHead>PAID / DUE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className='border'>
              {getFilteredBills().map((bill, index) => (
                <TableRow
                  key={bill._id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/purchase/${bill._id}`)}
                >
                  <TableCell className="font-medium pl-5">
                    {index+1}
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
                 
                  {/* <TableCell className="font-medium">
                    {formatCurrency(bill.payableAmount || bill.grandTotal)}
                  </TableCell> */}
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency((bill.billSummary?.grandTotal || 0) - (bill.amountPaid || 0))}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
