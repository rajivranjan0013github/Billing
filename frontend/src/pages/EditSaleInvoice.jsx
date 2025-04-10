import { useRef, useState, useMemo, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { ArrowLeft, Pencil, Save, FileText, Trash2, ChevronRight} from "lucide-react";
import { format } from "date-fns";
import { Backend_URL, convertQuantityValue } from "../assets/Data";
import { useToast } from "../hooks/use-toast";
import SelectdistributorDialog from "../components/custom/distributor/SelectDistributorDlg";
import { calculateTotals } from "./CreateSellInvoice";
import { useParams, useNavigate } from "react-router-dom";
import SaleItemTable from "../components/custom/sales/SaleItemTable";
import MakePaymentDlg from "../components/custom/payment/MakePaymentDlg";
import { useSelector } from "react-redux";
import { formatCurrency } from "../utils/Helper";

// Helper function to round to 2 decimal places
const roundToTwo = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export default function EditSaleInvoice() {
  const inputRef = useRef([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const {isCollapsed} = useSelector(state=>state.loader);
  const { invoiceId } = useParams();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState(true);
  const [invoiceDate, setInvoiceDate] = useState();
  const [dueDate, setDueDate] = useState();
  const [products, setProducts] = useState([]);
  const [distributorSelectDialog, setdistributorSelectDialog] = useState(false);
  const [distributorName, setdistributorName] = useState("");
  const [completeData, setCompleteData] = useState(null);
  const [amountPaid, setAmountPaid] = useState(0);
  const [payments, setPayments] = useState([]);
  const [paymentOutData, setPaymentOutData] = useState({
    paymentType: "Payment In",
    distributorId: "",
    distributorName: "",
    amount: 0,
    bills: [{
      billId: "",
      billNumber: "",
      grandTotal: 0,
      amountPaid: 0
    }]
  });
  const [paymentOutDialogOpen, setPaymentOutDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    saleType: "invoice",
    distributorName: "",
    distributorId: "",
    invoiceNumber: "",
    invoiceDate: "",
    paymentDueDate: "",
    withGst: "yes",
    overallDiscount: "",
  });

  // Fetch invoice data from server
  useEffect(() => {
    const fetchBill = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${Backend_URL}/api/sales/invoice/${invoiceId}`,{ credentials: "include" });
        if (!response.ok) {
          throw new Error("Something went wrong");
        }
        const data = await response.json();
        setCompleteData(data);
        const { distributorName, distributorId, invoiceNumber, products, invoiceDate, paymentDueDate, withGst, amountPaid, payments, saleType} = data;
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
          distributorName,
          distributorId,
          invoiceDate,
          paymentDueDate,
          invoiceNumber,
          saleType,
          withGst: withGst ? "yes" : "no",
        });
        setdistributorName(distributorName);
        setPayments(payments);
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

  // Calculate totals
  const amountData = useMemo(() => calculateTotals(products), [products]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveInvoice = async () => {
    try {
      setLoading(true);

      if (!formData.distributorName || !formData.invoiceNumber || !invoiceDate) {
        throw new Error("Please fill all required fields");
      }

      if (products.length === 0) {
        throw new Error("Please add at least one product");
      }
      const formattedProducts = products.map((product) => ({
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
        saleRate: Number(product.saleRate),
        discount: Number(product.discount || 0),
        gstPer: Number(product.gstPer),
        amount: Number(product.amount),
      }));

      const finalData = {
        _id: invoiceId,
        invoiceType: "SALE",
        invoiceNumber: formData.invoiceNumber,
        distributorName: formData.distributorName,
        distributorId: formData.distributorId,
        invoiceDate: invoiceDate,
        paymentDueDate: dueDate,
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
          gstSummary: {
            0: { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
            5: { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
            12: { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
            18: { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
            28: { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
          },
        },
        paymentStatus: "due",
        amountPaid: 0,
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

      const response = await fetch(
        `${Backend_URL}/api/sales/invoice/${invoiceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(finalData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save invoice");
      }

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
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerNameChange = (e) => {
    e.preventDefault();
    const value = e.target.value;

    if (value.length === 1 && value === " ") {
      setdistributorSelectDialog(true);
      return;
    }
    if (value.length > 0 && value[0] !== " ") {
      setdistributorName(value);
      setdistributorSelectDialog(true);
    }
  };
  const handleCustomerSelect = (customer) => {
    setdistributorName(customer.name);
    setFormData({
      ...formData,
      distributorId: customer._id,
      distributorName: customer.name,
    });
    setdistributorSelectDialog(false);
  };

  console.log(formData);
  console.log('complete',completeData);
  
  

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

                <Button className="gap-2 bg-rose-600 hover:bg-rose-500  ">
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </>
            ) : (
              <Button
                className="gap-2 bg-gray-800"
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
      </div>

      {/* Form Content */}
      <div className="grid gap-2">
        <div className="grid gap-4 grid-cols-5 w-full">
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
            <Input
              value={distributorName || ""}
              onChange={handleCustomerNameChange}
              placeholder="Type or Press space"
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
              value={invoiceDate ? format(invoiceDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => setInvoiceDate(new Date(e.target.value))}
              disabled={viewMode}
              className="w-full"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">PAYMENT DUE DATE</Label>
            <Input
              type="date"
              value={dueDate ? format(dueDate, 'yyyy-MM-dd') : ''}
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
                  paymentType: "Payment In",
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
                            onClick={() => navigate(`/sales/payment-in/${payment._id}`)}
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

      <div className={`fixed bottom-0 text-sm ${isCollapsed ? 'w-[calc(100%-95px)]' : 'w-[calc(100%-225px)]'} grid grid-cols-10 gap-4 text-white bg-gray-900 rounded-lg transition-all duration-300 text-center`}>
        <div className="py-2">
          <div >
            Products: {amountData?.productCount}
          </div>
          <div >
            Quantity: {amountData?.totalQuantity}
          </div>
        </div>
        <div className="py-2">
          <div >Subtotal</div>
          <div className="text-lg">{formatCurrency(amountData?.subtotal)}</div>
        </div>
        <div className="py-2">
          <div >(-) Discount</div>
          <div className='text-lg'>{formatCurrency(amountData?.discountAmount)}</div>
        </div>
        <div className="py-2">
          <div >Taxable</div>
          <div className='text-lg'>{formatCurrency(amountData?.taxable)}</div>
        </div>
        <div className="py-2">
          <div className="">(+) GST Amount</div>
          <div className='text-lg'>{formatCurrency(amountData?.gstAmount)}</div>
        </div>
        <div className="py-2">
          <div className="">{formData?.saleType === 'return' ? 'Return Amount' : '(+) Custom Charge'}</div>
          <div className='text-lg'>{formatCurrency(amountData?.returnAmount)}</div>
        </div>
        <div className="py-2">
          <div className="">(-) Adjustment</div>
          <div className='text-lg'>{formatCurrency(0)}</div>
        </div>
        <div className="bg-rose-500 py-2">
          <div className="">Total Amount</div>
          <div className='text-lg'>{formatCurrency(amountData?.grandTotal)}</div>
        </div>
        <div className="py-2">
          <div >Amount Paid</div>
          <div className='text-lg'>{formatCurrency(amountPaid)}</div>
        </div>
        <div className="py-2">
          <div >Due Amount</div>
          <div className='text-lg'>{formatCurrency(amountData?.grandTotal - amountPaid)}</div>
        </div>
      </div> 


      {/* distributor Selection Dialog */}
      <SelectdistributorDialog
        open={distributorSelectDialog}
        setOpen={setdistributorSelectDialog}
        search={distributorName}
        setSearch={setdistributorName}
        onSelect={handleCustomerSelect}
      />

      {/* Payment Dialog */}
      <MakePaymentDlg
        open={paymentOutDialogOpen}
        onOpenChange={setPaymentOutDialogOpen}
        paymentData={paymentOutData}
        showStep1={true}
      />
    </div>
  );
}
