import React, { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../ui/sheet";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useToast } from "../../../hooks/use-toast";
import { useDispatch, useSelector } from "react-redux";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import ProductSelector from './SelectInventoryItem';
import { Backend_URL } from "../../../assets/Data";

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
  ptr: "",
  unitsPerPack: "",
  quantityInStock: "" 
}

export default function ManageInventory({ open, onOpenChange, inventoryDetails, setItemDetails, batchDetails, setUpdateBatchDetails }) {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const batch_numberRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // creating new batch
  useEffect(() => {
    if(inventoryDetails && open) {
      setFormData({...formData, inventoryId: inventoryDetails._id});
      setProductSearch(inventoryDetails.name);
      setTimeout(() => {
        if(batch_numberRef.current) {
          batch_numberRef.current.focus();
        }
      }, 100);
    }
  }, [inventoryDetails, open]);

  // Update useEffect to handle batch editing
  useEffect(() => {
    if (batchDetails && open) {
      setFormData({
        inventoryId: batchDetails.inventoryId,
        batchNumber: batchDetails.batchNumber,
        expiryMonth: batchDetails.expiry.split('/')[0],
        expiryYear: batchDetails.expiry.split('/')[1],
        mrp: batchDetails.mrp,
        HSN: batchDetails.HSN,
        gstPer: batchDetails.gstPer,
        purchaseRate: batchDetails.purchaseRate,
        purchaseGstType: "Excl gst",
        ptr: batchDetails.ptr,
        unitsPerPack: batchDetails.pack,
        quantityInStock: batchDetails.quantity
      });
      // Set product name if inventoryDetails is available
      if (inventoryDetails) {
        setProductSearch(inventoryDetails.name);
      }
    }
  }, [batchDetails, open]);

  useEffect(() => {
    if(!open) {
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(isProductSelectorOpen) return;
    
    const expiry = `${formData.expiryMonth}/${formData.expiryYear}`;
    const purchaseRate = formData.purchaseGstType === "Excl gst" ? 
      formData.purchaseRate : 
      formData.purchaseRate / (1 + formData.gstPer/100);
    
    const finalFormData = {
      inventoryId: formData.inventoryId,
      batchNumber: formData.batchNumber,
      expiry,
      mrp: Number(formData.mrp),
      HSN: formData.HSN,
      gstPer: Number(formData.gstPer),
      purchaseRate: Number(parseFloat(purchaseRate).toFixed(2)),
      ptr: Number(parseFloat(formData.ptr).toFixed(2)),
      pack: parseInt(formData.unitsPerPack),
      quantity: Number(formData.quantityInStock),
    };

    // Add batch ID if editing existing batch
    if (batchDetails?._id) {
      finalFormData._id = batchDetails._id;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${Backend_URL}/api/inventory/manage-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalFormData),
        credentials: "include",
      });
      if (!response.ok) {
        toast({title: "Error", variant: "destructive"});
        return;
      }
      const data = await response.json();
      setItemDetails(data); // here batch are fetching from the server
      onOpenChange(false);
      toast({title: "Batch Added", variant:"success"});
    } catch (error) {
      toast({ title: "Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    setFormData(prev => ({
      ...prev,
      inventoryId: product._id,
    }));
    setProductSearch(product.name);
    if(batch_numberRef.current) {
      batch_numberRef.current.focus();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[500px] overflow-y-auto">
        <div className="flex justify-between items-center pr-8">
          <SheetHeader>
            <SheetTitle className="text-xl">Add New Batch</SheetTitle>
            <p className="text-sm text-gray-500">Add or Edit Stock Batches</p>
          </SheetHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-1">
            <Label htmlFor="productName">
              PRODUCT NAME<span className="text-red-500">*</span>
            </Label>
            <Input
              id="productName"
              autoFocus={!inventoryDetails}
              placeholder="Type to search products"
              value={productSearch}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length > 0 && value[0] !== ' ') {
                  setProductSearch(value);
                  setIsProductSelectorOpen(true);
                }
              }}
            />
            <ProductSelector
              open={isProductSelectorOpen}
              onOpenChange={setIsProductSelectorOpen}
              onSelect={handleProductSelect}
              search={productSearch}
              setSearch={setProductSearch}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="batchNumber">
                BATCH NUMBER<span className="text-red-500">*</span>
              </Label>
              <Input
                ref={batch_numberRef}
                id="batchNumber"
                name="batchNumber"
                placeholder="Batch Number"
                value={formData.batchNumber}
                onChange={handleInputChange}
                className="w-full h-10"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="expiryDate">
                BATCH EXPIRY DATE<span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="expiryMonth"
                  name="expiryMonth"
                  placeholder="MM"
                  value={formData.expiryMonth}
                  onChange={handleInputChange}
                  className="w-24 h-10"
                />
                <Input
                  id="expiryYear"
                  name="expiryYear"
                  placeholder="YY"
                  value={formData.expiryYear}
                  onChange={handleInputChange}
                  className="w-24 h-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="mrp">
                MRP (INCL GST)<span className="text-red-500">*</span>
              </Label>
              <Input
                id="mrp"
                name="mrp"
                placeholder="MRP (incl gst)"
                value={formData.mrp}
                onChange={handleInputChange}
                className="w-full h-10"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="HSN">
                HSN CODE WITH GST RATE<span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="HSN"
                  name="HSN"
                  placeholder="Ex. 3004"
                  value={formData.HSN}
                  onChange={handleInputChange}
                  className="w-full h-10"
                />
                <Select 
                  name="gstPer" 
                  value={formData.gstPer}
                  onValueChange={(value) => handleInputChange({ target: { name: 'gstPer', value }})}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="gst %" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="purchaseRate">
                PURCHASE RATE<span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="purchaseRate"
                  name="purchaseRate"
                  placeholder="Purch Rate"
                  value={formData.purchaseRate}
                  onChange={handleInputChange}
                  className="w-full h-10"
                />
                <Select 
                  name="purchaseGstType"
                  value={formData.purchaseGstType}
                  onValueChange={(value) => handleInputChange({ target: { name: 'purchaseGstType', value }})}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Excl gst" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excl gst">Excl gst</SelectItem>
                    <SelectItem value="Incl gst">Incl gst</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ptr">
                PRICE TO RETAILER (EXCL GST)<span className="text-red-500">*</span>
              </Label>
              <Input
                id="ptr"
                name="ptr"
                placeholder="PTR"
                value={formData.ptr}
                onChange={handleInputChange}
                className="w-full h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="unitsPerPack">
                UNITS PER PACK<span className="text-red-500">*</span>
              </Label>
              <Input
                id="unitsPerPack"
                name="unitsPerPack"
                placeholder="Ex. Tablets or Capsule per Strip"
                value={formData.unitsPerPack}
                onChange={handleInputChange}
                className="w-full h-10"
              />
            </div>
            <div>
            <Label htmlFor="quantityInStock">
              QUANTITY IN STOCK<span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantityInStock"
              name="quantityInStock"
              placeholder="No of Packs"
              value={formData.quantityInStock}
              onChange={handleInputChange}
              className="w-full h-10"
            />
            </div>
          </div>

          <div className="space-y-1">
            
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              <div className="bg-pink-500 rounded-full p-1 w-6 h-6 flex items-center justify-center text-white">
                💊
              </div>
              <p>For a strip of 10 tablets or capsules, the Units per Pack will be 10</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-gray-800 text-white" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save (F2)'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
