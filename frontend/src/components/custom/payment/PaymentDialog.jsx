import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAccounts } from "../../../redux/slices/accountSlice";
import { roundToTwo } from "../../../pages/CreatePurchaseInvoice";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { ScrollArea } from "../../ui/scroll-area";
import { format } from "date-fns";
import { Clock, CheckCircle2, BanknoteIcon, CreditCard, Building2, Wallet, Landmark, ArrowLeft} from "lucide-react";
import { cn } from "../../../lib/utils";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import { Separator } from "../../ui/separator";
import { formatCurrency } from "../../../utils/Helper";

export default function PaymentDialog({ open, onOpenChange, invoiceData, onSubmit, billStatus}) {
  const dispatch = useDispatch();
  const { accounts, fetchStatus } = useSelector((state) => state.accounts);
  const [step, setStep] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [dueDate, setDueDate] = useState();
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMethodIndex, setSelectedMethodIndex] = useState(1);
  const inputRef = useRef({});

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
    if (fetchStatus === "idle") {
      dispatch(fetchAccounts()).unwrap().catch((err) => setError(err.message));
    }
  }, [dispatch, fetchStatus]);

  const calculateDueAmount = () => {
    const totalDue = invoiceData?.grandTotal || 0;
    const alreadyPaid = invoiceData?.alreadyPaid || 0;
    const currentPayment = Number(paymentData?.amount || 0);
    return roundToTwo(totalDue - (alreadyPaid + currentPayment));
  };
  // Add error state
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      // Focus on the radio group when dialog opens
      setTimeout(() => {
        if (invoiceData?.isCashCounter) {
          if (inputRef?.current["nextButton"]) {
            inputRef?.current["nextButton"].focus();
          }
        } else {
          if (inputRef?.current["paymentStatus"]) {
            inputRef?.current["paymentStatus"].focus();
          }
        }
      }, 100);

      setError(null);
      // Reset all states when dialog opens
      setStep(invoiceData?.isCashCounter ? 2 : 1);

      // For new invoices, default to paid if it's cash counter, otherwise due
      // For existing invoices, start with paid status
      // const initialStatus = invoiceData?.isNewInvoice ? invoiceData?.isCashCounter ? "paid"  : "due": "paid";
      // setPaymentStatus(initialStatus);

      setShowDetails(false);
      setSelectedMethodIndex(1);

      // Calculate initial amount based on remaining due and payment status
      const remainingDue = (invoiceData?.grandTotal || 0) - (invoiceData?.alreadyPaid || 0);

      setPaymentData({
        amount: roundToTwo(remainingDue),
        paymentMethod: "",
        accountId: "",
        chequeNumber: "",
        chequeDate: new Date(),
        micrCode: "",
        transactionNumber: "",
      });

      // If there are accounts, automatically select the first account
      if (accounts && accounts.length > 0 && paymentStatus === "paid") {
        const firstAccount = accounts[0];
        setPaymentData((prev) => ({
          ...prev,
          paymentMethod: `ACCOUNT_${firstAccount._id}`,
          accountId: firstAccount._id,
        }));
      }
    }
  }, [open, dispatch, accounts, invoiceData]);

  // Add effect to update amount when payment status changes
  useEffect(() => {
    const remainingDue = (invoiceData?.grandTotal || 0) - (invoiceData?.alreadyPaid || 0);
    setPaymentData((prev) => ({
      ...prev,
      amount: paymentStatus === "due" ? 0 : roundToTwo(remainingDue),
      paymentMethod: paymentStatus === "due" ? "" : prev.paymentMethod,
      accountId: paymentStatus === "due" ? "" : prev.accountId,
    }));
  }, [paymentStatus, invoiceData]);

  // Calculate due amount considering already paid amounts
  const dueAmount = calculateDueAmount();

  const handleBack = () => {
    if (step === 3) {
      setShowDetails(false);
      setStep(2);
    } else if (step === 2) {
      setStep(1);
      setPaymentData((prev) => ({
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

    // Focus on cheque number input if cheque method is selected
    if (paymentMethod === "CHEQUE") {
      setTimeout(() => {
        if (inputRef.current["chequeNumber"]) {
          inputRef.current["chequeNumber"].focus();
        }
      }, 100);
    }
  };

  const canSubmitPayment = () => {
    if (paymentStatus === "due") return dueDate != null;

    switch (paymentData.paymentMethod) {
      case "CHEQUE":
        return (
          paymentData.chequeNumber &&
          paymentData.chequeNumber.trim() !== "" &&
          paymentData.chequeDate
        );
      case "BANK":
      case "UPI":
        return paymentData.accountId; // Only require accountId, transaction number is optional
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
      dueDate:
        paymentStatus === "due" || Number(paymentData.amount) < Number(invoiceData?.grandTotal)? dueDate: null,
      paymentType: "Purchase Invoice",
      totalPaid: (invoiceData?.alreadyPaid || 0) + Number(paymentData.amount || 0), // Add this to track cumulative payment
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
                onKeyDown={(e) => handleKeyDown(e, "micrCode")}
                ref={(el) => (inputRef.current["chequeNumber"] = el)}
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
                onKeyDown={(e) => handleKeyDown(e, "chequeDate")}
                ref={(el) => (inputRef.current["micrCode"] = el)}
              />
            </div>
          </div>
          <div>
            <Label>Cheque Date</Label>
            <Input
              type="date"
              value={paymentData.chequeDate? format(paymentData.chequeDate, "yyyy-MM-dd"): ""}
              onChange={(e) =>
                setPaymentData({...paymentData,chequeDate: new Date(e.target.value),})
              }
              className="w-full"
              onKeyDown={(e) => handleKeyDown(e, "nextField")}
              ref={(el) => (inputRef.current["chequeDate"] = el)}
              required
            />
          </div>
        </div>
      );
    }

    if ( paymentData.paymentMethod === "BANK" || paymentData.paymentMethod === "UPI") {
      const account = accounts.find((acc) => acc._id === paymentData.accountId);
      if (!account) return null;

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-blue-100 rounded-md">
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
                    ? account.bankDetails?.bankName || "Bank Account"
                    : account.accountType === "UPI"
                    ? account.upiDetails?.upiName || "UPI Account"
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
              onKeyDown={(e) => handleKeyDown(e, "amount")}
              ref={(el) => (inputRef.current["transactionNumber"] = el)}
            />
          </div>
        </div>
      );
    }
  };

  // Update the handleKeyDown function to prevent double-triggering of steps when pressing Enter
  const handleKeyDown = (e, nextInputId, isRadioGroup = false) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      
      if (isRadioGroup) {
        // If it's the radio group, determine next input based on payment status
        const nextInput = paymentStatus === "due" ? "dueDate" : "amount";
        if (inputRef.current[nextInput]) {
          inputRef.current[nextInput].focus();
        }
      } else if (nextInputId === "dueSubmitButton") {
        if (paymentStatus === "due" && dueDate) {
          handleSubmit();
        }
      } else if (nextInputId === "nextButton") {
        // Only focus the next button, don't trigger any action
        if (inputRef.current["nextButton"]) {
          inputRef.current["nextButton"].focus();
        }
      } else if (nextInputId && inputRef.current[nextInputId]) {
        inputRef.current[nextInputId].focus();
      }
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (selectedMethodIndex === 0) {
        handlePaymentMethodChange("CHEQUE");
      } else if (selectedMethodIndex > 0 && accounts[selectedMethodIndex - 1]) {
        const selectedAccount = accounts[selectedMethodIndex - 1];
        handlePaymentMethodChange(`ACCOUNT_${selectedAccount._id}`);
      }
    } else if (step === 3 && canSubmitPayment()) {
      handleSubmit();
    }
  };

  // Add keyboard navigation handler
  const handleKeyNavigation = (e) => {
    if (step !== 2) return;

    const totalMethods = accounts.length + 1; // 1 for cheque + number of accounts

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        setSelectedMethodIndex((prev) => {
          const newIndex = (prev - 1 + totalMethods) % totalMethods;
          // Update payment data to match selection
          if (newIndex === 0) {
            setPaymentData((prev) => ({
              ...prev,
              paymentMethod: "CHEQUE",
              accountId: "",
            }));
          } else {
            const selectedAccount = accounts[newIndex - 1];
            setPaymentData((prev) => ({
              ...prev,
              paymentMethod: `ACCOUNT_${selectedAccount._id}`,
              accountId: selectedAccount._id,
            }));
          }
          return newIndex;
        });
        break;
      case "ArrowDown":
        e.preventDefault();
        setSelectedMethodIndex((prev) => {
          const newIndex = (prev + 1) % totalMethods;
          // Update payment data to match selection
          if (newIndex === 0) {
            setPaymentData((prev) => ({
              ...prev,
              paymentMethod: "CHEQUE",
              accountId: "",
            }));
          } else {
            const selectedAccount = accounts[newIndex - 1];
            setPaymentData((prev) => ({
              ...prev,
              paymentMethod: `ACCOUNT_${selectedAccount._id}`,
              accountId: selectedAccount._id,
            }));
          }
          return newIndex;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (selectedMethodIndex === 0) {
          handlePaymentMethodChange("CHEQUE");
        } else {
          const selectedAccount = accounts[selectedMethodIndex - 1];
          handlePaymentMethodChange(`ACCOUNT_${selectedAccount._id}`);
        }
        break;
      default:
        break;
    }
  };

  // Add effect to handle keyboard events
  useEffect(() => {
    if (step === 2) {
      window.addEventListener("keydown", handleKeyNavigation);
      return () => window.removeEventListener("keydown", handleKeyNavigation);
    }
  }, [step, selectedMethodIndex, accounts]);

  // Add effect to sync payment method with selected index
  useEffect(() => {
    if (step === 2) {
      const totalMethods = accounts.length + 1;
      if (selectedMethodIndex >= 0 && selectedMethodIndex < totalMethods) {
        if (selectedMethodIndex === 0) {
          setPaymentData((prev) => ({
            ...prev,
            paymentMethod: "CHEQUE",
            accountId: "",
          }));
        } else {
          const selectedAccount = accounts[selectedMethodIndex - 1];
          setPaymentData((prev) => ({
            ...prev,
            paymentMethod: `ACCOUNT_${selectedAccount._id}`,
            accountId: selectedAccount._id,
          }));
        }
      }
    }
  }, [selectedMethodIndex, step, accounts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[450px] p-0 gap-0 font-semibold">
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
              {step === 1
                ? "Add Payment Details"
                : step === 2
                ? "Select Payment Method"
                : "Enter Payment Details"}
            </DialogTitle>
          </div>
        </DialogHeader>
        <Separator />

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm">{error}</div>
        )}

        <div>
          <ScrollArea className="h-[350px]">
            {step === 1 ? (
              <>
                {/* Invoice Summary Section - Only in step 1 */}
                <div className="grid grid-cols-2 gap-2 py-2 px-4 bg-gray-50 rounded-lg">
                  <div className="col-span-2">
                    <Label className="">
                      {invoiceData?.invoiceType === "sales" ? "Customer Name" : "Distributor Name"}
                    </Label>
                    <Input
                      value={invoiceData?.distributorName}
                      disabled={true}
                      className="font-bold border-gray-500"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Invoice Number</Label>
                    <Input
                      value={invoiceData?.invoiceNumber}
                      disabled={true}
                      className="font-bold border-gray-500"
                    />
                  </div>
                  <div>
                    <Label className="text-sm ">Invoice Date</Label>
                    <Input
                      value={invoiceData?.invoiceDate? format(new Date(invoiceData.invoiceDate),"dd/MM/yyyy"): "-"}
                      disabled={true}
                      className="font-bold border-gray-500"
                    />
                  </div>
                </div>

                {/* Step 1: Payment Status and Amount */}
                <div className="space-y-4">
                  <div className="space-y-2 px-4 ">
                    <Label>Payment Types</Label>
                    <RadioGroup
                      defaultValue="due"
                      value={paymentStatus}
                      onValueChange={setPaymentStatus}
                      className="grid grid-cols-2 gap-4"
                      ref={(el) => (inputRef.current["paymentStatus"] = el)}
                      onKeyDown={(e) => handleKeyDown(e, null, true)}
                    >
                       <div>
                        <RadioGroupItem
                          value="paid"
                          id="paid"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="paid"
                          className="flex  items-center  justify-center gap-1  border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                          <div className="space-y-1 text-center">Paid/Cash</div>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="due"
                          id="due"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="due"
                          className="flex items-center justify-center gap-1  border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <Clock className="h-6 w-6 text-orange-500" />
                          <div className="space-y-1 text-center">
                            Due/Credit
                          </div>
                        </Label>
                      </div>

                     
                    </RadioGroup>
                    <p className="text-xs">use arrow key ← →</p>
                  </div>

                  {paymentStatus === "due" ? (
                    <div className="px-4 w-1/2">
                      <Label>Payment Due Date</Label>
                      <Input
                        type="date"
                        value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const enteredValue = e.target.value;
                          const potentialDate = enteredValue? new Date(enteredValue): null;
                          if (potentialDate &&!isNaN(potentialDate.getTime())) {
                            setDueDate(potentialDate);
                          } else {
                            setDueDate(null); // Set to null if date is invalid
                          }
                        }}
                        className="w-full"
                        onKeyDown={(e) => handleKeyDown(e, "dueSubmitButton")}
                        ref={(el) => (inputRef.current["dueDate"] = el)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4 px-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Amount Paid</Label>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            value={paymentData.amount}
                            onChange={(e) =>
                              setPaymentData({...paymentData,amount: e.target.value,})
                            }
                            onKeyDown={(e) => {
                              if (Number(paymentData.amount) <Number(invoiceData?.grandTotal)) {
                                handleKeyDown(e, "dueDate2");
                              } else {
                                handleKeyDown(e, "nextButton");
                              }
                            }}
                            ref={(el) => (inputRef.current["amount"] = el)}
                          />
                        </div>
                        {dueAmount !== 0 && (
                          <div>
                            <Label>Payment Due Date</Label>
                            <Input
                              type="date"
                              value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""}
                              onChange={(e) => {
                                const enteredValue = e.target.value;
                                const potentialDate = enteredValue ? new Date(enteredValue) : null;
                                if (potentialDate && !isNaN(potentialDate.getTime())) {
                                  setDueDate(potentialDate);
                                } else {
                                  setDueDate(null); // Set to null if date is invalid
                                }
                              }}
                              className="w-full"
                              onKeyDown={(e) => handleKeyDown(e, "nextButton")}
                              ref={(el) => (inputRef.current["dueDate2"] = el)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3 px-4 mt-2">
                {!showDetails || step === 2 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {/* Account Options */}
                    {accounts.map((account, index) => (
                      <div
                        key={account._id}
                        className={cn(
                          "flex items-center justify-between rounded-md border border-muted bg-popover p-3 hover:bg-blue-100/70 hover:border-blue-600  cursor-pointer transition-all duration-200",
                          selectedMethodIndex === index + 1 &&
                            "border-blue-500 bg-blue-100 hover:border-blue-500 hover:bg-blue-100"
                        )}
                        onClick={() => {
                          setSelectedMethodIndex(index + 1);
                          handlePaymentMethodChange(`ACCOUNT_${account._id}`);
                        }}
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
                                    ? account.bankDetails?.bankName ||
                                      "Bank Account"
                                    : account.accountType === "UPI"
                                    ? account.upiDetails?.upiName ||
                                      "UPI Account"
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
                                {formatCurrency(account.balance || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Cheque Option */}
                    <div
                      className={cn(
                        "flex items-center justify-between rounded-md border border-muted bg-popover p-3 hover:bg-blue-100/70 hover:border-blue-300 cursor-pointer transition-all duration-200",
                        selectedMethodIndex === 0 &&
                          "border-blue-500 bg-blue-100"
                      )}
                      onClick={() => {
                        setSelectedMethodIndex(0);
                        handlePaymentMethodChange("CHEQUE");
                      }}
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
                  </div>
                ) : (
                  renderTransactionDetails()
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="grid grid-cols-3 px-2 py-2 text-lg font-semibold text-center bg-pink-100">
          <div>
            <p className="text-sm text-gray-500">TOTAL AMOUNT</p>
            <p className="font-bold">
              {formatCurrency(invoiceData?.grandTotal)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">
              {/* {invoiceData?.isNewInvoice ? "PAYING NOW" : "TOTAL PAID"} */}
              PAYING NOW
            </p>
            <p>
              {!invoiceData?.isNewInvoice && (
                <span className="">
                  {formatCurrency(invoiceData?.alreadyPaid || 0)}+
                </span>
              )}
              <span className="font-bold text-green-600">
                {" "}
                {formatCurrency(Number(paymentData.amount || 0))}{" "}
              </span>
            </p>
            {/* <p>Aready Paid : {}</p> */}
          </div>
          <div>
            <p className="text-sm text-gray-500">BALANCE DUE</p>
            <p className="font-bold">
              {dueAmount > 0 ? formatCurrency(dueAmount) : dueAmount === 0 ? "-" : `-${formatCurrency(Math.abs(dueAmount))}`}
            </p>
          </div>
        </div>

        <div className="p-3 bg-gray-100 border-t">
          <div className="flex items-center justify-end gap-2">
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
                disabled={!dueDate || billStatus === "loading"}
                ref={(el) => (inputRef.current["dueSubmitButton"] = el)}
              >
                {billStatus === "loading" ? "Submitting..." : "Submit"}
              </Button>
            ) : (
              <Button
                size="sm"
                ref={(el) => (inputRef.current["nextButton"] = el)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNextStep();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNextStep();
                  }
                }}
                disabled={
                  (step === 1 && !paymentData.amount && paymentStatus !== "due") ||
                  (step === 3 && !canSubmitPayment()) ||
                  billStatus === "loading"
                }
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {billStatus === "loading" ? "Submitting..." : step === 3 ? "Submit" : "Next"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
