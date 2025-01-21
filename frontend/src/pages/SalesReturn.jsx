import { useRef, useState, useMemo, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { CalendarIcon, ChevronLeft, Save, Settings } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { convertToFraction } from "../assets/Data";
import { Backend_URL } from "../assets/Data";
import { useToast } from "../hooks/use-toast";
import SelectPartyDialog from "../components/custom/party/SelectPartyDialog";
import PaymentDialog from "../components/custom/payment/PaymentDialog";
import { enIN } from "date-fns/locale";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import SaleItemTable from "../components/custom/sales/SaleItemTable";

// Calculate totals for return items
export const calculateReturnTotals = (products) => {
  return products.reduce(
    (total, product) => {
      const quantity = Number(product?.quantity || 0);
      const pack = Number(product?.pack || 1);
      const purchaseRate = Number(product?.ptr || 0);
      const discountPercent = Number(product?.discount || 0);
      const gstPer = Number(product?.gstPer || 0);

      const subtotal = (quantity * product?.mrp) / pack;
      const discount = (subtotal * discountPercent) / 100;
      const taxable = ((subtotal - discount) * 100) / (100 + gstPer);
      const gstAmount = (taxable * gstPer) / 100;

      total.grandTotal += taxable + gstAmount;
      total.productCount += 1;
      total.totalQuantity += quantity;
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

export default function SalesReturn() {
  const navigate = useNavigate();
  const inputRef = useRef([]);
  const dispatch = useDispatch();
  const [returnDate, setReturnDate] = useState(
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
  const [partySelectDialog, setPartySelectDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [partyName, setPartyName] = useState("");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    originalInvoiceNumber: "",
    returnNumber: "",
    partyName: "",
    partyId: "",
    returnDate: new Date(),
  });

  const [payment, setPayment] = useState(null);

  // Calculate totals of the return products
  const amountData = useMemo(() => calculateReturnTotals(products), [products]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    // Fetch return number from backend
    fetch(`${Backend_URL}/api/sales/return-number`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) =>
        setFormData((prev) => ({ ...prev, returnNumber: data.returnNumber }))
      );
  }, []);

  const handlePaymentSubmit = (paymentData) => {
    setPayment(paymentData);
    setPaymentDialog(false);
    // After payment is submitted, proceed with saving the return
    handleSaveReturnSubmit(paymentData);
  };

  const handleSaveReturnSubmit = async (paymentData = null) => {
    try {
      setLoading(true);

      if (!formData.returnNumber || !returnDate) {
        throw new Error("Please fill all required fields");
      }

      if (products.length === 0) {
        throw new Error("Please add at least one product to return");
      }

      // Format products data
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
        pack: Number(product.pack),
        purchaseRate: Number(product.purchaseRate),
        ptr: Number(product.ptr),
        discount: Number(product.discount || 0),
        gstPer: Number(product.gstPer),
        amount: Number(product.amount),
      }));

      // Calculate return summary
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
        returnNumber: formData.returnNumber,
        originalInvoiceNumber: formData.originalInvoiceNumber,
        partyName: formData.partyName || partyName,
        partyId: formData.partyId,
        returnDate: returnDate,
        products: formattedProducts,
        billSummary,
        payment: paymentData,
      };

      // Send data to backend
      const response = await fetch(`${Backend_URL}/api/sales/return`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create sales return");
      }

      const savedReturn = await response.json();

      toast({
        title: "Success",
        description: "Sales return created successfully",
        variant: "success",
      });

      navigate("/sales");
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create sales return",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReturn = () => {
    // Open payment dialog when save is clicked
    setPaymentDialog(true);
  };

  // Handle party name input change
  const handlePartyNameChange = (e) => {
    e.preventDefault();
    const value = e.target.value;

    if (value.length === 1 && value === " ") {
      setPartySelectDialog(true);
      return;
    }
    if (value.length > 0 && value[0] !== " ") {
      setPartyName(value);
      setPartySelectDialog(true);
    }
  };

  // Handle party selection from dialog
  const handlePartySelect = (party) => {
    setPartyName(party.name);
    setFormData({
      ...formData,
      partyId: party._id,
      partyName: party.name,
    });
    setPartySelectDialog(false);
  };

  const [returnDateOpen, setReturnDateOpen] = useState(false);

  return (
    <div className="relative rounded-lg h-[100vh] pt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChevronLeft
            className="w-5 h-5 text-rose-500 cursor-pointer"
            onClick={() => navigate(-1)}
          />
          <h1 className="text-xl font-medium">Sales Return</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="gap-2 bg-gray-800"
            onClick={handleSaveReturn}
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
                Save Return
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Return Information */}
      <div className="grid gap-4">
        <div className="grid gap-4 grid-cols-4 w-full">
          <div>
            <Label className="text-sm font-medium">ORIGINAL INVOICE NO</Label>
            <Input
              value={formData?.originalInvoiceNumber}
              onChange={(e) =>
                handleInputChange("originalInvoiceNumber", e.target.value)
              }
              placeholder="Original Invoice Number (Optional)"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">
              RETURN NO<span className="text-rose-500">*REQUIRED</span>
            </Label>
            <Input
              value={formData?.returnNumber}
              onChange={(e) =>
                handleInputChange("returnNumber", e.target.value)
              }
              placeholder="Return Number"
              disabled
            />
          </div>
          <div>
            <Label className="text-sm font-medium">
              CUSTOMER NAME<span className="text-rose-500">*REQUIRED</span>
            </Label>
            <Input
              value={partyName}
              onChange={handlePartyNameChange}
              placeholder="Type or Press space"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">
              RETURN DATE<span className="text-rose-500">*REQUIRED</span>
            </Label>
            <Popover open={returnDateOpen} onOpenChange={setReturnDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !returnDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {returnDate
                    ? format(returnDate, "dd/MM/yyyy")
                    : "Select Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={returnDate}
                  onSelect={(date) => {
                    setReturnDate(
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
                    setReturnDateOpen(false);
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

      {/* Return Items Table */}
      <div className="my-4">
        <SaleItemTable
          inputRef={inputRef}
          products={products}
          setProducts={setProducts}
          isReturn={true}
        />
      </div>

      {/* Footer with Totals */}
      <div className="fixed bottom-0 w-[cal(100%-200px)] grid grid-cols-7 gap-4 p-4 text-sm text-white bg-gray-800 rounded-lg">
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
        <div className="bg-rose-500 -m-4 p-4 rounded-r-lg">
          <div className="mb-1">Return Amount</div>
          <div>₹{amountData?.grandTotal}</div>
        </div>
      </div>

      <SelectPartyDialog
        open={partySelectDialog}
        setOpen={setPartySelectDialog}
        search={partyName}
        setSearch={setPartyName}
        onSelect={handlePartySelect}
      />

      <PaymentDialog
        open={paymentDialog}
        onOpenChange={(open) => {
          setPaymentDialog(open);
          // If dialog is closed without submitting, reset payment
          if (!open) {
            setPayment(null);
          }
        }}
        invoiceData={{
          partyName: formData.partyName || partyName,
          invoiceNumber: formData.returnNumber,
          invoiceDate: returnDate,
          totalAmount: amountData?.grandTotal || 0,
        }}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  );
}
