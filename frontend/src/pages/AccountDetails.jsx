import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchAccounts,
  addAccount,
  updateAccount,
} from "../redux/slices/accountSlice";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useToast } from "../hooks/use-toast";
import { format } from "date-fns";
import { Plus, Inbox, ArrowLeft } from "lucide-react";
import { Separator } from "../components/ui/separator";
import { formatCurrency } from "../utils/Helper";

const formatDate = (dateString) => {
  try {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-"; // Invalid date
    return format(date, "dd/MM/yyyy");
  } catch (error) {
    return "-";
  }
};

const formatDateTime = (dateString) => {
  try {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-"; // Invalid date
    return format(date, "dd/MM/yyyy HH:mm");
  } catch (error) {
    return "-";
  }
};

export default function AccountDetails() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    accounts,
    error,
    fetchStatus,
    createAccountStatus,
    updateAccountStatus,
  } = useSelector((state) => state.accounts);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [editAccountOpen, setEditAccountOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const { toast } = useToast();

  const [newAccount, setNewAccount] = useState({
    accountType: "",
    bankDetails: {
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      accountHolderName: "",
      type: "SAVINGS",
      openingBalance: "",
      openingBalanceDate: new Date(),
    },
    upiDetails: {
      upiId: "",
      upiName: "",
      openingBalance: "",
      openingBalanceDate: new Date(),
    },
    cashDetails: {
      openingBalance: "",
      openingBalanceDate: new Date(),
    },
    otherDetails: {
      openingBalance: "",
      openingBalanceDate: new Date(),
    },
  });

  useEffect(() => {
    if (fetchStatus === "idle") {
      dispatch(fetchAccounts());
    }
  }, [dispatch, fetchStatus]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleAddAccount = async () => {
    try {
      const resultAction = await dispatch(addAccount(newAccount)).unwrap();

      toast({
        title: "Success",
        description: "Account added successfully",
        variant: "success",
      });

      setAddAccountOpen(false);
      setNewAccount({
        accountType: "",
        bankDetails: {
          bankName: "",
          accountNumber: "",
          ifscCode: "",
          accountHolderName: "",
          type: "SAVINGS",
          openingBalance: "",
          openingBalanceDate: new Date(),
        },
        upiDetails: {
          upiId: "",
          upiName: "",
          openingBalance: "",
          openingBalanceDate: new Date(),
        },
        cashDetails: {
          openingBalance: "",
          openingBalanceDate: new Date(),
        },
        otherDetails: {
          openingBalance: "",
          openingBalanceDate: new Date(),
        },
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add account",
        variant: "destructive",
      });
    }
  };

  const handleEditAccount = async () => {
    try {
      const resultAction = await dispatch(
        updateAccount({
          id: selectedAccount._id,
          data: selectedAccount,
        })
      ).unwrap();

      toast({
        title: "Success",
        description: "Account updated successfully",
        variant: "success",
      });

      setEditAccountOpen(false);
      setSelectedAccount(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update account",
        variant: "destructive",
      });
    }
  };

  const renderAccountForm = () => {
    switch (newAccount.accountType) {
      case "BANK":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Bank Name<span className="text-red-500">*</span>
                </Label>
                <Input
                  className="h-9"
                  value={newAccount.bankDetails.bankName}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      bankDetails: {
                        ...newAccount.bankDetails,
                        bankName: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Account Number<span className="text-red-500">*</span>
                </Label>
                <Input
                  className="h-9"
                  value={newAccount.bankDetails.accountNumber}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      bankDetails: {
                        ...newAccount.bankDetails,
                        accountNumber: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  IFSC Code<span className="text-red-500">*</span>
                </Label>
                <Input
                  className="h-9"
                  value={newAccount.bankDetails.ifscCode}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      bankDetails: {
                        ...newAccount.bankDetails,
                        ifscCode: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Account Holder Name<span className="text-red-500">*</span>
                </Label>
                <Input
                  className="h-9"
                  value={newAccount.bankDetails.accountHolderName}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      bankDetails: {
                        ...newAccount.bankDetails,
                        accountHolderName: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Account Type<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={newAccount.bankDetails.type}
                  onValueChange={(value) =>
                    setNewAccount({
                      ...newAccount,
                      bankDetails: {
                        ...newAccount.bankDetails,
                        type: value,
                      },
                    })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAVINGS">Savings</SelectItem>
                    <SelectItem value="CURRENT">Current</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Opening Balance<span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  className="h-9"
                  value={newAccount.bankDetails.openingBalance}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      bankDetails: {
                        ...newAccount.bankDetails,
                        openingBalance: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Opening Balance Date<span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                className="h-9"
                value={
                  newAccount.bankDetails.openingBalanceDate
                    ? format(
                        newAccount.bankDetails.openingBalanceDate,
                        "yyyy-MM-dd"
                      )
                    : ""
                }
                onChange={(e) =>
                  setNewAccount({
                    ...newAccount,
                    bankDetails: {
                      ...newAccount.bankDetails,
                      openingBalanceDate: new Date(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>
        );

      case "UPI":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  UPI ID<span className="text-red-500">*</span>
                </Label>
                <Input
                  className="h-9"
                  value={newAccount.upiDetails.upiId}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      upiDetails: {
                        ...newAccount.upiDetails,
                        upiId: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  UPI Name<span className="text-red-500">*</span>
                </Label>
                <Input
                  className="h-9"
                  value={newAccount.upiDetails.upiName}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      upiDetails: {
                        ...newAccount.upiDetails,
                        upiName: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Opening Balance<span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  className="h-9"
                  value={newAccount.upiDetails.openingBalance}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      upiDetails: {
                        ...newAccount.upiDetails,
                        openingBalance: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Opening Balance Date<span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  className="h-9"
                  value={
                    newAccount.upiDetails.openingBalanceDate
                      ? format(
                          newAccount.upiDetails.openingBalanceDate,
                          "yyyy-MM-dd"
                        )
                      : ""
                  }
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      upiDetails: {
                        ...newAccount.upiDetails,
                        openingBalanceDate: new Date(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        );

      case "CASH":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Opening Balance<span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  className="h-9"
                  value={newAccount.cashDetails.openingBalance}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      cashDetails: {
                        ...newAccount.cashDetails,
                        openingBalance: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Opening Balance Date<span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  className="h-9"
                  value={
                    newAccount.cashDetails.openingBalanceDate
                      ? format(
                          newAccount.cashDetails.openingBalanceDate,
                          "yyyy-MM-dd"
                        )
                      : ""
                  }
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      cashDetails: {
                        ...newAccount.cashDetails,
                        openingBalanceDate: new Date(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        );

      case "OTHERS":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Opening Balance<span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  className="h-9"
                  value={newAccount.openingBalance}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      openingBalance: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Opening Balance Date<span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  className="h-9"
                  value={
                    newAccount.openingBalanceDate
                      ? format(newAccount.openingBalanceDate, "yyyy-MM-dd")
                      : ""
                  }
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      openingBalanceDate: new Date(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderEditAccountForm = () => {
    if (!selectedAccount) return null;

    switch (selectedAccount.accountType) {
      case "BANK":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Bank Name<span className="text-red-500">*</span>
                </Label>
                <Input
                  className="h-9"
                  value={selectedAccount.bankDetails?.bankName}
                  onChange={(e) =>
                    setSelectedAccount({
                      ...selectedAccount,
                      bankDetails: {
                        ...selectedAccount.bankDetails,
                        bankName: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Account Number<span className="text-red-500">*</span>
                </Label>
                <Input
                  className="h-9"
                  value={selectedAccount.bankDetails?.accountNumber}
                  onChange={(e) =>
                    setSelectedAccount({
                      ...selectedAccount,
                      bankDetails: {
                        ...selectedAccount.bankDetails,
                        accountNumber: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  IFSC Code<span className="text-red-500">*</span>
                </Label>
                <Input
                  className="h-9"
                  value={selectedAccount.bankDetails?.ifscCode}
                  onChange={(e) =>
                    setSelectedAccount({
                      ...selectedAccount,
                      bankDetails: {
                        ...selectedAccount.bankDetails,
                        ifscCode: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Account Holder Name<span className="text-red-500">*</span>
                </Label>
                <Input
                  className="h-9"
                  value={selectedAccount.bankDetails?.accountHolderName}
                  onChange={(e) =>
                    setSelectedAccount({
                      ...selectedAccount,
                      bankDetails: {
                        ...selectedAccount.bankDetails,
                        accountHolderName: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Account Type<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedAccount.bankDetails?.type}
                  onValueChange={(value) =>
                    setSelectedAccount({
                      ...selectedAccount,
                      bankDetails: {
                        ...selectedAccount.bankDetails,
                        type: value,
                      },
                    })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAVINGS">Savings</SelectItem>
                    <SelectItem value="CURRENT">Current</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case "UPI":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  UPI ID<span className="text-red-500">*</span>
                </Label>
                <Input
                  className="h-9"
                  value={selectedAccount.upiDetails?.upiId}
                  onChange={(e) =>
                    setSelectedAccount({
                      ...selectedAccount,
                      upiDetails: {
                        ...selectedAccount.upiDetails,
                        upiId: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  UPI Name<span className="text-red-500">*</span>
                </Label>
                <Input
                  className="h-9"
                  value={selectedAccount.upiDetails?.upiName}
                  onChange={(e) =>
                    setSelectedAccount({
                      ...selectedAccount,
                      upiDetails: {
                        ...selectedAccount.upiDetails,
                        upiName: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full mx-auto py-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Account Details</h1>
        </div>
        <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl p-0 gap-0">
            <DialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
              <DialogTitle className="text-base font-semibold">
                Add New Account
              </DialogTitle>
            </DialogHeader>
            <Separator />
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Account Type<span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={newAccount.accountType}
                    onValueChange={(value) =>
                      setNewAccount({ ...newAccount, accountType: value })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BANK">Bank</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="OTHERS">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {renderAccountForm()}
              </div>
            </div>
            <div className="p-3 bg-gray-100 border-t flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddAccountOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                onClick={handleAddAccount}
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={createAccountStatus === "loading"}
              >
                {createAccountStatus === "loading"
                  ? "Adding..."
                  : "Add Account"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {fetchStatus === "loading" ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          {accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Inbox className="w-16 h-16 mb-4" />
              <p className="text-lg">
                No accounts found. Add your first account to get started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((account) => (
                <Card key={account._id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{account.accountType}</CardTitle>
                        <CardDescription>
                          Last updated: {formatDateTime(account.lastUpdated)}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {(account.accountType === "BANK" ||
                          account.accountType === "UPI") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAccount(account);
                              setEditAccountOpen(true);
                            }}
                            className="text-sm"
                          >
                            Edit
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(`/accounts/transactions/${account._id}`)
                          }
                          className="text-sm"
                        >
                          View Transactions
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {account.accountType === "BANK" && (
                      <div className="space-y-2">
                        <div>
                          <Label>Bank Name</Label>
                          <div>{account.bankDetails?.bankName || "-"}</div>
                        </div>
                        <div>
                          <Label>Account Number</Label>
                          <div>{account.bankDetails?.accountNumber || "-"}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Opening Balance</Label>
                            <div>
                              ₹{account.bankDetails?.openingBalance || 0}
                            </div>
                          </div>
                          <div>
                            <Label>Opening Date</Label>
                            <div>
                              {formatDate(
                                account.bankDetails?.openingBalanceDate
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label>Current Balance</Label>
                          <div
                            className={`text-lg font-semibold ${
                              account.balance < 0 ? "text-red-600" : ""
                            }`}
                          >
                            {formatCurrency(account.balance)}
                          </div>
                        </div>
                      </div>
                    )}

                    {account.accountType === "UPI" && (
                      <div className="space-y-2">
                        <div>
                          <Label>UPI ID</Label>
                          <div>{account.upiDetails?.upiId || "-"}</div>
                        </div>
                        <div>
                          <Label>UPI Name</Label>
                          <div>{account.upiDetails?.upiName || "-"}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Opening Balance</Label>
                            <div>
                              ₹{account.upiDetails?.openingBalance || 0}
                            </div>
                          </div>
                          <div>
                            <Label>Opening Date</Label>
                            <div>
                              {formatDate(
                                account.upiDetails?.openingBalanceDate
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label>Current Balance</Label>
                          <div
                            className={`text-lg font-semibold ${
                              account.balance < 0 ? "text-red-600" : ""
                            }`}
                          >
                            {formatCurrency(account.balance)}
                          </div>
                        </div>
                      </div>
                    )}

                    {(account.accountType === "CASH" ||
                      account.accountType === "OTHERS") && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Opening Balance</Label>
                            <div>
                              ₹{account.cashDetails?.openingBalance || 0}
                            </div>
                          </div>
                          <div>
                            <Label>Opening Date</Label>
                            <div>
                              {formatDate(
                                account.cashDetails?.openingBalanceDate
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label>Current Balance</Label>
                          <div
                            className={`text-lg font-semibold ${
                              account.balance < 0 ? "text-red-600" : ""
                            }`}
                          >
                            {formatCurrency(account.balance)}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={editAccountOpen} onOpenChange={setEditAccountOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          <DialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
            <DialogTitle className="text-base font-semibold">
              Edit Account
            </DialogTitle>
          </DialogHeader>
          <Separator />
          <div className="p-6">
            <div className="space-y-4">{renderEditAccountForm()}</div>
          </div>
          <div className="p-3 bg-gray-100 border-t flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditAccountOpen(false);
                setSelectedAccount(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              onClick={handleEditAccount}
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={updateAccountStatus === "loading"}
            >
              {updateAccountStatus === "loading"
                ? "Updating..."
                : "Update Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
