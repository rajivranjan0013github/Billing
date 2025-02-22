import { ArrowLeft, Pencil, Share2, Trash2, FileX } from "lucide-react"
import { Button } from "../components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "../components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Backend_URL } from "../assets/Data"
import { Badge } from "../components/ui/badge"
import { Loader2 } from "lucide-react"

export default function PaymentDetails() {
  const navigate = useNavigate();
  const { paymentId } = useParams();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const response = await fetch(`${Backend_URL}/api/payment/details/${paymentId}`, { credentials: "include" });
        if (!response.ok) throw new Error('Failed to fetch payment details');
        const data = await response.json();
        setPaymentDetails(data);
      } catch (error) {
        console.error('Error fetching payment details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [paymentId]);

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <span className="ml-2 text-lg text-gray-700">Loading invoice...</span>
    </div>
  );
  if (!paymentDetails) return <div>Payment not found</div>;

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center">
            <h1 className="text-xl font-semibold">Payment Out Details</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-sm">
            Download PDF
          </Button>
          <Button variant="outline" size="sm" className="text-sm">
            Print PDF
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Share via email</DropdownMenuItem>
              <DropdownMenuItem>Copy link</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <CardTitle className="text-base font-medium">Payment Details</CardTitle>
          <Badge variant={
            paymentDetails.status === "COMPLETED" ? "success" : 
            paymentDetails.status === "PENDING" ? "warning" :
            paymentDetails.status === "FAILED" ? "destructive" : 
            "secondary"
          }>
            {paymentDetails.status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">DISTRIBUTOR NAME</p>
              <p className="font-medium">{paymentDetails.distributorName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">PAYMENT DATE</p>
              <p className="font-medium">
                {new Date(paymentDetails.paymentDate).toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">PAYMENT AMOUNT</p>
              <p className="font-medium">₹{paymentDetails.amount.toLocaleString("en-IN")}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">PAYMENT TYPE</p>
              <p className="font-medium">{paymentDetails.paymentType}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">PAYMENT METHOD</p>
              <p className="font-medium">{paymentDetails.paymentMethod}</p>
            </div>
            {paymentDetails.paymentMethod === "CHEQUE" && (
              <>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">CHEQUE NUMBER</p>
                  <p className="font-medium">{paymentDetails.chequeNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">CHEQUE DATE</p>
                  <p className="font-medium">
                    {paymentDetails.chequeDate && new Date(paymentDetails.chequeDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">MICR CODE</p>
                  <p className="font-medium">{paymentDetails.micrCode || 'N/A'}</p>
                </div>
              </>
            )}
            {(paymentDetails.paymentMethod === "UPI" || paymentDetails.paymentMethod === "BANK") && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">TRANSACTION NUMBER</p>
                <p className="font-medium">{paymentDetails.transactionNumber}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">REMARKS</p>
              <p className="text-sm text-muted-foreground">
                {paymentDetails.remarks || 'No remarks added'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Invoices settled with this payment</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentDetails.bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FileX className="h-12 w-12 mb-2" />
              <p>No invoices have been settled with this payment</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Invoice Type</TableHead>
                  <TableHead>Grand Total</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Payment Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentDetails.bills.map((bill) => (
                  <TableRow key={bill._id} onClick={() => navigate(`/purchase/${bill._id}`)} className="cursor-pointer">
                    <TableCell>{new Date(bill.invoiceDate).toLocaleDateString()}</TableCell>
                    <TableCell>{bill.invoiceNumber}</TableCell>
                    <TableCell>{bill.invoiceType}</TableCell>
                    <TableCell>₹{bill.grandTotal?.toLocaleString("en-IN")}</TableCell>
                    <TableCell>₹{bill.amountPaid?.toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      <Badge variant={bill.paymentStatus === "paid" ? "success" : "destructive"} className="capitalize">
                        {bill.paymentStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}