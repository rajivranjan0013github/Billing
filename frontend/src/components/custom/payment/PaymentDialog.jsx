import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAccounts } from "../../../redux/slices/accountSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { ScrollArea } from "../../ui/scroll-area";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar } from "../../ui/calendar";
import { CalendarIcon, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import { Card } from "../../ui/card";

export default function PaymentDialog({
  open,
  onOpenChange,
  invoiceData,
  onSubmit,
}) {
  const dispatch = useDispatch();
  const { accounts } = useSelector((state) => state.accounts);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [step, setStep] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState("due");
  const [dueDate, setDueDate] = useState(new Date());
  const [showDetails, setShowDetails] = useState(false);

  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentMethod: "",
    accountId: "",

    chequeNumber: "",
    chequeDate: new Date(),
    micrCode: "",
    transactionNumber: "",
  });

  useEffect(() => {
    if (open) {
      dispatch(fetchAccounts());
      setStep(1);
      setPaymentStatus("due");
      setDueDate(new Date());
      setPaymentData({
        amount: "",
        paymentMethod: "",
        accountId: "",

        chequeNumber: "",
        chequeDate: new Date(),
        micrCode: "",
        transactionNumber: "",
      });
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (paymentStatus === "paid") {
      setPaymentData((prev) => ({
        ...prev,
        amount: invoiceData?.totalAmount || "",
      }));
    } else {
      setPaymentData((prev) => ({
        ...prev,
        amount: "",
      }));
    }
  }, [paymentStatus, invoiceData?.totalAmount]);

  const handlePaymentMethodChange = (value) => {
    let paymentMethod;
    let accountId = "";

    // Convert UI payment method to database payment method
    if (value === "CHEQUE") {
      paymentMethod = "CHEQUE";
      accountId = null; // Set accountId to null for cheque payments
    } else if (value.startsWith("ACCOUNT_")) {
      accountId = value.replace("ACCOUNT_", "");
      const account = accounts.find((acc) => acc._id === accountId);

      switch (account?.accountType) {
        case "BANK":
          paymentMethod = "BANK";
          break;
        case "UPI":
          paymentMethod = "UPI";
          break;
        case "CASH":
          paymentMethod = "CASH";
          break;
        default:
          paymentMethod = "BANK";
      }
    }

    setPaymentData((prev) => ({
      ...prev,
      paymentMethod,
      accountId,
      // Clear cheque related fields when switching to non-cheque payment
      chequeNumber: paymentMethod === "CHEQUE" ? prev.chequeNumber : "",
      chequeDate: paymentMethod === "CHEQUE" ? prev.chequeDate : null,
      micrCode: paymentMethod === "CHEQUE" ? prev.micrCode : "",
      // Clear transaction number when switching payment methods
      transactionNumber: "",
    }));
    setSelectedAccount(null);
    setSearchValue("");
    setShowDetails(true);
  };

  const canSubmitPayment = () => {
    if (paymentStatus === "due") return true;

    if (!paymentData.amount) return false;
    switch (paymentData.paymentMethod) {
      case "CHEQUE":
        return (
          paymentData.chequeNumber &&
          paymentData.micrCode &&
          paymentData.chequeDate
        );
      case "BANK":
      case "UPI":
        return paymentData.accountId && paymentData.transactionNumber;
      case "CASH":
        return paymentData.accountId;
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    const finalData = {
      ...paymentData,
      amount: paymentData.amount === "" ? 0 : Number(paymentData.amount),
      status: paymentStatus,
      dueDate: paymentStatus === "due" ? dueDate : null,
      payment_type: "Purchase Invoice",
    };

    if (paymentStatus === "due") {
      finalData.paymentMethod = "";
      finalData.accountId = null;
      finalData.transactionNumber = "";
      finalData.chequeNumber = "";
      finalData.chequeDate = null;
      finalData.micrCode = "";
    }

    // Remove accountId if payment method is cheque
    if (finalData.paymentMethod === "cheque") {
      finalData.accountId = null;
    }

    onSubmit(finalData);
  };

  const renderTransactionDetails = () => {
    if (!paymentData.paymentMethod) return null;

    if (paymentData.paymentMethod === "CASH") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-md">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-green-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-600"
                >
                  <path d="M2 17h20" />
                  <path d="M2 12h20" />
                  <path d="M2 7h20" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Cash Payment</p>
                <p className="text-xs text-muted-foreground">Ready to submit</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (paymentData.paymentMethod === "CHEQUE") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-md">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-purple-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-600"
                >
                  <path d="M2 17V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z" />
                  <path d="M6 9h12v6H6z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Cheque Payment</p>
                <p className="text-xs text-muted-foreground">
                  Enter cheque details
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cheque Number</Label>
              <Input
                placeholder="Enter cheque number"
                value={paymentData.chequeNumber}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    chequeNumber: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <Label>MICR Code</Label>
              <Input
                placeholder="Enter MICR code"
                value={paymentData.micrCode}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    micrCode: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>
          <div>
            <Label>Cheque Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !paymentData.chequeDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentData.chequeDate ? (
                    format(paymentData.chequeDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={paymentData.chequeDate}
                  onSelect={(date) =>
                    setPaymentData({
                      ...paymentData,
                      chequeDate: date,
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => setShowDetails(false)}
          >
            Change Payment Method
          </Button>
        </div>
      );
    }

    if (
      paymentData.paymentMethod === "bank_transfer" ||
      paymentData.paymentMethod === "upi"
    ) {
      const account = accounts.find((acc) => acc._id === paymentData.accountId);
      if (!account) return null;

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-blue-100">
                {account.accountType === "BANK" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-600"
                  >
                    <path d="M3 21h18" />
                    <path d="M3 10h18" />
                    <path d="M5 6l7-3 7 3" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-600"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {account.accountType === "BANK"
                    ? account.bankDetails?.bankName
                    : account.accountType === "UPI"
                    ? account.upiDetails?.upiName
                    : `${account.accountType} Account`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {account.accountType === "BANK"
                    ? account.bankDetails?.accountNumber
                    : account.accountType === "UPI"
                    ? account.upiDetails?.upiId
                    : ""}
                </p>
              </div>
            </div>
            <p className="text-sm font-medium text-green-600">
              ₹{account.balance || 0}
            </p>
          </div>

          <div>
            <Label>Transaction Number</Label>
            <Input
              placeholder="Enter transaction number"
              value={paymentData.transactionNumber}
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  transactionNumber: e.target.value,
                })
              }
              required
            />
          </div>

          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => setShowDetails(false)}
          >
            Change Payment Method
          </Button>
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Payment Details</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {step === 1 ? (
            <>
              {/* Invoice Summary Section - Only in step 1 */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm text-gray-500">Distributor</Label>
                  <div className="font-medium">{invoiceData?.partyName}</div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">
                    Invoice Number
                  </Label>
                  <div className="font-medium">
                    {invoiceData?.invoiceNumber}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Invoice Date</Label>
                  <div className="font-medium">
                    {invoiceData?.invoiceDate
                      ? format(invoiceData.invoiceDate, "dd/MM/yyyy")
                      : "-"}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Total Amount</Label>
                  <div className="font-medium">₹{invoiceData?.totalAmount}</div>
                </div>
              </div>

              {/* Step 1: Payment Status and Amount */}
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <RadioGroup
                    defaultValue="due"
                    value={paymentStatus}
                    onValueChange={setPaymentStatus}
                    className="grid grid-cols-2 gap-4 pt-2"
                  >
                    <div>
                      <RadioGroupItem
                        value="due"
                        id="due"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="due"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Clock className="mb-3 h-6 w-6 text-orange-500" />
                        <div className="space-y-1 text-center">
                          <p className="text-sm font-medium leading-none">
                            Due
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Set payment due date
                          </p>
                        </div>
                      </Label>
                    </div>

                    <div>
                      <RadioGroupItem
                        value="paid"
                        id="paid"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="paid"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <CheckCircle2 className="mb-3 h-6 w-6 text-green-500" />
                        <div className="space-y-1 text-center">
                          <p className="text-sm font-medium leading-none">
                            Paid
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Enter payment details
                          </p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {paymentStatus === "due" ? (
                  <div>
                    <Label>Payment Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? (
                            format(dueDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={setDueDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <div>
                    <Label>Amount Paid</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={paymentData.amount}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          amount: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {!showDetails ? (
                <div className="grid grid-cols-1 gap-2">
                  {/* Cheque Option */}
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-md border border-muted bg-popover p-3 hover:bg-blue-100/70 hover:border-blue-300 cursor-pointer transition-all duration-200",
                      paymentData.paymentMethod === "CHEQUE" &&
                        "border-blue-500 bg-blue-100"
                    )}
                    onClick={() => handlePaymentMethodChange("CHEQUE")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-full bg-purple-100">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-purple-600"
                        >
                          <path d="M2 17V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z" />
                          <path d="M6 9h12v6H6z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Cheque Payment</p>
                        <p className="text-xs text-muted-foreground">
                          Pay by cheque
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Account Options */}
                  {accounts.map((account) => (
                    <div
                      key={account._id}
                      className={cn(
                        "flex items-center justify-between rounded-md border border-muted bg-popover p-3 hover:bg-blue-100/70 hover:border-blue-300 cursor-pointer transition-all duration-200",
                        paymentData.paymentMethod ===
                          `ACCOUNT_${account._id}` &&
                          "border-blue-500 bg-blue-100"
                      )}
                      onClick={() =>
                        handlePaymentMethodChange(`ACCOUNT_${account._id}`)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-full bg-blue-100">
                          {account.accountType === "BANK" ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-blue-600"
                            >
                              <path d="M3 21h18" />
                              <path d="M3 10h18" />
                              <path d="M5 6l7-3 7 3" />
                            </svg>
                          ) : account.accountType === "UPI" ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-blue-600"
                            >
                              <rect width="20" height="14" x="2" y="5" rx="2" />
                              <line x1="2" x2="22" y1="10" y2="10" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-blue-600"
                            >
                              <path d="M4 10V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6" />
                              <path d="M2 17a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6H2Z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">
                                {account.accountType === "BANK"
                                  ? account.bankDetails?.bankName
                                  : account.accountType === "UPI"
                                  ? account.upiDetails?.upiName
                                  : `${account.accountType} Account`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {account.accountType === "BANK"
                                  ? account.bankDetails?.accountNumber
                                  : account.accountType === "UPI"
                                  ? account.upiDetails?.upiId
                                  : ""}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-green-600 whitespace-nowrap">
                              ₹{account.balance || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                renderTransactionDetails()
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer with buttons - Only show for non-cash payments */}
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-end">
            {paymentStatus === "due" ? (
              <Button onClick={handleSubmit}>Submit</Button>
            ) : (
              <Button
                onClick={() => {
                  if (step === 1) setStep(2);
                  else if (step === 2) handleSubmit();
                }}
                disabled={!paymentData.amount}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
