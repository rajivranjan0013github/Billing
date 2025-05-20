import { useState, useEffect, useRef } from "react";
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
import { BanknoteIcon, CreditCard, Building2, Wallet, Landmark, ArrowLeft } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Separator } from "../../ui/separator";
import { formatCurrency } from "../../../utils/Helper";

export default function RefundDialog({
  open,
  onOpenChange,
  refundData,
  onSubmit,
  loadingStatus,
}) {
  const dispatch = useDispatch();
  const { accounts, fetchStatus } = useSelector((state) => state.accounts);
  const [step, setStep] = useState(1);
  const [selectedMethodIndex, setSelectedMethodIndex] = useState(1);
  const inputRef = useRef({});
  const [error, setError] = useState(null);

  // Refund state
  const [refundDetails, setRefundDetails] = useState({
    amount: "",
    method: "CASH", // Default refund method
    accountId: "",
    chequeNumber: "",
    chequeDate: new Date(),
    micrCode: "",
    transactionNumber: "",
  });

  useEffect(() => {
    if (fetchStatus === "idle") {
      dispatch(fetchAccounts())
        .unwrap()
        .catch((err) => setError("Failed to fetch accounts: " + err.message));
    }
  }, [dispatch, fetchStatus]);

  // Reset state when dialog opens or refundData changes
  useEffect(() => {
    if (open && refundData) {
      setError(null);
      setStep(1);
      setSelectedMethodIndex(1);

      setRefundDetails({
        amount: refundData.refundableAmount || 0,
        method: "CASH",
        accountId: "",
        chequeNumber: "",
        chequeDate: new Date(),
        micrCode: "",
        transactionNumber: "",
      });

      // Pre-select first available CASH account
      if (accounts && accounts.length > 0) {
        const firstCashAccount = accounts.find(
          (acc) => acc.accountType === "CASH"
        );
        if (firstCashAccount) {
          setSelectedMethodIndex(accounts.indexOf(firstCashAccount) + 1);
        }
      }

      // Focus on first input
      setTimeout(() => {
        if (inputRef?.current["nextButton"]) {
          inputRef?.current["nextButton"].focus();
        }
      }, 100);
    }
  }, [open, refundData, accounts]);

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setRefundDetails(prev => ({
        ...prev,
        method: "CASH",
        accountId: "",
      }));
    }
  };

  const handlePaymentMethodChange = (value) => {
    let method;
    let accountId = "";

    if (value === "CHEQUE") {
      method = "CHEQUE";
      accountId = null;
    } else if (value.startsWith("ACCOUNT_")) {
      accountId = value.replace("ACCOUNT_", "");
      const account = accounts.find((acc) => acc._id === accountId);

      switch (account?.accountType) {
        case "BANK":
          method = "BANK";
          break;
        case "UPI":
          method = "UPI";
          break;
        case "CASH":
          method = "CASH";
          break;
        default:
          method = "BANK";
      }
    }

    setRefundDetails(prev => ({
      ...prev,
      method,
      accountId,
      chequeNumber: method === "CHEQUE" ? prev.chequeNumber : "",
      chequeDate: method === "CHEQUE" ? prev.chequeDate : null,
      micrCode: method === "CHEQUE" ? prev.micrCode : "",
      transactionNumber: "",
    }));

    setStep(2);

    if (method === "CHEQUE") {
      setTimeout(() => {
        if (inputRef.current["chequeNumber"]) {
          inputRef.current["chequeNumber"].focus();
        }
      }, 100);
    }
  };

  const canSubmitRefund = () => {
    switch (refundDetails.method) {
      case "CHEQUE":
        return (
          refundDetails.chequeNumber &&
          refundDetails.chequeNumber.trim() !== "" &&
          refundDetails.chequeDate
        );
      case "BANK":
      case "UPI":
        return refundDetails.accountId;
      case "CASH":
        return refundDetails.accountId && refundDetails.accountId.trim() !== "";
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    if (!canSubmitRefund()) {
      let specificError = "Please complete the required refund details.";
      if (refundDetails.method === "CHEQUE" && (!refundDetails.chequeNumber || !refundDetails.chequeDate)) {
        specificError = "Please enter both Cheque Number and Cheque Date.";
      } else if (["CASH", "BANK", "UPI"].includes(refundDetails.method) && !refundDetails.accountId) {
        specificError = "Please select an account for the refund.";
      }
      setError(specificError);
      return;
    }

    const finalRefundDetails = {
      amount: refundDetails.amount,
      method: refundDetails.method,
      accountId: refundDetails.method !== "CHEQUE" ? refundDetails.accountId : null,
      chequeNumber: refundDetails.method === "CHEQUE" ? refundDetails.chequeNumber : null,
      chequeDate: refundDetails.method === "CHEQUE" ? refundDetails.chequeDate : null,
      micrCode: refundDetails.method === "CHEQUE" ? refundDetails.micrCode : null,
      transactionNumber: refundDetails.transactionNumber || null,
    };

    onSubmit(finalRefundDetails);
  };

  const handleKeyDown = (e, nextInputId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      
      if (nextInputId === "nextButton") {
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
      if (selectedMethodIndex === 0) {
        handlePaymentMethodChange("CHEQUE");
      } else if (selectedMethodIndex > 0 && accounts[selectedMethodIndex - 1]) {
        const selectedAccount = accounts[selectedMethodIndex - 1];
        handlePaymentMethodChange(`ACCOUNT_${selectedAccount._id}`);
      }
    } else if (step === 2 && canSubmitRefund()) {
      handleSubmit();
    }
  };

  const renderTransactionDetails = () => {
    if (!refundDetails.method) return null;

    if (refundDetails.method === "CASH") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-md">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-green-100">
                <BanknoteIcon size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Cash Refund</p>
                <p className="text-xs text-muted-foreground">Ready to submit</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (refundDetails.method === "CHEQUE") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-md">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-purple-100">
                <CreditCard size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Cheque Refund</p>
                <p className="text-xs text-muted-foreground">Enter cheque details</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cheque Number</Label>
              <Input
                placeholder="Enter cheque number"
                value={refundDetails.chequeNumber}
                onChange={(e) =>
                  setRefundDetails({
                    ...refundDetails,
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
                value={refundDetails.micrCode}
                onChange={(e) =>
                  setRefundDetails({
                    ...refundDetails,
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
              value={refundDetails.chequeDate ? format(refundDetails.chequeDate, "yyyy-MM-dd") : ""}
              onChange={(e) =>
                setRefundDetails({
                  ...refundDetails,
                  chequeDate: new Date(e.target.value),
                })
              }
              className="w-full"
              onKeyDown={(e) => handleKeyDown(e, "nextButton")}
              ref={(el) => (inputRef.current["chequeDate"] = el)}
              required
            />
          </div>
        </div>
      );
    }

    if (refundDetails.method === "BANK" || refundDetails.method === "UPI") {
      const account = accounts.find((acc) => acc._id === refundDetails.accountId);
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
              {formatCurrency(account.balance || 0)}
            </p>
          </div>

          <div>
            <Label>Transaction Number (Optional)</Label>
            <Input
              placeholder="Enter transaction number"
              value={refundDetails.transactionNumber}
              onChange={(e) =>
                setRefundDetails({
                  ...refundDetails,
                  transactionNumber: e.target.value,
                })
              }
              onKeyDown={(e) => handleKeyDown(e, "nextButton")}
              ref={(el) => (inputRef.current["transactionNumber"] = el)}
            />
          </div>
        </div>
      );
    }
  };

  // Effect for keyboard navigation
  useEffect(() => {
    const handleKeyNavigation = (e) => {
      if (step !== 1) return;

      const totalMethods = accounts.length + 1; // 1 for cheque + number of accounts

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setSelectedMethodIndex((prev) => (prev - 1 + totalMethods) % totalMethods);
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedMethodIndex((prev) => (prev + 1) % totalMethods);
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

    if (step === 1) {
      window.addEventListener("keydown", handleKeyNavigation);
      return () => window.removeEventListener("keydown", handleKeyNavigation);
    }
  }, [step, selectedMethodIndex, accounts]);

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
              {step === 1 ? "Process Refund" : "Enter Refund Details"}
            </DialogTitle>
          </div>
        </DialogHeader>
        <Separator />

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm">{error}</div>
        )}

        <div>
          <ScrollArea className="h-[400px]">
            {step === 1 ? (
              <>
                {/* Refund Summary Section */}
                <div className="grid grid-cols-2 gap-2 py-3 px-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm">Distributor</Label>
                    <Input
                      value={refundData?.distributorName || "N/A"}
                      disabled={true}
                      className="font-bold border-gray-500 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Refundable Amount</Label>
                    <Input
                      value={formatCurrency(refundData?.refundableAmount || 0)}
                      disabled={true}
                      className="font-bold border-gray-500 text-green-600 bg-white"
                    />
                  </div>
                </div>

                {/* Payment Methods Section */}
                <div className="space-y-3 px-4 mt-0">
                  {/* <Label className="text-sm font-medium">Select Refund Method</Label> */}
                  <div className="grid grid-cols-1 gap-2">
                    {/* Account Options */}
                    {accounts.map((account, index) => (
                      <div
                        key={account._id}
                        className={cn(
                          "flex items-center justify-between rounded-md border border-muted bg-popover p-3 hover:bg-blue-100/70 hover:border-blue-600 cursor-pointer transition-all duration-200",
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
                          <p className="text-sm font-medium">Cheque Refund</p>
                          <p className="text-xs text-muted-foreground">
                            Refund by cheque
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3 px-4 mt-2">
                {renderTransactionDetails()}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer with Buttons */}
        <div className="p-3 bg-gray-100 border-t">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loadingStatus === "loading"}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              ref={(el) => (inputRef.current["nextButton"] = el)}
              onClick={handleNextStep}
              disabled={step === 2 && !canSubmitRefund() || loadingStatus === "loading"}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {loadingStatus === "loading" ? "Processing..." : step === 2 ? "Submit Refund" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
