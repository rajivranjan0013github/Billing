import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAccounts,
  addAccount,
  updateAccount,
  updateAccountBalance,
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
import { Backend_URL } from "../assets/Data";
import { useToast } from "../hooks/use-toast";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { cn } from "../lib/utils";
import { Calendar } from "../components/ui/calendar";

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
  const { accounts, loading, error } = useSelector((state) => state.accounts);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
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
    dispatch(fetchAccounts());
  }, [dispatch]);

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

  const renderAccountForm = () => {
    switch (newAccount.accountType) {
      case "BANK":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bank Name</Label>
                <Input
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
              <div>
                <Label>Account Number</Label>
                <Input
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
              <div>
                <Label>IFSC Code</Label>
                <Input
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
              <div>
                <Label>Account Holder Name</Label>
                <Input
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
              <div>
                <Label>Account Type</Label>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAVINGS">Savings</SelectItem>
                    <SelectItem value="CURRENT">Current</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Opening Balance</Label>
                <Input
                  type="number"
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
            <div>
              <Label>Opening Balance Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newAccount.bankDetails.openingBalanceDate &&
                        "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newAccount.bankDetails.openingBalanceDate ? (
                      format(newAccount.bankDetails.openingBalanceDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newAccount.bankDetails.openingBalanceDate}
                    onSelect={(date) =>
                      setNewAccount({
                        ...newAccount,
                        bankDetails: {
                          ...newAccount.bankDetails,
                          openingBalanceDate: date,
                        },
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );

      case "UPI":
        return (
          <div className="space-y-4">
            <div>
              <Label>UPI ID</Label>
              <Input
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
            <div>
              <Label>UPI Name</Label>
              <Input
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
            <div>
              <Label>Opening Balance</Label>
              <Input
                type="number"
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
            <div>
              <Label>Opening Balance Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newAccount.upiDetails.openingBalanceDate &&
                        "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newAccount.upiDetails.openingBalanceDate ? (
                      format(newAccount.upiDetails.openingBalanceDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newAccount.upiDetails.openingBalanceDate}
                    onSelect={(date) =>
                      setNewAccount({
                        ...newAccount,
                        upiDetails: {
                          ...newAccount.upiDetails,
                          openingBalanceDate: date,
                        },
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );

      case "CASH":
        return (
          <div className="space-y-4">
            <div>
              <Label>Opening Balance</Label>
              <Input
                type="number"
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
            <div>
              <Label>Opening Balance Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newAccount.cashDetails.openingBalanceDate &&
                        "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newAccount.cashDetails.openingBalanceDate ? (
                      format(newAccount.cashDetails.openingBalanceDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newAccount.cashDetails.openingBalanceDate}
                    onSelect={(date) =>
                      setNewAccount({
                        ...newAccount,
                        cashDetails: {
                          ...newAccount.cashDetails,
                          openingBalanceDate: date,
                        },
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );

      case "OTHERS":
        return (
          <div className="space-y-4">
            <div>
              <Label>Opening Balance</Label>
              <Input
                type="number"
                value={newAccount.openingBalance}
                onChange={(e) =>
                  setNewAccount({
                    ...newAccount,
                    openingBalance: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label>Opening Balance Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newAccount.openingBalanceDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newAccount.openingBalanceDate ? (
                      format(newAccount.openingBalanceDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newAccount.openingBalanceDate}
                    onSelect={(date) =>
                      setNewAccount({
                        ...newAccount,
                        openingBalanceDate: date,
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Account Details</h1>
        <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Account Type</Label>
                <Select
                  value={newAccount.accountType}
                  onValueChange={(value) =>
                    setNewAccount({ ...newAccount, accountType: value })
                  }
                >
                  <SelectTrigger>
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
              <Button onClick={handleAddAccount}>Add Account</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <Card key={account._id}>
              <CardHeader>
                <CardTitle>{account.accountType}</CardTitle>
                <CardDescription>
                  Last updated: {formatDateTime(account.lastUpdated)}
                </CardDescription>
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
                        <div>₹{account.bankDetails?.openingBalance || 0}</div>
                      </div>
                      <div>
                        <Label>Opening Date</Label>
                        <div>
                          {formatDate(account.bankDetails?.openingBalanceDate)}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label>Current Balance</Label>
                      <div className="text-lg font-semibold">
                        ₹{account.balance || 0}
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
                        <div>₹{account.upiDetails?.openingBalance || 0}</div>
                      </div>
                      <div>
                        <Label>Opening Date</Label>
                        <div>
                          {formatDate(account.upiDetails?.openingBalanceDate)}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label>Current Balance</Label>
                      <div className="text-lg font-semibold">
                        ₹{account.balance || 0}
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
                        <div>₹{account.cashDetails?.openingBalance || 0}</div>
                      </div>
                      <div>
                        <Label>Opening Date</Label>
                        <div>
                          {formatDate(account.cashDetails?.openingBalanceDate)}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label>Current Balance</Label>
                      <div className="text-lg font-semibold">
                        ₹{account.balance || 0}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
