import {
  ArrowLeft,
  FileText,
  Trash2,
  ArrowUpDown,
  FileX,
  Pen,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomerDetails, setTabName, deleteCustomer } from "../redux/slices/CustomerSlice";
import CreateCustomerDialog from "../components/custom/customer/CreateCustomerDialog";
import LedgerTabContent from "../components/custom/distributor/LedgerTabContent";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { useToast } from "../hooks/use-toast";

export default function CustomerDetails() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const dispatch = useDispatch();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const {
    details: customerDetails,
    status,
    tabName,
    invoices,
    payments,
    deleteCustomerStatus,
  } = useSelector((state) => state.customers.currentCustomer);

  useEffect(() => {
    if (customerId) {
      dispatch(fetchCustomerDetails(customerId));
    }
  }, [customerId, dispatch]);

  if (!customerDetails || status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg text-red-700">Failed to load customer data.</p>
      </div>
    );
  }

  const formatInvoices = (invoices) => {
    if (!invoices) return [];
    
    return invoices.map(invoice => {
      if (!invoice) return null;
      
      const grandTotal = invoice?.totalAmount || 0;
      const amountPaid = invoice?.amountPaid || 0;
      const dueAmount = Math.max(0, grandTotal - amountPaid);
      
      return {
        date: invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : '-',
        type: "Sales Invoice",
        number: invoice.invoiceNumber || '-',
        items: `${invoice.items?.length || 0} items`,
        grandTotal: `₹ ${grandTotal.toLocaleString()}`,
        dueAmount: dueAmount > 0 ? `₹ ${dueAmount.toLocaleString()}` : '-',
        status: amountPaid >= grandTotal 
          ? "Paid" 
          : amountPaid > 0 
            ? "Partial Paid" 
            : "Unpaid",
        id: invoice._id,
      };
    }).filter(Boolean);
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteCustomer(customerId)).unwrap();
      toast({
        title: "Customer deleted successfully",
        variant: "success",
      });
      navigate(-1);
    } catch (error) {
      toast({
        title: "Failed to delete customer",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-6 py-3 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold uppercase">{customerDetails.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setIsEditDialogOpen(true)}>
            <Pen className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <CreateCustomerDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingCustomer={customerDetails}
        onSuccess={() => {
          dispatch(fetchCustomerDetails(customerId));
        }}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-xl p-0 gap-0">
          <AlertDialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
            <AlertDialogTitle className="text-base font-semibold">Delete Customer</AlertDialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDialogHeader>
          <div className="p-6">
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This action will permanently delete all associated records and cannot be undone.
            </AlertDialogDescription>
          </div>
          <div className="p-3 bg-gray-100 border-t flex items-center justify-end gap-2">
            <Button 
              onClick={() => setIsDeleteDialogOpen(false)} 
              variant="outline" 
              size="sm"
              disabled={deleteCustomerStatus === "loading"}
              className='px-4'
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              size="sm"
              className='px-4 bg-red-500 text-white hover:bg-red-600'
              disabled={deleteCustomerStatus === "loading"}
            >
              {deleteCustomerStatus === "loading" ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs defaultValue={tabName} className="flex-1" onValueChange={(value) => dispatch(setTabName(value))}>
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
                value="invoices"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Invoices
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Payments
              </TabsTrigger>
              <TabsTrigger
                value="ledger"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Ledger
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        <div className="flex-1 p-6">
          <TabsContent value="profile" className="m-0">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">
                    General Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 font-semibold">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Customer Name
                      </div>
                      <div className="capitalize">{customerDetails.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Mobile Number
                      </div>
                      <div>{customerDetails.mob || "-"}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Address
                    </div>
                    <div>{customerDetails.address || "-"}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Opening Balance
                      </div>
                      <div className={customerDetails.currentBalance > 0 ? "text-green-600" : customerDetails.currentBalance < 0 ? "text-red-600" : ""}>
                        {customerDetails.currentBalance > 0 ? "↓ " : customerDetails.currentBalance < 0 ? "↑ " : ""}
                        ₹ {Math.abs(customerDetails.openBalance || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Current Balance
                      </div>
                      <div className={customerDetails.currentBalance > 0 ? "text-green-600" : customerDetails.currentBalance < 0 ? "text-red-600" : ""}>
                        {customerDetails.currentBalance > 0 ? "↓ " : customerDetails.currentBalance < 0 ? "↑ " : ""}
                        ₹ {Math.abs(customerDetails.currentBalance || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="invoices" className="m-0">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-semibold hover:bg-transparent"
                      >
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold">Invoice Type</TableHead>
                    <TableHead className="font-semibold">Invoice Number</TableHead>
                    <TableHead className="font-semibold text-right">Items</TableHead>
                    <TableHead className="font-semibold text-right">Grand Total</TableHead>
                    <TableHead className="font-semibold text-right">Due Amount</TableHead>
                    <TableHead className="font-semibold text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="font-semibold">
                  {formatInvoices(invoices).length > 0 ? (
                    formatInvoices(invoices).map((invoice, index) => (
                      <TableRow
                        key={index}
                        onClick={() => navigate(`/sales/${invoice.id}`)}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell>{new Date(invoice.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}</TableCell>
                        <TableCell>
                          <span className="text-blue-600">{invoice.type}</span>
                        </TableCell>
                        <TableCell>{invoice.number}</TableCell>
                        <TableCell className="text-right">{invoice.items}</TableCell>
                        <TableCell className="text-right font-medium">{invoice.grandTotal}</TableCell>
                        <TableCell className="text-right">
                          <span className={invoice.dueAmount !== '-' ? "text-red-600" : ""}>
                            {invoice.dueAmount}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                      <Badge
                        variant={invoice.status === "Paid" ? "success" : invoice.status === "Unpaid" ? "destructive" : "secondary"}
                       
                      
                      >
                        {invoice.status}
                      </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <FileX className="h-12 w-12 mb-3 text-gray-400" />
                          <p className="text-lg font-medium mb-1">No Invoices Found</p>
                          <p className="text-sm">There are no invoices available for this customer.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="payments" className="m-0">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-semibold hover:bg-transparent"
                      >
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold">Payment Number</TableHead>
                    <TableHead className="font-semibold">Payment Method</TableHead>
                    <TableHead className="font-semibold text-right">Amount (₹)</TableHead>
                    <TableHead className="font-semibold text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="font-semibold">
                  {payments && payments.length > 0 ? (
                    payments.map((payment) => (
                      <TableRow
                        key={payment._id}
                        onClick={() => navigate(`/payment/${payment._id}`)}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell>
                          {new Date(payment.paymentDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>{payment.paymentNumber || "-"}</TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell className="text-right">{(payment.amount)}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={payment.status === "COMPLETED" ? "success" : "destructive"}
                          
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <FileX className="h-12 w-12 mb-3 text-gray-400" />
                          <p className="text-lg font-medium mb-1">No Payments Found</p>
                          <p className="text-sm">There are no payment records available for this customer.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="ledger" className="m-0">
            <LedgerTabContent isActive={tabName === 'ledger'} customerId={customerId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
