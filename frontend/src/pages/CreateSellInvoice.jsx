import { useRef, useState, useMemo, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { createBill } from "../redux/slices/SellBillSlice";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Switch } from "../components/ui/switch";
import {
  Save,
  Settings,
  FileText,
  ClipboardList,
  ScrollText,
  ArrowLeft,
} from "lucide-react";
import SaleItemTable from "../components/custom/sales/SaleItemTable";
import { Backend_URL } from "../assets/Data";
import { useToast } from "../hooks/use-toast";
import { CustomerSuggestionWithDialog } from "../components/custom/sales/customerSuggestion";
import { useDispatch, useSelector } from "react-redux";
import { fetchItems } from "../redux/slices/inventorySlice";
import { useNavigate } from "react-router-dom";
import PaymentDialog from "../components/custom/payment/PaymentDialog";
import { formatCurrency } from "../utils/Helper";
import SearchSuggestion from "../components/custom/custom-fields/CustomSearchSuggestion";
import { fetchSettings } from "../redux/slices/settingsSlice";

const roundToTwo = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

// for sale only
export const calculateTotals = (products, adjustment = false) => {
  const total = products.reduce(
    (total, product) => {
      const quantity = Number(product?.quantity || 0);
      const pack = Number(product?.pack || 1);
      const free = Number(product?.free || 0);
      const discountPercent =
        Number(product?.discount || 0) + Number(product?.schemePercent || 0);
      const gstPer = Number(product?.gstPer || 0);
      const amount = Number(product?.amount || 0);

      if (product.types === "return") {
        total.returnAmount += (amount);
        total.grandTotal += (amount);
        return total;
      }

      const subtotal = ((quantity * product?.mrp) / pack);
      const discount = (
        (((product?.quantity * product?.mrp) / pack) * discountPercent) / 100
      );
      const taxable = (
        ((subtotal - discount) * 100) / (100 + gstPer)
      );
      const gstAmount = ((taxable * gstPer) / 100);

      total.grandTotal = (total.grandTotal + taxable + gstAmount);
      total.productCount += 1;
      total.totalQuantity += quantity + free;
      total.subtotal = (total.subtotal + subtotal);
      total.discountAmount = (total.discountAmount + discount);
      total.taxable = (total.taxable + taxable);
      total.gstAmount = (total.gstAmount + gstAmount);
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
      returnAmount: 0,
    }
  );
  if (adjustment) {
    const grandTotal = total?.grandTotal;
    total.grandTotal = Math.round(grandTotal);
    total.adjustment = total.grandTotal - grandTotal;
  }
  total.subtotal = roundToTwo(total.subtotal);
  total.discountAmount = roundToTwo(total.discountAmount);
  total.taxable = roundToTwo(total.taxable);
  total.gstAmount = roundToTwo(total.gstAmount);
  total.grandTotal = roundToTwo(total.grandTotal);
  total.returnAmount = roundToTwo(total.returnAmount);
  total.adjustment = roundToTwo(total.adjustment);
  return total;
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

export default function CreateSellInvoice() {
  const navigate = useNavigate();
  const inputRef = useRef({});
  const dispatch = useDispatch();
  const { createBillStatus } = useSelector((state) => state.bill);
  const { settings, status } = useSelector((state) => state.settings);
  const { isCollapsed } = useSelector((state) => state.loader);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date()
      .toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .split("/")
      .reverse()
      .join("-")
  );
  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const { toast } = useToast();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const doctors = useSelector((state) => state.staff?.doctors);
  const [invoiceForPayment, setInvoiceForPayment] = useState(null);
  const [additionalDiscount, setAdditionalDiscount] = useState({
    per: "",
    value: "",
  }); // in percentage
  const [showDiscount, setShowDiscount] = useState(false);

  // Add useEffect to focus on customer name input when component mounts
  useEffect(() => {
    // Add a small delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      if (inputRef.current["customerName"]) {
        inputRef.current["customerName"].focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // fetching setting config
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchSettings());
    }
  }, [status, settings]);

  // Convert doctors array to the format expected by CustomSearchSuggestion
  const doctorSuggestions = doctors.map((doctor, index) => ({
    _id: index + 1,
    name: doctor.name?.includes("Dr") ? doctor.name : `Dr. ${doctor.name}`,
  }));

  const [formData, setFormData] = useState({
    saleType: "invoice",
    customerName: "",
    customerId: "",
    invoiceNumber: "",
    invoiceDate: new Date(),
    doctorName: "",
    returnInvoiceNumber: "",
  });
  const [isCashCounter, setIsCashCounter] = useState(true);

  // caculating total of the product
  const amountData = useMemo(
    () => calculateTotals(products, settings?.adjustment),
    [products, settings]
  );

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const [loading, setLoading] = useState(false);

  // Add keyboard shortcut for Alt+S
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Check for both Alt key (Windows) and Option/⌥ key (Mac)
      if ((e.altKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveInvoice();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [products, formData, invoiceDate, isCashCounter, customerName]); // Add dependencies that handleSaveInvoice uses

   useEffect(() => {
    fetch(`${Backend_URL}/api/sales/invoice-number`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) =>
        setFormData((prev) => ({ ...prev, invoiceNumber: data.invoiceNumber }))
      );
  }, []);

  const handleSaveInvoice = async () => {
    try {
      setLoading(true);
      // Validate required fields
      if (
        !formData.invoiceNumber ||
        !formData.saleType ||
        !invoiceDate ||
        (!formData.customerName && !isCashCounter)
      ) {
        throw new Error("Please fill all required fields");
      }

      if (products.length === 0) {
        throw new Error("Please add at least one product");
      }

      // Instead of saving invoice here, open payment dialog
      setInvoiceForPayment({
        invoiceType: "sales",
        isCashCounter,
        distributorName: isCashCounter ? "Cash/Counter" : formData.customerName,
        customerId: isCashCounter ? null : formData.customerId,
        invoiceNumber: formData.invoiceNumber,
        invoiceDate: invoiceDate,
        grandTotal: amountData.grandTotal,
        alreadyPaid: 0, 
        isNewInvoice: true, 
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
      setLoading(true);
      // Format products data to match schema
      const formattedProducts = products.map((product) => ({
        types: product.types,
        inventoryId: product.inventoryId,
        productName: product.productName,
        batchNumber: product.batchNumber,
        batchId: product.batchId,
        expiry: product.expiry,
        mfcName: product.mfcName,
        HSN: product.HSN,
        mrp: roundToTwo(Number(product.mrp)),
        quantity: Number(product.quantity),
        saleRate: roundToTwo(Number(product.saleRate)),
        pack: Number(product.pack || 1),
        purchaseRate: roundToTwo(Number(product.purchaseRate)),
        saleRate: roundToTwo(Number(product.saleRate)),
        discount: roundToTwo(Number(product.discount || 0)),
        gstPer: roundToTwo(Number(product.gstPer)),
        amount: roundToTwo(Number(product.amount)),
      }));

      // Calculate bill summary
      const billSummary = {
        subtotal: roundToTwo(amountData.subtotal),
        discountAmount: roundToTwo(amountData.discountAmount),
        taxableAmount: roundToTwo(amountData.taxable),
        gstAmount: roundToTwo(amountData.gstAmount),
        totalQuantity: amountData.totalQuantity,
        productCount: amountData.productCount,
        grandTotal: roundToTwo(amountData.grandTotal),
        returnAmount: roundToTwo(amountData.returnAmount),
        adjustment: roundToTwo(amountData?.adjustment),
        gstSummary: {
          0: { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
          5: { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
          12: { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
          18: { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
          28: { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
        },
      };

      // Calculate GST summary
      products.forEach((product) => {
        if (product.types === "return") return;
        const quantity = Number(product.quantity || 0);
        const pack = Number(product.pack || 1);
        const mrp = roundToTwo(Number(product.mrp || 0));
        const discountPercent = Number(product.discount || 0);
        const gstPer = Number(product.gstPer || 0);

        const subtotal = roundToTwo((quantity * mrp) / pack);
        const discount = roundToTwo((subtotal * discountPercent) / 100);
        const taxable = roundToTwo(
          ((subtotal - discount) * 100) / (100 + gstPer)
        );
        const gstAmount = roundToTwo((taxable * gstPer) / 100);

        if (billSummary.gstSummary.hasOwnProperty(gstPer)) {
          billSummary.gstSummary[gstPer].taxable = roundToTwo(
            billSummary.gstSummary[gstPer].taxable + taxable
          );
          billSummary.gstSummary[gstPer].cgst = roundToTwo(
            billSummary.gstSummary[gstPer].cgst + gstAmount / 2
          );
          billSummary.gstSummary[gstPer].sgst = roundToTwo(
            billSummary.gstSummary[gstPer].sgst + gstAmount / 2
          );
          billSummary.gstSummary[gstPer].total = roundToTwo(
            billSummary.gstSummary[gstPer].total + gstAmount
          );
        }
      });

      // Determine payment status based on amount paid
      const amountPaid = roundToTwo(Number(paymentData.amount || 0));
      const paymentStatus =
        amountPaid >= roundToTwo(amountData.grandTotal) ? "paid" : "due";

      const finalData = {
        saleType: formData.saleType,
        invoiceNumber: formData.invoiceNumber,
        customerName: isCashCounter ? "Cash/Counter" : formData.customerName,
        customerId: isCashCounter ? null : formData.customerId,
        invoiceDate: invoiceDate,
        paymentDueDate: paymentStatus === "due" ? paymentData.dueDate : null,
        products: formattedProducts,
        grandTotal: roundToTwo(amountData.grandTotal),
        is_cash_customer: isCashCounter,
        doctorName: formData?.doctorName,
        returnInvoiceNumber: formData?.returnInvoiceNumber,
        billSummary,
        // Payment details
        paymentStatus: paymentStatus,
        amountPaid: amountPaid,
        // Payment info
        payment:
          amountPaid !== 0
            ? {
                amount: amountPaid,
                paymentType: amountPaid > 0 ? "Payment In" : "Payment Out",
                paymentMethod: paymentData.paymentMethod,
                paymentDate: paymentData.chequeDate || new Date(),
                accountId: paymentData.accountId,
                transactionNumber: paymentData.transactionNumber,
                chequeNumber: paymentData.chequeNumber,
                chequeDate: paymentData.chequeDate,
                micrCode: paymentData.micrCode,
                status:
                  paymentData.paymentMethod === "CHEQUE"
                    ? "PENDING"
                    : "COMPLETED",
                remarks: paymentData.notes,
              }
            : null,
      };

      dispatch(createBill(finalData))
        .unwrap()
        .then((data) => {
          toast({
            title: "Sales invoice created successfully",
            variant: "success",
          });
          dispatch(fetchItems()); // updating inventory
          // Reset form
          setFormData({
            saleType: "invoice",
            customerName: "",
            invoiceNumber: "",
            invoiceDate: "",
            doctorName: "",
            overallDiscount: "",
          });
          setCustomerName("");
          setInvoiceDate(null);
          setProducts([]);
          setPaymentDialogOpen(false);
          setInvoiceForPayment(null);
          // Navigate to print preview with invoice data
          navigate("/sales/invoice-print", {
            state: {
              invoiceData: data,
            },
          });
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to save invoice",
            variant: "destructive",
          });
        });
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

  // Handle customer selection from CustomerSuggestion
  const handleCustomerSelect = (customer) => {
    setCustomerName(customer.name);
    setFormData({
      ...formData,
      customerId: customer._id,
      customerName: customer.name,
    });
    setIsCashCounter(false); // Uncheck cash/counter when customer is selected
    if (inputRef && inputRef.current["doctorName"]) {
      inputRef.current["doctorName"].focus();
    }
  };

  // Add this new function to handle key press events
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

  const onAdditionalDiscountChange = (key, num) => {
    if (!amountData?.subtotal) {
      toast({
        variant: "destructive",
        message: "Please add alteast on product",
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
        const mrp = Number(product.mrp || 0);
        const newSaleRate = (mrp * (1 - newDiscount / 100)).toFixed(2);

        return {
          ...product,
          discount: newDiscount,
          saleRate: newSaleRate,
          amount: calculateProductAmount({
            ...product,
            discount: newDiscount,
            saleRate: newSaleRate,
          }),
        };
      })
    );

    // Reset additional discount after applying
    setAdditionalDiscount({ per: "", value: "" });
  };

  // Helper function to calculate product amount with updated discount
  const calculateProductAmount = (product) => {
    const quantity = Number(product?.quantity || 0);
    const pack = Number(product?.pack || 1);
    const mrp = Number(product?.mrp || 0);
    const discountPercent = Number(product?.discount || 0);
    const gstPer = Number(product?.gstPer || 0);

    const subtotal = ((quantity * mrp) / pack);
    const discount = ((subtotal * discountPercent) / 100);
    const taxable = (((subtotal - discount) * 100) / (100 + gstPer));
    const gstAmount = ((taxable * gstPer) / 100);

    return roundToTwo(taxable + gstAmount);
  };

  return (
    <div className="relative rounded-lg h-[100vh] pt-4">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">Add Sale</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button
            onClick={handleSaveInvoice}
            disabled={loading}
            className="gap-1"
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
      <div className="grid gap-2 text-[12px]">
        <div className="grid gap-4 grid-cols-5 w-full">
          <div>
            <Label className="text-sm font-medium">SALE TYPE</Label>
            <RadioGroup
              value={formData?.saleType}
              onValueChange={(value) => handleInputChange("saleType", value)}
              className="grid grid-cols-1 gap-1.5 pt-1"
            >
              <div>
                <RadioGroupItem
                  value="invoice"
                  id="invoice"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="invoice"
                  className="flex items-center gap-3 rounded-md border-2 border-muted bg-popover p-1.5 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">Invoice</p>
                    <p className="text-xs text-muted-foreground">
                      Regular sale invoice
                    </p>
                  </div>
                </Label>
              </div>

              <div>
                <RadioGroupItem
                  value="return"
                  id="return"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="return"
                  className="flex items-center gap-3 rounded-md border-2 border-muted bg-popover p-1.5 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <ClipboardList className="h-5 w-5 text-orange-500 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">
                      Sales Return
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sales return invoice
                    </p>
                  </div>
                </Label>
              </div>

              <div>
                <RadioGroupItem
                  value="quotation"
                  id="quotation"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="quotation"
                  className="flex items-center gap-3 rounded-md border-2 border-muted bg-popover p-1.5 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <ScrollText className="h-5 w-5 text-green-500 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">
                      Quotation
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Price estimate
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="col-span-4 grid-cols-4 grid gap-4 font-semibold">
            <div>
              <Label className="text-sm font-medium">
                CUSTOMER NAME
                <span className="text-rose-500 pl-2 text-xs">*REQUIRED</span>
              </Label>
              <CustomerSuggestionWithDialog
                inputRef={inputRef}
                value={customerName}
                setValue={setCustomerName}
                onSuggestionSelect={handleCustomerSelect}
                onKeyDown={(e) => handleKeyDown(e, "customerName")}
                ref={(el) => (inputRef.current["customerName"] = el)}
              />
              <div className="flex items-center gap-2 mt-1 text-sm font-semibold">
                <Checkbox
                  checked={isCashCounter}
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
                  // Focus on the product input after selecting a doctor, using requestAnimationFrame
                  requestAnimationFrame(() => {
                    if (inputRef.current["product"]) {
                      inputRef.current["product"].focus();
                    }
                  });
                }}
                onKeyDown={(e) => handleKeyDown(e, "doctorName")}
                ref={(el) => (inputRef.current["doctorName"] = el)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">
                INVOICE NO
                <span className="text-rose-500 pl-2 text-xs">*REQUIRED</span>
              </Label>
              <Input
                value={formData?.invoiceNumber}
                onChange={(e) =>
                  handleInputChange("invoiceNumber", e.target.value)
                }
                placeholder="Invoice No"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">
                INVOICE DATE
                <span className="text-rose-500 pl-2 text-xs">*REQUIRED</span>
              </Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full"
              />
            </div>
            {formData?.saleType === "return" && (
              <div>
                <Label className="text-sm font-medium">
                  OLD INVOICE NUMBER
                </Label>
                <Input
                  type="text"
                  ref={(el) => (inputRef.current["returnInvoiceNumber"] = el)}
                  value={formData.returnInvoiceNumber}
                  onChange={(e) =>
                    handleInputChange("returnInvoiceNumber", e.target.value)
                  }
                  className="w-full "
                  placeholder="Enter Old Invoice number"
                  onKeyDown={(e) => handleKeyDown(e, "returnInvoiceNumber")}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* sales  table */}
      <div className="my-4">
        <SaleItemTable
          inputRef={inputRef}
          products={products}
          setProducts={setProducts}
          handleKeyDown={handleKeyDown}
          saleType={formData?.saleType}
        />
      </div>

      <div className={`grid grid-cols-4 gap-4 ${showDiscount ? 'block' : 'hidden'}`}>
        <div className="p-4 border rounded-lg ">
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
        {/* <div className="p-4 border rounded-lg">
          <h3 className="mb-4 text-sm font-medium">CUSTOM CHARGE</h3>
          <div className="flex gap-4">
            <Input placeholder="Custom charge" />
            <Input placeholder="₹ Value" />
          </div>
        </div> */}
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
          <div className="">
            {formData.saleType === "return"
              ? "Return Amount"
              : "(+) Custom"}
          </div>
          <div className="text-lg">
            {formatCurrency(amountData?.returnAmount)}
          </div>
        </div>
        <div className="py-2">
          <div className="">(-) Adjustment</div>
          <div className="text-lg">
            {formatCurrency(amountData?.adjustment || 0)}
          </div>
        </div>
        <div className="bg-rose-500 py-2">
          <div className="">Total Amount</div>
          <div className="text-lg">
            {formatCurrency(amountData?.grandTotal)}
          </div>
        </div>
      </div>
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoiceData={invoiceForPayment}
        onSubmit={handlePaymentSubmit}
        billStatus={createBillStatus}
      />
    </div>
  );
}
