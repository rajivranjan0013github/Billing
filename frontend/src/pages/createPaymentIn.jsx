import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ArrowLeft, Calendar, MessageSquare, Search, Settings, Store } from "lucide-react";
import { Card } from "../components/ui/card";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState, useRef } from "react";
import { fetchDistributors } from "../redux/slices/distributorSlice";
import { SearchSuggestion } from "../components/custom/custom-fields/CustomSearchSuggestion";
import { Backend_URL } from "../assets/Data";
import { useToast } from "../hooks/use-toast";
import { createPayment } from "../redux/slices/paymentSlice";
import { TableContent } from "./CreatePaymentOut";

export default function Component() {
  const navigate = useNavigate();
  const { parties, fetchStatus } = useSelector((state) => state.distributor);
  const { createStatus } = useSelector((state) => state.payment);
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
  const [paymentMode, setPaymentMode] = useState("cash");
  const [notes, setNotes] = useState("");
  const [paymentOutNumber, setPaymentOutNumber] = useState("");

  useEffect(() => {
    if (fetchStatus === "idle") {
      dispatch(fetchDistributors());
    }
  }, [fetchStatus]);

  const handleFetchPendingInvoices = async(distributorId) => {
    setIsLoadingBills(true);
    try {
      const response = await fetch(`${Backend_URL}/api/payment/pending-invoices/${distributorId}?bill_type=sales`, {credentials: "include"});
      const data = await response.json();
      // console.log('data', data);
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
    if (!selecteddistributor) {
      toast({ title: 'Select distributor', variant: 'destructive',});
      return;
    }

    if (paymentAmount <= 0) {
      toast({ title: 'Payment amount must be greater than 0', variant: 'destructive',});
      return;
    }

    if (!paymentOutNumber) {
      toast({ title: 'Please enter a payment in number', variant: 'destructive',});
      return;
    }

    const paymentData = {
      paymentType: "Payment In",
      distributorId: selecteddistributor._id,
      paymentDate: paymentDate,
      paymentMethod: paymentMode,
      amount: paymentAmount,
      remarks: notes,
      payment_number: paymentOutNumber,
      bills: selectedBills.map(bill => ({
        bill_id: bill._id,
        amount: bill.grand_total - bill.payment.amount_paid,
        bill_number: bill.bill_number
      }))
    };

    dispatch(createPayment(paymentData)).unwrap().then(() => {
        toast({title: "Payment added successfully", variant: "success",});
        dispatch(fetchDistributors());
        navigate('/sales/payment-in');
      })
      .catch((error) => {
        toast({title: "Failed to create payment", variant: "destructive",});
      });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Record Payment In</h1>
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
            <label className="text-sm text-muted-foreground">distributor Name</label>
            <div className="relative">
              <SearchSuggestion
                suggestions={parties}
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
          <div className="grid grid-cols-3 gap-4">
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
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Payment In Number
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
    </div>
  );
}
