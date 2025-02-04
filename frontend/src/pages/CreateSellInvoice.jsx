import { useRef, useState, useMemo, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Input } from "../components/ui/input";
import { createBill } from "../redux/slices/SellBillSlice";

import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { CalendarIcon, ChevronLeft, Save, Settings } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import SaleItemTable from "../components/custom/sales/SaleItemTable";
import { convertToFraction } from "../assets/Data";
import { Backend_URL } from "../assets/Data";
import { useToast } from "../hooks/use-toast";
import SelectCustomerDialog from "../components/custom/customer/SelectCustomerDialog";
import { enIN } from "date-fns/locale";
import { useDispatch } from "react-redux";
import { fetchItems } from "../redux/slices/inventorySlice";
import { useNavigate } from "react-router-dom";
import { fetchBills } from "../redux/slices/SellBillSlice";
import PaymentDialog from "../components/custom/payment/PaymentDialog";

// for sale only
export const calculateTotals = (products) => {
  return products.reduce(
    (total, product) => {
      const quantity = Number(product?.quantity || 0);
      const pack = Number(product?.pack || 1);
      const free = Number(product?.free || 0);
      const purchaseRate = Number(product?.ptr || 0);
      const discountPercent =
        Number(product?.discount || 0) + Number(product?.schemePercent || 0);
      const gstPer = Number(product?.gstPer || 0);
      const amount = Number(product?.amount || 0);

      const subtotal = (quantity * product?.mrp) / pack;
      const discount =
        (((product?.quantity * product?.mrp) / pack) * discountPercent) / 100;
      const taxable = ((subtotal - discount) * 100) / (100 + gstPer);
      const gstAmount = (taxable * gstPer) / 100;

      total.grandTotal += taxable + gstAmount;
      total.productCount += 1;
      total.totalQuantity += quantity + free;
      total.subtotal += convertToFraction(subtotal);
      total.discountAmount += convertToFraction(discount);
      total.taxable += convertToFraction(taxable);
      total.gstAmount += convertToFraction(gstAmount);

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

export default function CreateSellInvoice() {
  const navigate = useNavigate();
  const inputRef = useRef([]);
  const dispatch = useDispatch();
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
  const [dueDate, setDueDate] = useState();
  const [products, setProducts] = useState([]);
  const [customerSelectDialog, setCustomerSelectDialog] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const { toast } = useToast();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoiceForPayment, setInvoiceForPayment] = useState(null);

  const [formData, setFormData] = useState({
    saleType: "invoice",
    partyName: "",
    partyId: "",
    invoiceNumber: "",
    invoiceDate: new Date(),
    paymentDueDate: "",
    overallDiscount: "", // in percentage
  });
  const [isCashCounter, setIsCashCounter] = useState(true);

  // caculating total of the product
  const amountData = useMemo(() => calculateTotals(products), [products]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const [loading, setLoading] = useState(false);

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
        (!formData.partyName && !isCashCounter)
      ) {
        throw new Error("Please fill all required fields");
      }

      if (products.length === 0) {
        throw new Error("Please add at least one product");
      }

      // Instead of saving invoice here, open payment dialog
      setInvoiceForPayment({
        partyName: isCashCounter ? "Cash/Counter" : formData.partyName,
        partyId: isCashCounter ? null : formData.partyId,
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
      setLoading(true);
      // Format products data to match schema
      const formattedProducts = products.map((product) => ({
        inventoryId: product.inventoryId,
        productName: product.productName,
        batchNumber: product.batchNumber,
        batchId: product.batchId,
        expiry: product.expiry,
        HSN: product.HSN,
        mrp: Number(product.mrp),
        quantity: Number(product.quantity),
        saleRate: Number(product.saleRate),
        pack: Number(product.pack || 1),
        purchaseRate: Number(product.purchaseRate),
        ptr: Number(product.ptr),
        discount: Number(product.discount || 0),
        gstPer: Number(product.gstPer),
        amount: Number(product.amount),
      }));

      // Calculate bill summary
      const billSummary = {
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

        if (billSummary.gstSummary.hasOwnProperty(gstPer)) {
          billSummary.gstSummary[gstPer].taxable += Number(taxable.toFixed(2));
          billSummary.gstSummary[gstPer].cgst += Number(
            (gstAmount / 2).toFixed(2)
          );
          billSummary.gstSummary[gstPer].sgst += Number(
            (gstAmount / 2).toFixed(2)
          );
          billSummary.gstSummary[gstPer].total += Number(gstAmount.toFixed(2));
        }
      });

      const finalData = {
        saleType: formData.saleType,
        invoiceNumber: formData.invoiceNumber,
        partyName: isCashCounter ? "Cash/Counter" : formData.partyName,
        partyId: isCashCounter ? null : formData.partyId,
        invoiceDate: invoiceDate,
        paymentDueDate:
          paymentData.status === "due" ? paymentData.dueDate : null,
        products: formattedProducts,
        grandTotal: amountData.grandTotal,
        is_cash_customer: isCashCounter,
        billSummary,
        // Payment details
        paymentStatus: paymentData.status,
        amountPaid:
          paymentData.status === "due" ? 0 : Number(paymentData.amount || 0),
        // Payment info
        payment:
          paymentData.status === "paid"
            ? {
                amount: Number(paymentData.amount || 0),
                payment_type: "Payment In",
                payment_method: paymentData.paymentMethod,
                payment_date: paymentData.chequeDate || new Date(),
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
          dispatch(fetchBills()); // updating sales list
          // Reset form
          setFormData({
            saleType: "invoice",
            partyName: "",
            invoiceNumber: "",
            invoiceDate: "",
            paymentDueDate: "",
            overallDiscount: "",
          });
          setCustomerName("");
          setInvoiceDate(null);
          setDueDate(null);
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

  // Handle customer name input change
  const handleCustomerNameChange = (e) => {
    e.preventDefault();
    const value = e.target.value;

    // Open dialog if space is pressed or text is entered
    if (value.length === 1 && value === " ") {
      setCustomerSelectDialog(true);
      return;
    }
    if (value.length > 0 && value[0] !== " ") {
      setCustomerName(value);
      setCustomerSelectDialog(true);
    }
  };

  // Handle customer selection from dialog
  const handleCustomerSelect = (customer) => {
    setCustomerName(customer.name);
    setFormData({
      ...formData,
      partyId: customer._id,
      partyName: customer.name,
    });
    setCustomerSelectDialog(false);
  };

  const [invoiceDateOpen, setInvoiceDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  return (
    <div className="relative rounded-lg h-[100vh] pt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChevronLeft
            className="w-5 h-5 text-rose-500 cursor-pointer"
            onClick={() => navigate(-1)}
          />
          <h1 className="text-xl font-medium">Add Sale</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-blue-500 shrink-0"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
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
                  value="deliveryChallan"
                  id="deliveryChallan"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="deliveryChallan"
                  className="flex items-center gap-3 rounded-md border-2 border-muted bg-popover p-1.5 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-orange-500 shrink-0"
                  >
                    <rect width="16" height="20" x="4" y="2" rx="2" />
                    <path d="M9 22v-4h6v4" />
                    <path d="M8 6h.01" />
                    <path d="M16 6h.01" />
                    <path d="M12 6h.01" />
                    <path d="M12 10h.01" />
                    <path d="M12 14h.01" />
                    <path d="M16 10h.01" />
                    <path d="M16 14h.01" />
                    <path d="M8 10h.01" />
                    <path d="M8 14h.01" />
                  </svg>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">
                      Delivery Challan
                    </p>
                    <p className="text-xs text-muted-foreground">
                      For delivery purposes
                    </p>
                  </div>
                </Label>
              </div>

              <div>
                <RadioGroupItem
                  value="Quotation"
                  id="Quotation"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="Quotation"
                  className="flex items-center gap-3 rounded-md border-2 border-muted bg-popover p-1.5 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-green-500 shrink-0"
                  >
                    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
                    <path d="M16 8h-6" />
                    <path d="M14 12h-4" />
                    <path d="M12 16H8" />
                  </svg>
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
          <div>
            <div>
              <Label className="text-sm font-medium">
                CUSTOMER NAME<span className="text-rose-500">*REQUIRED</span>
              </Label>
              <Input
                value={customerName || ""}
                onChange={handleCustomerNameChange}
                placeholder="Type or Press space"
                disabled={isCashCounter}
              />
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm font-semibold">
              <Checkbox
                checked={isCashCounter}
                onCheckedChange={(checked) => {
                  setIsCashCounter(checked);
                  if (checked) {
                    setCustomerName("");
                    setFormData((prev) => ({
                      ...prev,
                      partyName: "",
                      partyId: "",
                    }));
                  }
                }}
              />
              Cash/Counter Sale
            </div>
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
                    "w-full justify-start text-left font-normal",
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
                      date
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
                  locale={enIN}
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
                    "w-full justify-start text-left font-normal",
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
      </div>

      {/* purchase table */}
      <div className="my-4">
        <SaleItemTable
          inputRef={inputRef}
          products={products}
          setProducts={setProducts}
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
      <SelectCustomerDialog
        open={customerSelectDialog}
        setOpen={setCustomerSelectDialog}
        search={customerName}
        setSearch={setCustomerName}
        onSelect={handleCustomerSelect}
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
