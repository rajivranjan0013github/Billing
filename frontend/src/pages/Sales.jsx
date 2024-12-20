import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBills } from "../redux/slices/SellBillSlice";
import { format } from "date-fns";
import { Search, Settings, Mail, HelpCircle, PackageX } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { useNavigate } from "react-router-dom";

export default function Sales() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bills, fetchStatus } = useSelector((state) => state.bill);
  const [totalSales, setTotalSales] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if(fetchStatus === 'idle'){
      dispatch(fetchBills());
    }
  }, [dispatch]);

  useEffect(() => {
    if (bills.length > 0) {
      const totals = bills.reduce((acc, bill) => {
        acc.total += bill.grand_total;
        acc.paid += bill.payment.amount_paid;
        acc.unpaid += (bill.grand_total - bill.payment.amount_paid);
        return acc;
      }, { total: 0, paid: 0, unpaid: 0 });

      setTotalSales(totals.total);
      setTotalPaid(totals.paid);
      setTotalUnpaid(totals.unpaid);
    }
  }, [bills]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const filteredBills = bills.filter(bill => {
    const partyName = bill.is_cash_customer 
      ? "Cash Sale" 
      : (bill.party?.name || bill.partyName || "");
    
    return partyName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="container mx-auto p-4 space-y-4">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sales Invoices</h1>
        <div className="flex items-center space-x-2">
          <Select defaultValue="Reports">
            <option>Reports</option>
          </Select>
          <Button variant="ghost" size="icon"   >
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Mail className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-blue-600">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-green-600">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-red-600">Unpaid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalUnpaid)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center space-x-4">
        <div className="flex items-center space-x-2 flex-grow">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input 
              className="pl-10" 
              placeholder="Search by party name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select defaultValue="Last 365 Days">
            <option>Last 365 Days</option>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Select defaultValue="Bulk Actions">
            <option>Bulk Actions</option>
          </Select>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => navigate("/sales/create-sell-invoice")}>
            Create Sales Invoice
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <input type="checkbox" className="rounded border-gray-300" />
            </TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Party Name</TableHead>
            <TableHead>Due In</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fetchStatus === 'loading' ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">Loading...</TableCell>
            </TableRow>
          ) : filteredBills.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7}>
                <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                  <PackageX className="h-12 w-12 mb-2" />
                  <p className="text-lg font-medium">No bills found</p>
                  <p className="text-sm">
                    {searchQuery 
                      ? "Try adjusting your search query" 
                      : "Start by creating your first sales invoice"}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : filteredBills.map((bill) => (
            <TableRow 
              key={bill._id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => navigate(`/sales/${bill._id}`)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" className="rounded border-gray-300" />
              </TableCell>
              <TableCell>{format(new Date(bill.bill_date), 'dd MMM yyyy')}</TableCell>
              <TableCell>{bill.bill_number}</TableCell>
              <TableCell>{bill.is_cash_customer ? "Cash Sale" : bill.party?.name || bill.partyName}</TableCell>
              <TableCell>-</TableCell>
              <TableCell>
                {formatCurrency(bill.grand_total)}
                {bill.grand_total !== bill.payment.amount_paid && (
                  <div className="text-sm text-gray-500">
                    ({formatCurrency(bill.grand_total - bill.payment.amount_paid)} unpaid)
                  </div>
                )}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  bill.payment.amount_paid >= bill.grand_total 
                    ? "bg-green-100 text-green-800"
                    : bill.payment.amount_paid > 0
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {bill.payment.amount_paid >= bill.grand_total 
                    ? "Paid"
                    : bill.payment.amount_paid > 0
                    ? "Partially Paid"
                    : "Unpaid"}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="fixed bottom-4 right-4">
        <Button variant="outline" size="icon" className="rounded-full bg-white shadow-lg">
          <HelpCircle className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}