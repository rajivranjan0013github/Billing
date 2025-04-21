import { useRef, useState, useMemo, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Save, Settings2, ArrowLeft } from "lucide-react";
import PurchaseItemTable from "../components/custom/purchase/PurchaseItemTable";
import { useToast } from "../hooks/use-toast";
import SelectDistributorDlg from "../components/custom/distributor/SelectDistributorDlg";
import { useDispatch, useSelector } from "react-redux";
import { createPurchaseBill } from "../redux/slices/PurchaseBillSlice";
import { useNavigate } from "react-router-dom";
import PaymentDialog from "../components/custom/payment/PaymentDialog";
import AmountSettingsDialog from "../components/custom/purchase/AmountSettingDialog";
import { formatCurrency } from "../utils/Helper";
const inputKeys = [
  "distributorName",
  "invoiceNo",
  "invoiceDate",
  "product",
  "batchNumber",
  "HSN",
  "expiry",
  "pack",
  "quantity",
  "free",
  "mrp",
  "purchaseRate",
  "schemeInput1",
  "schemeInput2",
  "discount",
  "gstPer",
  "addButton",
];

export const roundToTwo = (num) => {
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
  const [products, setProducts] = useState([]);
  const [distributorSelectDialog, setdistributorSelectDialog] = useState(false);
  const [distributorName, setdistributorName] = useState("");
  const { toast } = useToast();
  const { createPurchaseBillStatus } = useSelector(
    (state) => state.purchaseBill
  );
  const { isCollapsed } = useSelector((state) => state.loader);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoiceForPayment, setInvoiceForPayment] = useState(null);
  const [additionalDiscount, setAdditionalDiscount] = useState({per : '', value : ''});

  const [formData, setFormData] = useState({
    purchaseType: "invoice",
    distributorName: "",
    distributorId: "",
    invoiceNumber: "",
    invoiceDate: "",
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

  // Add keyboard shortcut for Alt+S
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveInvoice();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    products,
    formData,
    formData?.invoiceNumber,
    invoiceDate,
    distributorName,
  ]); // Add dependencies that handleSaveInvoice uses

  const handleSaveInvoice = async () => {
    try {
      setLoading(true);
      // Validate required fields
      if (!distributorName || !formData.invoiceNumber || !invoiceDate) {
        throw new Error("Please fill all required fields");
      }

      if (products.length === 0) {
        throw new Error("Please add at least one product");
      }

      // Instead of saving invoice here, open payment dialog
      setInvoiceForPayment({
        invoiceType: "purchase",
        distributorName: formData.distributorName,
        distributorId: formData.distributorId,
        invoiceNumber: formData.invoiceNumber,
        invoiceDate: invoiceDate,
        grandTotal: amountData.grandTotal,
        alreadyPaid: 0, // Add this for new invoices
        isNewInvoice: true, // Add this to indicate it's a new invoice
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
        free: Number(product.free || 0) * Number(product.pack || 1),
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
        amountPaid:
          paymentData.status === "due" ? 0 : Number(paymentData.amount || 0),
        payment:
          paymentData.status === "paid"
            ? {
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
              }
            : null,
      };

      await dispatch(createPurchaseBill(purchaseData)).unwrap();

      toast({
        title: "Purchase invoice saved successfully",
        variant: "success",
      });

      // Reset form state
      resetFormState();

      // Navigate back
      navigate("/purchase");
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
      withGst: "yes",
      overallDiscount: "",
      amountType: "exclusive",
    });
    setInvoiceDate(null);
    setProducts([]);
    setPaymentDialogOpen(false);
    setInvoiceForPayment(null);
    setdistributorName("");
  };

  // Add this new function to handle key press events
  const handleKeyDown = (e, nextInputId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        const nextInputIndex = inputKeys.indexOf(nextInputId);
        if (nextInputIndex > 1) {
          const newInputId = inputKeys[nextInputIndex - 2];
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
    if (e.altKey && e.key === "s") {
      e.preventDefault();
      handleSaveInvoice();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleShortcutKeyPressed);

    return () => {
      document.removeEventListener("keydown", handleShortcutKeyPressed);
    };
  }, [formData, invoiceDate, distributorName, products]); 

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
    setTimeout(() => {
      if (inputRef.current["invoiceNo"]) {
        inputRef.current["invoiceNo"].focus();
      }
    }, 0);
  };

  useEffect(() => {
    // Add a small delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      if (inputRef.current["distributorName"]) {
        inputRef.current["distributorName"].focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const onAdditionalDiscountChange = (key, num) => {
    if(!amountData?.subtotal) {
      toast({variant : 'destructive', message : 'Please add at least one product'}); 
      return;
    }
    const tempNum = Number(num);
    const tempSubtotal = amountData?.subtotal;
    if(key === 'per') {
      const value = roundToTwo(tempSubtotal*tempNum/100)
      setAdditionalDiscount({per : tempNum, value})
    } else {
      const per = roundToTwo(tempNum/tempSubtotal*100);
      setAdditionalDiscount({per, value : tempNum});
    }
  }

  const handleAdditionalDiscountApply = () => {
    const additionalDiscountTemp = Number(additionalDiscount?.per || 0);
    if (additionalDiscountTemp <= 0) return;

    setProducts(prevProducts => 
      prevProducts.map(product => {
        const newDiscount = Number(product.discount || 0) + additionalDiscountTemp;
        return {
          ...product,
          discount: newDiscount,
          amount: calculateProductAmount({
            ...product,
            discount: newDiscount,
          }, formData.amountType)
        };
      })
    );

    // Reset additional discount after applying
    setAdditionalDiscount({ per: '', value: '' });
  }

  // Helper function to calculate product amount with updated discount
  const calculateProductAmount = (product, amountType) => {
    const quantity = Number(product?.quantity || 0);
    const purchaseRate = Number(product?.purchaseRate || 0);
    const discountPercent = Number(product?.discount || 0) + Number(product?.schemePercent || 0);
    const gstPer = Number(product?.gstPer || 0);

    // Calculate base amount and effective rate
    const baseAmount = roundToTwo(quantity * purchaseRate);
    const discountAmount = roundToTwo((baseAmount * discountPercent) / 100);
    const effectiveRate = roundToTwo(purchaseRate - (purchaseRate * discountPercent) / 100);

    // Calculate amount based on mode
    let amount;
    switch (amountType) {
      case "exclusive":
        // Just Rate × Quantity
        amount = roundToTwo(purchaseRate * quantity);
        break;
      case "inclusive_all":
        // (Rate - Rate×Discount%) × Quantity
        amount = roundToTwo(effectiveRate * quantity);
        break;
      case "inclusive_gst":
        // (Rate - Rate×Discount% + (Rate - Rate×Discount%)×GST%) × Quantity
        const gstAmount = roundToTwo((effectiveRate * gstPer) / 100);
        amount = roundToTwo((effectiveRate + gstAmount) * quantity);
        break;
      default:
        amount = roundToTwo(purchaseRate * quantity);
    }

    return amount;
  }

  return (
    <div className="relative rounded-lg h-[100vh] pt-4 ">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Add Purchase</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
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
        <div className="grid gap-4 grid-cols-4 w-full">
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
              ref={(el) => (inputRef.current["distributorName"] = el)}
              value={distributorName || ""}
              onChange={handleDistributorNameChange}
              onKeyDown={(e) => handleKeyDown(e, "invoiceNo")}
              placeholder="Type or Press space"
              className="appearance-none h-8 w-full border-[1px] border-gray-300 px-2 bg-white focus:outline-none focus:ring-0 focus:border-gray-300"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">
              INVOICE NO<span className="text-rose-500">*REQUIRED</span>
            </Label>
            <Input
              ref={(el) => (inputRef.current["invoiceNo"] = el)}
              value={formData?.invoiceNumber}
              onChange={(e) =>
                handleInputChange("invoiceNumber", e.target.value)
              }
              onKeyDown={(e) => handleKeyDown(e, "invoiceDate")}
              placeholder="Invoice No"
              className="appearance-none h-8 w-full border-[1px] border-gray-300 px-2 bg-white focus:outline-none focus:ring-0 focus:border-gray-300"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">
              INVOICE DATE<span className="text-rose-500">*REQUIRED</span>
            </Label>
            <Input
              ref={(el) => (inputRef.current["invoiceDate"] = el)}
              type="date"
              value={invoiceDate || ""}
              onChange={(e) => {
                setInvoiceDate(e.target.value);
              }}
              onKeyDown={(e) => handleKeyDown(e, "product")}
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
          <div className="flex justify-between">
            <h3 className="mb-4 text-sm font-medium">OVERALL BILL DISCOUNT</h3>
            <Button size='sm' onClick={handleAdditionalDiscountApply} className='h-5'>Apply</Button>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Input
                placeholder="Value"
                className="w-24 pr-5"
                value={additionalDiscount?.per}
                onChange={(e)=>onAdditionalDiscountChange('per', e.target.value)}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2">%</span>
            </div>
            <span className="px-2 py-1">OR</span>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 z-0">₹</span>
              <Input 
                placeholder="Value" 
                className="flex-1 pl-5" 
                value={additionalDiscount?.value}  
                onChange={(e)=>onAdditionalDiscountChange('value', e.target.value)} 
              />
            </div>
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
      <div
        className={`fixed bottom-0 ${
          isCollapsed ? "w-[calc(100%-95px)]" : "w-[calc(100%-225px)]"
        } text-sm grid grid-cols-8 gap-4 text-white bg-gray-900 rounded-lg transition-all duration-300 text-center`}
      >
        <div className="py-2">
          <div>Total Products: {amountData?.productCount}</div>
          <div>Total Quantity: {amountData?.totalQuantity}</div>
        </div>
        <div className="py-2">
          <div>Subtotal</div>
          <div className="text-lg">{formatCurrency(amountData?.subtotal)}</div>
        </div>
        <div className="py-2">
          <div className="">(-) Discount</div>
          <div className="text-lg">
            {formatCurrency(amountData?.discountAmount)}
          </div>
        </div>
        <div className="py-2">
          <div className="">Taxable</div>
          <div className="text-lg">{formatCurrency(amountData?.taxable)}</div>
        </div>
        <div className="py-2">
          <div className="">(+) GST Amount</div>
          <div className="text-lg">{formatCurrency(amountData?.gstAmount)}</div>
        </div>
        <div className="py-2">
          <div className="">(-) Adjustment</div>
          <div className="text-lg">{formatCurrency(0)}</div>
        </div>
        <div className="py-2">
          <div className="">(+) Delivery Charge</div>
          <div className="text-lg">{formatCurrency(0.0)}</div>
        </div>
        <div className="bg-rose-500 py-2">
          <div className="">Total Amount</div>
          <div className="text-lg">
            {formatCurrency(amountData?.grandTotal)}
          </div>
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
