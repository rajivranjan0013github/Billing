import { useRef, useState, useMemo, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Checkbox } from "../components/ui/checkbox";
import { ArrowLeft, Pencil, Save, FileText, Trash2, ChevronRight, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { Backend_URL, convertQuantityValue } from "../assets/Data";
import { useToast } from "../hooks/use-toast";
import { CustomerSuggestionWithDialog } from "../components/custom/sales/customerSuggestion";
import { calculateTotals } from "./CreateSellInvoice";
import { useParams, useNavigate } from "react-router-dom";
import SaleItemTable from "../components/custom/sales/SaleItemTable";
import { useSelector, useDispatch } from "react-redux";
import { formatCurrency } from "../utils/Helper";
import { fetchSettings } from '../redux/slices/settingsSlice'
import { editSaleInvoice, deleteSaleInvoice } from '../redux/slices/SellBillSlice';
import MakePaymentDlg from "../components/custom/payment/MakePaymentDlg";
import SearchSuggestion from "../components/custom/custom-fields/CustomSearchSuggestion";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

// Helper function to round to 2 decimal places
const roundToTwo = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

const inputKeys = [
  "customerName",
  "doctorName",
  "product",
  "batchNumber",
  "hsn",
  "pack",
  "expiry",
  "mrp",
  "packs",
  "loose",
  "saleRate",
  "discount",
  "gstPer",
  "add",
];

export default function EditSaleInvoice() {
  const inputRef = useRef([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {settings, status } = useSelector(state => state.settings)
  const { isCollapsed } = useSelector((state) => state.loader);
  const { invoiceId } = useParams();
  const doctors = useSelector((state) => state.staff?.doctors);
  const [viewMode, setViewMode] = useState(true);
  const [invoiceDate, setInvoiceDate] = useState();
  const [dueDate, setDueDate] = useState();
  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [isCashCounter, setIsCashCounter] = useState(false);
  const [completeData, setCompleteData] = useState(null);
  const [amountPaid, setAmountPaid] = useState(0);
  const [payments, setPayments] = useState([]);
  const [paymentOutData, setPaymentOutData] = useState(null);
  const [paymentOutDialogOpen, setPaymentOutDialogOpen] = useState(false);
  const [editedPayments, setEditedPayments] = useState({});
  const { editBillStatus, deleteStatus } = useSelector((state) => state.bill);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Convert doctors array to the format expected by SearchSuggestion
  const doctorSuggestions = doctors.map((doctor, index) => ({
    _id: index + 1,
    name: doctor.name?.includes("Dr") ? doctor.name : `Dr. ${doctor.name}`,
  }));

  const [formData, setFormData] = useState({
    saleType: "invoice",
    customerName: "",
    customerId: "",
    invoiceNumber: "",
    invoiceDate: "",
    paymentDueDate: "",
    withGst: "yes",
    overallDiscount: "",
  });

  // fetching setting config
  useEffect(()=> {
    if(status === 'idle') {
      dispatch(fetchSettings());
    }
  }, [status, settings]);

  // Fetch invoice data from server
  useEffect(() => {
    const fetchBill = async () => {
      try {
        const response = await fetch(
          `${Backend_URL}/api/sales/invoice/${invoiceId}`,
          { credentials: "include" }
        );
        if (!response.ok) {
          throw new Error("Something went wrong");
        }
        const data = await response.json();
        setCompleteData(data);
        const {customerName,customerId,invoiceNumber,products,invoiceDate,paymentDueDate,withGst,amountPaid,payments,saleType,is_cash_customer,doctorName} = data;
        const fomateProduct = products.map((item) => {
          const temp = convertQuantityValue(item.quantity, item.pack);
          return { ...item, ...temp };
        });
        setProducts(fomateProduct);
        setInvoiceDate(invoiceDate ? new Date(invoiceDate) : null);
        setDueDate(paymentDueDate ? new Date(paymentDueDate) : null);
        setAmountPaid(amountPaid);
        setFormData({
          ...formData,
          customerName,
          customerId,
          invoiceDate,
          paymentDueDate,
          invoiceNumber,
          saleType,
          withGst: withGst ? "yes" : "no",
          doctorName,
        });
        setCustomerName(customerName);
        setIsCashCounter(is_cash_customer);
        setPayments(payments);
        // Initialize editedPayments with original amounts
        const initialEditedPayments = {};
        payments.forEach(payment => {
          initialEditedPayments[payment._id] = payment.amount;
        });
        setEditedPayments(initialEditedPayments);
      } catch (error) {
        console.error("Error fetching bill:", error);
        toast({
          title: "Error",
          description: "Failed to fetch invoice details",
          variant: "destructive",
        });
      }
    };
    if (invoiceId) {
      fetchBill();
    }
  }, [invoiceId]);

  // Calculate totals
  const amountData = useMemo(() => calculateTotals(products, completeData?.billSummary?.adjustment), [products]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Add function to handle payment amount changes
  const handlePaymentAmountChange = (paymentId, newAmount) => {
    setEditedPayments(prev => ({
      ...prev,
      [paymentId]: Number(newAmount)
    }));

    // Recalculate total amount paid
    let newTotalPaid = 0;
    payments.forEach(payment => {
      if (payment._id === paymentId) {
        newTotalPaid += Number(newAmount);
      } else {
        newTotalPaid += editedPayments[payment._id] || payment.amount;
      }
    });
    setAmountPaid(newTotalPaid);
  };

  const handleSaveInvoice = async () => {
    try {
      if (!formData.customerName || !formData.invoiceNumber || !invoiceDate) {
        throw new Error("Please fill all required fields");
      }

      if (products.length === 0) {
        throw new Error("Please add at least one product");
      }

      const formattedProducts = products.map((product) => ({
        types: product.types,
        inventoryId: product.inventoryId,
        productName: product.productName,
        batchNumber: product.batchNumber,
        batchId: product.batchId,
        HSN: product.HSN,
        expiry: product.expiry,
        mrp: Number(product.mrp),
        quantity: Number(product.quantity),
        pack: Number(product.pack),
        saleRate: Number(product.saleRate),
        purchaseRate: Number(product.purchaseRate),
        discount: Number(product.discount || 0),
        gstPer: Number(product.gstPer),
        amount: Number(product.amount),
      }));

      // Create updated payments array with edited amounts
      const updatedPayments = payments.map(payment => ({
        _id : payment._id,
        amount: editedPayments[payment._id] || payment.amount
      }));

      const finalData = {
        _id: invoiceId,
        invoiceType: "SALE",
        invoiceNumber: formData.invoiceNumber,
        customerName: isCashCounter ? "Cash/Counter" : formData.customerName,
        customerId: isCashCounter ? null : formData.customerId,
        is_cash_customer: isCashCounter,
        invoiceDate: invoiceDate,
        paymentDueDate: amountData?.grandTotal > amountPaid  ? dueDate : null,
        doctorName: formData.doctorName,
        products: formattedProducts,
        withGst: formData.withGst === "yes",
        grandTotal: amountData.grandTotal,
        billSummary: {
          subtotal: amountData.subtotal,
          discountAmount: amountData.discountAmount,
          taxableAmount: amountData.taxable,
          gstAmount: amountData.gstAmount,
          totalQuantity: amountData.totalQuantity,
          productCount: amountData.productCount,
          grandTotal: amountData.grandTotal,
          returnAmount: amountData.returnAmount,
          gstSummary: {
            0: { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
            5: { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
            12: { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
            18: { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
            28: { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
          },
        },
        paymentStatus: amountPaid >= amountData.grandTotal ? 'paid' : 'due',
        amountPaid: amountPaid,
        payments: updatedPayments
      };

      // Calculate GST summary
      products.forEach((product) => {
        const quantity = Number(product.quantity || 0);
        const pack = Number(product.pack || 1);
        const mrp = Number(product.mrp || 0);
        const discountPercent = Number(product.discount || 0);
        const gstPer = Number(product.gstPer || 0);

        const subtotal = (quantity * mrp) / pack;
        const discount = (subtotal * discountPercent) / 100;
        const taxable = ((subtotal - discount) * 100) / (100 + gstPer);
        const gstAmount = (taxable * gstPer) / 100;

        if (finalData.billSummary.gstSummary.hasOwnProperty(gstPer)) {
          finalData.billSummary.gstSummary[gstPer].taxable += Number(
            taxable.toFixed(2)
          );
          finalData.billSummary.gstSummary[gstPer].cgst += Number(
            (gstAmount / 2).toFixed(2)
          );
          finalData.billSummary.gstSummary[gstPer].sgst += Number(
            (gstAmount / 2).toFixed(2)
          );
          finalData.billSummary.gstSummary[gstPer].total += Number(
            gstAmount.toFixed(2)
          );
        }
      });

      const result = await dispatch(editSaleInvoice(finalData)).unwrap();

      toast({
        title: "Sale invoice saved successfully",
        variant: "success",
      });

      navigate(-1);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save invoice",
        variant: "destructive",
      });
    }
  };

  const handleCustomerSelect = (customer) => {
    setCustomerName(customer.name);
    setFormData({
      ...formData,
      customerId: customer._id,
      customerName: customer.name,
    });
    setIsCashCounter(false);
    if (inputRef && inputRef.current["product"]) {
      inputRef.current["product"].focus();
    }
  };

  const handleKeyDown = (e, currentInputId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const currentInputIndex = inputKeys.indexOf(currentInputId);
      if (e.shiftKey) {
        if (currentInputIndex > 0) {
          const newInputId = inputKeys[currentInputIndex - 1];
          if (newInputId && inputRef.current[newInputId]) {
            inputRef.current[newInputId].focus();
          }
        }
      } else {
        if (currentInputIndex < inputKeys.length - 1) {
          const newInputId = inputKeys[currentInputIndex + 1];
          if (newInputId && inputRef.current[newInputId]) {
            inputRef.current[newInputId].focus();
          }
        }
      }
    }
  };

  const handleAddNewPayment = () => {
    setPaymentOutData({ 
      invoiceType : 'sales',
      paymentType: "Payment In",
      distributorId: formData.customerId,
      distributorName: isCashCounter ? "Cash/Counter" : formData.customerName,
      amount: roundToTwo(amountData?.grandTotal - amountPaid),
      bills: [
        {
          billId: invoiceId,
          billNumber: formData.invoiceNumber,
          grandTotal: roundToTwo(amountData?.grandTotal),
          amountPaid: roundToTwo(amountPaid),
        },
      ],
    });
    setPaymentOutDialogOpen(true);
  };

  const handleDeleteInvoice = async () => {
    try {
      await dispatch(deleteSaleInvoice(invoiceId)).unwrap();
      toast({
        title: "Success",
        description: "Sale invoice deleted successfully",
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
    <div className="relative rounded-lg h-[100vh] pt-2 ">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">
            {viewMode ? "View" : "Edit"} Sale Invoice
          </h1>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-3">
            {viewMode ? (
              <>
                <Button
                  className="gap-2 bg-blue-600"
                  onClick={() => {
                    navigate(`/sales/invoice-print`, {
                      state: {
                        invoiceData: completeData,
                      },
                    });
                  }}
                >
                  <FileText className="w-4 h-4" /> Show Invoice
                </Button>
                <Button
                  className="gap-2 bg-blue-600 px-6"
                  onClick={() => setViewMode(false)}
                >
                  <Pencil className="w-4 h-4" /> Edit
                </Button>

                <Button 
                  className="gap-2 bg-rose-600 hover:bg-rose-500"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </>
            ) : (
              <Button
                className="gap-2"
                onClick={handleSaveInvoice}
                disabled={editBillStatus === 'loading'}
              >
                {editBillStatus === 'loading' ? (
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
      </div>

      {/* Form Content */}
      <div className="grid gap-2">
        <div className="grid gap-4 grid-cols-6 w-full">
          <div className="flex gap-8">
            <div>
              <Label className="text-sm font-medium">SALE TYPE</Label>
              <RadioGroup
                value={formData?.saleType}
                onValueChange={(value) => handleInputChange("saleType", value)}
                className=" gap-4 mt-2"
                disabled={viewMode}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="invoice" id="invoice" />
                  <Label htmlFor="invoice">INVOICE</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="return" id="return" />
                  <Label htmlFor="challan">SALE RETURN</Label>
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
              CUSTOMER NAME<span className="text-rose-500">*REQUIRED</span>
            </Label>
            <CustomerSuggestionWithDialog
              inputRef={inputRef}
              value={customerName}
              setValue={setCustomerName}
              onSuggestionSelect={handleCustomerSelect}
              onKeyDown={(e) => handleKeyDown(e, "customerName")}
              ref={(el) => (inputRef.current["customerName"] = el)}
              disabled={viewMode}
            />
            <div className="flex items-center gap-2 mt-1 text-sm font-semibold">
              <Checkbox
                checked={isCashCounter}
                disabled={viewMode}
                onCheckedChange={(checked) => {
                  if (!checked && !customerName) {
                    toast({
                      title: "Please select customer to uncheck",
                      variant: "destructive",
                    });
                    return;
                  }
                  setIsCashCounter(checked);
                  if (checked) {
                    setCustomerName("");
                    setFormData((prev) => ({
                      ...prev,
                      customerName: "",
                      customerId: "",
                    }));
                  }
                }}
              />
              Cash/Counter Sale
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">DOCTOR NAME</Label>
            <SearchSuggestion
              suggestions={doctorSuggestions}
              placeholder="Enter or select doctor name"
              value={formData.doctorName}
              setValue={(value) => handleInputChange("doctorName", value)}
              onSuggestionSelect={(selected) => {
                handleInputChange("doctorName", selected.name);
                // Focus on the product input after selecting a doctor
                if (inputRef.current["product"]) {
                  inputRef.current["product"].focus();
                }
              }}
              onKeyDown={(e) => handleKeyDown(e, "doctorName")}
              ref={(el) => (inputRef.current["doctorName"] = el)}
              disabled={viewMode}
            />
          </div>
          <div>
            <Label className="text-sm font-medium">
              INVOICE NO<span className="text-rose-500">*REQUIRED</span>
            </Label>
            <Input
              value={formData?.invoiceNumber}
              onChange={(e) =>
                handleInputChange("invoiceNumber", e.target.value)
              }
              placeholder="Invoice No"
              disabled={viewMode}
            />
          </div>
          <div>
            <Label className="text-sm font-medium">
              INVOICE DATE<span className="text-rose-500">*REQUIRED</span>
            </Label>
            <Input
              type="date"
              value={invoiceDate ? format(invoiceDate, "yyyy-MM-dd") : ""}
              onChange={(e) => setInvoiceDate(new Date(e.target.value))}
              disabled={viewMode}
              className="w-full"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">PAYMENT DUE DATE</Label>
            <Input
              type="date"
              value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""}
              onChange={(e) => setDueDate(new Date(e.target.value))}
              disabled={viewMode}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Sale Item Table */}
      <div className="my-4">
        <SaleItemTable
          inputRef={inputRef}
          products={products}
          setProducts={setProducts}
          viewMode={viewMode}
          handleKeyDown={handleKeyDown}
        />
      </div>

      {/* Footer */}
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
              disabled={viewMode}
            />
            %<span className="px-2 py-1">OR</span>
            <Input
              placeholder="₹ Value"
              className="flex-1"
              disabled={viewMode}
            />
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="mb-4 text-sm font-medium">CUSTOM CHARGE</h3>
          <div className="flex gap-4">
            <Input placeholder="Custom charge" disabled={viewMode} />
            <Input placeholder="₹ Value" disabled={viewMode} />
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
      <div className="pb-20 mt-4">
        <div className="border rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b bg-gray-50">
            <h3 className="text-lg font-medium">Payment History</h3>
            <Button
              variant="outline"
              size="sm"
              disabled={amountPaid >= amountData?.grandTotal}
              onClick={handleAddNewPayment}
              className='gap-1 px-2'
            >
              <Plus className="h-4 w-4" />
              Add Payment
            </Button>
          </div>

          {payments.length > 0 ? (
            <div className="overflow-x-auto ">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">
                      Date
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">
                      Payment Number
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">
                      Method
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">
                      Status
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">
                      Reference
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">
                      Remarks
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) => (
                    <tr
                      key={payment._id || index}
                      className={`border-t ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">
                        {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {payment.paymentNumber}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {!viewMode ? (
                          <Input
                            type="number"
                            value={editedPayments[payment._id] || payment.amount}
                            onChange={(e) => handlePaymentAmountChange(payment._id, e.target.value)}
                            className="w-24 h-8"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          formatCurrency(payment?.amount)
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {payment.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            payment.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : payment.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {payment.paymentMethod === "CHEQUE"
                          ? `Cheque: ${payment.chequeNumber}`
                          : payment.paymentMethod === "BANK" ||
                            payment.paymentMethod === "UPI"
                          ? `Txn: ${payment.transactionNumber || "N/A"}`
                          : payment.paymentMethod}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {payment.remarks || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate(`/payment/${payment._id}`)
                          }
                          className="h-6 w-6"
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
              <p className="text-xs text-gray-400 mt-1">
                Click 'Add New Payment' to record a payment
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className={`fixed bottom-0 text-sm ${
          isCollapsed ? "w-[calc(100%-95px)]" : "w-[calc(100%-225px)]"
        } grid grid-cols-10 gap-4 text-white bg-gray-900 rounded-lg transition-all duration-300 text-center`}
      >
        <div className="py-2">
          <div>Products: {amountData?.productCount}</div>
          <div>Quantity: {amountData?.totalQuantity}</div>
        </div>
        <div className="py-2">
          <div>Subtotal</div>
          <div className="text-lg">{formatCurrency(amountData?.subtotal)}</div>
        </div>
        <div className="py-2">
          <div>(-) Discount</div>
          <div className="text-lg">
            {formatCurrency(amountData?.discountAmount)}
          </div>
        </div>
        <div className="py-2">
          <div>Taxable</div>
          <div className="text-lg">{formatCurrency(amountData?.taxable)}</div>
        </div>
        <div className="py-2">
          <div className="">(+) GST Amount</div>
          <div className="text-lg">{formatCurrency(amountData?.gstAmount)}</div>
        </div>
        <div className="py-2">
          <div className="">
            {formData?.saleType === "return"
              ? "Return Amount"
              : "(+) Custom"}
          </div>
          <div className="text-lg">
            {formatCurrency(amountData?.returnAmount)}
          </div>
        </div>
        <div className="py-2">
          <div className="">(-) Adjustment</div>
          <div className="text-lg">{formatCurrency(amountData?.adjustment || 0)}</div>
        </div>
        <div className="bg-rose-500 py-2">
          <div className="">Total Amount</div>
          <div className="text-lg">
            {formatCurrency(amountData?.grandTotal)}
          </div>
        </div>
        <div className="py-2">
          <div>Amount Paid</div>
          <div className="text-lg">{formatCurrency(amountPaid)}</div>
        </div>
        <div className="py-2">
          <div>Due Amount</div>
          <div className="text-lg">
            {formatCurrency(amountData?.grandTotal - amountPaid)}
          </div>
        </div>
      </div>

      <MakePaymentDlg
        open={paymentOutDialogOpen}
        onOpenChange={setPaymentOutDialogOpen}
        paymentData={paymentOutData}
        showStep1={true}
      />

      {/* Add Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-xl p-0 gap-0">
          <AlertDialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
            <AlertDialogTitle className="text-base font-semibold">
              Delete Sale Invoice
            </AlertDialogTitle>
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
              Are you sure you want to delete this sale invoice? This action
              will permanently delete the invoice and revert all associated
              inventory adjustments and payment records.
            </AlertDialogDescription>
          </div>
          <div className="p-3 bg-gray-100 border-t flex items-center justify-end gap-2">
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              variant="outline"
              size="sm"
              disabled={deleteStatus === "loading"}
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteInvoice}
              size="sm"
              disabled={deleteStatus === "loading"}
              className="bg-destructive text-white hover:bg-destructive/90 px-4"
            >
              {deleteStatus === "loading" ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
