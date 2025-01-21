import { useRef, useState, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { CalendarIcon, ChevronLeft, Save, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import PurchaseItemTable from "../components/custom/purchase/PurchaseItemTable";
import { convertToFraction } from "../assets/Data";
import { Backend_URL } from "../assets/Data";
import { useToast } from "../hooks/use-toast";
import SelectPartyDialog from "../components/custom/party/SelectPartyDialog";
import { enIN } from "date-fns/locale";
import { useDispatch } from "react-redux";
import { fetchItems } from "../redux/slices/inventorySlice";
import { useNavigate } from "react-router-dom";
import PaymentDialog from "../components/custom/payment/PaymentDialog";

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

// Create a separate component for the settings dialog
const AmountSettingsDialog = ({
  open,
  onOpenChange,
  value,
  onChange,
  products,
  setProducts,
}) => {
  const handleModeChange = (newMode) => {
    // First update the mode
    onChange(newMode);

    // Then recalculate amounts for all existing products
    if (products && products.length > 0) {
      setProducts(
        products.map((product) => {
          const quantity = Number(product?.quantity || 0);
          const purchaseRate = Number(product?.purchaseRate || 0);
          const discount = Number(product?.discount || 0);
          let schemePercent = 0;

          if (product.schemeInput1 && product.schemeInput2) {
            const temp1 = Number(product.schemeInput1);
            const temp2 = Number(product.schemeInput2);
            schemePercent = (temp2 / (temp1 + temp2)) * 100;
          }

          const totalDiscountPercent = discount + schemePercent;
          const effectiveRate =
            purchaseRate - (purchaseRate * totalDiscountPercent) / 100;
          const gstAmount =
            (effectiveRate * Number(product?.gstPer || 0)) / 100;

          let amount;
          switch (newMode) {
            case "exclusive":
              // Just Rate × Quantity
              amount = purchaseRate * quantity;
              break;
            case "inclusive_all":
              // (Rate - Rate×Discount%) × Quantity
              amount = effectiveRate * quantity;
              break;
            case "inclusive_gst":
              // (Rate - Rate×Discount% + (Rate - Rate×Discount%)×GST%) × Quantity
              amount = (effectiveRate + gstAmount) * quantity;
              break;
          }

          return {
            ...product,
            amount: convertToFraction(amount),
          };
        })
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Amount Calculation Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">
              How should the amount be calculated for each product?
            </Label>
            <RadioGroup
              className="gap-4"
              value={value}
              onValueChange={handleModeChange}
            >
              <Label
                htmlFor="settings-exclusive"
                className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleModeChange("exclusive")}
              >
                <RadioGroupItem value="exclusive" id="settings-exclusive" />
                <div className="flex-1">
                  <div className="font-medium">Rate</div>
                  <div className="text-sm text-gray-500">
                    Shows pure rate × quantity without any adjustments
                  </div>
                </div>
              </Label>

              <Label
                htmlFor="settings-inclusive_all"
                className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleModeChange("inclusive_all")}
              >
                <RadioGroupItem
                  value="inclusive_all"
                  id="settings-inclusive_all"
                />
                <div className="flex-1">
                  <div className="font-medium">Discounted Rate</div>
                  <div className="text-sm text-gray-500">
                    Shows rate after applying discount × quantity
                  </div>
                </div>
              </Label>

              <Label
                htmlFor="settings-inclusive_gst"
                className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleModeChange("inclusive_gst")}
              >
                <RadioGroupItem
                  value="inclusive_gst"
                  id="settings-inclusive_gst"
                />
                <div className="flex-1">
                  <div className="font-medium">Discounted Rate + GST</div>
                  <div className="text-sm text-gray-500">
                    Shows rate after discount and GST × quantity
                  </div>
                </div>
              </Label>
            </RadioGroup>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function PurchaseForm() {
  const navigate = useNavigate();
  const inputRef = useRef([]);
  const dispatch = useDispatch();
  const [invoiceDate, setInvoiceDate] = useState();
  const [dueDate, setDueDate] = useState();
  const [products, setProducts] = useState([]);
  const [partySelectDialog, setPartySelectDialog] = useState(false);
  const [partyName, setPartyName] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    purchaseType: "invoice",
    partyName: "",
    partyId: "",
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
      if (!formData.partyName || !formData.invoiceNumber || !invoiceDate) {
        throw new Error("Please fill all required fields");
      }

      if (products.length === 0) {
        throw new Error("Please add at least one product");
      }

      // Instead of saving invoice here, open payment dialog
      setInvoiceForPayment({
        partyName: formData.partyName,
        partyId: formData.partyId,
        invoiceNumber: formData.invoiceNumber,
        invoiceDate: invoiceDate,
        totalAmount: amountData.grandTotal,
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
      // Format products data to match schema
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

      // Create a summary object for all the calculated totals with rounded values
      const billSummary = {
        subtotal: roundToTwo(amountData.subtotal),
        discountAmount: roundToTwo(amountData.discountAmount),
        taxableAmount: roundToTwo(amountData.taxable),
        gstAmount: roundToTwo(amountData.gstAmount),
        totalQuantity: amountData.totalQuantity,
        productCount: amountData.productCount,
        grandTotal: roundToTwo(amountData.grandTotal),
      };

      const finalData = {
        invoiceType: "PURCHASE",
        invoiceNumber: formData.invoiceNumber,
        partyName: formData.partyName,
        partyId: formData.partyId,
        mob: "", // Add if available
        invoiceDate: invoiceDate,
        paymentDueDate:
          paymentData.status === "due" ? paymentData.dueDate : null,
        products: formattedProducts,
        withGst: formData.withGst === "yes",
        billSummary,
        amountCalculationType: formData.amountType,
        status: "active",
        // Payment details
        paymentStatus: paymentData.status,
        amountPaid:
          paymentData.status === "due" ? 0 : Number(paymentData.amount || 0),
        // Create separate payment record
        payment:
          paymentData.status === "paid"
            ? {
                amount: Number(paymentData.amount || 0),
                payment_type: paymentData.payment_type,
                payment_method: paymentData.paymentMethod,
                party_id: formData.partyId,
                partyName: formData.partyName,
                remarks: paymentData.notes,
                // Only include accountId if payment method is not cheque
                ...(paymentData.paymentMethod !== "cheque" && {
                  accountId: paymentData.accountId,
                }),
                // Include cheque details if payment method is cheque
                ...(paymentData.paymentMethod === "cheque" && {
                  chequeNumber: paymentData.chequeNumber,
                  chequeDate: paymentData.chequeDate,
                  micrCode: paymentData.micrCode,
                }),
              }
            : null,
      };

      const response = await fetch(`${Backend_URL}/api/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save invoice");
      }

      toast({
        title: "Purchase invoice saved successfully",
        variant: "success",
      });

      dispatch(fetchItems());

      // Reset all form data and states
      setFormData({
        purchaseType: "invoice",
        partyName: "",
        partyId: "",
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
      setInvoiceForPayment(null); // Reset invoice data for payment
      setPartyName(""); // Reset party name input

      // Navigate back after successful submission
      navigate(-1);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save invoice",
        variant: "destructive",
      });
    }
  };

  // Handle distributor name input change
  const handleDistributorNameChange = (e) => {
    e.preventDefault();
    const value = e.target.value;
    setPartyName(value);

    // Only open dialog if space is pressed or text is entered (not on backspace/delete)
    if (value.length === 1) {
      if (value === " ") {
        setPartySelectDialog(true);
      } else if (value[0] !== " " && partyName.length === 0) {
        setPartySelectDialog(true);
      }
    }
  };

  // Handle distributor selection from dialog
  const handleDistributorSelect = (distributor) => {
    setPartyName(distributor.name);
    setFormData({
      ...formData,
      partyId: distributor._id,
      partyName: distributor.name,
    });
    setPartySelectDialog(false);
  };

  const [invoiceDateOpen, setInvoiceDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoiceForPayment, setInvoiceForPayment] = useState(null);

  const calculateItemAmount = (product) => {
    const quantity = Number(product?.quantity || 0);
    const purchaseRate = Number(product?.purchaseRate || 0);
    const discountPercent =
      Number(product?.discount || 0) + Number(product?.schemePercent || 0);
    const gstPer = Number(product?.gstPer || 0);

    let amount = 0;

    switch (formData.amountType) {
      case "exclusive":
        // Amount is exclusive of both discount and GST
        const subtotal = quantity * purchaseRate;
        const discount = (subtotal * discountPercent) / 100;
        const taxable = subtotal - discount;
        const gst = (taxable * gstPer) / 100;
        amount = taxable + gst;
        break;

      case "inclusive_gst":
        // Amount is inclusive of GST but exclusive of discount
        const baseAmount = quantity * purchaseRate;
        const effectiveRate = baseAmount / (1 + gstPer / 100);
        const discountAmount = (effectiveRate * discountPercent) / 100;
        amount = baseAmount - discountAmount;
        break;

      case "inclusive_all":
        // Amount is inclusive of both GST and discount
        const grossAmount = quantity * purchaseRate;
        amount = grossAmount;
        break;
    }

    return convertToFraction(amount);
  };

  return (
    <div className="relative rounded-lg h-[100vh] pt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChevronLeft
            className="w-5 h-5 text-rose-500 cursor-pointer"
            onClick={() => navigate(-1)}
          />
          <h1 className="text-xl font-medium">Add Purchase</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-rose-500 text-rose-500 gap-2"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 className="w-4 h-4" />
            Column Settings
          </Button>
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
              value={partyName || ""}
              onChange={handleDistributorNameChange}
              placeholder="Type or Press space"
              className="appearance-none h-8 w-full border-[1px] border-gray-300 px-2 bg-white focus:outline-none focus:ring-0 focus:border-gray-300"
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
              className="appearance-none h-8 w-full border-[1px] border-gray-300 px-2 bg-white focus:outline-none focus:ring-0 focus:border-gray-300"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">
              INVOICE DATE<span className="text-rose-500">*REQUIRED</span>
            </Label>
            <Popover open={invoiceDateOpen} onOpenChange={setInvoiceDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "appearance-none w-full h-8 justify-start text-left font-normal border-[1px] border-gray-300 px-2 bg-white hover:bg-white focus:outline-none focus:ring-0 focus:border-gray-300 shadow-none",
                    !invoiceDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {invoiceDate
                    ? format(invoiceDate, "dd/MM/yyyy")
                    : "Select Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={invoiceDate}
                  onSelect={(date) => {
                    setInvoiceDate(
                      new Date(date)
                        .toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                        .split("/")
                        .reverse()
                        .join("-")
                    );
                    setInvoiceDateOpen(false);
                  }}
                  captionLayout="dropdown-buttons"
                  showOutsideDays={false}
                  ISOWeek={false}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="text-sm font-medium">PAYMENT DUE DATE</Label>
            <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "appearance-none w-full h-8 justify-start text-left font-normal border-[1px] border-gray-300 px-2 bg-white hover:bg-white focus:outline-none focus:ring-0 focus:border-gray-300 shadow-none",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {dueDate ? format(dueDate, "dd/MM/yyyy") : "Select Due Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setDueDateOpen(false);
                  }}
                  locale={enIN}
                  captionLayout="dropdown-buttons"
                  showOutsideDays={false}
                  ISOWeek={false}
                />
              </PopoverContent>
            </Popover>
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
      <SelectPartyDialog
        open={partySelectDialog}
        setOpen={setPartySelectDialog}
        search={partyName}
        setSearch={setPartyName}
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
    </div>
  );
}
