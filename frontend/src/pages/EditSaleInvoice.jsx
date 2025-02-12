import { useRef, useState, useMemo, useEffect } from "react";
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
  CalendarIcon,
  ChevronLeft,
  Pencil,
  Save,
  FileText,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { Backend_URL, convertQuantityValue } from "../assets/Data";
import { useToast } from "../hooks/use-toast";
import SelectPartyDialog from "../components/custom/distributor/SelectDistributorDlg";
import { enIN } from "date-fns/locale";
import { calculateTotals } from "./CreateSellInvoice";
import { useParams, useNavigate } from "react-router-dom";
import SaleItemTable from "../components/custom/sales/SaleItemTable";

export default function EditSaleInvoice() {
  const inputRef = useRef([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState(true);
  const [invoiceDate, setInvoiceDate] = useState();
  const [dueDate, setDueDate] = useState();
  const [products, setProducts] = useState([]);
  const [partySelectDialog, setPartySelectDialog] = useState(false);
  const [partyName, setPartyName] = useState("");
  const [invoiceDateOpen, setInvoiceDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [completeData, setCompleteData] = useState(null);

  const [formData, setFormData] = useState({
    saleType: "invoice",
    partyName: "",
    partyId: "",
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
        const response = await fetch(
          `${Backend_URL}/api/sales/invoice/${invoiceId}`,
          { credentials: "include" }
        );
        if (!response.ok) {
          throw new Error("Something went wrong");
        }
        const data = await response.json();
        setCompleteData(data);
        const {
          partyName,
          partyId,
          invoiceNumber,
          products,
          invoiceDate,
          paymentDueDate,
          withGst,
        } = data;
        const fomateProduct = products.map((item) => {
          const temp = convertQuantityValue(item.quantity, item.pack);
          return { ...item, ...temp };
        });
        setProducts(fomateProduct);
        setInvoiceDate(invoiceDate ? new Date(invoiceDate) : null);
        setDueDate(paymentDueDate ? new Date(paymentDueDate) : null);
        setFormData({
          ...formData,
          partyName,
          partyId,
          invoiceDate,
          paymentDueDate,
          invoiceNumber,
          withGst: withGst ? "yes" : "no",
        });
        setPartyName(partyName);
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

      if (!formData.partyName || !formData.invoiceNumber || !invoiceDate) {
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
        ptr: Number(product.ptr),
        discount: Number(product.discount || 0),
        gstPer: Number(product.gstPer),
        amount: Number(product.amount),
      }));

      const finalData = {
        _id: invoiceId,
        invoiceType: "SALE",
        invoiceNumber: formData.invoiceNumber,
        partyName: formData.partyName,
        partyId: formData.partyId,
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
      setPartySelectDialog(true);
      return;
    }
    if (value.length > 0 && value[0] !== " ") {
      setPartyName(value);
      setPartySelectDialog(true);
    }
  };
  const handleCustomerSelect = (customer) => {
    setPartyName(customer.name);
    setFormData({
      ...formData,
      partyId: customer._id,
      partyName: customer.name,
    });
    setPartySelectDialog(false);
  };

  return (
    <div className="relative rounded-lg h-[100vh] pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChevronLeft
            className="w-5 h-5 text-rose-500 cursor-pointer"
            onClick={() => navigate(-1)}
          />
          <h1 className="text-xl font-medium">
            {viewMode ? "View" : "Edit"} Sale
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

                <Button className="gap-2 bg-rose-600">
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
              CUSTOMER NAME<span className="text-rose-500">*REQUIRED</span>
            </Label>
            <Input
              value={partyName || ""}
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
            <Popover open={invoiceDateOpen} onOpenChange={setInvoiceDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !invoiceDate && "text-muted-foreground"
                  )}
                  disabled={viewMode}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {invoiceDate && !isNaN(invoiceDate.getTime())
                    ? format(invoiceDate, "dd/MM/yyyy")
                    : "Select Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={invoiceDate}
                  onSelect={(date) => {
                    setInvoiceDate(date);
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
                  disabled={viewMode}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {dueDate && !isNaN(dueDate.getTime())
                    ? format(dueDate, "dd/MM/yyyy")
                    : "Select Due Date"}
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

      {/* Fixed Footer */}
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
          <div>₹{amountData?.grandTotal}</div>
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

      {/* Party Selection Dialog */}
      <SelectPartyDialog
        open={partySelectDialog}
        setOpen={setPartySelectDialog}
        search={partyName}
        setSearch={setPartyName}
        onSelect={handleCustomerSelect}
      />
    </div>
  );
}
