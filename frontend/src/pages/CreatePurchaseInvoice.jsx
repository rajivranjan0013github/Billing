
import { useState } from 'react'
import { Button } from "../components/ui/button"
import { Calendar } from "../components/ui/calendar"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover"
import { CalendarIcon, ChevronLeft, Film, Save } from 'lucide-react'
import { format } from "date-fns"
import { cn } from "../lib/utils"
import PurchaseItemTable from '../components/custom/purchase/PurchaseItemTable'

export default function PurchaseForm() {
  const [invoiceDate, setInvoiceDate] = useState();
  const [dueDate, setDueDate] = useState();
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState({
    purchaseType : 'invoice',
    partyName : "",
    invoiceNumber : "",
    invoiceDate : "",
    paymentDueDate : "",
    withGst : 'yes',
    overallDiscount : "", // in percentage
  });

  const [amountData, setAmountData] = useState({
    subtotal : 0,
    discount : 0,
    taxable : 0,
    gstAmount : 0,
    productCount : 0,
    totalQuantity : 0,
  });

  const handleInputChange = (field, value) => {
    setFormData(prev=>({...prev, [field] : value}));
  }

  return (
    <div className=" relative rounded-lg h-[100vh] pt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChevronLeft className="w-5 h-5 text-rose-500" />
          <h1 className="text-xl font-medium">Add Purchase</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-rose-500 text-rose-500">
            PTR, Column Settings
          </Button>
          <Button className="gap-2 bg-gray-800">
            <Save className="w-4 h-4" />
            Save (Alt + S)
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
                value={formData?.partyName || ""} 
                onChange={(e) => handleInputChange('partyName', e.target.value)}
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
                <Popover>
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
                      onSelect={setInvoiceDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-sm font-medium">PAYMENT DUE DATE</Label>
                <Popover>
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
                      onSelect={setDueDate}
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
        <PurchaseItemTable />
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
            <div className="mb-1 text-gray-400">Total Products: 2</div>
            <div className="text-gray-400">Total Quantity: 60</div>
          </div>
          <div>
            <div className="mb-1 text-gray-400">Subtotal</div>
            <div>₹915.00</div>
          </div>
          <div>
            <div className="mb-1 text-gray-400">(-) Discount</div>
            <div>₹27.45</div>
          </div>
          <div>
            <div className="mb-1 text-gray-400">Taxable</div>
            <div>₹887.55</div>
          </div>
          <div>
            <div className="mb-1 text-gray-400">(+) GST Amount</div>
            <div>₹76.97</div>
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
            <div>₹965.00</div>
          </div>
        </div>
    </div>
  )
}

