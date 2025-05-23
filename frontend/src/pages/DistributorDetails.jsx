import {
  ArrowLeft,
  Plus,
  Trash2,
  ArrowUpDown,
  FileX,
  Pen,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDistributorDetails,
  fetchDistributorInvoices,
  fetchDistributorPayments,
  setTabName,
  deleteDistributor,
} from "../redux/slices/distributorSlice";
import CreateDistributorDlg from "../components/custom/distributor/CreateDistributorDlg";
import LedgerTabContent from "../components/custom/distributor/LedgerTabContent";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { useToast } from "../hooks/use-toast";

export default function DistributorDetails() {
  const navigate = useNavigate();
  const { distributorId } = useParams();
  const dispatch = useDispatch();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const {
    details: distributorDetails,
    status,
    invoicesStatus,
    paymentsStatus,
    tabName,
    invoices,
    payments,
    deleteDistributorStatus,
  } = useSelector((state) => state.distributor.currentDistributor);

  useEffect(() => {
    if (distributorId) {
      if (distributorDetails?._id !== distributorId) {
        dispatch(fetchDistributorDetails(distributorId));
      }
    }
  }, [distributorId, dispatch, distributorDetails?._id]);

  useEffect(() => {
    if (distributorId && distributorDetails?._id === distributorId) {
      if (tabName === "invoices" && distributorId) {
        dispatch(fetchDistributorInvoices(distributorId));
      } else if (tabName === "payments" && distributorId) {
        dispatch(fetchDistributorPayments(distributorId));
      }
    }
  }, [distributorId, tabName, dispatch, distributorDetails?._id]);

  const handleEditSuccess = () => {
    dispatch(fetchDistributorDetails(distributorId));
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteDistributor(distributorId)).unwrap();
      toast({
        title: "Distributor deleted successfully",
        variant: "success",
      });
      navigate(-1);
    } catch (error) {
      toast({
        title: "Failed to delete distributor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!distributorDetails || status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg text-red-700">Failed to load distributor data.</p>
      </div>
    );
  }

  const formatInvoices = (invoices) => {
    if (!invoices) return [];

    return invoices
      .map((invoice) => {
        if (!invoice) return null;

        const grandTotal = invoice?.billSummary?.grandTotal || 0;
        const amountPaid = invoice.amountPaid || 0;
        const productCount = invoice?.billSummary?.productCount || 0;
        const totalQuantity = invoice?.billSummary?.totalQuantity || 0;
        const dueAmount = Math.max(0, grandTotal - amountPaid);

        return {
          date: invoice.invoiceDate
            ? new Date(invoice.invoiceDate).toLocaleDateString()
            : "-",
          type:
            invoice.invoiceType === "SALE"
              ? "Sales Invoice"
              : "Purchase Invoice",
          number: invoice.invoiceNumber || "-",
          items: `${productCount} (${totalQuantity} units)`,
          grandTotal: `₹ ${grandTotal.toLocaleString()}`,
          dueAmount: dueAmount > 0 ? `₹ ${dueAmount.toLocaleString()}` : "-",
          status:
            amountPaid >= grandTotal
              ? "Paid"
              : amountPaid > 0
              ? "Partial Paid"
              : "Unpaid",
          paymentDue: invoice.paymentDueDate
            ? new Date(invoice.paymentDueDate).toLocaleDateString()
            : "-",
          id: invoice._id,
        };
      })
      .filter(Boolean);
  };

  const handleInvoiceClick = (invoice) => {
    if (invoice.type === "Sales Invoice") {
      navigate(`/sales/${invoice.id}`);
    } else if (invoice.type === "Purchase Invoice") {
      navigate(`/purchase/${invoice.id}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-semibold">
      <header className="flex items-center justify-between px-6 py-3 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">{distributorDetails.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/payment/create-payment/${distributorId}`)}
          >
            <Plus className="h-4 w-4" /> Add Payment
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Pen className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          
        </div>
      </header>
      <Tabs
        defaultValue={tabName}
        className="flex-1"
        onValueChange={(value) => dispatch(setTabName(value))}
      >
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
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Distributor Name
                      </div>
                      <div>{distributorDetails.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Mobile Number
                      </div>
                      <div>{distributorDetails.mob || "-"}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div>{distributorDetails.email || "-"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Opening Balance
                      </div>
                      <div
                        className={
                          distributorDetails.openBalance > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {distributorDetails.openBalance !== 0 &&
                          (distributorDetails.openBalance > 0 ? "↓ " : "↑ ")}
                        ₹{" "}
                        {Math.abs(
                          distributorDetails.openBalance
                        ).toLocaleString()}
                        <span className="text-gray-500 text-sm ml-1">
                          (
                          {distributorDetails.openBalance > 0
                            ? "To Collect"
                            : "To Pay"}
                          )
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Current Balance
                      </div>
                      <div
                        className={
                          distributorDetails.currentBalance > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {distributorDetails.currentBalance !== 0 &&
                          (distributorDetails.currentBalance > 0 ? "↓ " : "↑ ")}
                        ₹{" "}
                        {Math.abs(
                          distributorDetails.currentBalance
                        ).toLocaleString()}
                        <span className="text-gray-500 text-sm ml-1">
                          (
                          {distributorDetails.currentBalance > 0
                            ? "To Collect"
                            : "To Pay"}
                          )
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">
                    Business Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">GSTIN</div>
                      <div>{distributorDetails.gstin || "-"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Drug License Number
                      </div>
                      <div>{distributorDetails.DLNumber || "-"}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Bank Account Number
                      </div>
                      <div>
                        {distributorDetails?.bankDetails?.accountNumber || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        IFSC Code
                      </div>
                      <div className="uppercase">
                        {distributorDetails?.bankDetails?.ifsc || "-"}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Billing Address
                    </div>
                    <div>{distributorDetails.address || "-"}</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">
                    Credit Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Credit Period
                      </div>
                      <div>{distributorDetails.credit_period || 0} Days</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Credit Limit
                      </div>
                      <div>
                        {distributorDetails.credit_limit
                          ? `₹ ${distributorDetails.credit_limit}`
                          : "-"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="invoices" className="m-0">
            {invoicesStatus === "loading" && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
              </div>
            )}
            {invoicesStatus === "failed" && (
              <div className="flex flex-col items-center justify-center py-8 text-red-700">
                <FileX className="h-12 w-12 mb-3" />
                <p className="text-lg font-medium">Failed to load invoices.</p>
              </div>
            )}
            {invoicesStatus === "succeeded" && !invoices.length && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <FileX className="h-12 w-12 mb-3 text-gray-400" />
                <p className="text-lg font-medium mb-1">No Invoices Found</p>
                <p className="text-sm">
                  There are no invoices available for this distributor.
                </p>
              </div>
            )}
            {invoicesStatus === "succeeded" && invoices.length > 0 && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-medium">
                        <Button
                          variant="ghost"
                          className="p-0 h-auto font-medium hover:bg-transparent"
                        >
                          Date
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="font-medium">
                        Invoice Type
                      </TableHead>
                      <TableHead className="font-medium">
                        Invoice Number
                      </TableHead>
                      <TableHead className="font-medium text-right">
                        Items
                      </TableHead>
                      <TableHead className="font-medium text-right">
                        Grand Total
                      </TableHead>
                      <TableHead className="font-medium text-right">
                        Due Amount
                      </TableHead>
                      <TableHead className="font-medium">Due Date</TableHead>
                      <TableHead className="font-medium">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formatInvoices(invoices).map((invoice, index) => (
                      <TableRow
                        key={index}
                        onClick={() => handleInvoiceClick(invoice)}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell>
                          {new Date(invoice.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <span className="text-blue-600">{invoice.type}</span>
                        </TableCell>
                        <TableCell>{invoice.number}</TableCell>
                        <TableCell className="text-right">
                          {invoice.items}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {invoice.grandTotal}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              invoice.dueAmount !== "-" ? "text-red-600" : ""
                            }
                          >
                            {invoice.dueAmount}
                          </span>
                        </TableCell>
                        <TableCell>{invoice.paymentDue}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invoice.status === "Paid"
                                ? "success"
                                : invoice.status === "Unpaid"
                                ? "destructive"
                                : "warning"
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          <TabsContent value="payments" className="m-0">
            {paymentsStatus === "loading" && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
              </div>
            )}
            {paymentsStatus === "failed" && (
              <div className="flex flex-col items-center justify-center py-8 text-red-700">
                <FileX className="h-12 w-12 mb-3" />
                <p className="text-lg font-medium">Failed to load payments.</p>
              </div>
            )}
            {paymentsStatus === "succeeded" && !payments.length && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <FileX className="h-12 w-12 mb-3 text-gray-400" />
                <p className="text-lg font-medium mb-1">No Payments Found</p>
                <p className="text-sm">
                  There are no payment records available for this distributor.
                </p>
              </div>
            )}
            {paymentsStatus === "succeeded" && payments.length > 0 && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-medium">
                        <Button
                          variant="ghost"
                          className="p-0 h-auto font-medium hover:bg-transparent"
                        >
                          Date
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="font-medium">
                        Payment Type
                      </TableHead>
                      <TableHead className="font-medium">
                        Payment Number
                      </TableHead>
                      <TableHead className="font-medium">
                        Payment Method
                      </TableHead>
                      <TableHead className="font-medium text-right">
                        Amount
                      </TableHead>
                      <TableHead className="font-medium text-right">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow
                        key={payment._id}
                        onClick={() => {
                          navigate(`/payment/${payment._id}`);
                        }}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell>
                          {new Date(payment.paymentDate).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              payment.paymentType === "Payment In"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {payment.paymentType}
                          </span>
                        </TableCell>
                        <TableCell>{payment.paymentNumber || "-"}</TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell className="text-right">
                          ₹ {payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.status === "COMPLETED"
                                ? "success"
                                : payment.status === "PENDING"
                                ? "warning"
                                : "destructive"
                            }
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          <TabsContent value="ledger" className="m-0">
            <LedgerTabContent
              isActive={tabName === "ledger"}
              distributorId={distributorId}
            />
          </TabsContent>
        </div>
      </Tabs>
      <CreateDistributorDlg
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={handleEditSuccess}
        distributorToEdit={distributorDetails}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-xl p-0 gap-0">
          <AlertDialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
            <AlertDialogTitle className="text-base font-semibold">Delete Distributor</AlertDialogTitle>
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
              Are you sure you want to delete this distributor? This action will permanently delete all associated records and cannot be undone.
            </AlertDialogDescription>
          </div>
          <div className="p-3 bg-gray-100 border-t flex items-center justify-end gap-2">
            <Button 
              onClick={() => setIsDeleteDialogOpen(false)} 
              variant="outline" 
              size="sm"
              disabled={deleteDistributorStatus === "loading"}
              className='px-4'
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              size="sm"
              className='px-4 bg-red-500 text-white hover:bg-red-600'
              disabled={deleteDistributorStatus === "loading"}
            >
              {deleteDistributorStatus === "loading" ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
