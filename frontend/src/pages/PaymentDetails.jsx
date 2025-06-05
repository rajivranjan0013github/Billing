import { ArrowLeft, Printer, Trash2, FileX, X } from "lucide-react"
import { Button } from "../components/ui/button"
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
import { formatCurrency } from "../utils/Helper"
import { format } from "date-fns"


export default function PaymentDetails() {
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
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center">
            <h1 className="text-xl font-semibold">Payment Details</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-sm gap-2 px-4"
            onClick={() => navigate('/payment/invoice-print', { state: { paymentData: paymentDetails } })}
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="text-destructive">
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
                <Button disabled={deletePaymentStatus === "loading"} onClick={() => setIsDialogOpen(false)} variant="outline" size="sm" className="px-4">Cancel</Button>
                <Button 
                  onClick={handleDeletePayment} 
                  size="sm"
                  disabled={deletePaymentStatus === "loading"}
                  className="bg-destructive text-white hover:bg-destructive/90 px-4"
                >
                  {deletePaymentStatus === "loading" ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </AlertDialogContent>
          </AlertDialog>
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
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">DISTRIBUTOR NAME</p>
              <p className="font-medium">{paymentDetails?.distributorName || paymentDetails?.customerName || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">PAYMENT DATE</p>
              <p className="font-medium">
                {format(new Date(paymentDetails.paymentDate), "dd-MM-yyyy")} {format(new Date(paymentDetails.createdAt), "hh:mm a")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">PAYMENT AMOUNT</p>
              <p className="font-medium">{formatCurrency(paymentDetails.amount)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">PAYMENT NUMBER</p>
              <p className="font-medium">{paymentDetails.paymentNumber}</p>
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
                    {paymentDetails.chequeDate && format(new Date(paymentDetails.chequeDate), "dd-MM-yyyy")} {format(new Date(paymentDetails.chequeDate), "hh:mm a")}
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
          {paymentDetails.bills.length === 0 && paymentDetails.salesBills?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FileX className="h-12 w-12 mb-2" />
              <p>No invoices have been settled with this payment</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Purchase Bills */}
              {paymentDetails.bills.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Purchase Bills</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead>Invoice Type</TableHead>
                        <TableHead>Grand Total</TableHead>
                        <TableHead>Amount Paid</TableHead>
                        <TableHead>Due Amount</TableHead>
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
                          <TableCell>₹{(bill.grandTotal - bill.amountPaid)?.toLocaleString("en-IN")}</TableCell>
                          <TableCell>
                            <Badge variant={bill.paymentStatus === "paid" ? "success" : "destructive"} className="capitalize">
                              {bill.paymentStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Sales Bills */}
              {paymentDetails.salesBills?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Sales Bills</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead>Sale Type</TableHead>
                        <TableHead>Grand Total</TableHead>
                        <TableHead>Amount Paid</TableHead>
                        <TableHead>Due Amount</TableHead>
                        <TableHead>Payment Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentDetails.salesBills.map((bill) => (
                        <TableRow key={bill._id} onClick={() => navigate(`/sales/${bill._id}`)} className="cursor-pointer">
                          <TableCell>{new Date(bill.invoiceDate).toLocaleDateString()}</TableCell>
                          <TableCell>{bill.invoiceNumber}</TableCell>
                          <TableCell className="capitalize">{bill.saleType}</TableCell>
                          <TableCell>₹{bill.grandTotal?.toLocaleString("en-IN")}</TableCell>
                          <TableCell>₹{bill.amountPaid?.toLocaleString("en-IN")}</TableCell>
                          <TableCell>₹{(bill.grandTotal - bill.amountPaid)?.toLocaleString("en-IN")}</TableCell>
                          <TableCell>
                            <Badge variant={bill.paymentStatus === "paid" ? "success" : "destructive"} className="capitalize">
                              {bill.paymentStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}