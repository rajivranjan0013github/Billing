import React,{ useRef, useState, useMemo, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { ArrowLeft, Pencil, Save, Settings2, ChevronRight, Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import PurchaseItemTable from "../components/custom/purchase/PurchaseItemTable";
import { Backend_URL } from "../assets/Data";
import { useToast } from "../hooks/use-toast";
import SelectdistributorDialog from "../components/custom/distributor/SelectDistributorDlg";
import { calculateTotals } from "./CreatePurchaseInvoice";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchItems } from "../redux/slices/inventorySlice";
import { deletePurchaseBill } from "../redux/slices/PurchaseBillSlice";
import PaymentDialog from "../components/custom/payment/PaymentDialog";
import AmountSettingsDialog from "../components/custom/purchase/AmountSettingDialog";
import MakePaymentDlg from "../components/custom/payment/MakePaymentDlg";
import { ScrollArea } from "../components/ui/scroll-area";
import { formatCurrency } from "../utils/Helper";
import { Separator } from "../components/ui/separator";

const inputKeys = ['distributorName', 'invoiceNo', 'invoiceDate', 'dueDate', 'product', 'HSN', 'batchNumber', 'expiry', 'pack', 'quantity', 'free', 'mrp', 'purchaseRate', 'schemeInput1', 'schemeInput2', 'discount', 'gstPer', 'addButton'];

const roundToTwo = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

// Helper function to format date to YYYY-MM-DD
const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

// Helper function to format date for API
const formatDateForAPI = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
};

