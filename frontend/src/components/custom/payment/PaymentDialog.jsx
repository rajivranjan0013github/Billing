import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAccounts } from "../../../redux/slices/accountSlice";
import { Dialog, DialogContent, DialogHeader, DialogTitle} from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { ScrollArea } from "../../ui/scroll-area";
import { format } from "date-fns";
import { Clock, CheckCircle2, BanknoteIcon, CreditCard, Building2, Wallet, Landmark, ArrowLeft } from "lucide-react";
import { cn } from "../../../lib/utils";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import { Separator } from "../../ui/separator";

export default function PaymentDialog({ open, onOpenChange, invoiceData, onSubmit}) {
  const dispatch = useDispatch();
  const { accounts, fetchStatus } = useSelector((state) => state.accounts);
  const { createPurchaseBillStatus } = useSelector((state) => state.purchaseBill);
  const [step, setStep] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState("due");
  const [dueDate, setDueDate] = useState(new Date(invoiceData?.dueDate || new Date()));
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
    if(fetchStatus === 'idle') {
      dispatch(fetchAccounts()).unwrap()
        .catch(err => setError(err.message));
    }
  }, [dispatch, fetchStatus]);

  // Add error state
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setStep(1);
      setPaymentStatus("due");
      setDueDate(new Date(invoiceData?.dueDate || new Date()));
      setShowDetails(false);
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
        amount: invoiceData?.grandTotal || "",
      }));
    } else {
      setPaymentData((prev) => ({
        ...prev,
        amount: "",
      }));
    }
  }, [paymentStatus, invoiceData?.grandTotal]);

  const handleBack = () => {
    if (step === 3) {
      setShowDetails(false);
      setStep(2);
    } else if (step === 2) {
      setStep(1);
      setPaymentData(prev => ({
        ...prev,
        paymentMethod: "",
        accountId: "",
      }));
    }
  };

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
    setShowDetails(true);
    setStep(3); // Move to payment details step
  };

  const canSubmitPayment = () => {
    if (paymentStatus === "due") return true;

    const amount = Number(paymentData.amount);
    if (!amount || amount <= 0) return false;
    
    switch (paymentData.paymentMethod) {
      case "CHEQUE":
        return (
          paymentData.chequeNumber &&
          paymentData.chequeNumber.trim() !== "" &&
          paymentData.chequeDate
        );
      case "BANK":
      case "UPI":
        return paymentData.accountId;  // Only require accountId, transaction number is optional
      case "CASH":
        return paymentData.accountId && paymentData.accountId.trim() !== "";
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    const finalData = {
      ...paymentData,
      amount: paymentData.amount === "" ? 0 : Number(paymentData.amount),
      status: paymentStatus,
      dueDate,
      paymentType: "Purchase Invoice",
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
    if (finalData.paymentMethod === "CHEQUE") {
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
                <BanknoteIcon size={18} className="text-green-600" />
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
                <CreditCard size={18} className="text-purple-600" />
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
              <Label>MICR Code (Optional)</Label>
              <Input
                placeholder="Enter MICR code"
                value={paymentData.micrCode}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    micrCode: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div>
            <Label>Cheque Date</Label>
            <Input
              type="date"
              value={paymentData.chequeDate ? format(paymentData.chequeDate, "yyyy-MM-dd") : ""}
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  chequeDate: new Date(e.target.value),
                })
              }
              className="w-full"
              required
            />
          </div>
        </div>
      );
    }

    if (paymentData.paymentMethod === "BANK" || paymentData.paymentMethod === "UPI") {
      const account = accounts.find((acc) => acc._id === paymentData.accountId);
      if (!account) return null;

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-blue-100">
                {account.accountType === "BANK" ? (
                  <Building2 size={18} className="text-blue-600" />
                ) : account.accountType === "UPI" ? (
                  <Wallet size={18} className="text-blue-600" />
                ) : (
                  <Landmark size={18} className="text-blue-600" />
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
            <Label>Transaction Number (Optional)</Label>
            <Input
              placeholder="Enter transaction number"
              value={paymentData.transactionNumber}
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  transactionNumber: e.target.value,
                })
              }
            />
          </div>
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0">
        <DialogHeader className="px-4 py-2.5 flex flex-row items-center bg-gray-100 border-b">
          <div className="flex items-center flex-1">
            {step > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 mr-2 -ml-2"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-base font-semibold">
              {step === 1 ? "Add Payment Details" : 
               step === 2 ? "Select Payment Method" : 
               "Enter Payment Details"}
            </DialogTitle>
          </div>
        </DialogHeader>
        <Separator />

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="p-6">
          <ScrollArea className="h-[400px]">
            {step === 1 ? (
              <>
                {/* Invoice Summary Section - Only in step 1 */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm text-gray-500">Distributor</Label>
                    <div className="font-medium">{invoiceData?.distributorName}</div>
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
                        ? format(new Date(invoiceData.invoiceDate), "dd/MM/yyyy")
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Total Amount</Label>
                    <div className="font-medium">₹{invoiceData?.grandTotal}</div>
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
                      <Input
                        type="date"
                        value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""}
                        onChange={(e) => setDueDate(new Date(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
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
                       
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {!showDetails || step === 2 ? (
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
                          <CreditCard size={18} className="text-purple-600" />
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
                              <Building2 size={18} className="text-blue-600" />
                            ) : account.accountType === "UPI" ? (
                              <Wallet size={18} className="text-blue-600" />
                            ) : (
                              <Landmark size={18} className="text-blue-600" />
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
        </div>

        <div className="p-3 bg-gray-100 border-t flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className=""
          >
            Cancel
          </Button>
          {paymentStatus === "due" ? (
            <Button
              size="sm"
              onClick={handleSubmit}
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={createPurchaseBillStatus === 'loading'}
            >
              {createPurchaseBillStatus === 'loading' ? 'Submitting...' : 'Submit'}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                if (step === 1) setStep(2);
                else if (step === 2) setStep(3);
                else if (step === 3 && canSubmitPayment()) handleSubmit();
              }}
              disabled={
                (step === 3 ? !canSubmitPayment() : !paymentData.amount) ||
                createPurchaseBillStatus === 'loading'
              }
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {createPurchaseBillStatus === 'loading' ? 'Submitting...' : 
               step === 3 ? "Submit" : "Next"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
