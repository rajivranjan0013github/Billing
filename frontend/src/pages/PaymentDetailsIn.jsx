import { ArrowLeft, Pencil, Share2, Trash2, FileX, X } from "lucide-react"
import { Button } from "../components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "../components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Backend_URL } from "../assets/Data"
import { Badge } from "../components/ui/badge"
import { Loader2 } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { deletePayment } from "../redux/slices/paymentSlice"
import { useToast } from "../hooks/use-toast"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog"

export default function PaymentDetailsIn() {
  const navigate = useNavigate();
  const { paymentId } = useParams();
  const { toast } = useToast();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const dispatch = useDispatch();
  const { deletePaymentStatus } = useSelector((state) => state.payment);

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

  const handleDeletePayment = async () => {
    try {
      await dispatch(deletePayment(paymentId)).unwrap();
      setIsDialogOpen(false);
      toast({title: "Payment deleted successfully", variant: "success"});
      navigate(-1);
    } catch (error) {
      toast({title: "Failed to delete payment", variant: "destructive"});
    }
  };

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
          <Button 
            variant="outline" 
            className="text-sm"
            onClick={() => navigate('/payment/invoice-print', { state: { paymentData: paymentDetails } })}
          >
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
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-xl p-0 gap-0">
              <AlertDialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
                <AlertDialogTitle className="text-base font-semibold">Delete Payment</AlertDialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </AlertDialogHeader>
              <div className="p-6">
                <AlertDialogDescription>
                  Are you sure you want to delete this payment? This action will revert all associated transactions and cannot be undone.
                </AlertDialogDescription>
              </div>
              <div className="p-3 bg-gray-100 border-t flex items-center justify-end gap-2">
                <Button disabled={deletePaymentStatus === "loading"} onClick={() => setIsDialogOpen(false)} variant="outline" size="sm">Cancel</Button>
                <Button 
                  onClick={handleDeletePayment} 
                  size="sm"
                  disabled={deletePaymentStatus === "loading"}
                >
                  {deletePaymentStatus === "loading" ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </AlertDialogContent>
          </AlertDialog>
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
              <p className="font-medium">{paymentDetails.distributorName}</p>
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
            <p className="font-medium">{paymentDetails.paymentType}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">PAYMENT METHOD</p>
            <p className="font-medium">{paymentDetails.paymentMethod}</p>
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
          {paymentDetails.salesBills.length === 0 ? (
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
                {paymentDetails.salesBills.map((bill) => (
                  <TableRow key={bill._id} onClick={() => navigate(`/sale/${bill._id}`)} className="cursor-pointer">
                    <TableCell>{new Date(bill.invoiceDate).toLocaleDateString()}</TableCell>
                    <TableCell>{bill.invoiceNumber}</TableCell>
                    <TableCell>₹{bill?.grandTotal?.toLocaleString("en-IN")}</TableCell>
                    <TableCell>₹{bill?.amountPaid?.toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      <Badge variant={bill.paymentStatus === "paid" ? "success" : "destructive"}>
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