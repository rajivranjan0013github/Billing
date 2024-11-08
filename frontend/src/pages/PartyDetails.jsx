import { ArrowLeft, FileText, Plus, Printer, Trash2, ArrowUpDown, Calendar, FileX } from "lucide-react"
import { useEffect, useState } from "react"
import { Backend_URL } from "../assets/Data"
import { Loader2 } from "lucide-react"

import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "../components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"

export default function PartyDetails() {
    const navigate = useNavigate();
    const { partyId } = useParams();
    const [party, setParty] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const fetchPartyDetails = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${Backend_URL}/api/party/details/${partyId}`, {credentials: "include",});
                const data = await response.json();
                setParty(data);
            } catch (error) {
                console.error('Error fetching party:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        if (partyId) {
            fetchPartyDetails();
        }
    }, [partyId]);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await fetch(`${Backend_URL}/api/party/transactions/${partyId}`, {
                    credentials: "include",
                });
                const data = await response.json();
                setTransactions(data);
            } catch (error) {
                console.error('Error fetching transactions:', error);
            }
        };
        
        if (partyId) {
            fetchTransactions();
        }
    }, [partyId]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-lg text-gray-700">Loading party details...</span>
            </div>
        );
    }

    if (!party) {
        return (
            <div className="h-screen flex items-center justify-center">
                <p className="text-lg text-gray-700">No party data found.</p>
            </div>
        );
    }


    const formatTransactions = (transactions) => {
        return transactions.map(transaction => ({
            date: new Date(transaction.date).toLocaleDateString(),
            type: transaction.type,
            number: transaction.bill_number || transaction.invoice_id,
            amount: `₹ ${transaction.amount.toLocaleString()}`,
            unpaidAmount: transaction.amount_paid < transaction.amount 
                ? `₹ ${(transaction.amount - transaction.amount_paid).toLocaleString()}`
                : null,
            status: transaction.amount_paid >= transaction.amount ? "Paid" : "Partial Paid",
            invoice_id: transaction.invoice_id
        }));
    };

    const handleTransactionClick = (transaction) => {
        console.log(transaction);
        
        if(transaction.type === "Sell Invoice"){
            navigate(`/sales/${transaction.invoice_id}`);
        } else {
            navigate(`/purchase/${transaction.invoice_id}`);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <header className="flex items-center justify-between px-6 py-3 border-b">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-xl font-semibold">{party.name}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create New Invoice
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>Create Sales Invoice</DropdownMenuItem>
                            <DropdownMenuItem>Create Purchase Invoice</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="icon">
                        <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                        <Printer className="h-4 w-4" />
                    </Button>
                </div>
            </header>
            <Tabs defaultValue="profile" className="flex-1">
                <div className="border-b">
                    <div className="px-6">
                        <TabsList className="h-12 p-0 bg-transparent border-b-0">
                            <TabsTrigger
                                value="transactions"
                                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                            >
                                Transactions
                            </TabsTrigger>
                            <TabsTrigger
                                value="profile"
                                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                            >
                                Profile
                            </TabsTrigger>
                            <TabsTrigger
                                value="ledger"
                                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                            >
                                Ledger (Statement)
                            </TabsTrigger>
                            <TabsTrigger
                                value="report"
                                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                            >
                                Item Wise Report
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </div>
                <div className="flex-1 p-6">
                    <TabsContent value="profile" className="m-0">
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-medium">General Details</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Party Name</div>
                                            <div>{party.name}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Mobile Number</div>
                                            <div>{party.mobile_number || '-'}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Email</div>
                                            <div>{party.email || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Opening Balance</div>
                                            <div className={party.opening_balance > 0 ? "text-green-600" : "text-red-600"}>
                                                {party.opening_balance !== 0 && (party.opening_balance > 0 ? "↓ " : "↑ ")}
                                                ₹ {Math.abs(party.opening_balance).toLocaleString()} 
                                                <span className="text-gray-500 text-sm ml-1">
                                                    ({party.opening_balance > 0 ? 'To Collect' : 'To Pay'})
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Current Balance</div>
                                            <div className={party.current_balance > 0 ? "text-green-600" : "text-red-600"}>
                                                {party.current_balance !== 0 && (party.current_balance > 0 ? "↓ " : "↑ ")}
                                                ₹ {Math.abs(party.current_balance).toLocaleString()} 
                                                <span className="text-gray-500 text-sm ml-1">
                                                    ({party.current_balance > 0 ? 'To Collect' : 'To Pay'})
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-medium">Business Details</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">GSTIN</div>
                                            <div>{party.gstin || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">PAN Number</div>
                                            <div>{party.pan_number || '-'}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Drug License Number</div>
                                            <div>{party.drug_license_number || '-'}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Billing Address</div>
                                        <div>{party.billing_address || '-'}</div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-medium">Credit Details</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Credit Period</div>
                                            <div>{party.credit_period || 0} Days</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Credit Limit</div>
                                            <div>{party.credit_limit ? `₹ ${party.credit_limit}` : '-'}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    <TabsContent value="transactions" className="m-0">
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full sm:w-auto">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Last 365 Days
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem>Last 7 Days</DropdownMenuItem>
                                    <DropdownMenuItem>Last 30 Days</DropdownMenuItem>
                                    <DropdownMenuItem>Last 365 Days</DropdownMenuItem>
                                    <DropdownMenuItem>Custom Range</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full sm:w-auto">
                                        Select Transaction Type
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem>All Transactions</DropdownMenuItem>
                                    <DropdownMenuItem>Sales Invoices</DropdownMenuItem>
                                    <DropdownMenuItem>Purchase Invoices</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {transactions.length > 0 ? (
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="font-semibold">
                                                <Button variant="ghost" className="p-0 h-auto font-semibold hover:bg-transparent">
                                                    Date
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead className="font-semibold">Transaction Type</TableHead>
                                            <TableHead className="font-semibold">Transaction Number</TableHead>
                                            <TableHead className="font-semibold">
                                                <Button variant="ghost" className="p-0 h-auto font-semibold hover:bg-transparent">
                                                    Amount
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead className="font-semibold">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {formatTransactions(transactions).map((transaction, index) => (
                                            <TableRow key={index} onClick={() => handleTransactionClick(transaction)} className="cursor-pointer">
                                                <TableCell>{transaction.date}</TableCell>
                                                <TableCell>
                                                    <span className="text-blue-600">{transaction.type}</span>
                                                </TableCell>
                                                <TableCell>{transaction.number}</TableCell>
                                                <TableCell>
                                                    {transaction.amount}
                                                    {transaction.unpaidAmount && (
                                                        <span className="text-red-600 ml-1">
                                                            ({transaction.unpaidAmount} unpaid)
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className={
                                                            transaction.status === "Paid"
                                                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                                                : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                                                        }
                                                    >
                                                        {transaction.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <FileX className="h-12 w-12 mb-4" />
                                <p className="text-lg font-medium">No transactions found</p>
                                <p className="text-sm">This party doesn't have any transactions yet.</p>
                            </div>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}