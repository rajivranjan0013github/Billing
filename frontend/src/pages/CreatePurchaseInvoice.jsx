import { useRef, useState, useMemo, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Save, Settings2, ArrowLeft } from "lucide-react";
import PurchaseItemTable from "../components/custom/purchase/PurchaseItemTable";
import ProductMappingDialog from "../components/custom/purchase/ProductMappingDialog";
import { useToast } from "../hooks/use-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  createPurchaseBill,
  preprocessImageForLLM,
} from "../redux/slices/PurchaseBillSlice";
import { fetchItems } from "../redux/slices/inventorySlice";
import { useNavigate } from "react-router-dom";
import PaymentDialog from "../components/custom/payment/PaymentDialog";
import AmountSettingsDialog from "../components/custom/purchase/AmountSettingDialog";
import { formatCurrency } from "../utils/Helper";
import { Switch } from "../components/ui/switch";
import SelectDistributorDlg from "../components/custom/distributor/SelectDistributorDlg";
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

// Renamed and refined from calculateProductAmount
const calculateLineItemAmountDetails = (product, amountType) => {
  const quantity = Number(product?.quantity || 0);
  const purchaseRate = Number(product?.purchaseRate || 0);
  const discountPercent = Number(product?.discount || 0); // Explicit discount
  const gstPer = Number(product?.gstPer || 0);
  const s1 = Number(product?.schemeInput1 || 0);
  const s2 = Number(product?.schemeInput2 || 0);

  let billableQuantity = quantity;
  if (s1 > 0 && s1 + s2 > 0) {
    const schemeRatio = s1 / (s1 + s2);
    billableQuantity = quantity * schemeRatio;
  }

  const discountedRate = purchaseRate * (1 - discountPercent / 100);

  let amount;
  switch (amountType) {
    case "exclusive":
      // As per dialog: "Shows pure rate × quantity"
      // Interpreted: Original Purchase Rate * Billable Quantity (to account for scheme)
      amount = purchaseRate * billableQuantity;
      break;
    case "inclusive_all":
      // As per dialog: "Shows rate after applying discount × quantity"
      // Interpreted: Discounted Rate (after explicit disc) * Billable Quantity
      amount = discountedRate * billableQuantity;
      break;
    case "inclusive_gst":
      // As per dialog: "Shows rate after discount and GST × quantity"
      // Interpreted: (Discounted Rate (after explicit disc) + GST on it) * Billable Quantity
      const gstOnDiscountedRate = discountedRate * (gstPer / 100);
      amount = (discountedRate + gstOnDiscountedRate) * billableQuantity;
      break;
    default: // Default to exclusive logic
      amount = purchaseRate * billableQuantity;
      break;
  }
  return roundToTwo(amount); // Returns raw number; convertToFraction applied by caller if needed
};

