import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAccounts } from "../../../redux/slices/accountSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter, // Added for footer
} from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { ScrollArea } from "../../ui/scroll-area";
import { format } from "date-fns";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Separator } from "../../ui/separator";
import { formatCurrency } from "../../../utils/Helper"; // Assuming you have this helper
import { useToast } from "../../../hooks/use-toast";

export default function RefundDialog({
  open,
  onOpenChange,
  refundData, // { refundableAmount, distributorName, distributorId }
  onSubmit, // Function to call with refund details
  loadingStatus,
}) {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { accounts, fetchStatus } = useSelector((state) => state.accounts);
  const [error, setError] = useState(null);

  // Refund state
  const [method, setMethod] = useState("CASH"); // Default refund method
  const [accountId, setAccountId] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeDate, setChequeDate] = useState(null);

  // Fetch accounts if not already loaded
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
      // Reset based on default or previous state if needed
      setMethod("CASH"); // Default to cash on open
      setAccountId("");
      setChequeNumber("");
      setChequeDate(null);

      // Pre-select first available CASH account if method is CASH
      if (accounts && accounts.length > 0) {
        const firstCashAccount = accounts.find(
          (acc) => acc.accountType === "CASH"
        );
        if (firstCashAccount) {
          // setAccountId(firstCashAccount._id); // Optionally pre-select
        }
      }
    }
  }, [open, refundData, accounts]); // Add accounts dependency

  const handleMethodChange = (newMethodValue) => {
    setError(null); // Clear errors on change
    setAccountId(""); // Reset account ID when method changes
    setChequeNumber("");
    setChequeDate(null);

    // Handle the combined 'BANK_UPI' value from RadioGroup
    if (newMethodValue === "BANK_UPI") {
      setMethod("BANK"); // Default to BANK when BANK_UPI is selected, actual type set by account selection
    } else {
      setMethod(newMethodValue);
    }

    // Pre-select account if applicable (e.g., first cash account)
    if (newMethodValue === "CASH" && accounts) {
      const firstCashAccount = accounts.find(
        (acc) => acc.accountType === "CASH"
      );
      if (firstCashAccount) {
        // setAccountId(firstCashAccount._id); // Optionally pre-select
      }
    }
  };

  const handleAccountSelect = (selectedAccountId) => {
    setAccountId(selectedAccountId);
    // Determine the actual method (BANK or UPI) based on the selected account
    const selectedAccount = accounts.find(
      (acc) => acc._id === selectedAccountId
    );
    if (selectedAccount) {
      setMethod(selectedAccount.accountType); // Set specific method based on selected account
    }
    setError(null);
  };

  const canSubmitRefund = () => {
    if (!method) return false;
    switch (method) {
      case "CASH":
      case "BANK":
      case "UPI":
        return !!accountId; // Account must be selected
      case "CHEQUE":
        return !!chequeNumber && !!chequeDate; // Cheque number and date required
      case "ADJUSTMENT": // If you add an Adjustment option
        return true; // No extra details needed for adjustment
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    if (!canSubmitRefund()) {
      // Determine specific error message
      let specificError = "Please complete the required refund details.";
      if (method === "CHEQUE" && (!chequeNumber || !chequeDate)) {
        specificError = "Please enter both Cheque Number and Cheque Date.";
      } else if (["CASH", "BANK", "UPI"].includes(method) && !accountId) {
        specificError = "Please select an account for the refund.";
      }
      setError(specificError);
      toast({
        title: "Validation Error",
        description: specificError,
        variant: "destructive",
      });
      return;
    }

    const finalRefundDetails = {
      amount: refundData?.refundableAmount || 0,
      method: method,
      accountId:
        method !== "CHEQUE" && method !== "ADJUSTMENT" ? accountId : null,
      chequeNumber: method === "CHEQUE" ? chequeNumber : null,
      chequeDate: method === "CHEQUE" ? chequeDate : null,
      // Add other fields like transactionNumber if needed later
    };
    onSubmit(finalRefundDetails); // Pass the structured details back
  };

  // Determine the value for the RadioGroup based on the current method
  const radioGroupValue = ["CASH", "CHEQUE", "ADJUSTMENT"].includes(method)
    ? method
    : "BANK_UPI";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[450px] p-0 gap-0 font-semibold">
        <DialogHeader className="px-4 py-2.5 flex flex-row items-center bg-gray-100 border-b">
          {/* Optional: Add Back button if needed */}
          <DialogTitle className="text-base font-semibold">
            Process Refund
          </DialogTitle>
        </DialogHeader>
        <Separator />

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm">{error}</div>
        )}

        <div>
          <ScrollArea className="h-auto max-h-[400px]">
            {" "}
            {/* Adjusted height */}
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
                <Label className="text-sm ">Refundable Amount</Label>
                <Input
                  value={formatCurrency(refundData?.refundableAmount || 0)}
                  disabled={true}
                  className="font-bold border-gray-500 text-green-600 bg-white"
                />
              </div>
            </div>
            {/* Refund Method Selection */}
            <div className="p-4 space-y-4">
              <Label>Select Refund Method</Label>
              <RadioGroup
                value={radioGroupValue} // Use the derived value
                onValueChange={handleMethodChange}
                className="grid grid-cols-3 gap-4"
              >
                {/* Option: Cash */}
                <div>
                  <RadioGroupItem
                    value="CASH"
                    id="refund-cash"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="refund-cash"
                    className="flex flex-col items-center justify-center text-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    Cash
                  </Label>
                </div>
                {/* Option: Bank/UPI */}
                <div>
                  <RadioGroupItem
                    value="BANK_UPI"
                    id="refund-bank-upi"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="refund-bank-upi"
                    className="flex flex-col items-center justify-center text-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    Bank/UPI
                  </Label>
                </div>
                {/* Option: Cheque */}
                <div>
                  <RadioGroupItem
                    value="CHEQUE"
                    id="refund-cheque"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="refund-cheque"
                    className="flex flex-col items-center justify-center text-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    Cheque
                  </Label>
                </div>
                {/* Option: Adjustment (Uncomment if needed) */}
                {/* <div>
                         <RadioGroupItem value="ADJUSTMENT" id="refund-adjustment" className="peer sr-only" />
                         <Label htmlFor="refund-adjustment" className="...">Adjustment</Label>
                     </div> */}
              </RadioGroup>

              {/* Account Selection (for Cash, Bank, UPI) */}
              {radioGroupValue === "BANK_UPI" || radioGroupValue === "CASH" ? (
                <div className="mb-4">
                  <Label htmlFor="refund-account" className="mb-2 block">
                    Select Account
                  </Label>
                  <Select
                    value={accountId}
                    onValueChange={handleAccountSelect} // Use dedicated handler
                  >
                    <SelectTrigger id="refund-account">
                      <SelectValue placeholder="Select account..." />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts && accounts.length > 0 ? (
                        accounts
                          // Filter accounts based on the RADIO BUTTON selection (Cash or Bank/UPI)
                          .filter((acc) =>
                            radioGroupValue === "CASH"
                              ? acc.accountType === "CASH"
                              : ["BANK", "UPI"].includes(acc.accountType)
                          )
                          .map((account) => (
                            <SelectItem key={account._id} value={account._id}>
                              {account.accountName} ({account.accountType}) -
                              Bal: {formatCurrency(account.balance || 0)}
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem value="no-accounts" disabled>
                          No compatible accounts
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {/* Cheque Details (for Cheque) */}
              {radioGroupValue === "CHEQUE" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cheque-number" className="mb-2 block">
                      Cheque Number
                    </Label>
                    <Input
                      id="cheque-number"
                      placeholder="Enter cheque number"
                      value={chequeNumber}
                      onChange={(e) => {
                        setChequeNumber(e.target.value);
                        setError(null);
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cheque-date" className="mb-2 block">
                      Cheque Date
                    </Label>
                    <Input
                      id="cheque-date"
                      type="date"
                      value={
                        chequeDate
                          ? format(new Date(chequeDate), "yyyy-MM-dd")
                          : ""
                      }
                      onChange={(e) => {
                        setChequeDate(
                          e.target.value ? new Date(e.target.value) : null
                        );
                        setError(null);
                      }}
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer with Buttons */}
        <DialogFooter className="p-3 bg-gray-100 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loadingStatus}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmitRefund() || loadingStatus}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {loadingStatus ? "Processing..." : "Submit Refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
