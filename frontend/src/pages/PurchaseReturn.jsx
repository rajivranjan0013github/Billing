import React from "react";
import { ArrowLeft, CirclePlus, Trash2, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { useState, useEffect } from "react";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import SelectPartyDialog from "../components/custom/pharmacy/SelectPartyDialog";
import SelectPurchaseItemDialog from "../components/custom/pharmacy/SelectPurchaseItemDialog";
import { useDispatch, useSelector } from 'react-redux';
import { createPurchaseBill } from '../redux/slices/PurchaseBillSlice';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import { Backend_URL } from "../assets/Data";
import { fetchParties } from "../redux/slices/partySlice";
import { calculateQuantityValue } from "../assets/utils";
const CreatePurchaseInvoice = () => {
  const [items, setItems] = useState([]);
  const [amountReceived, setAmountReceived] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isFullyPaid, setIsFullyPaid] = useState(false);
  const [isRoundOff, setIsRoundOff] = useState(false);
  const [showPartyDialog, setShowPartyDialog] = useState(false);  
  const [selectedParty, setSelectedParty] = useState(null);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const {toast} = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { createBillStatus } = useSelector((state) => state.bill);
  const [billNumber, setBillNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [originalBillNumber, setOriginalBillNumber] = useState("");
  const [oldBillData, setOldBillData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // fetch next bill number
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

  const fetchPurchaseBill = async (bill_number) => {
    try {
        setIsLoading(true);
        const response = await fetch(`${Backend_URL}/api/purchase/purchase-bill/${bill_number}`, { credentials: 'include' });
        const data = await response.json();
        setOldBillData(data);
    } catch (error) {
        console.error('Error fetching bill:', error);
    } finally {
        setIsLoading(false);
    }
  }

  const handleInputChange = (id, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          const price = parseFloat(updatedItem.pricePerItem) || 0;
          const subtotal = Number(calculateQuantityValue(updatedItem.qty, item.secondary_unit?.conversion_rate) * price).toFixed(2);
          
          const discountPercent = parseFloat(updatedItem.discount) || 0;
          const afterDiscount = Number((subtotal * (1 - discountPercent/100)).toFixed(2));
          
          const tax = parseFloat(updatedItem.tax) || 0;
          const taxAmount = Number(((afterDiscount * tax) / 100).toFixed(2));
          updatedItem.amount = Number((afterDiscount + taxAmount)).toFixed(2);
          return updatedItem;
        }
        return item;
      })  
    );
  };

  const calculateTotals = () => {
    return items.reduce(
      (acc, item) => {
        const qty = item.qty || "0";
        if (qty === "0") return acc;
        
        const rate = parseFloat(item.pricePerItem) || 0;
        const subtotal = Number(calculateQuantityValue(qty, item.secondary_unit?.conversion_rate) * rate).toFixed(2);
        
        const discountPercent = parseFloat(item.discount) || 0;
        const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
        const afterDiscount = Number((subtotal - discountAmount).toFixed(2));
        
        const taxPercent = parseFloat(item.tax) || 0;
        const taxAmount = Number(((afterDiscount * taxPercent) / 100).toFixed(2));
        
        return {
          subtotal: Number((Number(acc.subtotal) + Number(subtotal))).toFixed(2),
          discount: Number((Number(acc.discount) + discountAmount)).toFixed(2),
          taxableAmount: Number((Number(acc.taxableAmount) + afterDiscount)).toFixed(2),
          tax: Number((Number(acc.tax) + taxAmount)).toFixed(2),
          total: Number((Number(acc.total) + afterDiscount + taxAmount)).toFixed(2)
        };
      },
      { subtotal: 0, discount: 0, taxableAmount: 0, tax: 0, total: 0 }
    );
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

  const handlePartySelect = (party) => {
    setSelectedParty(party);
    setShowPartyDialog(false);
  };

  const handleItemSelect = (selectedItems) => {
    if (Array.isArray(selectedItems)) {
      setItems(prevItems => {
        const updatedItems = [...prevItems];
        
        selectedItems.forEach(selectedItem => {
          const existingItemIndex = updatedItems.findIndex(item => item._id === selectedItem._id);
          
          if (existingItemIndex !== -1) {
            // If item exists, update its quantity
            const newQty = selectedItem.qty.split(':').map(Number);
            const oldQty = updatedItems[existingItemIndex].qty.split(':').map(Number);
            if(!newQty.length) {
              return updatedItems;
            } else if(newQty.length === 1 && oldQty.length === 1) {
              updatedItems[existingItemIndex].qty = (oldQty[0] + newQty[0]).toString();
            } else {
              let arr = [0,0];
              const sum = (oldQty[1] || 0) + (newQty[1] || 0);
              arr[1] = sum % selectedItem.secondary_unit?.conversion_rate;
              arr[0] = (oldQty[0] || 0) + (newQty[0] || 0) + parseInt(sum / selectedItem.secondary_unit?.conversion_rate);
              updatedItems[existingItemIndex].qty = arr.join(':');
              // update the amount
              const subtotal = calculateQuantityValue(updatedItems[existingItemIndex].qty, selectedItem.secondary_unit?.conversion_rate) * parseFloat(updatedItems[existingItemIndex].pricePerItem);
              const discountPercent = parseFloat(updatedItems[existingItemIndex].discount) || 0;
              const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
              const afterDiscount = Number((subtotal - discountAmount).toFixed(2));
              const tax = parseFloat(updatedItems[existingItemIndex].tax) || 0;
              const taxAmount = Number(((afterDiscount * tax) / 100).toFixed(2));
              updatedItems[existingItemIndex].amount = Number((afterDiscount + taxAmount)).toFixed(2);
            }
          } else {
            // If item doesn't exist, add it as new
            let rate = 0;
            let tempRate = selectedItem.purchase_info.price_per_unit;
            let gst = selectedItem.gst_percentage;
            if(selectedItem.purchase_info.is_tax_included) {
              rate = tempRate / (1 + gst/100);
            } else {
              rate = tempRate;
            }

            updatedItems.push({
              id: updatedItems.length + 1,
              itemName: selectedItem.name,
              pack: selectedItem.pack,
              hsn: selectedItem.hsn_code,
              batchNo: "",
              expDate: "",
              qty: selectedItem.qty || "",
              pricePerItem: rate.toFixed(2),
              mrp: selectedItem.mrp || 0,
              secondary_unit: selectedItem.secondary_unit,
              discount: 0,
              discountAmount: 0,
              tax: selectedItem.gst_percentage || 0,
              amount: (calculateQuantityValue(selectedItem.qty, selectedItem.secondary_unit?.conversion_rate) * rate * (1 + (selectedItem.gst_percentage || 0) / 100)).toFixed(2),
              unit: selectedItem.unit,
              _id: selectedItem._id
            });
          }
        });
        
        return updatedItems;
      });
    }
  };

  const calculateTaxSummary = () => {
    const taxGroups = items.reduce((acc, item) => {
      const qty = item.qty || "0";
      if (qty === "0") return acc;

      const tax = parseFloat(item.tax) || 0;
      const rate = parseFloat(item.pricePerItem) || 0;
      const subtotal = Number(calculateQuantityValue(qty, item.secondary_unit?.conversion_rate || 1) * rate).toFixed(2);

      const discountPercent = parseFloat(item.discount) || 0;
      const taxableAmount = Number((subtotal * (1 - discountPercent/100)).toFixed(2));
      const sgst = Number((taxableAmount * (tax / 2) / 100).toFixed(2));
      const cgst = Number((taxableAmount * (tax / 2) / 100).toFixed(2));

      if (acc[tax]) {
        acc[tax].taxableAmount = Number((acc[tax].taxableAmount + taxableAmount).toFixed(2));
        acc[tax].sgst = Number((acc[tax].sgst + sgst).toFixed(2));
        acc[tax].cgst = Number((acc[tax].cgst + cgst).toFixed(2));
      } else {
        acc[tax] = {
          taxableAmount: taxableAmount,
          sgst: sgst,
          cgst: cgst
        };
      }
      return acc;
    }, {});

    return Object.entries(taxGroups)
      .sort(([rateA], [rateB]) => parseFloat(rateA) - parseFloat(rateB))
      .map(([rate, values]) => ({
        rate: parseFloat(rate),
        ...values
      }));
  };

  const handleDeleteItem = (itemId) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const handleSaveBill = async () => {
    if (items.length === 0) {
      toast({ title: 'Please add atleast one item', variant: 'destructive',});
      return;
    }

    if (!selectedParty) {
      toast({ title: 'Please select a supplier', variant: 'destructive',});
      return;
    }

    if(originalBillNumber === "") {
      toast({ title: 'Please enter original bill number', variant: 'destructive',});
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
        qty: calculateQuantityValue(item.qty, item.secondary_unit?.conversion_rate),
        secondary_unit: item.secondary_unit,
        unit: item.unit,
        mrp: parseFloat(item.mrp),
        purchasePrice: parseFloat(item.pricePerItem),
        discount: parseFloat(item.discount) || 0,
        tax: parseFloat(item.tax) || 0,
        hsn: item.hsn
      })),
      payment: {
        amount_paid: parseFloat(amountReceived) || 0,
        payment_method: paymentMethod
      },
      is_round_off: isRoundOff,
      grand_total: isRoundOff ? getRoundedTotal(totals.total) : totals.total,
      tax_summary: calculateTaxSummary()
    };

    dispatch(createPurchaseBill(purchaseBillData))
      .unwrap()
      .then((resultAction) => {
        toast({variant: 'success', title: 'Bill created successfully',});
        dispatch(fetchParties());
        navigate(`/purchase/${resultAction._id}`);
      })
      .catch((error) => {
        toast({variant: 'destructive', title: 'Something went wrong',});
      });
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
                  <th className="border border-gray-200 p-2 text-left text-sm w-24">Pack</th>
                  <th className="border border-gray-200 p-2 text-left text-sm w-24">HSN</th>
                  <th className="border border-gray-200 p-2 text-left text-sm w-24">MRP</th>
                  <th className="border border-gray-200 p-2 text-left text-sm w-24">Batch No</th>
                  <th className="border border-gray-200 p-2 text-left text-sm w-24">Expiry</th>
                  <th className="border border-gray-200 p-2 text-left text-sm w-28">Qty(Unit)</th>
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
                    <td className="border border-gray-200 p-2 text-sm">{item.pack || "_"}</td>
                    <td className="border border-gray-200 p-2 text-sm">{item.hsn}</td>
                    <td className="border border-gray-200 p-2 text-sm">
                      <Input
                        type="number"
                        value={item.mrp}
                        onChange={(e) =>
                          handleInputChange(
                            item.id,
                            "mrp",
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-20 h-7 px-2"
                        placeholder="0"
                      />
                    </td>
                    <td className="border border-gray-200 p-2 text-sm">{item.batchNo}</td>
                    <td className="border border-gray-200 p-2 text-sm">{item.expDate}</td>
                    <td className="border border-gray-200 p-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Input 
                          type="text" 
                          value={item.qty}  
                          onChange={(e) => handleInputChange(item.id, "qty", e.target.value)}  
                          className="w-16 h-7 px-2" 
                        />
                        <span className="text-gray-600 text-xs">{item.unit}</span>
                      </div>
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
                      ₹{(calculateQuantityValue(item.qty, item.secondary_unit?.conversion_rate) * (item.pricePerItem || 0)).toFixed(2)}
                    </td>
                    <td className="border border-gray-200 p-2 text-sm">
                      <div className="flex items-center">
                        <span className="bg-gray-100 border border-r-0 border-gray-200 rounded-l h-6 w-8 text-sm text-center">%</span>
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
                        />
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
                  <td colSpan={9} className="border border-gray-200 px-4 py-2 text-sm">
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
      <SelectPartyDialog open={showPartyDialog} onOpenChange={setShowPartyDialog} onSelectParty={handlePartySelect} />
      <SelectPurchaseItemDialog 
        open={showItemDialog} 
        onOpenChange={setShowItemDialog} 
        onSelectItem={handleItemSelect}
      />
    </div>
  );
};

export default CreatePurchaseInvoice;
