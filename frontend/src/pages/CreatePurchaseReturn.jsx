import React, { useEffect } from "react";
import { ArrowLeft, Save, CirclePlus, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { useState } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import SelectDistributorDlg from "../components/custom/distributor/SelectDistributorDlg";
import { Backend_URL } from "../assets/Data";
import { useToast } from "../hooks/use-toast";

const PurchaseReturn = () => {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [returnDate, setReturnDate] = useState(
    new Date()
      .toLocaleDateString("en-IN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .split("/")
      .reverse()
      .join("-")
  );
  console.log(returnDate);
  const [claimGSTInReturn, setClaimGSTInReturn] = useState(true);
  const [adjustRateForDisc, setAdjustRateForDisc] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [distributorSelectDialog, setdistributorSelectDialog] = useState(false);
  const [distributorName, setdistributorName] = useState("");
  const [formData, setFormData] = useState({
    distributorName: "",
    distributorId: "",
    invoiceNumber: "",
  });

  // Handle distributor name input change
  const handleDistributorNameChange = (e) => {
    e.preventDefault();
    const value = e.target.value;
    setdistributorName(value);

    // Only open dialog if space is pressed or text is entered (not on backspace/delete)
    if (value.length === 1) {
      if (value === " ") {
        setdistributorSelectDialog(true);
      } else if (value[0] !== " " && distributorName.length === 0) {
        setdistributorSelectDialog(true);
      }
    }
  };

  // Handle distributor selection from dialog
  const handleDistributorSelect = (distributor) => {
    setdistributorName(distributor.name);
    setFormData({
      ...formData,
      distributorId: distributor._id,
      distributorName: distributor.name,
    });
    setdistributorSelectDialog(false);
  };

  // Update handleInputChange to include calculations
  const handleInputChange = (id, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };

          // Recalculate effective purchase rate
          if (field === "pricePerItem" || field === "discount") {
            const purchaseRate =
              parseFloat(
                field === "pricePerItem" ? value : item.pricePerItem
              ) || 0;
            const discount =
              parseFloat(field === "discount" ? value : item.discount) || 0;
            updatedItem.effPurRate = adjustRateForDisc
              ? purchaseRate - (purchaseRate * discount) / 100
              : purchaseRate;
          }

          // Recalculate amount when qty, price, or effective rate changes
          if (
            field === "qty" ||
            field === "pricePerItem" ||
            field === "effPurRate" ||
            field === "pack"
          ) {
            const qty = parseFloat(field === "qty" ? value : item.qty) || 0;
            const pack = parseFloat(field === "pack" ? value : item.pack) || 1;
            const adjustedQty = qty;
            const effRate = parseFloat(updatedItem.effPurRate) || 0;
            const amount = effRate * adjustedQty;
            const gst = parseFloat(item.gst) || 0;
            const gstAmount = claimGSTInReturn ? (amount * gst) / 100 : 0;
            updatedItem.amount = amount.toFixed(2);
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  // Update handleSearch to directly set items
  const handleSearch = async () => {
    if (!formData.distributorId || !formData.invoiceNumber) {
      toast({
        title: "Please select distributor and enter invoice number",
        variant: "destructive",
      });
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `${Backend_URL}/api/purchase/search-by-invoice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            distributorId: formData.distributorId,
            invoiceNumber: formData.invoiceNumber,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch invoice details");
      }

      const data = await response.json();
      const { invoiceDetails, products } = data;

      // Update form data with invoice details
      setFormData((prev) => ({
        ...prev,
        invoiceId: invoiceDetails._id,
        distributorName: invoiceDetails.distributorName,
        distributorId: invoiceDetails.distributorId,
        invoiceNumber: invoiceDetails.invoiceNumber,
      }));

      // Directly format products into items structure
      const formattedItems = products.map((product, index) => {
        const effectivePurRate = adjustRateForDisc
          ? product.purchaseRate -
            (product.purchaseRate * (product.discount || 0)) / 100
          : product.purchaseRate;

        const adjustedQty = product.quantity / product.pack;
        const calculatedAmount = effectivePurRate * adjustedQty;
        const gstAmount = claimGSTInReturn
          ? (calculatedAmount * product.gstPer) / 100
          : 0;

        return {
          id: index + 1,
          inventoryId: product.inventoryId._id,
          itemName: product.productName,
          batchId: product.batchId,
          batchNo: product.batchNumber,
          pack: product.pack,
          expiry: product.expiry,
          mrp: product.mrp,
          qty: adjustedQty,
          pricePerItem: product.purchaseRate,
          discount: product.discount || 0,
          effPurRate: effectivePurRate,
          gst: product.gstPer,
          amount: calculatedAmount.toFixed(2),
        };
      });

      setItems(formattedItems);
    } catch (error) {
      toast({
        title: "Failed to search invoice",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // Update useEffect to recalculate when adjustRateForDisc changes
  useEffect(() => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        const purchaseRate = parseFloat(item.pricePerItem) || 0;
        const discount = parseFloat(item.discount) || 0;
        const effPurRate = adjustRateForDisc
          ? purchaseRate - (purchaseRate * discount) / 100
          : purchaseRate;

        const qty = parseFloat(item.qty) || 0;
        const pack = parseFloat(item.pack) || 1;
        const adjustedQty = qty / pack;
        const amount = effPurRate * adjustedQty;
        const gst = parseFloat(item.gst) || 0;
        const gstAmount = claimGSTInReturn ? (amount * gst) / 100 : 0;

        return {
          ...item,
          effPurRate,
          amount: (amount + gstAmount).toFixed(2),
        };
      })
    );
  }, [adjustRateForDisc, claimGSTInReturn]);

  const calculateTotals = () => {
    return items.reduce(
      (acc, item) => {
        const qty = parseFloat(item.qty) || 0;
        const rate = parseFloat(item.effPurRate) || 0;
        const amount = qty * rate;
        const gst = parseFloat(item.gst) || 0;
        const gstAmount = claimGSTInReturn ? (amount * gst) / 100 : 0;

        return {
          products: acc.products + 1,
          totalQuantity: acc.totalQuantity + qty,
          discount: acc.discount,
          taxableAmount: acc.taxableAmount + amount,
          cgstSgst: acc.cgstSgst + gstAmount,
          roundOff:
            Math.round((acc.total + amount + gstAmount) * 100) / 100 -
            (acc.total + amount + gstAmount),
          refundableAmt: acc.refundableAmt + amount + gstAmount,
          total: acc.total + amount + (claimGSTInReturn ? gstAmount : 0),
        };
      },
      {
        products: 0,
        totalQuantity: 0,
        discount: 0,
        taxableAmount: 0,
        cgstSgst: 0,
        roundOff: 0,
        refundableAmt: 0,
        total: 0,
      }
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        itemName: "",
        invoiceNo: "",
        invoiceDate: "",
        batchNo: "",
        pack: "",
        expiry: "",
        mrp: "",
        qty: "",
        pricePerItem: "",
        effPurRate: "",
        gst: "",
        amount: "0",
      },
    ]);
  };

  const handleDeleteItem = (id) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    if (!formData.distributorId || !formData.invoiceId || items.length === 0) {
      toast({
        title: "Please select distributor and enter invoice number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const totals = calculateTotals();
      // Format products data
      const formattedProducts = items.map((item) => ({
        inventoryId: item.inventoryId,
        batchId: item.batchId,
        productName: item.itemName,
        batchNumber: item.batchNo,
        expiry: item.expiry,
        HSN: item.HSN || "",
        mrp: parseFloat(item.mrp),
        quantity: parseFloat(item.qty) * parseFloat(item.pack), // Convert to base unit quantity
        pack: parseFloat(item.pack),
        purchaseRate: parseFloat(item.pricePerItem),
        discount: item.discount || 0,
        gstPer: parseFloat(item.gst),
        amount: parseFloat(item.amount),
        reason: item.reason || "other",
      }));

      // Format bill summary
      const billSummary = {
        subtotal: totals.taxableAmount,
        discountAmount: totals.discount,
        taxableAmount: totals.taxableAmount,
        gstAmount: totals.cgstSgst,
        totalQuantity: totals.totalQuantity,
        productCount: totals.products,
        grandTotal: totals.total,
        gstSummary: calculateGSTSummary(items),
      };

      const returnData = {
        returnDate,
        distributorId: formData.distributorId,
        originalInvoice: formData.invoiceId,
        originalInvoiceNumber: formData.invoiceNumber,
        originalInvoiceDate: formData.invoiceDate,
        products: formattedProducts,
        claimGSTInReturn,
        adjustRateForDisc,
        billSummary,
      };

      const response = await fetch(`${Backend_URL}/api/purchase/return`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(returnData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to create purchase return"
        );
      }

      const data = await response.json();
      toast({
        title: "Purchase return created successfully",
        variant: "success",
      });
      navigate("/purchase/return/list"); // Assuming this is the returns list page
    } catch (error) {
      toast({
        title: "Failed to create purchase return",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate GST summary
  const calculateGSTSummary = (items) => {
    const gstRates = [0, 5, 12, 18, 28];
    const summary = {};

    gstRates.forEach((rate) => {
      summary[rate] = {
        taxable: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 0,
      };
    });

    items.forEach((item) => {
      const gstRate = parseFloat(item.gst);
      const qty = parseFloat(item.qty);
      const rate = parseFloat(item.effPurRate);
      const amount = qty * rate;

      if (gstRates.includes(gstRate)) {
        summary[gstRate].taxable += amount;
        const gstAmount = (amount * gstRate) / 100;
        summary[gstRate].cgst += gstAmount / 2;
        summary[gstRate].sgst += gstAmount / 2;
        summary[gstRate].total += amount + gstAmount;
      }
    });

    return summary;
  };

  const totals = calculateTotals();

  return (
    <div className="relative rounded-lg h-[100vh] pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">Create Purchase Return</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={loading}>
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

      <div className="grid gap-4">
        {/* Top Section */}
        <div className="grid grid-cols-4 gap-4">
          {/* Left Section - Distributor */}
          <div className="col-span-3 border rounded-lg p-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-7">
                <Label className="text-sm font-medium mb-2 block">
                  DISTRIBUTOR
                </Label>
                <Input
                  type="text"
                  placeholder="Type or Press space"
                  value={distributorName}
                  onChange={handleDistributorNameChange}
                  className="w-full"
                />
              </div>
              <div className="col-span-3">
                <Label className="text-sm font-medium mb-2 block">
                  INVOICE NO
                </Label>
                <Input
                  type="text"
                  placeholder="Enter Invoice No."
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, invoiceNumber: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2 flex items-end">
                <Button
                  className="w-full h-10"
                  onClick={handleSearch}
                  disabled={searchLoading}
                >
                  {searchLoading ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Section - Return Info */}
          <div className="border rounded-lg p-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  RETURN DATE<span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="claim-gst"
                    checked={claimGSTInReturn}
                    onCheckedChange={setClaimGSTInReturn}
                  />
                  <Label htmlFor="claim-gst" className="text-sm">
                    Claim GST in Debit Note
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="adjust-rate"
                    checked={adjustRateForDisc}
                    onCheckedChange={setAdjustRateForDisc}
                  />
                  <Label htmlFor="adjust-rate" className="text-sm">
                    Adjust Rate for Disc, Scheme, Free Qty
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="w-full border-[1px] border-inherit py-4 rounded-sm space-y-2">
          {/* Table Headers */}
          <div className="grid grid-cols-12 w-full space-x-1 px-4">
            <div className="col-span-2">
              <p className="text-xs font-semibold">PRODUCT</p>
            </div>
            <div>
              <p className="text-xs font-semibold">BATCH NO</p>
            </div>
            <div>
              <p className="text-xs font-semibold">PACK</p>
            </div>
            <div>
              <p className="text-xs font-semibold">EXPIRY</p>
            </div>
            <div>
              <p className="text-xs font-semibold">MRP</p>
            </div>
            <div>
              <p className="text-xs font-semibold">QTY</p>
            </div>
            <div>
              <p className="text-xs font-semibold">PUR RATE</p>
            </div>
            <div>
              <p className="text-xs font-semibold">DISC %</p>
            </div>
            <div>
              <p className="text-xs font-semibold">EFF PUR RATE</p>
            </div>
            <div>
              <p className="text-xs font-semibold">GST</p>
            </div>
            <div>
              <p className="text-xs font-semibold">AMOUNT</p>
            </div>
            <div>
              <p className="text-xs font-semibold">ACTION</p>
            </div>
          </div>

          {/* Table Body */}
          <div className="w-full space-y-2 px-4">
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 w-full space-x-1">
                <div className="col-span-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) =>
                        handleInputChange(item.id, "itemName", e.target.value)
                      }
                      className="h-8 w-full border-[1px] border-gray-300 px-1 pl-7"
                    />
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    value={item.batchNo}
                    onChange={(e) =>
                      handleInputChange(item.id, "batchNo", e.target.value)
                    }
                    className="h-8 w-full border-[1px] border-gray-300 px-1"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={item.pack}
                    onChange={(e) =>
                      handleInputChange(item.id, "pack", e.target.value)
                    }
                    className="h-8 w-full border-[1px] border-gray-300 px-1"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={item.expiry}
                    onChange={(e) =>
                      handleInputChange(item.id, "expiry", e.target.value)
                    }
                    className="h-8 w-full border-[1px] border-gray-300 px-1"
                  />
                </div>
                <div>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={item.mrp}
                      onChange={(e) =>
                        handleInputChange(item.id, "mrp", e.target.value)
                      }
                      className="h-8 w-full border-[1px] border-gray-300 px-1 pl-5"
                    />
                  </div>
                </div>
                <div>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) =>
                      handleInputChange(item.id, "qty", e.target.value)
                    }
                    className="h-8 w-full border-[1px] border-gray-300 px-1"
                  />
                </div>
                <div>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={item.pricePerItem}
                      onChange={(e) =>
                        handleInputChange(
                          item.id,
                          "pricePerItem",
                          e.target.value
                        )
                      }
                      className="h-8 w-full border-[1px] border-gray-300 px-1 pl-5"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      value={item.discount}
                      onChange={(e) =>
                        handleInputChange(item.id, "discount", e.target.value)
                      }
                      className="h-8 w-16 border-[1px] border-gray-300 px-1 pr-5"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2">
                      %
                    </span>
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={item.effPurRate}
                      onChange={(e) =>
                        handleInputChange(item.id, "effPurRate", e.target.value)
                      }
                      className="h-8 w-full border-[1px] border-gray-300 px-1 pl-5"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      value={item.gst}
                      onChange={(e) =>
                        handleInputChange(item.id, "gst", e.target.value)
                      }
                      className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5"
                      readOnly
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2">
                      %
                    </span>
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2">
                      ₹
                    </span>
                    <input
                      type="text"
                      value={item.amount}
                      className="h-8 w-full border-[1px] border-gray-300 px-1 pl-5"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Item Button */}
          <div className="px-4 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleAddItem}
            >
              <CirclePlus size={16} /> Add Item
            </Button>
          </div>
        </div>

        {/* Additional Options */}
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <Label className="text-sm font-medium mb-4 block">DISCOUNT</Label>
            <div className="flex gap-4">
              <Input placeholder="Value" className="w-24" />
              <span className="flex items-center">%</span>
              <span className="flex items-center px-2">OR</span>
              <Input placeholder="₹ Value" className="flex-1" />
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <Label className="text-sm font-medium mb-4 block">
              REFUNDABLE AMOUNT
            </Label>
            <Input placeholder="₹ Value" />
          </div>
          <div className="flex items-center justify-center p-4 border rounded-lg">
            <div className="text-center">
              <div className="mb-1">Click on Save to Process Return</div>
              <div className="text-sm text-muted-foreground">
                Use 'Alt+S' Key
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 w-[calc(100%-200px)] grid grid-cols-8 gap-4 p-4 text-sm text-white bg-gray-800 rounded-lg">
        <div>
          <div className="mb-1 text-gray-400">
            Total Products: {totals.products}
          </div>
          <div className="text-gray-400">
            Total Quantity: {totals.totalQuantity}
          </div>
        </div>
        <div>
          <div className="mb-1 text-gray-400">Taxable</div>
          <div>₹{totals.taxableAmount.toFixed(2)}</div>
        </div>
        <div>
          <div className="mb-1 text-gray-400">(-) Discount</div>
          <div>₹{totals.discount.toFixed(2)}</div>
        </div>
        <div>
          <div className="mb-1 text-gray-400">(+) GST Amount</div>
          <div>₹{totals.cgstSgst.toFixed(2)}</div>
        </div>
        <div>
          <div className="mb-1 text-gray-400">Round Off</div>
          <div>₹{totals.roundOff.toFixed(2)}</div>
        </div>
        <div>
          <div className="mb-1 text-gray-400">Refundable Amt</div>
          <div>₹{totals.refundableAmt.toFixed(2)}</div>
        </div>
        <div>
          <div className="mb-1 text-gray-400">Balance</div>
          <div>₹{totals.total.toFixed(2)}</div>
        </div>
        <div className="bg-rose-500 -m-4 p-4 rounded-r-lg">
          <div className="mb-1">Total Amount</div>
          <div>₹{totals.total.toFixed(2)}</div>
        </div>
      </div>

      {/* Add SelectDistributorDlg */}
      <SelectDistributorDlg
        open={distributorSelectDialog}
        setOpen={setdistributorSelectDialog}
        search={distributorName}
        setSearch={setdistributorName}
        onSelect={handleDistributorSelect}
      />
    </div>
  );
};

export default PurchaseReturn;
