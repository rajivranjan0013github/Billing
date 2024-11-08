import React from "react";
import { ArrowLeft, CirclePlus, Trash2, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { useState, useEffect } from "react";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import SelectPartyDialog from "../components/custom/pharmacy/SelectPartyDialog";
import SelectItemDialog from "../components/custom/pharmacy/SelectItemDialog";
import { useDispatch, useSelector } from 'react-redux';
import { createPurchaseBill } from '../redux/slices/PurchaseBillSlice';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import { Backend_URL } from "../assets/Data";

const DiscountInputs = ({ billDiscountPercent, billDiscountAmount, handleBillDiscountChange, handleRemoveDiscount}) => (
  <div className="flex items-center gap-2">
    <div className="flex items-center">
      <span className="bg-gray-100 border border-r-0 border-gray-200 rounded-l h-7 w-8 text-sm flex items-center justify-center">%</span>
      <Input
        type="number"
        value={billDiscountPercent === 0 ? "" : billDiscountPercent}
        onChange={(e) => handleBillDiscountChange("percent", e.target.value)}
        className="w-16 h-7 rounded-l-none text-sm"
        placeholder="0"
      />
    </div>
    <div className="flex items-center">
      <span className="bg-gray-100 border border-r-0 border-gray-200 rounded-l h-7 w-8 text-sm flex items-center justify-center">₹</span>
      <Input
        type="number"
        value={billDiscountAmount === 0 ? "" : billDiscountAmount}
        onChange={(e) => handleBillDiscountChange("amount", e.target.value)}
        className="w-20 h-7 rounded-l-none text-sm"
        placeholder="0"
      />
    </div>
    <X size={18} className="cursor-pointer text-gray-500 hover:text-gray-700" onClick={handleRemoveDiscount} />
  </div>
);

const CreatePurchaseInvoice = () => {
  const [items, setItems] = useState([]);
  const [amountReceived, setAmountReceived] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isFullyPaid, setIsFullyPaid] = useState(false);
  const [isRoundOff, setIsRoundOff] = useState(false);
  const [showBillDiscount, setShowBillDiscount] = useState(false);
  const [billDiscountPercent, setBillDiscountPercent] = useState(0);
  const [billDiscountAmount, setBillDiscountAmount] = useState(0);
  const [isCashCustomer, setIsCashCustomer] = useState(false);
  const [showPartyDialog, setShowPartyDialog] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDiscountType, setPendingDiscountType] = useState(null);
  const {toast} = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { createBillStatus } = useSelector((state) => state.bill);
  const [billNumber, setBillNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [originalBillNumber, setOriginalBillNumber] = useState("");

  useEffect(() => {
    const fetchNextBillNumber = async () => {
      try {
        const response = await fetch(`${Backend_URL}/api/purchase/next-bill-number`, { 
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.nextBillNumber) {
          setBillNumber(data.nextBillNumber);
        } else {
          throw new Error(data.message || "Failed to get next bill number");
        }
      } catch (error) {
        console.error('Error fetching bill number:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to get bill number. Please refresh the page or contact support."
        });
      }
    };

    fetchNextBillNumber();
  }, [toast]);

  const handleInputChange = (id, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // Ensure we're working with numbers
          const qty = parseFloat(updatedItem.qty) || 0;
          const price = parseFloat(updatedItem.pricePerItem) || 0;
          const subtotal = qty * price;
          // Calculate discount
          if (field === "discountAmount") {
            updatedItem.discount = subtotal > 0 ? (value / subtotal) * 100 : 0;
          } else if (field === "discount") {
            updatedItem.discountAmount = (subtotal * value) / 100;
          }
          // Calculate final amount
          const discountAmount = parseFloat(updatedItem.discountAmount) || 0;
          const afterDiscount = subtotal - discountAmount;
          const tax = parseFloat(updatedItem.tax) || 0;
          const taxAmount = (afterDiscount * tax) / 100;
          updatedItem.amount = afterDiscount + taxAmount;
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Update the calculateTotals function
  const calculateTotals = () => {
    // First calculate item-level totals
    const itemTotals = items.reduce(
      (acc, item) => {
        const qty = parseFloat(item.qty) || 0;
        // Skip calculations if quantity is zero or undefined
        if (qty <= 0) return acc;
        
        const rate = parseFloat(item.pricePerItem) || 0;
        const subtotal = qty * rate;
        
        // Calculate item discount
        const discountPercent = parseFloat(item.discount) || 0;
        const itemDiscountAmount = (subtotal * discountPercent) / 100;
        
        // Calculate amount after item discount
        const afterItemDiscount = subtotal - itemDiscountAmount;
        
        // Calculate tax
        const taxPercent = parseFloat(item.tax) || 0;
        const taxAmount = (afterItemDiscount * taxPercent) / 100;
        
        // Calculate item total
        const itemTotal = afterItemDiscount + taxAmount;

        return {
          subtotal: acc.subtotal + subtotal,
          discount: acc.discount + itemDiscountAmount,
          taxableAmount: acc.taxableAmount + afterItemDiscount,
          tax: acc.tax + taxAmount,
          total: acc.total + itemTotal
        };
      },
      { subtotal: 0, discount: 0, taxableAmount: 0, tax: 0, total: 0 }
    );

    // Then apply bill-level discount if it exists
    if (showBillDiscount && billDiscountAmount > 0) {
      const afterBillDiscount = itemTotals.subtotal - billDiscountAmount;
      const totalTaxRate = 0.12; // 12% (CGST 6% + SGST 6%)
      const totalTaxAmount = afterBillDiscount * totalTaxRate;

      return {
        ...itemTotals,
        billDiscount: billDiscountAmount,
        taxableAmount: afterBillDiscount,
        tax: totalTaxAmount,
        total: afterBillDiscount + totalTaxAmount
      };
    }

    // If no bill discount, return item totals as is
    return {...itemTotals, billDiscount: 0};
  };

  const handleFullyPaidChange = (checked) => {
    setIsFullyPaid(checked);
    if (checked) {
      const total = calculateTotals().total;
      setAmountReceived(isRoundOff ? getRoundedTotal(total) : total);
    }
  };

  const getRoundedTotal = (total) => {
    return Math.round(total);
  };

  const handleBillDiscountChange = (type, value) => {
    const subtotal = calculateTotals().subtotal;
    const numValue = value === "" ? 0 : parseFloat(value);

    if (type === "percent") {
      setBillDiscountPercent(value); // Keep the raw value for empty input
      setBillDiscountAmount((subtotal * numValue) / 100 || 0);
    } else {
      setBillDiscountAmount(value); // Keep the raw value for empty input
      setBillDiscountPercent((numValue / subtotal) * 100 || 0);
    }
  };

  const handleRemoveDiscount = () => {
    setShowBillDiscount(false);
    setBillDiscountPercent(0);
    setBillDiscountAmount(0);
  };

  // Add this function to check if any items have discounts
  const hasItemDiscounts = () => {
    return items.some((item) => item.discount > 0 || item.discountAmount > 0);
  };

  // Modify handleAddDiscount to handle the logic
  const handleAddDiscount = () => {
    if (hasItemDiscounts()) {
      // Show warning that adding additional discount will clear item discounts
      setPendingDiscountType("beforeTax");
      setShowConfirmDialog(true);
    } else {
      setShowBillDiscount(true);
    }
  };

  // Add function to clear all item discounts
  const clearItemDiscounts = () => {
    setItems((prevItems) =>
      prevItems.map((item) => ({
        ...item,
        discount: 0,
        discountAmount: 0,
        amount: item.qty * item.pricePerItem * (1 + item.tax / 100), // Recalculate amount without discount
      }))
    );
  };

  // Add this function to handle confirmation
  const handleConfirmDiscountChange = () => {
    if (pendingDiscountType) {
      clearItemDiscounts();
      setShowBillDiscount(true);
      setPendingDiscountType(null);
    }
    setShowConfirmDialog(false);
  };

  // Add this effect to distribute bill discount to items when before-tax discount is applied
  useEffect(() => {
    if (
      showBillDiscount &&
      billDiscountPercent > 0
    ) {
      // Distribute the discount proportionally to all items
      setItems((prevItems) =>
        prevItems.map((item) => {
          const itemSubtotal = item.qty * item.pricePerItem;
          const itemDiscountAmount = (itemSubtotal * billDiscountPercent) / 100;
          return {
            ...item,
            discount: billDiscountPercent,
            discountAmount: itemDiscountAmount,
            amount: (itemSubtotal - itemDiscountAmount) * (1 + item.tax / 100),
          };
        })
      );
    }
  }, [billDiscountPercent, showBillDiscount]);

  const handlePartySelect = (party) => {
    setSelectedParty(party);
    setShowPartyDialog(false);
  };

  const handleItemSelect = (selectedItems) => {
    // If it's an array, process all items
    if (Array.isArray(selectedItems)) {
      setItems(prevItems => {
        const updatedItems = [...prevItems];
        
        selectedItems.forEach(selectedItem => {
          // Check if item already exists in the list
          const existingItemIndex = updatedItems.findIndex(item => item._id === selectedItem._id);
          
          if (existingItemIndex !== -1) {
            // If item exists, update its quantity
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              qty: (updatedItems[existingItemIndex].qty || 0) + (selectedItem.qty || 1)
            };
          } else {
            // If item doesn't exist, add it as new
            updatedItems.push({
              id: updatedItems.length + 1,
              itemName: selectedItem.name,
              hsn: selectedItem.hsn_code,
              batchNo: "",
              expDate: "",
              qty: selectedItem.qty || 1,
              pricePerItem: selectedItem.sales_info?.price_per_unit || 0,
              discount: 0,
              discountAmount: 0,
              tax: selectedItem.gst_percentage || 0,
              amount: (selectedItem.sales_info?.price_per_unit || 0) * (selectedItem.qty || 1) * (1 + (selectedItem.gst_percentage || 0) / 100),
              unit: selectedItem.unit,
              _id: selectedItem._id
            });
          }
        });
        
        return updatedItems;
      });
    }
  };

  // Add this function to calculate tax summary
  const calculateTaxSummary = () => {
    // Group items by tax rate
    const taxGroups = items.reduce((acc, item) => {
      const qty = parseFloat(item.qty) || 0;
      if (qty <= 0) return acc;

      const tax = parseFloat(item.tax) || 0;
      const rate = parseFloat(item.pricePerItem) || 0;
      const subtotal = qty * rate;
      const itemDiscount = subtotal * (parseFloat(item.discount) || 0) / 100;
      const taxableAmount = subtotal - itemDiscount;

      // If this tax rate already exists, add to it
      if (acc[tax]) {
        acc[tax].taxableAmount += taxableAmount;
        acc[tax].sgst += (taxableAmount * (tax / 2)) / 100;
        acc[tax].cgst += (taxableAmount * (tax / 2)) / 100;
      } else {
        // Create new entry for this tax rate
        acc[tax] = {
          taxableAmount: taxableAmount,
          sgst: (taxableAmount * (tax / 2)) / 100,
          cgst: (taxableAmount * (tax / 2)) / 100
        };
      }
      return acc;
    }, {});

    // Convert to array and sort by tax rate
    return Object.entries(taxGroups)
      .sort(([rateA], [rateB]) => parseFloat(rateA) - parseFloat(rateB))
      .map(([rate, values]) => ({
        rate: parseFloat(rate),
        ...values
      }));
  };

  // Add this new function after other state declarations
  const handleDeleteItem = (itemId) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  // Add this function to handle cash customer toggle
  const handleCashCustomerChange = (checked) => {
    if (!checked && !selectedParty) {
      setShowPartyDialog(true);
      return;
    }
    setIsCashCustomer(checked);
  };

  const handleSaveBill = async () => {
    if (items.length === 0) {
      toast({ title: 'Error', description: 'Please add at least one item to the bill', variant: 'destructive',});
      return;
    }

    if (!selectedParty) {
      toast({ title: 'Error', description: 'Please select a supplier', variant: 'destructive',});
      return;
    }

    const totals = calculateTotals();
    const purchaseBillData = {
      supplier: selectedParty._id,
      supplier_name: selectedParty.name,
      supplier_invoice_number: originalBillNumber,
      items: items.map(item => ({
        _id: item._id,
        batchNo: item.batchNo,
        expDate: item.expDate,
        qty: parseFloat(item.qty),
        unit: item.unit,
        mrp: parseFloat(item.mrp),
        purchasePrice: parseFloat(item.pricePerItem),
        discount: parseFloat(item.discount) || 0,
        tax: parseFloat(item.tax) || 0,
        hsn: item.hsn
      })),
      bill_discount: parseFloat(billDiscountAmount) || 0,
      payment: {
        amount_paid: parseFloat(amountReceived) || 0,
        payment_method: paymentMethod
      },
      is_round_off: isRoundOff,
      grand_total: isRoundOff ? getRoundedTotal(totals.total) : totals.total,
      tax_summary: calculateTaxSummary()
    };

    try {
      const resultAction = await dispatch(createPurchaseBill(purchaseBillData)).unwrap();
      toast({variant: 'success', title: 'Success', description: 'Purchase bill created successfully',});
      navigate(`/purchase/${resultAction._id}`);
    } catch (error) {
      toast({variant: 'destructive', title: 'Error', description: error.message || 'Failed to create purchase bill',});
    }
  };

  return (
    <div className="w-full mt-2">
      {/* header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ArrowLeft className="cursor-pointer" onClick={() => navigate(-1)} />
          <span>Create Purchase Invoice</span>
        </div>
        <div className=" flex gap-2">
          <Button  variant="outline"  size="sm"  onClick={handleSaveBill} disabled={createBillStatus === 'loading'}>
            {createBillStatus === 'loading' ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="outline" size="sm">Settings</Button>
        </div>
      </div>
      {/* body */}
      <div className="mt-2 border border-gray-200 rounded-md">
        <div className="grid grid-cols-3 divide-x divide-gray-200 border-b border-gray-200">
          <div className=" col-span-2">
            <div className="border-b border-gray-200 p-2 flex justify-between items-center">
              <div>Supplier</div>
              <div className="flex items-center gap-4">
                {selectedParty && (
                  <Button variant="outline" size="sm" className="h-6 text-blue-600" onClick={() => setShowPartyDialog(true)}>
                    Change Supplier
                  </Button>
                )}
              </div>
            </div>
            <div className="p-4">
              {selectedParty ? (
                <div className="space-y-2">
                  <div className="font-medium text-lg">{selectedParty?.name}</div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Phone:</span>
                      <span>{selectedParty?.mobile_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Address:</span>
                      <span>{selectedParty?.billing_address}</span>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">GSTIN:</span>
                        <span>{selectedParty?.gstin}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">State:</span>
                        <span>{selectedParty?.state}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setShowPartyDialog(true)}
                  className="cursor-pointer p-6 border border-dashed border-gray-200 rounded-md w-40">
                  <div className="flex items-center justify-center h-full text-primary">+Add Supplier</div>
                </div>
              )}
            </div>
          </div>

          <div className=" p-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div>Invoice No.</div>
                <Input 
                  type="text" 
                  value={billNumber || 'Loading...'} 
                  className="w-40" 
                  readOnly 
                  disabled={!billNumber}
                />
              </div>
              
              <div>
                <div>Invoice Date</div>
                <Input 
                  type="date" 
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
              <div>
                <div>Original Bill No.</div>
                <Input 
                  type="text" 
                  value={originalBillNumber}
                  onChange={(e) => setOriginalBillNumber(e.target.value)}
                  className="w-40"
                  placeholder="Enter supplier bill no."
                />
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="overflow-x-auto p-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-2 text-left text-sm w-12">No.</th>
                  <th className="border border-gray-200 p-2 text-left text-sm w-48">Item Name</th>
                  <th className="border border-gray-200 p-2 text-left text-sm w-24">HSN</th>
                  <th className="border border-gray-200 p-2 text-left text-sm w-24">Batch No</th>
                  <th className="border border-gray-200 p-2 text-left text-sm w-24">Expiry</th>
                  <th className="border border-gray-200 p-2 text-left text-sm w-20">Qty</th>
                  <th className="border border-gray-200 p-2 text-left text-sm w-28">Rate(₹)</th>
                  <th className="border border-gray-200 p-2 text-left text-sm w-28">Amount(₹)</th>
                  <th className="border border-gray-200 p-2 text-left text-sm w-24">Discount</th>
                  <th className="border border-gray-200 p-2 text-left text-sm w-20">GST(%)</th>
                  <th className="border border-gray-200 p-2 text-left text-sm w-28">Total(₹)</th>
                  <th className="border border-gray-200 p-2 text-left text-sm w-12"><CirclePlus /></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 p-2 text-sm">{item.id}</td>
                    <td className="border border-gray-200 p-2 text-sm">{item.itemName}</td>
                    <td className="border border-gray-200 p-2 text-sm">{item.hsn}</td>
                    <td className="border border-gray-200 p-2 text-sm">{item.batchNo}</td>
                    <td className="border border-gray-200 p-2 text-sm">{item.expDate}</td>
                    <td className="border border-gray-200 p-2 text-sm">
                      <Input type="number" value={item.qty}  onChange={(e) =>  handleInputChange(item.id, "qty",  parseFloat(e.target.value)) }  className="w-16 h-7 px-2" />
                    </td>
                    <td className="border border-gray-200 p-2 text-sm">
                      <Input
                        type="number"
                        value={item.pricePerItem}
                        onChange={(e) =>
                          handleInputChange(
                            item.id,
                            "pricePerItem",
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-20 h-7 px-2"
                        placeholder="0"
                      />
                    </td>
                    <td className="border border-gray-200 p-2 text-sm">
                      ₹{((item.qty || 0) * (item.pricePerItem || 0)).toLocaleString("en-IN", {minimumFractionDigits: 2})}
                    </td>
                    <td className="border border-gray-200 p-2 text-sm">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center">
                          <span className="bg-gray-100 border border-r-0 border-gray-200 rounded-l h-6 w-8 text-sm text-center"> %</span>
                          <Input
                            type="number"
                            value={item.discount}
                            onChange={(e) =>
                              handleInputChange(
                                item.id,
                                "discount",
                                parseFloat(e.target.value)
                              )
                            }
                            className="w-16 h-6 px-2 rounded-l-none"
                            placeholder="0"
                            disabled={
                              showBillDiscount && billDiscountPercent > 0
                            }
                          />
                        </div>
                        <div className="flex items-center">
                          <span className="bg-gray-100 border border-r-0 border-gray-200 rounded-l h-6 w-8 text-sm text-center">₹</span>
                          <Input
                            type="number"
                            value={item.discountAmount}
                            onChange={(e) =>
                              handleInputChange(
                                item.id,
                                "discountAmount",
                                parseFloat(e.target.value)
                              )
                            }
                            className="w-16 h-6 px-2 rounded-l-none"
                            placeholder="0"
                            disabled={
                              showBillDiscount && billDiscountPercent > 0
                            }
                          />
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-200 p-2 text-sm">
                      <Input
                        type="number"
                        value={item.tax}
                        onChange={(e) =>
                          handleInputChange(
                            item.id,
                            "tax",
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-16 h-7 px-2"
                        placeholder="0"
                      />
                    </td>
                    <td className="border border-gray-200 p-2 text-sm">
                      ₹{item.amount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="border border-gray-200 p-2 text-sm">
                      <Trash2 className="cursor-pointer hover:text-red-500" onClick={() => handleDeleteItem(item.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={7} className="border border-gray-200 px-4 py-2 text-sm">
                    <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => setShowItemDialog(true)}>
                      <CirclePlus size={16} /> Add Item
                    </Button>
                  </td>
                  <td colSpan={0} className="border border-gray-200 px-4 py-2 text-sm font-semibold text-right">
                    ₹{calculateTotals().subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-sm font-semibold text-right">
                    ₹{calculateTotals().discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-sm font-semibold text-right">
                    ₹{calculateTotals().tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2} className="border border-gray-200 px-4 py-2 text-sm font-semibold text-right">
                    ₹{calculateTotals().total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="grid grid-cols-2 border-t border-gray-200">
            <div className="border-r border-gray-200">
              <table className=" text-sm w-1/2 m-4">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 text-left font-medium">Tax Rate</th>
                    <th className="py-2 text-right font-medium">Taxable Amt</th>
                    <th className="py-2 text-right font-medium">SGST</th>
                    <th className="py-2 text-right font-medium">CGST</th>
                  </tr>
                </thead>
                <tbody>
                  {calculateTaxSummary().map((group) => (
                    <tr key={group.rate} className="border-b border-gray-200">
                      <td className="py-2 text-left">{group.rate}%</td>
                      <td className="py-2 text-right">₹{group.taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 text-right">₹{group.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 text-right">₹{group.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  <tr className="font-medium">
                    <td className="py-2 text-left">Total</td>
                    <td className="py-2 text-right">₹{calculateTotals().taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 text-right">₹{(calculateTotals().tax / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 text-right">₹{(calculateTotals().tax / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="w-full py-4">
              <div className="px-8 space-y-2">
                {/* Discount Section - Always at Top */}
                {!showBillDiscount ? (
                  <div className="flex justify-between items-center">
                    <div className="cursor-pointer text-sm text-primary" onClick={handleAddDiscount}>+Add Discount</div>
                    <div>-₹ 0</div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Additional Discount</span>
                    </div>
                    <DiscountInputs
                      billDiscountPercent={billDiscountPercent}
                      billDiscountAmount={billDiscountAmount}
                      handleBillDiscountChange={handleBillDiscountChange}
                      handleRemoveDiscount={handleRemoveDiscount}
                    />
                  </div>
                )}

                <div className="flex justify-between">
                  <div className="cursor-pointer text-sm text-primary">+Add Additional Charges</div>
                  <div>-₹ 0</div>
                </div>
              </div>
              <div className="px-8 flex flex-col gap-2 border-t border-gray-200 pt-2 mt-2">
                <div className="flex items-center gap-1">
                  <Checkbox checked={isRoundOff} onCheckedChange={setIsRoundOff} id="round-off" />
                  <label htmlFor="round-off" className="text-sm text-gray-600 cursor-pointer">Round off</label>
                </div>
                <div className="flex justify-between items-center font-semibold">
                  <span>Grand Total</span>
                  <span>
                    ₹{(isRoundOff ? getRoundedTotal(calculateTotals().total) : calculateTotals().total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="px-8 flex flex-col gap-2 border-t border-gray-200 pt-2 mt-2">
                <div className="flex items-center gap-2 self-end">
                  <Checkbox checked={isFullyPaid} onCheckedChange={handleFullyPaidChange} id="fully-paid"/>
                  <label htmlFor="fully-paid" className="text-sm text-gray-600 cursor-pointer">Mark as fully paid</label>
                </div>
                <div className="flex justify-between items-center">
                  <span>Amount Received</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <span className="bg-gray-100 border border-r-0 border-gray-200 rounded-l h-8 w-8 text-sm flex items-center justify-center">₹</span>
                      <Input
                        type="number"
                        value={amountReceived}
                        onChange={(e) =>
                          setAmountReceived(parseFloat(e.target.value))
                        }
                        className="w-28 h-8 rounded-l-none"
                        placeholder="0.00"
                      />
                    </div>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="w-28 h-8">
                        <SelectValue placeholder="Payment Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Additional Discount</DialogTitle>
            <DialogDescription>
              Applying additional discount will clear all item-level discounts.
              Do you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button onClick={handleConfirmDiscountChange}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <SelectPartyDialog open={showPartyDialog} onOpenChange={setShowPartyDialog} onSelectParty={handlePartySelect} />
      <SelectItemDialog 
        open={showItemDialog} 
        onOpenChange={setShowItemDialog} 
        onSelectItem={handleItemSelect}
        mode="purchase"
      />
    </div>
  );
};

export default CreatePurchaseInvoice;
