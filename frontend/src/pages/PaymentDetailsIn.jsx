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

export default function PaymentDetailsIn() {
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
        // You might want to add error handling UI here
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
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Payment In Details</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-sm">
            Download PDF
          </Button>
          <Button variant="outline" className="text-sm">
            Print PDF
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-sm">
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
        <CardHeader>
          <CardTitle className="text-base font-medium">Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">CUSTOMER NAME</p>
              <p className="font-medium">{paymentDetails.party_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">PAYMENT DATE</p>
              <p className="font-medium">
                {new Date(paymentDetails.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">PAYMENT AMOUNT</p>
              <p className="font-medium">₹{paymentDetails.amount.toLocaleString("en-IN")}</p>
            </div>
            <div className="space-y-1">
            <p className="text-sm text-muted-foreground">PAYMENT TYPE</p>
            <p className="font-medium">{paymentDetails.payment_type}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">PAYMENT METHOD</p>
            <p className="font-medium">{paymentDetails.payment_method}</p>
          </div>
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
          <CardTitle className="text-base font-medium">Sales Invoices settled with this payment</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentDetails.sales_bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FileX className="h-12 w-12 mb-2" />
              <p>No sales invoices have been settled with this payment</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>INVOICE AMOUNT</TableHead>
                  <TableHead>Amount Settled</TableHead>
                  <TableHead>PAYMENT STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentDetails.sales_bills.map((bill) => (
                  <TableRow key={bill._id} onClick={() => navigate(`/sales/${bill._id}`)} className="cursor-pointer">
                    <TableCell>{new Date(bill.bill_date).toLocaleDateString()}</TableCell>
                    <TableCell>{bill.bill_number}</TableCell>
                    <TableCell>₹{bill?.grand_total?.toLocaleString("en-IN")}</TableCell>
                    <TableCell>₹{bill?.payment?.amount_paid?.toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      <Badge variant={bill.payment_status === "paid" ? "success" : "destructive"}>
                        {bill.payment_status}
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