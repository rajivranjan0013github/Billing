import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
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
  TableFooter,
} from "../components/ui/table";
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  Search,
  Settings,
  Store,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState, useRef } from "react";
import { fetchParties } from "../redux/slices/partySlice";
import { SearchSuggestion } from "../components/custom/registration/CustomSearchSuggestion";
import { Backend_URL } from "../assets/Data";

// First, let's create a TableContent component for better organization
const TableContent = ({ isLoadingBills, pendingInvoices, selectedBills, onBillSelection }) => {
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
            <TableCell>{new Date(invoice.bill_date).toLocaleDateString()}</TableCell>
            <TableCell>-</TableCell>
            <TableCell>{invoice.bill_number}</TableCell>
            <TableCell className="text-right">
              ₹{invoice.grand_total.toLocaleString()}{" "}
              <span className="text-red-500 ml-1">
                (₹{(invoice.grand_total - invoice.payment.amount_paid).toLocaleString()} pending)
              </span>
            </TableCell>
            <TableCell className="text-right">₹{invoice.payment.amount_paid.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={4}>Total</TableCell>
          <TableCell className="text-right">
            ₹{pendingInvoices.reduce((total, invoice) => total + invoice.grand_total, 0).toLocaleString()}
          </TableCell>
          <TableCell className="text-right">
            ₹{pendingInvoices.reduce((total, invoice) => total + invoice.payment.amount_paid, 0).toLocaleString()}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
};

export default function Component() {
  const navigate = useNavigate();
  const { parties, fetchStatus } = useSelector((state) => state.party);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [value, setValue] = useState("");
  const partyNameRef = useRef(null);
  const dispatch = useDispatch();
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
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [paymentOutNumber, setPaymentOutNumber] = useState("");

  useEffect(() => {
    if (fetchStatus === "idle") {
      dispatch(fetchParties());
    }
  }, [fetchStatus]);

  const handleFetchPendingInvoices = async(partyId) => {
    setIsLoadingBills(true);
    try {
      const response = await fetch(`${Backend_URL}/api/payment/pending-invoices/${partyId}?bill_type=purchase`, {credentials: "include"});
      const data = await response.json();
      setPendingInvoices(data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoadingBills(false);
    }
  }

  const handlePartySuggestionSelect = (suggestion) => {
    setSelectedParty(suggestion);
    setValue(suggestion.name);
    handleFetchPendingInvoices(suggestion._id);
  };

  const handleBillSelection = (invoice, isChecked) => {
    if (isChecked) {
      const newSelectedBills = [...selectedBills, invoice];
      setSelectedBills(newSelectedBills);
      // Calculate total pending amount of selected bills
      const totalPending = newSelectedBills.reduce((total, bill) => 
        total + (bill.grand_total - bill.payment.amount_paid), 0
      );
      setPaymentAmount(totalPending);
    } else {
      const newSelectedBills = selectedBills.filter(bill => bill._id !== invoice._id);
      setSelectedBills(newSelectedBills);
      const totalPending = newSelectedBills.reduce((total, bill) => 
        total + (bill.grand_total - bill.payment.amount_paid), 0
      );
      setPaymentAmount(totalPending);
    }
  };

  const handleSubmit = async () => {
    if (!selectedParty) {
      alert("Please select a party");
      return;
    }

    if (paymentAmount <= 0) {
      alert("Payment amount must be greater than 0");
      return;
    }

    if (selectedBills.length === 0) {
      alert("Please select at least one invoice to settle");
      return;
    }

    if (!paymentOutNumber) {
      alert("Please enter a payment out number");
      return;
    }

    const paymentData = {
      payment_type: "Expense",

      party_id: selectedParty._id,
      payment_date: paymentDate,
      payment_method: paymentMode,
      party_name: selectedParty.name,
      amount: paymentAmount,
      remarks: notes,
      payment_out_number: paymentOutNumber,
      bills: selectedBills.map(bill => ({
        bill_id: bill._id,
        amount: bill.grand_total - bill.payment.amount_paid,
        bill_number: bill.bill_number
      }))
    };
    console.log(paymentData);

    // try {
    //   const response = await fetch(`${Backend_URL}/api/payment/out`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json'
    //     },
    //     credentials: 'include',
    //     body: JSON.stringify(paymentData)
    //   });

    //   if (!response.ok) {
    //     throw new Error('Payment creation failed');
    //   }

    //   const data = await response.json();
    //   navigate('/payments'); // or wherever you want to redirect after success
    // } catch (error) {
    //   console.error('Error creating payment:', error);
    //   alert('Failed to create payment. Please try again.');
    // }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Record Payment Out</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button 
            className="bg-[#6366F1] hover:bg-[#5558DD]"
            onClick={handleSubmit}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Party Name</label>
            <div className="relative">
              <SearchSuggestion
                suggestions={parties}
                placeholder='Search party by name'
                value={value}
                setValue={setValue}
                onSuggestionSelect={handlePartySuggestionSelect}
                ref={partyNameRef}
                showAmount={true}
              />
            </div>
          </div>
          {
            selectedParty && (
              <div className="text-sm text-muted-foreground">
                Current Balance: ₹{selectedParty?.current_balance.toLocaleString()}
              </div>
            )
          }

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Enter Payment Amount
            </label>
            <Input 
              type="number" 
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
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
                Payment Mode
              </label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger>
                  <SelectValue>Cash</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Payment Out Number
            </label>
            <Input 
              value={paymentOutNumber}
              onChange={(e) => setPaymentOutNumber(e.target.value)}
              placeholder="Enter Payment Out Number"
            />
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
          {selectedParty && pendingInvoices.length > 0 && (
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search Invoice Number" />
            </div>
          )}
        </div>

        {!selectedParty ? (
          <div className="border rounded-md">
            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
              <Store className="h-12 w-12 mb-4" />
              <p className="text-lg">Select a party to view pending invoices</p>
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
    </div>
  );
}