export default function EditPurchaseInvoice() {
  const inputRef = useRef([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState(true);
  const [invoiceDate, setInvoiceDate] = useState();
  const [dueDate, setDueDate] = useState();
  const [products, setProducts] = useState([]);
  const [distributorSelectDialog, setdistributorSelectDialog] = useState(false);
  const [distributorName, setdistributorName] = useState("");
  const [billSummary, setBillSummary] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoiceForPayment, setInvoiceForPayment] = useState(null);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('due');
  const [payments, setPayments] = useState([]);
  const [paymentOutDialogOpen, setPaymentOutDialogOpen] = useState(false);
  const [paymentOutData, setPaymentOutData] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { deleteStatus } = useSelector((state) => state.purchaseBill);

  const [formData, setFormData] = useState({
    purchaseType: "invoice",
    distributorName: "",
    distributorId: "",
    invoiceNumber: "",
    invoiceDate: "",
    paymentDueDate: "",
    withGst: "yes",
    overallDiscount: "", // in percentage
    amountType: "exclusive", // 'exclusive', 'inclusive_gst', 'inclusive_all'
  });

  // fetching invoice data from server
  useEffect(() => {
    const fetchBill = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${Backend_URL}/api/purchase/invoice/${invoiceId}`,
          { credentials: "include" }
        );
        if (!response.ok) {
          throw new Error("Something went wrong");
        }
        const data = await response.json();

        // Update to handle the new data format
        const {
          distributorName,
          distributorId,
          invoiceNumber,
          products,
          invoiceDate,
          paymentDueDate,
          withGst,
          billSummary,
          mob,
          amountCalculationType,
          amountPaid,
          paymentStatus,
          payments = [],
        } = data;

        // Transform products data
        const tempData = products.map((p) => ({
          ...p,
          quantity: p.quantity / (p.pack || 1),
        }));

        setProducts(tempData);
        setInvoiceDate(formatDateForInput(invoiceDate));
        setDueDate(formatDateForInput(paymentDueDate));
        setAmountPaid(amountPaid || 0);
        setPaymentStatus(paymentStatus || 'due');
        setPayments(payments);

        setFormData({
          ...formData,
          distributorName,
          distributorId,
          invoiceNumber,
          withGst: withGst ? "yes" : "no",
          amountType: amountCalculationType || "exclusive",
          mob: mob || "",
        });

        if (billSummary) {
          setBillSummary(billSummary);
        }
        setdistributorName(distributorName);
      } catch (error) {
        console.error("Error fetching bill:", error);
        toast({
          title: "Error",
          description: "Failed to fetch invoice details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchBill();
    }
  }, [invoiceId]);

  // caculating total of the product
  const amountData = useMemo(
    () => calculateTotals(products, formData.amountType),
    [products]
  );

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle key navigation
  const handleKeyDown = (e, nextInputId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        const nextInputIndex = inputKeys.indexOf(nextInputId);
        if(nextInputIndex > 1) {
          const newInputId = inputKeys[nextInputIndex-2];
          if (newInputId && inputRef.current[newInputId]) {
            inputRef.current[newInputId].focus();
          }
        }
      } else {
        if (nextInputId && inputRef.current[nextInputId]) {
          inputRef.current[nextInputId].focus();
        }
      }
    }
  };

  // shortcut for saving invoice
  const handleShortcutKeyPressed = (e) => {
    if(e.altKey && e.key === "s") {
      e.preventDefault()
      handleSaveInvoice();
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleShortcutKeyPressed);

    return () => {
      document.removeEventListener("keydown", handleShortcutKeyPressed);
    };
  }, []);

  const handleSaveInvoice = async () => {
    try {
      setLoading(true);
      // Validate required fields
      if (!formData.distributorName || !formData.invoiceNumber || !invoiceDate) {
        throw new Error("Please fill all required fields");
      }

      if (products.length === 0) {
        throw new Error("Please add at least one product");
      }

      // Format products data to match schema
      const formattedProducts = products.map((product) => ({
        inventoryId: product.inventoryId,
        productName: product.productName,
        batchNumber: product.batchNumber,
        batchId: product.batchId,
        expiry: product.expiry,
        HSN: product.HSN || "",
        mrp: roundToTwo(Number(product.mrp)),
        quantity: Number(product.quantity) * (Number(product.pack) || 1),
        free: Number(product.free || 0),
        pack: Number(product.pack),
        purchaseRate: roundToTwo(Number(product.purchaseRate)),
        schemeInput1: Number(product.schemeInput1 || 0),
        schemeInput2: Number(product.schemeInput2 || 0),
        discount: roundToTwo(Number(product.discount || 0)),
        gstPer: roundToTwo(Number(product.gstPer)),
        amount: roundToTwo(Number(product.amount)),
      }));

      const finalData = {
        _id: invoiceId,
        invoiceType: "PURCHASE",
        invoiceNumber: formData.invoiceNumber,
        distributorName: formData.distributorName,
        distributorId: formData.distributorId,
        mob: formData.mob || "",
        invoiceDate: formatDateForAPI(invoiceDate),
        paymentDueDate: formatDateForAPI(dueDate),
        products: formattedProducts,
        withGst: formData.withGst === "yes",
        amountCalculationType: formData.amountType,
        billSummary: {
          subtotal: roundToTwo(amountData.subtotal),
          discountAmount: roundToTwo(amountData.discountAmount),
          taxableAmount: roundToTwo(amountData.taxable),
          gstAmount: roundToTwo(amountData.gstAmount),
          totalQuantity: amountData.totalQuantity,
          productCount: amountData.productCount,
          grandTotal: roundToTwo(amountData.grandTotal),
        },
        paymentStatus: "due",
        amountPaid: 0,
      };

      const response = await fetch(`${Backend_URL}/api/purchase/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save invoice");
      }

      await response.json();
      
      toast({
        title: "Purchase invoice updated successfully",
        variant: "success",
      });

      // Refresh inventory items
      dispatch(fetchItems());

      // Navigate back
      navigate(-1);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle distributor name input change
  const handleDistributorNameChange = (e) => {
    e.preventDefault();
    const value = e.target.value;

    // Open dialog if space is pressed or text is entered
    if (value.length === 1 && value === " ") {
      setdistributorSelectDialog(true);
      return;
    }
    if (value.length > 0 && value[0] !== " ") {
      setdistributorName(value);
      setdistributorSelectDialog(true);
    }
  };

  // Handle distributor selection from dialog
  const handleDistributorSelect = (distributor) => {
    setdistributorName(distributor.name);
    setFormData({
      ...formData,
      distributorId: distributor._id,
      distributorName: distributor.name,
    });
    setdistributorSelectDialog(false);
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      setLoading(true);
      // Format products data to match schema
      const formattedProducts = products.map((product) => ({
        inventoryId: product.inventoryId,
        productName: product.productName,
        batchNumber: product.batchNumber,
        batchId: product.batchId,
        expiry: product.expiry,
        HSN: product.HSN || "",
        mrp: roundToTwo(Number(product.mrp)),
        quantity: Number(product.quantity) * (Number(product.pack) || 1),
        free: Number(product.free || 0),
        pack: Number(product.pack),
        purchaseRate: roundToTwo(Number(product.purchaseRate)),
        schemeInput1: Number(product.schemeInput1 || 0),
        schemeInput2: Number(product.schemeInput2 || 0),
        discount: roundToTwo(Number(product.discount || 0)),
        gstPer: roundToTwo(Number(product.gstPer)),
        amount: roundToTwo(Number(product.amount)),
      }));

      const purchaseData = {
        _id: invoiceId,
        invoiceType: "PURCHASE",
        invoiceNumber: formData.invoiceNumber,
        distributorName: formData.distributorName,
        distributorId: formData.distributorId,
        mob: formData.mob || "",
        invoiceDate: formatDateForAPI(invoiceDate),
        paymentDueDate: paymentData.status === "due" ? formatDateForAPI(paymentData.dueDate) : null,
        products: formattedProducts,
        withGst: formData.withGst === "yes",
        amountCalculationType: formData.amountType,
        billSummary: {
          subtotal: roundToTwo(amountData.subtotal),
          discountAmount: roundToTwo(amountData.discountAmount),
          taxableAmount: roundToTwo(amountData.taxable),
          gstAmount: roundToTwo(amountData.gstAmount),
          totalQuantity: amountData.totalQuantity,
          productCount: amountData.productCount,
          grandTotal: roundToTwo(amountData.grandTotal),
        },
        status: "active",
        paymentStatus: paymentData.status,
        grandTotal: roundToTwo(amountData.grandTotal),
        amountPaid: paymentData.status === "due" ? 0 : Number(paymentData.amount || 0),
        payment: paymentData.status === "paid" ? {
          amount: Number(paymentData.amount || 0),
          paymentType: paymentData.paymentType,
          paymentMethod: paymentData.paymentMethod,
          distributorId: formData.distributorId,
          distributorName: formData.distributorName,
          remarks: paymentData.notes,
          ...(paymentData.paymentMethod !== "cheque" && {
            accountId: paymentData.accountId,
          }),
          ...(paymentData.paymentMethod === "cheque" && {
            chequeNumber: paymentData.chequeNumber,
            chequeDate: formatDateForAPI(paymentData.chequeDate),
            micrCode: paymentData.micrCode,
          }),
        } : null,
      };

      const response = await fetch(`${Backend_URL}/api/purchase/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(purchaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save invoice");
      }

      await response.json();
      
      toast({
        title: "Purchase invoice updated successfully",
        variant: "success",
      });

      // Refresh inventory items
      dispatch(fetchItems());

      // Navigate back
      navigate(-1);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async () => {
    try {
      await dispatch(deletePurchaseBill(invoiceId)).unwrap();
      toast({
        title: "Success",
        description: "Purchase invoice deleted successfully",
        variant: "success",
      });
      navigate(-1);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice",
        variant: "destructive",
      });
    }
  };

  return (
    <div className=" relative rounded-lg h-[100vh] pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">
            {viewMode ? "View" : "Edit"} Purchase
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Column Settings
          </Button>
          {viewMode ? (
            <>
              <Button
                size="sm"
                variant="destructive"
                className="gap-2"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setViewMode(false)}
              >
                <Pencil className="w-4 h-4" /> Edit
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="gap-2"
              onClick={handleSaveInvoice}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save (Alt + S)
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <Separator className="my-2" />

      <ScrollArea className="h-[calc(100vh-9rem)] pr-4">

      {/* extra information */}
      <div className="grid gap-2">
        <div className="grid gap-4 grid-cols-5 w-full">
          <div className="flex gap-8">
            <div>
              <Label className="text-sm font-medium">PURCHASE TYPE</Label>
              <RadioGroup
                value={formData?.purchaseType}
                onValueChange={(value) =>
                  handleInputChange("purchaseType", value)
                }
                className=" gap-4 mt-2"
                disabled={viewMode}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="invoice" id="invoice" />
                  <Label htmlFor="invoice">INVOICE</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="challan" id="challan" />
                  <Label htmlFor="challan">DELIVERY CHALLAN</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label className="text-sm font-medium">WITH GST?</Label>
              <RadioGroup
                className=" gap-4 mt-2"
                value={formData?.withGst}
                onValueChange={(value) => handleInputChange("withGst", value)}
                disabled={viewMode}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes">YES</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no">NO</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">
              DISTRIBUTOR NAME<span className="text-rose-500">*REQUIRED</span>
            </Label>
            <Input
              ref={el => inputRef.current['distributorName'] = el}
              value={distributorName || ""}
              onChange={handleDistributorNameChange}
              onKeyDown={(e) => handleKeyDown(e, 'invoiceNo')}
              placeholder="Type or Press space"
              disabled={viewMode}
            />
          </div>
          <div>
            <Label className="text-sm font-medium">
              INVOICE NO<span className="text-rose-500">*REQUIRED</span>
            </Label>
            <Input
              ref={el => inputRef.current['invoiceNo'] = el}
              value={formData?.invoiceNumber}
              onChange={(e) =>
                handleInputChange("invoiceNumber", e.target.value)
              }
              onKeyDown={(e) => handleKeyDown(e, 'invoiceDate')}
              placeholder="Invoice No"
              disabled={viewMode}
            />
          </div>
          <div>
            <Label className="text-sm font-medium">
              INVOICE DATE<span className="text-rose-500">*REQUIRED</span>
            </Label>
            <Input
              ref={el => inputRef.current['invoiceDate'] = el}
              type="date"
              value={invoiceDate || ''}
              onChange={(e) => {
                setInvoiceDate(e.target.value);
              }}
              onKeyDown={(e) => handleKeyDown(e, 'dueDate')}
              disabled={viewMode}
            />
          </div>
          <div>
            <Label className="text-sm font-medium">PAYMENT DUE DATE</Label>
            <Input
              ref={el => inputRef.current['dueDate'] = el}
              type="date"
              value={dueDate || ''}
              onChange={(e) => {
                setDueDate(e.target.value);
              }}
              onKeyDown={(e) => handleKeyDown(e, 'product')}
              disabled={viewMode}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-200 rounded" />
            <span>Near Expiry Batches</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-rose-200 rounded" />
            <span>Expired Batches</span>
          </div>
        </div>
      </div>

      {/* purchase table */}
      <div className="my-4">
        <PurchaseItemTable
          inputRef={inputRef}
          products={products}
          setProducts={setProducts}
          viewMode={viewMode}
          gstMode={formData.amountType}
          handleKeyDown={handleKeyDown}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="mb-4 text-sm font-medium">OVERALL BILL DISCOUNT</h3>
          <div className="flex gap-4">
            <Input
              placeholder="Value"
              className="w-24"
              value={formData?.overallDiscount}
              onChange={(e) =>
                handleInputChange("overallDiscount", e.target.value)
              }
            />
            %<span className="px-2 py-1">OR</span>
            <Input placeholder="₹ Value" className="flex-1" />
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="mb-4 text-sm font-medium">CUSTOM CHARGE</h3>
          <div className="flex gap-4">
            <Input placeholder="Custom charge" />
            <Input placeholder="₹ Value" />
          </div>
        </div>
        <div className="flex items-center justify-center p-4 border rounded-lg">
          <div className="text-center">
            <div className="mb-1">Click on Save to Add Payment</div>
            <div className="text-sm text-muted-foreground">Use 'Alt+S' Key</div>
          </div>
        </div>
      </div>

      {/* Payment Details Section */}
      <div className="mb-10 mt-4">
        <div className="border rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b bg-gray-50">
            <h3 className="text-lg font-medium">Payment History</h3>
            <Button
              variant="outline"
              size="sm"
              disabled={amountPaid >= amountData?.grandTotal}
              onClick={() => {
                setPaymentOutData({
                  paymentType: "Payment Out",
                  distributorId: formData.distributorId,
                  distributorName: formData.distributorName,
                  amount: roundToTwo(amountData?.grandTotal - amountPaid),
                  bills: [{
                    billId: invoiceId,
                    billNumber: formData.invoiceNumber,
                    grandTotal: roundToTwo(amountData?.grandTotal),
                    amountPaid: roundToTwo(amountPaid)
                  }]
                });
                setPaymentOutDialogOpen(true);
              }}
            >
              Add New Payment
            </Button>
          </div>
          
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Payment Number</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Amount</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Method</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Reference</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Remarks</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) => (
                    <tr 
                      key={payment._id || index}
                      className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 text-sm">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {payment.paymentNumber}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        ₹{payment.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {payment.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          payment.status === "PENDING" 
                            ? "bg-yellow-100 text-yellow-800"
                            : payment.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {payment.paymentMethod === "CHEQUE" 
                          ? `Cheque: ${payment.chequeNumber}`
                          : payment.paymentMethod === "BANK" || payment.paymentMethod === "UPI"
                          ? `Txn: ${payment.transactionNumber || 'N/A'}`
                          : payment.paymentMethod}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {payment.remarks || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/purchase/payment-out/${payment._id}`)}
                            className='h-6 w-6'
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">No payment records found</p>
              <p className="text-xs text-gray-400 mt-1">Click 'Add New Payment' to record a payment</p>
            </div>
          )}
        </div>
      </div>
      </ScrollArea>
      {/* footer of purchase */}
      <div className="fixed bottom-0 w-[cal(100%-200px)] grid grid-cols-9 gap-4 p-4 text-sm text-white bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="mb-1 text-gray-400">
            Total Products: {amountData?.productCount}
          </div>
          <div className="text-gray-400">
            Total Quantity: {amountData?.totalQuantity}
          </div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-gray-400">Subtotal</div>
          <div>{formatCurrency(amountData?.subtotal)}</div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-gray-400">(-) Discount</div>
          <div>{formatCurrency(amountData?.discountAmount)}</div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-gray-400">Taxable</div>
          <div>{formatCurrency(amountData?.taxable)}</div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-gray-400">(+) GST Amount</div>
          <div>{formatCurrency(amountData?.gstAmount)}</div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-gray-400">(-) Adjustment</div>
          <div>₹0</div>
        </div>
        <div className="bg-rose-500 -m-4 p-4 rounded-r-lg text-center">
          <div className="mb-1">Total Amount</div>
          <div>{formatCurrency(amountData?.grandTotal)}</div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-gray-400">Amount Paid</div>
          <div>{formatCurrency(amountPaid)}</div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-gray-400">Due Amount</div>
          <div>{formatCurrency(amountData?.grandTotal - amountPaid)}</div>
        </div>
        
      </div>
      <SelectdistributorDialog
        open={distributorSelectDialog}
        setOpen={setdistributorSelectDialog}
        search={distributorName}
        setSearch={setdistributorName}
        onSelect={handleDistributorSelect}
      />
      <AmountSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        value={formData.amountType}
        onChange={(value) => handleInputChange("amountType", value)}
        products={products}
        setProducts={setProducts}
      />
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoiceData={invoiceForPayment}
        onSubmit={handlePaymentSubmit}
      />
      <MakePaymentDlg
        open={paymentOutDialogOpen}
        onOpenChange={setPaymentOutDialogOpen}
        paymentData={paymentOutData}
        showStep1={true}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-xl p-0 gap-0">
          <AlertDialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
            <AlertDialogTitle className="text-base font-semibold">Delete Purchase Invoice</AlertDialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setDeleteDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDialogHeader>
          <div className="p-6">
            <AlertDialogDescription>
              Are you sure you want to delete this purchase invoice? This action will permanently delete the invoice
              and revert all associated inventory adjustments and payment records.
            </AlertDialogDescription>
          </div>
          <div className="p-3 bg-gray-100 border-t flex items-center justify-end gap-2">
            <Button 
              onClick={() => setDeleteDialogOpen(false)} 
              variant="outline" 
              size="sm"
              disabled={deleteStatus === "loading"}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteInvoice} 
              size="sm"
              disabled={deleteStatus === "loading"}
            >
              {deleteStatus === "loading" ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
