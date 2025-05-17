import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAccounts } from "../../../redux/slices/accountSlice";
import { createPayment } from "../../../redux/slices/paymentSlice";
import { fetchDistributors } from "../../../redux/slices/distributorSlice";
import { Dialog, DialogContent, DialogHeader, DialogTitle} from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { ScrollArea } from "../../ui/scroll-area";
import { format } from "date-fns";
import { Building2, CreditCard, BanknoteIcon, Wallet, Landmark, ArrowLeft } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Separator } from "../../ui/separator";
import { useToast } from "../../../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Backend_URL } from "../../../assets/Data";
import { Textarea } from "../../ui/textarea";
import { formatCurrency } from "../../../utils/Helper";

export default function MakePaymentDlg({ open, onOpenChange, paymentData, showStep1 }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accounts, fetchStatus } = useSelector((state) => state.accounts);
  const { createPaymentStatus } = useSelector((state) => state.payment);
  const [step, setStep] = useState(showStep1 ? 1 : 2);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState(null);

  const [paymentDetails, setPaymentDetails] = useState({
    amount: paymentData?.amount || "",
    paymentMethod: "",
    accountId: "",
    chequeNumber: "",
    chequeDate: new Date(),
    micrCode: "",
    transactionNumber: "",
    remarks: "",
    paymentDate: new Date(),
  });

  useEffect(() => {
    if(fetchStatus === 'idle') {
      dispatch(fetchAccounts()).unwrap()
        .catch(err => setError(err.message));
    }
  }, [dispatch, fetchStatus]);

  useEffect(() => {
    if (open) {
      setError(null);
      setStep(showStep1 ? 1 : 2);
      setShowDetails(false);
      setPaymentDetails({
        amount: paymentData?.amount || "",
        paymentMethod: "",
        accountId: "",
        chequeNumber: "",
        chequeDate: new Date(),
        micrCode: "",
        transactionNumber: "",
        remarks: paymentData?.remarks || "",
        paymentDate: new Date(),
      });
    }
  }, [open, dispatch, showStep1, paymentData]);

  useEffect(() => {
    const fetchPaymentNumber = async () => {
      const response = await fetch(`${Backend_URL}/api/payment/payment-number`, {credentials: "include"});
      const data = await response.json();
      setPaymentDetails(prev => ({
        ...prev,
        paymentNumber: data.paymentNumber,
      }));
    }
    if(open) {
      fetchPaymentNumber();
    }
  }, [open]);

  const handleBack = () => {
    if (step === 3) {
      setShowDetails(false);
      setStep(2);
    } else if (step === 2 && showStep1) {
      setStep(1);
      setPaymentDetails(prev => ({
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
      accountId = null;
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

    setPaymentDetails((prev) => ({
      ...prev,
      paymentMethod,
      accountId,
      chequeNumber: paymentMethod === "CHEQUE" ? prev.chequeNumber : "",
      chequeDate: paymentMethod === "CHEQUE" ? prev.chequeDate : null,
      micrCode: paymentMethod === "CHEQUE" ? prev.micrCode : "",
      transactionNumber: "",
    }));
    setShowDetails(true);
    setStep(3);
  };

  const canSubmitPayment = () => {
    switch (paymentDetails.paymentMethod) {
      case "CHEQUE":
        return (
          paymentDetails.chequeNumber &&
          paymentDetails.chequeNumber.trim() !== "" &&
          paymentDetails.chequeDate
        );
      case "BANK":
      case "UPI":
        return paymentDetails.accountId;
      case "CASH":
        return paymentDetails.accountId && paymentDetails.accountId.trim() !== "";
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    const finalData = {
      ...paymentData,
      ...paymentDetails,
      paymentMethod: paymentDetails.paymentMethod,
      accountId: paymentDetails.accountId,
    };

    finalData.amount = Number(finalData.amount);

    // Remove accountId if payment method is cheque
    if (finalData.paymentMethod === "CHEQUE") {
      finalData.accountId = null;
    }

    dispatch(createPayment(finalData)).unwrap()
      .then((data) => {
        toast({title: "Payment added successfully", variant: "success"});
        dispatch(fetchDistributors());
        navigate(`/payment/${data?._id}`);
      })
      .catch((error) => {
        toast({title: "Failed to create payment", variant: "destructive"});
      });
  };

  const renderTransactionDetails = () => {
    if (!paymentDetails.paymentMethod) return null;

    if (paymentDetails.paymentMethod === "CASH") {
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

    if (paymentDetails.paymentMethod === "CHEQUE") {
      return (
        <div className="space-y-4 px-2">
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-md">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-purple-100">
                <CreditCard size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Cheque Payment</p>
                <p className="text-xs text-muted-foreground">Enter cheque details</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cheque Number</Label>
              <Input
                placeholder="Enter cheque number"
                value={paymentDetails.chequeNumber}
                onChange={(e) =>
                  setPaymentDetails({
                    ...paymentDetails,
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
                value={paymentDetails.micrCode}
                onChange={(e) =>
                  setPaymentDetails({
                    ...paymentDetails,
                    micrCode: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>
          <div>
            <Label>Cheque Date</Label>
            <Input
              type="date"
              value={paymentDetails.chequeDate ? format(paymentDetails.chequeDate, "yyyy-MM-dd") : ""}
              onChange={(e) =>
                setPaymentDetails({
                  ...paymentDetails,
                  chequeDate: new Date(e.target.value),
                })
              }
              className="w-full"
            />
          </div>
        </div>
      );
    }

    if (paymentDetails.paymentMethod === "BANK" || paymentDetails.paymentMethod === "UPI") {
      const account = accounts.find((acc) => acc._id === paymentDetails.accountId);
      if (!account) return null;

      return (
        <div className="space-y-4 px-2">
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

          <div >
            <Label>Transaction Number</Label>
            <Input
              placeholder="Enter transaction number (optional)"
              value={paymentDetails.transactionNumber}
              onChange={(e) =>
                setPaymentDetails({
                  ...paymentDetails,
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
            {((showStep1 && step > 1) || (!showStep1 && step > 2)) && (
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
            {step === 1 && showStep1 ? (
              <div className="space-y-4 px-1">
                {/* Invoice Summary Section - Only in step 1 */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="col-span-2">
                    <Label className="text-sm text-gray-500">{paymentData?.invoiceType === 'sales' ? 'Customer' : 'Distributor'} Name</Label>
                    <div className="font-medium">{paymentData?.distributorName}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Payment Number</Label>
                    <div className="font-medium">{paymentDetails.paymentNumber}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">
                      Invoice Number
                    </Label>
                    <div className="font-medium">
                      {paymentData?.bills[0]?.billNumber}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-500">Total Amount</Label>
                    <div className="font-medium">{formatCurrency(paymentData?.bills[0]?.grandTotal)}</div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500 ">Due Amount</Label>
                    <div className="font-medium text-rose-500">{formatCurrency(paymentData?.bills[0]?.grandTotal - paymentData?.bills[0]?.amountPaid)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {/* Amount Input */}
                    <div className="space-y-1">
                    <Label>Amount Paying</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={paymentDetails.amount}   
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            amount: e.target.value,
                          })
                        }
                        className="pl-7 font-semibold"
                      />
                    </div>
                    </div>

                    {/* Payment Date Input */}
                    <div className="space-y-1">
                    <Label>Payment Date</Label>
                    <Input
                        type="date"
                        className='font-bold'
                        value={paymentDetails.paymentDate ? format(paymentDetails.paymentDate, "yyyy-MM-dd") : ""}
                        onChange={(e) =>
                        setPaymentDetails({
                            ...paymentDetails,
                            paymentDate: new Date(e.target.value),
                        })
                        }
                    />
                    </div>
                </div>

                {/* Remarks Input */}
                <div className="space-y-1">
                  <Label>Remarks</Label>
                  <Textarea
                    type="text"
                    className='font-semibold'
                    placeholder="Enter remarks (optional)"
                    value={paymentDetails.remarks}
                    onChange={(e) =>
                      setPaymentDetails({
                        ...paymentDetails,
                        remarks: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {!showDetails || step === 2 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {/* Cheque Option */}
                    <div
                      className={cn(
                        "flex items-center justify-between rounded-md border border-muted bg-popover p-3 hover:bg-blue-100/70 hover:border-blue-300 cursor-pointer transition-all duration-200",
                        paymentDetails.paymentMethod === "CHEQUE" &&
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
                          paymentDetails.accountId === account._id &&
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
                              <p className="text-sm font-medium text-green-600 whitespace-nowrap">
                               {formatCurrency(account.balance  || 0)}
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
            className='px-4 text-[14px]'
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={createPaymentStatus === 'loading'}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (step === 1) {
                setStep(2);
              } else if (step === 2) {
                if (paymentDetails.paymentMethod) {
                  setShowDetails(true);
                  setStep(3);
                }
              } else if (step === 3 && canSubmitPayment()) {
                handleSubmit();
              }
            }}
            disabled={
              (step === 1 ? !paymentDetails.amount : 
               step === 3 ? !canSubmitPayment() : false) ||
              createPaymentStatus === 'loading'
            }
            className="bg-blue-600 text-white hover:bg-blue-700 px-4 text-[14px]"
          >
            {createPaymentStatus === 'loading' ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </div>
            ) : step === 3 ? (
              "Submit"
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
