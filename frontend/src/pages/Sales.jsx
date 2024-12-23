import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBills } from "../redux/slices/SellBillSlice";
import { Calendar, ChevronDown, Filter, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";

export default function Sales() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bills, fetchStatus } = useSelector((state) => state.bill);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if(fetchStatus === 'idle'){
      dispatch(fetchBills());
    }
  }, [dispatch, fetchStatus]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount).replace(/^(\D+)/, '₹');
  };

  const summary = bills.reduce((acc, bill) => {
    acc.count++;
    acc.salesAmount += bill.grand_total || 0;
    acc.amountPaid += bill?.payment?.amount_paid || 0;
    return acc;
  }, { count: 0, salesAmount: 0, amountPaid: 0 });

  return (
    <div className="relative p-6 rounded-lg space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Sales Transactions</h1>
          <p className="text-muted-foreground">
            View List of all your Sales Transactions here
          </p>
        </div>
        <div className="grid grid-cols-4 gap-4 text-right">
          <div>
            <div className="font-semibold">{summary.count}</div>
            <div className="text-sm text-muted-foreground">Sales Count</div>
          </div>
          <div>
            <div className="font-semibold">{formatCurrency(summary.salesAmount)}</div>
            <div className="text-sm text-muted-foreground">Sales Amount</div>
          </div>
          <div>
            <div className="font-semibold">{formatCurrency(summary.amountPaid)}</div>
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
          <Select defaultValue="invoice">
            <SelectTrigger className="absolute left-0 w-[140px] rounded-r-none border-r-0">
              <SelectValue>INVOICE NO</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invoice">INVOICE NO</SelectItem>
              <SelectItem value="customer">CUSTOMER</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex">
            <Input 
              className="pl-[150px]" 
              placeholder="Search using Invoice No"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="ghost" className="absolute right-0" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative w-[300px]">
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <Calendar className="mr-2 h-4 w-4" />
            Last 365 Days
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </div>

        <div className="relative w-[200px]">
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <Filter className="mr-2 h-4 w-4" />
            FILTER BY
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </div>

        <div className="relative w-[200px]">
          <Button variant="outline" className="w-full justify-start text-left">
            SORT BY
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </div>

        <div className="relative w-[200px]">
          <Button 
            className="w-full justify-start text-left"
            onClick={() => navigate("/sales/create-sell-invoice")}
          >
            Create Sales Invoice
          </Button>
        </div>
      </div>

      <div className="relative overflow-x-auto">
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
                onClick={() => navigate(`/sales/${bill._id}`)}
              >
                <TableCell>{bill.bill_number}</TableCell>
                <TableCell>
                  <div>{bill.is_cash_customer ? "Cash Sale" : bill.party?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {bill.party?.mobile || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <div>{new Date(bill.bill_date).toLocaleDateString('en-IN', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: '2-digit' 
                  })}</div>
                </TableCell>
                <TableCell>{formatCurrency(bill.grand_total)}</TableCell>
                <TableCell>{formatCurrency(bill.grand_total)}</TableCell>
                <TableCell>{formatCurrency(bill.grand_total - bill?.payment?.amount_paid)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                      {
                        "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20":
                          bill?.payment?.amount_paid >= bill.grand_total,
                        "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20":
                          bill?.payment?.amount_paid > 0 && bill?.payment?.amount_paid < bill.grand_total,
                        "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20":
                          bill?.payment?.amount_paid === 0,
                      }
                    )}>
                      {bill?.payment?.amount_paid >= bill.grand_total 
                        ? "Paid"
                        : bill?.payment?.amount_paid > 0
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
      </div>

      <div className="fixed bottom-2 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Create New Sale - <span className="font-medium">F2</span> | Move Up or Down - <span className="font-medium">Arrow Keys</span> | To Open - <span className="font-medium">Enter</span>
        </div>
      </div>
    </div>
  );
}