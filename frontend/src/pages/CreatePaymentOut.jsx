import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "../components/ui/table";
import { ArrowLeft, Calendar, Search, Settings, Store } from "lucide-react";
import { Card } from "../components/ui/card";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState, useRef } from "react";
import { fetchDistributors } from "../redux/slices/distributorSlice";
import { SearchSuggestion } from "../components/custom/custom-fields/CustomSearchSuggestion";
import { Backend_URL } from "../assets/Data";
import { useToast } from "../hooks/use-toast";
import MakePaymentDlg from "../components/custom/payment/MakePaymentDlg";

// First, let's create a TableContent component for better organization
export const TableContent = ({ isLoadingBills, pendingInvoices, selectedBills, onBillSelection }) => {
  if (isLoadingBills) {
    return (
      <div className="border rounded-md">
        <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#6366F1]"></div>
          <span className="mt-2">Loading invoices...</span>
        </div>
      </div>
    );
  }

  if (pendingInvoices.length === 0) {
    return (
      <div className="border rounded-md">
        <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
          <Store className="h-12 w-12 mb-4" />
          <p className="text-lg">No pending invoices found</p>
        </div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox 
              checked={selectedBills.length === pendingInvoices.length && pendingInvoices.length > 0}
              onCheckedChange={(checked) => {
                if (checked) {
                  pendingInvoices.forEach(invoice => onBillSelection(invoice, true));
                } else {
                  pendingInvoices.forEach(invoice => onBillSelection(invoice, false));
                }
              }}
            />
          </TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Invoice Number</TableHead>
          <TableHead className="text-right">Invoice Amount</TableHead>
          <TableHead className="text-right">Amount Settled</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pendingInvoices.map((invoice) => (
          <TableRow key={invoice._id}>
            <TableCell>
              <Checkbox 
                checked={selectedBills.some(bill => bill._id === invoice._id)}
                onCheckedChange={(checked) => onBillSelection(invoice, checked)}
              />
            </TableCell>
            <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
            <TableCell>{invoice.paymentDueDate ? new Date(invoice.paymentDueDate).toLocaleDateString() : '-'}</TableCell>
            <TableCell>{invoice.invoiceNumber}</TableCell>
            <TableCell className="text-right">
              ₹{invoice.grandTotal.toLocaleString()}{" "}
              <span className="text-red-500 ml-1">
                (₹{roundToTwo(invoice.grandTotal - invoice.amountPaid).toLocaleString()} pending)
              </span>
            </TableCell>
            <TableCell className="text-right">₹{invoice.amountPaid.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={4}>Total</TableCell>
          <TableCell className="text-right">
            ₹{roundToTwo(pendingInvoices.reduce((total, invoice) => total + invoice.grandTotal, 0)).toLocaleString()}
          </TableCell>
          <TableCell className="text-right">
            ₹{roundToTwo(pendingInvoices.reduce((total, invoice) => total + invoice.amountPaid, 0)).toLocaleString()}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
};

const roundToTwo = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export default function Component() {
  const navigate = useNavigate();
  const { distributors, fetchStatus } = useSelector((state) => state.distributor);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [selecteddistributor, setSelecteddistributor] = useState(null);
  const [value, setValue] = useState("");
  const distributorNameRef = useRef(null);
  const dispatch = useDispatch();
  const {toast} = useToast();
  const [paymentDate, setPaymentDate] = useState(() => {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date()).split('/').reverse().join('-');
  });
  const [isLoadingBills, setIsLoadingBills] = useState(false);
  const [selectedBills, setSelectedBills] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState();
  const [notes, setNotes] = useState("");
  const [paymentOutNumber, setPaymentOutNumber] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    if (fetchStatus === "idle") {
      dispatch(fetchDistributors());
    }
  }, [fetchStatus]);

  useEffect(() => {
    const fetchPaymentNumber = async () => {
      const response = await fetch(`${Backend_URL}/api/payment/payment-number`, {credentials: "include"});
      const data = await response.json();
      setPaymentOutNumber(data.paymentNumber);
    }
    fetchPaymentNumber();
  }, []);

  const handleFetchPendingInvoices = async(distributorId) => {
    setIsLoadingBills(true);
    try {
      const response = await fetch(`${Backend_URL}/api/payment/pending-invoices/${distributorId}?bill_type=purchase`, {credentials: "include"});
      const data = await response.json();
      setPendingInvoices(data);
    } catch (error) {
    } finally {
      setIsLoadingBills(false);
    }
  }

  const handledistributorSuggestionSelect = (suggestion) => {
    setSelecteddistributor(suggestion);
    setValue(suggestion.name);
    handleFetchPendingInvoices(suggestion._id);
  };

  const handleBillSelection = (invoice, isChecked) => {
    if (isChecked) {
      const newSelectedBills = [...selectedBills, invoice];
      setSelectedBills(newSelectedBills);
      // Calculate total pending amount of selected bills
      const totalPending = roundToTwo(newSelectedBills.reduce((total, bill) => 
        total + (bill.grandTotal - bill.amountPaid), 0
      ));
      setPaymentAmount(totalPending);
    } else {
      const newSelectedBills = selectedBills.filter(bill => bill._id !== invoice._id);
      setSelectedBills(newSelectedBills);
      const totalPending = roundToTwo(newSelectedBills.reduce((total, bill) => 
        total + (bill.grandTotal - bill.amountPaid), 0
      ));
      setPaymentAmount(totalPending);
    }
  };

  const handleSubmit = async () => {
    if (!selecteddistributor) {
      toast({ title: 'Select distributor', variant: 'destructive',});
      return;
    }

    if (paymentAmount <= 0) {
      toast({ title: 'Payment amount must be greater than 0', variant: 'destructive',});
      return;
    }

    if (!paymentOutNumber) {
      toast({ title: 'Please enter a payment out number', variant: 'destructive',});
      return;
    }

    setShowPaymentDialog(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Record Payment Out</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button onClick={handleSubmit}>
            Create Payment
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Distributor Name</label>
            <div className="relative">
              <SearchSuggestion
                suggestions={distributors}
                placeholder='Search distributor by name'
                value={value}
                setValue={setValue}
                onSuggestionSelect={handledistributorSuggestionSelect}
                ref={distributorNameRef}
                showAmount={true}
              />
            </div>
          </div>
          {
            selecteddistributor && (
              <div className="text-sm text-muted-foreground">
                Current Balance: ₹{selecteddistributor?.currentBalance.toLocaleString()}
              </div>
            )
          }

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Enter Payment Amount
            </label>
            <Input 
              type="number" 
              value={paymentAmount || ''}
              onChange={(e) => {
                const value = e.target.value;
                setPaymentAmount(value === '' ? '' : Number(value));
              }}
              placeholder="0" 
            />
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Payment Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="date" 
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Payment Out Number
              </label>
              <Input 
                value={paymentOutNumber}
                onChange={(e) => setPaymentOutNumber(e.target.value)}
                placeholder="Enter..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Notes</label>
            <Textarea 
              placeholder="Enter Notes" 
              className="resize-none" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Settle invoices with this payment
          </h2>
          {selecteddistributor && pendingInvoices.length > 0 && (
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search Invoice Number" />
            </div>
          )}
        </div>

        {!selecteddistributor ? (
          <div className="border rounded-md">
            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
              <Store className="h-12 w-12 mb-4" />
              <p className="text-lg">Select a distributor to view pending invoices</p>
            </div>
          </div>
        ) : (
          <TableContent 
            isLoadingBills={isLoadingBills} 
            pendingInvoices={pendingInvoices}
            selectedBills={selectedBills}
            onBillSelection={handleBillSelection}
          />
        )}
      </div>

      <MakePaymentDlg
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        paymentData={{
          paymentType: "Payment Out",
          distributorId: selecteddistributor?._id,
          paymentDate,
          amount: roundToTwo(paymentAmount),
          remarks: notes,
          paymentNumber: paymentOutNumber,
          bills: selectedBills.map(bill => ({
            billId: bill._id,
            amount: roundToTwo(bill.grandTotal - bill.amountPaid),
            billNumber: bill.invoiceNumber
          }))
        }}
      />
    </div>
  );
}
