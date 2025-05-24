import React, { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../ui/sheet";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useToast } from "../../../hooks/use-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import ProductSelector from "./SelectInventory";
import { Backend_URL } from "../../../assets/Data";
import {  setItemStatusIdle } from "../../../redux/slices/inventorySlice";

const INITIAL_FORM_DATA = {
  inventoryId: "",
  batchNumber: "",
  expiryMonth: "",
  expiryYear: "",
  mrp: "",
  HSN: "",
  gstPer: "",
  purchaseRate: "",
  purchaseGstType: "Excl gst",
  saleRate: "",
  saleGstType: "Incl gst",
  pack: "",
  packs: "",
  loose: "",
};

// Input keys in order of navigation
const inputKeys = [
  'productName',
  'batchNumber',
  'expiryMonth',
  'expiryYear',
  'mrp',
  'HSN',
  'gstPer',
  'purchaseRate',
  'purchaseGstType',
  'saleRate',
  'saleGstType',
  'pack',
  'packs',
  'loose',
  'submitButton'
];

export default function ManageInventory({
  open,
  onOpenChange,
  inventoryDetails,
  setItemDetails,
  batchDetails,
  setUpdateBatchDetails,
}) {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const inputRef = useRef([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  useEffect(() => {
    if (inventoryDetails && open) {
      setFormData({ ...formData, inventoryId: inventoryDetails?._id, pack: inventoryDetails?.pack || "" });
      setProductSearch(inventoryDetails?.name);
      setTimeout(() => {
        if (inputRef?.current?.['batchNumber']) {
          inputRef.current['batchNumber'].focus();
        }
      }, 100);
    } else {
      setTimeout(() => {
        if (inputRef?.current?.['productName']) {
          inputRef.current['productName'].focus();
        }
      }, 100);
    }
  }, [inventoryDetails, open]);

  // Update useEffect to handle batch editing
  useEffect(() => {
    if (batchDetails && open) {
      setFormData({
        inventoryId: batchDetails?.inventoryId,
        batchNumber: batchDetails?.batchNumber,
        expiryMonth: batchDetails?.expiry?.split("/")?.[0],
        expiryYear: batchDetails?.expiry?.split("/")?.[1],
        mrp: batchDetails?.mrp,
        HSN: batchDetails?.HSN,
        gstPer: batchDetails?.gstPer,
        purchaseRate: batchDetails?.purchaseRate,
        purchaseGstType: "Excl gst",
        saleRate: batchDetails?.saleRate,
        saleGstType: "Incl gst",
        pack: batchDetails?.pack,
        packs: Math.floor(
          Number(batchDetails?.quantity) / Number(batchDetails?.pack || 1)
        ),
        loose: Number(batchDetails?.quantity) % Number(batchDetails?.pack || 1),
      });
      // Set product name if inventoryDetails is available
      if (inventoryDetails) {
        setProductSearch(inventoryDetails?.name);
      }
    }
  }, [batchDetails, open]);

  useEffect(() => {
    if (!open) {
      setFormData(INITIAL_FORM_DATA);
      setProductSearch("");
      if (setUpdateBatchDetails) {
        setUpdateBatchDetails(null);
      }
    }
  }, [open, setUpdateBatchDetails]);

  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleKeyDown = (e, currentKey) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentIndex = inputKeys.indexOf(currentKey);
      
      // Check if current element is a select trigger
      const isSelect = ['gstPer', 'purchaseGstType', 'saleGstType'].includes(currentKey);
      
      if (isSelect) {
        // Trigger click on the select to open it
        const selectEl = inputRef.current[currentKey];
        if (selectEl) {
          selectEl.click();
        }
        return;
      }

      if (e.shiftKey) {
        // Move to previous input on Shift+Enter
        if (currentIndex > 0) {
          const prevKey = inputKeys[currentIndex - 1];
          inputRef.current[prevKey]?.focus();
        }
      } else {
        // Move to next input on Enter
        if (currentIndex < inputKeys.length - 1) {
          const nextKey = inputKeys[currentIndex + 1];
          inputRef.current[nextKey]?.focus();
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if(!formData.batchNumber) {
      toast({title : 'Enter batch number', variant : 'destructive'});
      return;
    } 
    if (isProductSelectorOpen) return;

    const expiry = `${formData.expiryMonth}/${formData.expiryYear}`;

    const purchaseRate = formData.purchaseGstType === "Excl gst" ? formData.purchaseRate : formData.purchaseRate / (1 + formData.gstPer / 100);

    const saleRate = formData.saleGstType === "Excl gst"  ? formData.saleRate * (1+formData.gstPer/100)  : formData.saleRate;

    const quantity = Number(formData.packs) * Number(formData.pack) + Number(formData.loose);
    const finalFormData = {
      inventoryId: formData.inventoryId,
      batchNumber: formData.batchNumber,
      expiry,
      mrp: Number(formData.mrp),
      HSN: formData.HSN,
      gstPer: Number(formData.gstPer),
      purchaseRate: Number(parseFloat(purchaseRate).toFixed(2)),
      saleRate: Number(parseFloat(saleRate).toFixed(2)),
      pack: parseInt(formData.pack),
      quantity,
    };

    // Add batch ID if editing existing batch
    if (batchDetails?._id) {
      finalFormData._id = batchDetails._id;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${Backend_URL}/api/inventory/manage-batch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalFormData),
          credentials: "include",
        }
      );
      if (!response.ok) {
        toast({ title: "Error", variant: "destructive" });
        return;
      }
      const data = await response.json();
      if (setItemDetails) {
        setItemDetails(); // Just trigger the callback without passing data
      }
      dispatch(setItemStatusIdle());
      onOpenChange(false);
      toast({ title: "Batch Added", variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    setFormData((prev) => ({
      ...prev,
      inventoryId: product?._id,
      pack: product?.pack || "",
    }));
    setProductSearch(product?.name);
    setTimeout(() => {
      if (inputRef?.current?.['batchNumber']) {
        inputRef.current['batchNumber'].focus();
      }
    }, 100);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[500px] overflow-y-auto p-0 gap-0">
        <div className="flex justify-between items-center pr-4 px-4 py-2.5 bg-gray-100 border-b">
          <SheetHeader className="p-0">
            <SheetTitle className="text-base font-semibold">Add New Batch</SheetTitle>
          </SheetHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="productName" className="text-sm font-medium text-gray-700">
              PRODUCT NAME<span className="text-red-500">*</span>
            </Label>
            <Input
              id="productName"
              placeholder="Type to search products"
              value={productSearch}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length > 0 && value[0] !== " ") {
                  setProductSearch(value);
                  setIsProductSelectorOpen(true);
                }
              }}
              onKeyDown={(e) => handleKeyDown(e, 'productName')}
              ref={el => inputRef.current['productName'] = el}
              className="h-9"
            />
            <ProductSelector
              open={isProductSelectorOpen}
              onOpenChange={setIsProductSelectorOpen}
              onSelect={handleProductSelect}
              search={productSearch}
              setSearch={setProductSearch}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="batchNumber" className="text-sm font-medium text-gray-700">
                BATCH NUMBER<span className="text-red-500">*</span>
              </Label>
              <Input
                id="batchNumber"
                name="batchNumber"
                placeholder="Batch Number"
                value={formData.batchNumber}
                onChange={handleInputChange}
                className="h-9"
                onKeyDown={(e) => handleKeyDown(e, 'batchNumber')}
                ref={el => inputRef.current['batchNumber'] = el}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate" className="text-sm font-medium text-gray-700">
                BATCH EXPIRY DATE<span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="expiryMonth"
                  name="expiryMonth"
                  placeholder="MM"
                  value={formData.expiryMonth}
                  onChange={handleInputChange}
                  className="h-9"
                  onKeyDown={(e) => handleKeyDown(e, 'expiryMonth')}
                  ref={el => inputRef.current['expiryMonth'] = el}
                />
                <Input
                  id="expiryYear"
                  name="expiryYear"
                  placeholder="YY"
                  value={formData.expiryYear}
                  onChange={handleInputChange}
                  className="h-9"
                  onKeyDown={(e) => handleKeyDown(e, 'expiryYear')}
                  ref={el => inputRef.current['expiryYear'] = el}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="mrp" className="text-sm font-medium text-gray-700">
                MRP (INCL GST)<span className="text-red-500">*</span>
              </Label>
              <Input
                id="mrp"
                name="mrp"
                placeholder="MRP (incl gst)"
                value={formData.mrp}
                onChange={handleInputChange}
                className="h-9"
                onKeyDown={(e) => handleKeyDown(e, 'mrp')}
                ref={el => inputRef.current['mrp'] = el}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="HSN" className="text-sm font-medium text-gray-700">
                HSN CODE WITH GST RATE<span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="HSN"
                  name="HSN"
                  placeholder="Ex. 3004"
                  value={formData.HSN}
                  onChange={handleInputChange}
                  className="h-9"
                  onKeyDown={(e) => handleKeyDown(e, 'HSN')}
                  ref={el => inputRef.current['HSN'] = el}
                />
                <Select
                  name="gstPer"
                  value={formData.gstPer}
                  onValueChange={(value) => {
                    handleInputChange({ target: { name: "gstPer", value } });
                  }}
                  onOpenChange={(open) => {
                    if (!open) {
                      const currentIndex = inputKeys.indexOf('gstPer');
                      if (currentIndex < inputKeys.length - 1) {
                        const nextKey = inputKeys[currentIndex + 1];
                        setTimeout(() => {
                          inputRef.current[nextKey]?.focus();
                        }, 100);
                      }
                    }
                  }}
                >
                  <SelectTrigger 
                    className="w-24 h-9" 
                    ref={el => inputRef.current['gstPer'] = el}
                    onKeyDown={(e) => handleKeyDown(e, 'gstPer')}
                  >
                    <SelectValue placeholder="gst %" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="purchaseRate" className="text-sm font-medium text-gray-700">
                PURCHASE RATE
              </Label>
              <div className="flex gap-2">
                <Input
                  id="purchaseRate"
                  name="purchaseRate"
                  placeholder="Purch Rate"
                  value={formData.purchaseRate}
                  onChange={handleInputChange}
                  className="h-9"
                  onKeyDown={(e) => handleKeyDown(e, 'purchaseRate')}
                  ref={el => inputRef.current['purchaseRate'] = el}
                />
                <Select
                  name="purchaseGstType"
                  value={formData.purchaseGstType}
                  onValueChange={(value) => {
                    handleInputChange({
                      target: { name: "purchaseGstType", value },
                    });
                  }}
                  onOpenChange={(open) => {
                    if (!open) {
                      const currentIndex = inputKeys.indexOf('purchaseGstType');
                      if (currentIndex < inputKeys.length - 1) {
                        const nextKey = inputKeys[currentIndex + 1];
                        setTimeout(() => {
                          inputRef.current[nextKey]?.focus();
                        }, 100);
                      }
                    }
                  }}
                >
                  <SelectTrigger 
                    className="w-24 h-9" 
                    ref={el => inputRef.current['purchaseGstType'] = el}
                    onKeyDown={(e) => handleKeyDown(e, 'purchaseGstType')}
                  >
                    <SelectValue placeholder="Excl gst" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excl gst">Excl gst</SelectItem>
                    <SelectItem value="Incl gst">Incl gst</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="saleRate" className="text-sm font-medium text-gray-700">
                SALE RATE
              </Label>
              <div className="flex gap-2">
                <Input
                  id="saleRate"
                  name="saleRate"
                  placeholder="Sale Rate"
                  value={formData.saleRate}
                  onChange={handleInputChange}
                  className="h-9"
                  onKeyDown={(e) => handleKeyDown(e, 'saleRate')}
                  ref={el => inputRef.current['saleRate'] = el}
                />
                <Select
                  name="saleGstType"
                  value={formData.saleGstType}
                  onValueChange={(value) => {
                    handleInputChange({
                      target: { name: "saleGstType", value },
                    });
                  }}
                  onOpenChange={(open) => {
                    if (!open) {
                      const currentIndex = inputKeys.indexOf('saleGstType');
                      if (currentIndex < inputKeys.length - 1) {
                        const nextKey = inputKeys[currentIndex + 1];
                        setTimeout(() => {
                          inputRef.current[nextKey]?.focus();
                        }, 100);
                      }
                    }
                  }}
                >
                  <SelectTrigger 
                    className="w-24 h-9" 
                    ref={el => inputRef.current['saleGstType'] = el}
                    onKeyDown={(e) => handleKeyDown(e, 'saleGstType')}
                  >
                    <SelectValue placeholder="Incl gst" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excl gst">Excl gst</SelectItem>
                    <SelectItem value="Incl gst">Incl gst</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="pack" className="text-sm font-medium text-gray-700">
                UNITS PER PACK<span className="text-red-500">*</span>
              </Label>
              <Input
                id="pack"
                name="pack"
                placeholder="Ex. Tablets or Capsule per Strip"
                value={formData.pack}
                onChange={handleInputChange}
                className="h-9"
                onKeyDown={(e) => handleKeyDown(e, 'pack')}
                ref={el => inputRef.current['pack'] = el}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 h-full">
                <div className="bg-pink-500 rounded-full p-1 w-6 h-6 flex items-center justify-center text-white">
                  💊
                </div>
                <p>
                  For a strip of 10 tablets, the Units per Pack will
                  be 10
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="packs" className="text-sm font-medium text-gray-700">
              QUANTITY IN STOCK<span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-5">
              <Input
                id="packs"
                name="packs"
                placeholder="No of Packs"
                value={formData.packs}
                onChange={handleInputChange}
                className="h-9"
                onKeyDown={(e) => handleKeyDown(e, 'packs')}
                ref={el => inputRef.current['packs'] = el}
              />
              <Input
                id="loose"
                name="loose"
                placeholder="Loose Units"
                value={formData.loose || ""}
                onChange={handleInputChange}
                className="h-9"
                onKeyDown={(e) => handleKeyDown(e, 'loose')}
                ref={el => inputRef.current['loose'] = el}
              />
            </div>
          </div>
        </form>

        <div className="p-3  flex items-center justify-end gap-2 b-0">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isLoading}
            onClick={handleSubmit}
            ref={el => inputRef.current['submitButton'] = el}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
