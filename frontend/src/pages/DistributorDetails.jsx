import { ArrowLeft, FileText, Plus, Printer, Trash2, ArrowUpDown, Calendar, FileX } from "lucide-react"
import { useEffect, useState } from "react"
import { Backend_URL } from "../assets/Data"
import { Loader2 } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"

export default function DistributorDetails() {
    const navigate = useNavigate();
    const { distributorId } = useParams();
    const [party, setParty] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [ledger, setLedger] = useState([]);

    useEffect(() => {
        const fetchPartyDetails = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${Backend_URL}/api/party/details/${distributorId}`, {credentials: "include",});
                const data = await response.json();
                setParty(data);
            } catch (error) {
                console.error('Error fetching party:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        if (distributorId) {
            fetchPartyDetails();
        }
    }, [distributorId]);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await fetch(`${Backend_URL}/api/party/transactions/${distributorId}`, {
                    credentials: "include",
                });
                const data = await response.json();
                setTransactions(data);
            } catch (error) {
                console.error('Error fetching transactions:', error);
            }
        };
        
        if (distributorId) {
            fetchTransactions();
        }
    }, [distributorId]);

    useEffect(() => {
        const fetchLedger = async () => {
            try {
                const response = await fetch(`${Backend_URL}/api/party/ledger/${distributorId}`, {
                    credentials: "include",
                });
                const data = await response.json();
                setLedger(data);
            } catch (error) {
                console.error('Error fetching ledger:', error);
            }
        };
        
        if (distributorId) {
            fetchLedger();
        }
    }, [distributorId]);

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
            status: ['Payment In', 'Payment Out'].includes(transaction.type) 
                ? null 
                : (transaction.amount_paid >= transaction.amount ? "Paid" : "Partial Paid"),
            invoice_id: transaction.invoice_id
        }));
    };

    const handleTransactionClick = (transaction) => {
        if(transaction.type === "Sell Invoice"){
            navigate(`/sales/${transaction.invoice_id}`);
        } else if (transaction.type === "Purchase Invoice") {
            navigate(`/purchase/${transaction.invoice_id}`);
        } else{
            navigate(`/purchase/payment-out/${transaction.invoice_id}`);
        }
    };

    const formatLedger = (ledgerEntries) => {
        return ledgerEntries.map(entry => ({
            date: new Date(entry.date).toLocaleDateString(),
            type: entry.type,
            number: entry.bill_number || entry.invoice_id || '-',
            description: entry.description || '-',
            debit: entry.debit ? `₹ ${entry.debit.toLocaleString()}` : '-',
            credit: entry.credit ? `₹ ${entry.credit.toLocaleString()}` : '-',
            balance: entry.balance ? `₹ ${entry.balance.toLocaleString()}` : '-',
        }));
    };

    return (
        <div className="flex flex-col min-h-screen">
            <header className="flex items-center justify-between px-6 py-3 border-b">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-xl font-semibold">{party.name}</h1>
                    <span className="text-sm text-gray-500 capitalize">({party.partyType})</span>
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
                                value="transactions"
                                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                            >
                                Transactions
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
                                            <div>{party.mob || '-'}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Email</div>
                                            <div>{party.email || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Opening Balance</div>
                                            <div className={party.openBalance > 0 ? "text-green-600" : "text-red-600"}>
                                                {party.openBalance !== 0 && (party.openBalance > 0 ? "↓ " : "↑ ")}
                                                ₹ {Math.abs(party.openBalance).toLocaleString()} 
                                                <span className="text-gray-500 text-sm ml-1">
                                                    ({party.openBalance > 0 ? 'To Collect' : 'To Pay'})
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Current Balance</div>
                                            <div className={party.currentBalance > 0 ? "text-green-600" : "text-red-600"}>
                                                {party.currentBalance !== 0 && (party.currentBalance > 0 ? "↓ " : "↑ ")}
                                                ₹ {Math.abs(party.currentBalance).toLocaleString()} 
                                                <span className="text-gray-500 text-sm ml-1">
                                                    ({party.currentBalance > 0 ? 'To Collect' : 'To Pay'})
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Customer Type</div>
                                            <div className="capitalize">{party.partyType}</div>
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
                                            <div>{party.panNumber || '-'}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Drug License Number</div>
                                            <div>{party.DLNumber || '-'}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Billing Address</div>
                                        <div>{party.address || '-'}</div>
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
                                                    {transaction.status && (
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
                                                    )}
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
                    <TabsContent value="ledger" className="m-0">
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
                        </div>

                        {ledger.length > 0 ? (
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
                                            <TableHead className="font-semibold">Type</TableHead>
                                            <TableHead className="font-semibold">Number</TableHead>
                                            <TableHead className="font-semibold">Description</TableHead>
                                            <TableHead className="font-semibold text-right">Debit</TableHead>
                                            <TableHead className="font-semibold text-right">Credit</TableHead>
                                            <TableHead className="font-semibold text-right">Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {formatLedger(ledger).map((entry, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{entry.date}</TableCell>
                                                <TableCell>
                                                    <span className="text-blue-600">{entry.type}</span>
                                                </TableCell>
                                                <TableCell>{entry.number}</TableCell>
                                                <TableCell>{entry.description}</TableCell>
                                                <TableCell className="text-right">{entry.debit}</TableCell>
                                                <TableCell className="text-right">{entry.credit}</TableCell>
                                                <TableCell className="text-right">{entry.balance}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="font-medium bg-muted/50">
                                            <TableCell></TableCell>
                                            <TableCell colSpan={3}>Closing Balance</TableCell>
                                            <TableCell className="text-right">
                                                {`₹ ${ledger.reduce((sum, entry) => sum + (entry.debit || 0), 0).toLocaleString()}`}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {`₹ ${ledger.reduce((sum, entry) => sum + (entry.credit || 0), 0).toLocaleString()}`}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {`₹ ${party.currentBalance.toLocaleString()}`}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <FileX className="h-12 w-12 mb-4" />
                                <p className="text-lg font-medium">No ledger entries found</p>
                                <p className="text-sm">This party doesn't have any ledger entries yet.</p>
                            </div>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}