import { useRef, useState, useMemo, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {  Save, Settings2, ArrowLeft } from "lucide-react";
import PurchaseItemTable from "../components/custom/purchase/PurchaseItemTable";
import { useToast } from "../hooks/use-toast";
import SelectDistributorDlg from "../components/custom/distributor/SelectDistributorDlg";
import { useDispatch, useSelector } from "react-redux";
import { createPurchaseBill } from "../redux/slices/PurchaseBillSlice";
import { useNavigate } from "react-router-dom";
import PaymentDialog from "../components/custom/payment/PaymentDialog";
import AmountSettingsDialog from "../components/custom/purchase/AmountSettingDialog";
const inputKeys = ['distributorName', 'invoiceNo', 'invoiceDate', 'dueDate', 'product', 'HSN', 'batchNumber', 'expiry', 'pack', 'quantity', 'free', 'mrp', 'purchaseRate', 'schemeInput1', 'schemeInput2', 'discount', 'gstPer', 'addButton' ];

const roundToTwo = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const calculateTotals = (products, amountType) => {
  return products.reduce(
    (total, product) => {
      const quantity = Number(product?.quantity || 0);
      const free = Number(product?.free || 0);
      const purchaseRate = Number(product?.purchaseRate || 0);
      const discountPercent =
        Number(product?.discount || 0) + Number(product?.schemePercent || 0);
      const gstPer = Number(product?.gstPer || 0);

      // Calculate base amount and effective rate
      const baseAmount = roundToTwo(quantity * purchaseRate);
      const discountAmount = roundToTwo((baseAmount * discountPercent) / 100);
      const effectiveRate = roundToTwo(
        purchaseRate - (purchaseRate * discountPercent) / 100
      );

      // Calculate taxable amount based on mode
      let taxable;
      switch (amountType) {
        case "exclusive":
          taxable = roundToTwo(baseAmount - discountAmount);
          break;
        case "inclusive_all":
          taxable = roundToTwo(effectiveRate * quantity);
          break;
        case "inclusive_gst":
          taxable = roundToTwo(effectiveRate * quantity);
          break;
      }

      const gstAmount = roundToTwo((taxable * gstPer) / 100);

      // Add to running totals
      total.productCount += 1;
      total.totalQuantity += quantity + free;
      total.subtotal = roundToTwo(total.subtotal + baseAmount);
      total.discountAmount = roundToTwo(total.discountAmount + discountAmount);
      total.taxable = roundToTwo(total.taxable + taxable);
      total.gstAmount = roundToTwo(total.gstAmount + gstAmount);
      total.grandTotal = roundToTwo(total.grandTotal + taxable + gstAmount);

      return total;
    },
    {
      subtotal: 0,
      discountAmount: 0,
      taxable: 0,
      gstAmount: 0,
      productCount: 0,
      totalQuantity: 0,
      grandTotal: 0,
    }
  );
};

export default function PurchaseForm() {
  const navigate = useNavigate();
  const inputRef = useRef([]);
  const dispatch = useDispatch();
  
  const [invoiceDate, setInvoiceDate] = useState();
  const [dueDate, setDueDate] = useState();
  const [products, setProducts] = useState([]);
  const [distributorSelectDialog, setdistributorSelectDialog] = useState(false);
  const [distributorName, setdistributorName] = useState("");
  const { toast } = useToast();
  const { createPurchaseBillStatus } = useSelector((state) => state.purchaseBill);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoiceForPayment, setInvoiceForPayment] = useState(null);

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

  // caculating total of the product
  const amountData = useMemo(
    () => calculateTotals(products, formData.amountType),
    [products, formData.amountType]
  );

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const [loading, setLoading] = useState(false);

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

      // Instead of saving invoice here, open payment dialog
      setInvoiceForPayment({
        distributorName: formData.distributorName,
        distributorId: formData.distributorId,
        invoiceNumber: formData.invoiceNumber,
        invoiceDate: invoiceDate,
        grandTotal: amountData.grandTotal,
        dueDate: dueDate,
      });
      setPaymentDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to validate invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      const formattedProducts = products.map((product) => ({
        inventoryId: product.inventoryId,
        productName: product.productName,
        batchNumber: product.batchNumber,
        batchId: product.batchId,
        expiry: product.expiry,
        HSN: product.HSN,
        mrp: roundToTwo(Number(product.mrp)),
        quantity: Number(product.quantity) * Number(product.pack || 1),
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
        invoiceType: "PURCHASE",
        invoiceNumber: formData.invoiceNumber,
        distributorName: formData.distributorName,
        distributorId: formData.distributorId,
        invoiceDate: new Date(invoiceDate),
        paymentDueDate: paymentData.dueDate || null,
        products: formattedProducts,
        withGst: formData.withGst === "yes",
        billSummary: {
          subtotal: roundToTwo(amountData.subtotal),
          discountAmount: roundToTwo(amountData.discountAmount),
          taxableAmount: roundToTwo(amountData.taxable),
          gstAmount: roundToTwo(amountData.gstAmount),
          totalQuantity: amountData.totalQuantity,
          productCount: amountData.productCount,
          grandTotal: roundToTwo(amountData.grandTotal),
        },
        amountCalculationType: formData.amountType,
        status: "active",
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
            chequeDate: paymentData.chequeDate,
            micrCode: paymentData.micrCode,
          }),
        } : null,
      };

      await dispatch(createPurchaseBill(purchaseData)).unwrap();
      
      toast({
        title: "Purchase invoice saved successfully",
        variant: "success",
      });

      // Reset form state
      resetFormState();

      // Navigate back
      navigate(-1);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save invoice",
        variant: "destructive",
      });
    }
  };

  const resetFormState = () => {
    setFormData({
      purchaseType: "invoice",
      distributorName: "",
      distributorId: "",
      invoiceNumber: "",
      invoiceDate: "",
      paymentDueDate: "",
      withGst: "yes",
      overallDiscount: "",
      amountType: "exclusive",
    });
    setInvoiceDate(null);
    setDueDate(null);
    setProducts([]);
    setPaymentDialogOpen(false);
    setInvoiceForPayment(null);
    setdistributorName("");
  };

  // Add this new function to handle key press events
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
  }, [])

  // Update the distributor name input section
  const handleDistributorNameChange = (e) => {
    e.preventDefault();
    const value = e.target.value;
    setdistributorName(value);

    if (value.length === 1) {
      if (value === " ") {
        setdistributorSelectDialog(true);
      } else if (value[0] !== " " && distributorName.length === 0) {
        setdistributorSelectDialog(true);
      }
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
    if(inputRef.current['invoiceNo']) {
      inputRef.current['invoiceNo'].focus();
    }
  };


  return (
    <div className="relative rounded-lg h-[100vh] pt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">Add Purchase</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 className="w-4 h-4" />
            Column Settings
          </Button>
          <Button
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
        </div>
      </div>

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
                className="gap-4 mt-2"
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
                className="gap-4 mt-2"
                value={formData?.withGst}
                onValueChange={(value) => handleInputChange("withGst", value)}
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
              className="appearance-none h-8 w-full border-[1px] border-gray-300 px-2 bg-white focus:outline-none focus:ring-0 focus:border-gray-300"
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
              className="appearance-none h-8 w-full border-[1px] border-gray-300 px-2 bg-white focus:outline-none focus:ring-0 focus:border-gray-300"
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
              className="appearance-none h-8 w-full border-[1px] border-gray-300 px-2 bg-white focus:outline-none focus:ring-0 focus:border-gray-300"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">PAYMENT DUE DATE</Label>
            <Input
              ref={el => inputRef.current['dueDate'] = el}
              onKeyDown={(e)=> handleKeyDown(e, 'product')}
              type="date"
              value={dueDate || ''}
              onChange={(e) => {
                setDueDate(e.target.value);
              }}
              className="appearance-none h-8 w-full border-[1px] border-gray-300 px-2 bg-white focus:outline-none focus:ring-0 focus:border-gray-300"
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
              className="appearance-none w-24 h-8 border-[1px] border-gray-300 px-2 bg-white focus:outline-none focus:ring-0 focus:border-gray-300"
              value={formData?.overallDiscount}
              onChange={(e) =>
                handleInputChange("overallDiscount", e.target.value)
              }
            />
            %<span className="px-2 py-1">OR</span>
            <Input
              placeholder="₹ Value"
              className="appearance-none flex-1 h-8 border-[1px] border-gray-300 px-2 bg-white focus:outline-none focus:ring-0 focus:border-gray-300"
            />
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="mb-4 text-sm font-medium">CUSTOM CHARGE</h3>
          <div className="flex gap-4">
            <Input
              placeholder="Custom charge"
              className="appearance-none h-8 border-[1px] border-gray-300 px-2 bg-white focus:outline-none focus:ring-0 focus:border-gray-300"
            />
            <Input
              placeholder="₹ Value"
              className="appearance-none h-8 border-[1px] border-gray-300 px-2 bg-white focus:outline-none focus:ring-0 focus:border-gray-300"
            />
          </div>
        </div>
        <div className="flex items-center justify-center p-4 border rounded-lg">
          <div className="text-center">
            <div className="mb-1">Click on Save to Add Payment</div>
            <div className="text-sm text-muted-foreground">Use 'Alt+S' Key</div>
          </div>
        </div>
      </div>

      {/* footer of purchase */}
      <div className="fixed bottom-0 w-[cal(100%-200px)] grid grid-cols-8 gap-4 p-4 text-sm text-white bg-gray-800 rounded-lg">
        <div className="">
          <div className="mb-1 text-gray-400">
            Total Products: {amountData?.productCount}
          </div>
          <div className="text-gray-400">
            Total Quantity: {amountData?.totalQuantity}
          </div>
        </div>
        <div>
          <div className="mb-1 text-gray-400">Subtotal</div>
          <div>₹{amountData?.subtotal}</div>
        </div>
        <div>
          <div className="mb-1 text-gray-400">(-) Discount</div>
          <div>₹{amountData?.discountAmount}</div>
        </div>
        <div>
          <div className="mb-1 text-gray-400">Taxable</div>
          <div>₹{amountData?.taxable}</div>
        </div>
        <div>
          <div className="mb-1 text-gray-400">(+) GST Amount</div>
          <div>₹{amountData?.gstAmount}</div>
        </div>
        <div>
          <div className="mb-1 text-gray-400">(-) Adjustment</div>
          <div>₹0</div>
        </div>
        <div>
          <div className="mb-1 text-gray-400">(+) Delivery Charge</div>
          <div>₹0.00</div>
        </div>
        <div className="bg-rose-500 -m-4 p-4 rounded-r-lg">
          <div className="mb-1">Total Amount</div>
          <div>₹{amountData?.grandTotal}</div>
        </div>
      </div>
      <SelectDistributorDlg
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
        billStatus={createPurchaseBillStatus}
      />
    </div>
  );
}