export const calculateTotals = (products) => {
  // Calculate the sums using reduce
  const totals = products.reduce(
    (acc, product) => {
      const quantity = Number(product?.quantity || 0);
      const free = Number(product?.free || 0);
      const purchaseRate = Number(product?.purchaseRate || 0);
      const discountPercent = Number(product?.discount || 0);
      const gstPer = Number(product?.gstPer || 0);
      const s1 = Number(product?.schemeInput1 || 0);
      const s2 = Number(product?.schemeInput2 || 0);

      let billableQuantity = quantity;
      if (s1 > 0 && s1 + s2 > 0) {
        const schemeRatio = s1 / (s1 + s2);
        billableQuantity = quantity * schemeRatio;
      }

      const discountedRate = purchaseRate * (1 - discountPercent / 100);
      const baseAmountForSubtotal = quantity * purchaseRate;

      let taxable;
      let gstAmount;

      // Standardized calculation for taxable and GST, equivalent to former 'exclusive' mode.
      // This ensures grandTotal is not affected by the display amountType.
      taxable = discountedRate * billableQuantity;
      gstAmount = (taxable * gstPer) / 100;

      acc.productCount += 1;
      acc.totalQuantity += quantity + free;
      acc.subtotal = acc.subtotal + baseAmountForSubtotal;
      acc.taxable = acc.taxable + taxable;
      acc.gstAmount = acc.gstAmount + gstAmount;
      acc.grandTotal = acc.grandTotal + taxable + gstAmount;

      return acc;
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

  totals.subtotal = roundToTwo(totals.subtotal);
  totals.taxable = roundToTwo(totals.taxable);
  totals.gstAmount = roundToTwo(totals.gstAmount);

  // Calculate the total discount amount after summing subtotal and taxable
  totals.discountAmount = roundToTwo(totals.subtotal - totals.taxable);

  // Perform final rounding and adjustment on the calculated totals
  const grandTotalBeforeRounding = totals.grandTotal;
  totals.grandTotal = Math.round(grandTotalBeforeRounding);
  totals.adjustment = roundToTwo(totals.grandTotal - grandTotalBeforeRounding);

  return totals;
};

export default function PurchaseForm() {
  const navigate = useNavigate();
  const inputRef = useRef([]);
  const dispatch = useDispatch();

  const [invoiceDate, setInvoiceDate] = useState();
  const [products, setProducts] = useState([]);
  const { toast } = useToast();
  const { createPurchaseBillStatus } = useSelector(
    (state) => state.purchaseBill
  );
  const { isCollapsed } = useSelector((state) => state.loader);
  const { items: inventoryItems, itemsStatus: inventoryItemsStatus } =
    useSelector((state) => state.inventory);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoiceForPayment, setInvoiceForPayment] = useState(null);
  const [additionalDiscount, setAdditionalDiscount] = useState({
    per: "",
    value: "",
  });
  const [showDiscount, setShowDiscount] = useState(false);
  const [llmData, setLlmData] = useState(null);
  const [productMappingDialogOpen, setProductMappingDialogOpen] =
    useState(false);
  const [productsToMap, setProductsToMap] = useState([]);
  const [distributorSelectDialog, setdistributorSelectDialog] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);

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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onDistributorSelect = (distributor) => {
    if (distributor) {
      setFormData((prev) => ({
        ...prev,
        distributorId: distributor._id,
        distributorName: distributor.name,
      }));
    } else {
      // Handles clearing the selection, e.g., when 'Change' is clicked in mapping
      setFormData((prev) => ({
        ...prev,
        distributorId: "",
      }));
    }
  };

  useEffect(() => {
    if (llmData) {
      if (
        inventoryItemsStatus === "idle" ||
        inventoryItemsStatus === "failed"
      ) {
        dispatch(fetchItems());
      }

      setFormData((prevFormData) => ({
        ...prevFormData,
        distributorName: llmData.distributorName || "",
        distributorId:
          llmData.distributorId || prevFormData.distributorId || "",
        invoiceNumber: llmData.invoiceNumber || "",
        withGst: llmData.withGst ? "yes" : "no",
      }));

      setInvoiceDate(llmData.invoiceDate || null);

      // If we have products or a distributor name without ID, open the mapping dialog
      if (
        (llmData.products && llmData.products.length > 0) ||
        (llmData.distributorName &&
          !llmData.distributorId &&
          !formData.distributorId)
      ) {
        setProductsToMap(llmData.products || []);
        setProductMappingDialogOpen(true);
      }
    }
  }, [llmData, dispatch, formData.distributorId, inventoryItemsStatus]);

  const handleProductMappingSubmit = (confirmedProducts) => {
    setProducts((prevProducts) => [...prevProducts, ...confirmedProducts]);
    setProductMappingDialogOpen(false);
    setLlmData(null);
    setProductsToMap([]);
    toast({
      title: "Products Added",
      description: `${confirmedProducts.length} products have been mapped and added to the invoice.`,
      variant: "success",
    });
  };

  // caculating total of the product
  const amountData = useMemo(() => calculateTotals(products), [products]);

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
    formData.distributorName,
  ]); // Add dependencies that handleSaveInvoice uses

  const handleSaveInvoice = async () => {
    try {
      setLoading(true);
      // Validate required fields
      if (
        !formData.distributorName ||
        !formData.invoiceNumber ||
        !invoiceDate
      ) {
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
        mfcName: product.mfcName,
        inventoryId: product.inventoryId,
        name: product.productName,
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
          adjustment: roundToTwo(amountData.adjustment),
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
  };

  // Add this new function to handle key press events
  const handleKeyDown = (e, nextInputId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Shift+Enter logic for header inputs
      if (e.shiftKey) {
        const currentInputIndex = inputKeys.indexOf(nextInputId); // Use nextInputId as current here
        // Only handle shift+enter for header fields before 'product'
        if (
          currentInputIndex > 0 &&
          currentInputIndex < inputKeys.indexOf("product")
        ) {
          const prevInputId = inputKeys[currentInputIndex - 1];
          if (prevInputId && inputRef.current[prevInputId]) {
            inputRef.current[prevInputId].focus();
          }
        }
        // If Shift+Enter is pressed in the table, let the table handle it (handled in PurchaseItemTable now)
        return;
      }

      // Normal Enter logic
      // Special case: from invoiceDate, focus the product input in the table
      if (nextInputId === "product") {
        if (inputRef.current["product"]) {
          inputRef.current["product"].focus();
        }
      } else {
        // Standard navigation for header fields
        if (nextInputId && inputRef.current[nextInputId]) {
          inputRef.current[nextInputId].focus();
        }
      }
      // Navigation within the table is handled by PurchaseItemTable itself
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
  }, [formData, invoiceDate, formData.distributorName, products]);

  // Update the distributor name input section
  const handleDistributorNameChange = (e) => {
    e.preventDefault();
    const value = e.target.value;
    handleInputChange("distributorName", value);

    if (value.length === 1) {
      if (value === " ") {
        setdistributorSelectDialog(true);
      } else if (value[0] !== " " && formData.distributorName.length <= 1) {
        setdistributorSelectDialog(true);
      }
    }
  };

  // Handle distributor selection from dialog
  const handleDistributorSelect = (distributor) => {
    onDistributorSelect(distributor);
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
    if (!amountData?.subtotal) {
      toast({
        variant: "destructive",
        message: "Please add at least one product",
      });
      return;
    }
    const tempNum = Number(num);
    const tempSubtotal = amountData?.subtotal;
    if (key === "per") {
      const value = roundToTwo((tempSubtotal * tempNum) / 100);
      setAdditionalDiscount({ per: tempNum, value });
    } else {
      const per = roundToTwo((tempNum / tempSubtotal) * 100);
      setAdditionalDiscount({ per, value: tempNum });
    }
  };

  const handleAdditionalDiscountApply = () => {
    const additionalDiscountTemp = Number(additionalDiscount?.per || 0);
    if (additionalDiscountTemp <= 0) return;

    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        const newDiscount =
          Number(product.discount || 0) + additionalDiscountTemp;
        // Product with the new discount to be passed for amount calculation
        const productWithNewDiscount = {
          ...product,
          discount: newDiscount,
        };
        return {
          ...product,
          discount: newDiscount, // Apply the new discount to the product state
          amount: calculateLineItemAmountDetails(
            // Use the standardized function
            productWithNewDiscount,
            formData.amountType
          ),
        };
      })
    );

    // Reset additional discount after applying
    setAdditionalDiscount({ per: "", value: "" });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    // Optional: Check file type and size if needed
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      // Remove the data URL prefix to get just the base64 data
      const base64Image = reader.result.split(",")[1];
      try {
        setImageProcessing(true);
        const response = await dispatch(
          preprocessImageForLLM({
            base64Image,
            mimeType: file.type,
          })
        ).unwrap();
        setLlmData(response.extractedData);

        toast({
          title: "Data Extracted Successfully",
          description:
            "The data has been successfully extracted from the image.",
          variant: "success",
        });
      } catch (error) {
        toast({
          title: "Error Extracting Data",
          description:
            error.message || "Failed to extract data from the image.",
          variant: "destructive",
        });
      } finally {
        setImageProcessing(false);
      }
    };
    reader.onerror = () => {
      toast({
        title: "Error Reading File",
        description: "Could not read the selected file.",
        variant: "destructive",
      });
    };
  };

  const handleOcrData = async (file) => {
    // Implementation of handleOcrData function
  };

  return (
    <div className="relative rounded-lg h-[100vh] pt-4 font-semibold\">
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
              value={formData.distributorName || ""}
              onChange={handleDistributorNameChange}
              onKeyDown={(e) => handleKeyDown(e, "invoiceNo")}
              placeholder="Type or Press space"
              className="appearance-none h-8 w-full font-semibold border-[1px] border-gray-300 px-2 bg-white focus:outline-none focus:ring-0 focus:border-gray-300"
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
              className="appearance-none font-semibold h-8 w-full border-[1px] border-gray-300 px-2 bg-white focus:outline-none focus:ring-0 focus:border-gray-300"
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
              className="appearance-none font-semibold h-8 w-full border-[1px] border-gray-300 px-2 bg-white focus:outline-none focus:ring-0 focus:border-gray-300"
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
          calculateProductAmount={calculateLineItemAmountDetails}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div
          className={`p-4 border rounded-lg ${
            showDiscount ? "block" : "hidden"
          }`}
        >
          <div className="flex justify-between">
            <h3 className="mb-4 text-sm font-medium">OVERALL BILL DISCOUNT</h3>
            <Button
              size="sm"
              onClick={handleAdditionalDiscountApply}
              className="h-5"
            >
              Apply
            </Button>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Input
                placeholder="Value"
                className="w-24 pr-5"
                value={additionalDiscount?.per}
                onChange={(e) =>
                  onAdditionalDiscountChange("per", e.target.value)
                }
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2">
                %
              </span>
            </div>
            <span className="px-2 py-1">OR</span>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 z-0">
                ₹
              </span>
              <Input
                placeholder="Value"
                className="flex-1 pl-5"
                value={additionalDiscount?.value}
                onChange={(e) =>
                  onAdditionalDiscountChange("value", e.target.value)
                }
              />
            </div>
          </div>
        </div>
        {/* Image Upload Section */}
        <div className="p-4 border rounded-lg group hover:shadow-lg transition-shadow duration-200 cursor-pointer">
          <h3 className="mb-4 text-sm font-medium text-gray-700 group-hover:text-gray-900">
            Upload Invoice Image for AI data filling
          </h3>
          <div className="relative mt-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="sr-only" // Screen-reader only, visually hidden
              id="imageUploadInput"
              disabled={imageProcessing}
            />
            <Label
              htmlFor="imageUploadInput"
              className={`w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${
                imageProcessing
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer"
              }`}
            >
              {imageProcessing ? (
                <>
                  <span className="animate-spin mr-2 text-violet-700">⏳</span>
                  Processing...
                </>
              ) : (
                "Upload Invoice Image"
              )}
            </Label>
            {imageProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-md">
                {/* Spinner is now part of the button text when processing */}
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500 group-hover:text-gray-600">
            Upload an image of the invoice for automated data extraction
            (optional).
          </p>
        </div>
        {/* <div className="flex items-center justify-center p-4 border rounded-lg">
          <div className="text-center">
            <div className="mb-1">Click on Save to Add Payment</div>
            <div className="text-sm text-muted-foreground">Use 'Alt+S' Key</div>
          </div>
        </div> */}
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
        <div className="py-2 flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span>(-) Discount</span>
            <Switch
              checked={showDiscount}
              onCheckedChange={setShowDiscount}
              size="sm"
              className="scale-75"
            />
          </div>
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
          <div className="text-lg">
            {formatCurrency(amountData?.adjustment)}
          </div>
        </div>
        <div className="py-2">
          <div className="">(+) Custom</div>
          <div className="text-lg">{formatCurrency(0.0)}</div>
        </div>
        <div className="bg-rose-500 py-2">
          <div className="">Total Amount</div>
          <div className="text-lg">
            {formatCurrency(amountData?.grandTotal)}
          </div>
        </div>
      </div>
      <AmountSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        value={formData.amountType}
        onChange={(value) => handleInputChange("amountType", value)}
        products={products}
        setProducts={setProducts}
        calculateProductAmount={calculateLineItemAmountDetails}
      />
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoiceData={invoiceForPayment}
        onSubmit={handlePaymentSubmit}
        billStatus={createPurchaseBillStatus}
      />
      <SelectDistributorDlg
        open={distributorSelectDialog}
        setOpen={setdistributorSelectDialog}
        search={formData.distributorName}
        setSearch={(value) => handleInputChange("distributorName", value)}
        onSelect={handleDistributorSelect}
      />
      <ProductMappingDialog
        open={productMappingDialogOpen}
        onOpenChange={setProductMappingDialogOpen}
        productsToMap={productsToMap}
        inventoryItems={inventoryItems}
        onSubmit={handleProductMappingSubmit}
        isLoadingInventory={
          inventoryItemsStatus === "loading" || inventoryItemsStatus === "idle"
        }
        distributorName={llmData?.distributorName || ""}
        distributorData={{
          distributorName: llmData?.distributorName,
          distributorMob: llmData?.distributorMob,
          distributorAddress: llmData?.distributorAddress,
          distributorGstin: llmData?.distributorGstin,
          distributorDlNumber: llmData?.distributorDlNumber,
          distributorEmail: llmData?.distributorEmail,
          distributorBankNumber: llmData?.distributorBankNumber,
          distributorBankIfsc: llmData?.distributorBankIfsc,
        }}
        onDistributorSelect={onDistributorSelect}
        selectedDistributor={
          formData.distributorId
            ? { _id: formData.distributorId, name: formData.distributorName }
            : null
        }
      />
    </div>
  );
}
