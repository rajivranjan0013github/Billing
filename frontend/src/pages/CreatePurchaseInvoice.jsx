import { useRef, useState, useMemo } from 'react'
import { Button } from "../components/ui/button"
import { Calendar } from "../components/ui/calendar"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover"
import { CalendarIcon, ChevronLeft, Save } from 'lucide-react'
import { format } from "date-fns"
import { cn } from "../lib/utils"
import PurchaseItemTable from '../components/custom/purchase/PurchaseItemTable'
import { convertToFraction } from '../assets/Data'
import { Backend_URL } from '../assets/Data'
import { useToast } from '../hooks/use-toast'
import SelectPartyDialog from '../components/custom/party/SelectPartyDialog'
import { enIN } from 'date-fns/locale'
import { useDispatch } from 'react-redux'
import { fetchItems } from '../redux/slices/inventorySlice';
import { useNavigate } from 'react-router-dom'

export const calculateTotals = (products) => {
  return products.reduce(
    (total, product) => {
      const quantity = Number(product?.quantity || 0);
      const free = Number(product?.free || 0);
      const purchaseRate = Number(product?.purchaseRate || 0);
      const discountPercent = Number(product?.discount || 0) + Number(product?.schemePercent || 0);
      const gstPer = Number(product?.gstPer || 0);
      const amount = Number(product?.amount || 0);

      const subtotal = quantity * purchaseRate;
      const discount = convertToFraction((subtotal * discountPercent) / 100);
      const taxable = subtotal - discount;
      const gstAmount = (taxable * gstPer) / 100;

      total.grandTotal += amount;
      total.productCount += 1;
      total.totalQuantity += quantity + free;
      total.subtotal += subtotal;
      total.discountAmount += discount;
      total.taxable += taxable;
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

export default function PurchaseForm() {
  const navigate = useNavigate();
  const inputRef = useRef([]);
  const dispatch = useDispatch();
  const [invoiceDate, setInvoiceDate] = useState();
  const [dueDate, setDueDate] = useState();
  const [products, setProducts] = useState([]);
  const [partySelectDialog, setPartySelectDialog] = useState(false);
  const [partyName, setPartyName] = useState("");
  const {toast} = useToast();

  const [formData, setFormData] = useState({
    purchaseType : 'invoice',
    partyName : "",
    partyId : "",
    invoiceNumber : "",
    invoiceDate : "",
    paymentDueDate : "",
    withGst : 'yes',
    overallDiscount : "", // in percentage
  });

  // caculating total of the product
  const amountData = useMemo(()=> calculateTotals(products), [products]);

  const handleInputChange = (field, value) => {
    setFormData(prev=>({...prev, [field] : value}));
  }

  const [loading, setLoading] = useState(false);

  const handleSaveInvoice = async() => {
    try {
      setLoading(true);
      // Validate required fields
      if (!formData.partyName || !formData.invoiceNumber || !invoiceDate) {
        throw new Error('Please fill all required fields');
      }

      if(products.length === 0)  {
        throw new Error('Please add atleast one product');
      }
      // Format products data to match schema
      const formattedProducts = products.map(product => ({
        inventoryId: product.inventoryId,
        productName: product.productName,
        batchNumber: product.batchNumber,
        batchId: product.batchId,
        expiry: product.expiry,
        HSN : product.HSN,
        mrp: Number(product.mrp),
        quantity: Number(product.quantity) * Number(product.pack || 1) ,
        free: Number(product.free || 0),
        pack: Number(product.pack),
        purchaseRate: Number(product.purchaseRate),
        ptr: Number(product.ptr),
        schemeInput1: Number(product.schemeInput1 || 0),
        schemeInput2: Number(product.schemeInput2 || 0),
        discount: Number(product.discount || 0),
        gstPer: Number(product.gstPer),
        amount: Number(product.amount)
      }));

      const finalData = {
        invoiceType: 'PURCHASE',
        invoiceNumber: formData.invoiceNumber,
        partyName: formData.partyName,
        partyId : formData.partyId,
        invoiceDate: invoiceDate,
        paymentDueDate: dueDate,
        products: formattedProducts,
        withGst: formData.withGst === 'yes',
        grandTotal: amountData.grandTotal,
        
        // Additional schema fields
        gstSummary: {
          subtotal: amountData.subtotal,
          discountAmount: amountData.discountAmount,
          taxableAmount: amountData.taxable,
          gstAmount: amountData.gstAmount
        },
        
        // Default values
        paymentStatus: 'due',
        amountPaid: 0
      };

      const response = await fetch(`${Backend_URL}/api/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(finalData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save invoice');
      }

      const data = await response.json();
      toast({
        title: "Purchase invoice saved successfully",
        variant: "success"
      });
      dispatch(fetchItems());
      // Reset form
      setFormData({
        purchaseType: 'invoice',
        partyName: "",
        invoiceNumber: "",
        invoiceDate: "",
        paymentDueDate: "",
        withGst: 'yes',
        overallDiscount: ""
      });
      setInvoiceDate(null);
      setDueDate(null);
      setProducts([]);
      
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save invoice",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle distributor name input change
  const handleDistributorNameChange = (e) => {
    e.preventDefault();
    const value = e.target.value;
    
    // Open dialog if space is pressed or text is entered
    if (value.length === 1 && value === ' ') {
      setPartySelectDialog(true);
      return;
    }
    if (value.length > 0 && value[0] !== " ") {
      setPartyName(value);
      setPartySelectDialog(true);
    }
  };

  // Handle distributor selection from dialog
  const handleDistributorSelect = (distributor) => {
    setPartyName(distributor.name);
    setFormData({...formData, partyId : distributor._id, partyName : distributor.name});
    setPartySelectDialog(false);
  };

  const [invoiceDateOpen, setInvoiceDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  return (
    <div className=" relative rounded-lg h-[100vh] pt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChevronLeft className="w-5 h-5 text-rose-500 cursor-pointer" onClick={()=>navigate(-1)} />
          <h1 className="text-xl font-medium">Add Purchase</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-rose-500 text-rose-500">
            PTR, Column Settings
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
                onValueChange={(value)=> handleInputChange('purchaseType', value)} 
                className=" gap-4 mt-2"
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
                onValueChange={(value)=>handleInputChange('withGst', value)}
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
                placeholder='Type or Press space' 
              />
            </div>
            <div>
              <Label className="text-sm font-medium">
                INVOICE NO<span className="text-rose-500">*REQUIRED</span>
              </Label>
              <Input 
                value={formData?.invoiceNumber}
                onChange={(e)=>handleInputChange('invoiceNumber', e.target.value)}
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
                      {invoiceDate ? format(invoiceDate, "dd/MM/yyyy") : "Select Date"}
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
      <div className='my-4'>
        <PurchaseItemTable 
          inputRef={inputRef}
          products={products}
          setProducts={setProducts}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="mb-4 text-sm font-medium">OVERALL BILL DISCOUNT</h3>
            <div className="flex gap-4">
              <Input placeholder="Value" className="w-24" value={formData?.overallDiscount} onChange={(e)=>handleInputChange('overallDiscount', e.target.value)} />
              %
              <span className="px-2 py-1">OR</span>
              <Input 
                placeholder="₹ Value" 
                className="flex-1"
              />
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="mb-4 text-sm font-medium">CUSTOM CHARGE</h3>
            <div className="flex gap-4">
              <Input placeholder='Custom charge' />
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
            <div className="mb-1 text-gray-400">Total Products: {amountData?.productCount}</div>
            <div className="text-gray-400">Total Quantity: {amountData?.totalQuantity}</div>
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
    </div>
  )
}

