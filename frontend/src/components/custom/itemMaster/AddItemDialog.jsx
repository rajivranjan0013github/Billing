import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../../ui/select";
import { useDispatch, useSelector } from "react-redux";
import { createInventoryItem } from "../../../redux/slices/pharmacySlice";
import { useToast } from "../../../hooks/use-toast";
import { Separator } from "../../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { ScrollArea } from "../../ui/scroll-area";

// GST tax rates
const gstRates = [0, 5, 12, 18, 28];

// Measuring units (example list, adjust as needed)
const measuringUnits = ["Piece", "Box", "Strip", "Bottle", "Tablet", "Capsule", "ml", "mg", "g", "kg", "L"];

export default function AddItemDialog({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { createItemStatus } = useSelector((state) => state.inventory);
  const pharmacyItemCategories = [
    'Tablet', 'Capsule', 'Injection', 'Cream', 'Ointment', 
    'Suspension', 'Powder', 'Liquid', 'Syrup', 'Drops', 
    'Inhaler', 'Patch', 'Gel', 'Lotion', 'Solution'
  ];
  
  const [name, setName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [MRP, setMRP] = useState("");
  const [category, setCategory] = useState("");
  const [gstRate, setGstRate] = useState("");
  const [measuringUnit, setMeasuringUnit] = useState("");
  const [priceWithTax, setPriceWithTax] = useState("withoutTax");
  const [sellPriceWithTax, setSellPriceWithTax] = useState("withoutTax");
  const [hsnCode, setHsnCode] = useState("");
  const [manufactureName, setManufactureName] = useState("");
  const [secondaryUnit, setSecondaryUnit] = useState("");
  const [conversionRate, setConversionRate] = useState("");
  const [showSecondaryUnit, setShowSecondaryUnit] = useState(false);
  const [pack, setPack] = useState("");

  const handleAddItem = () => {
    const itemData = {
      itemsDetails: {
        item_category: category,  
        name,
        manufacturer_name: manufactureName,
        gst_percentage: parseInt(gstRate),
        sales_info: {
          is_tax_included: sellPriceWithTax === "withTax",
          price_per_unit: parseFloat(sellPrice),
        },
        purchase_info: {
          is_tax_included: priceWithTax === "withTax",
          price_per_unit: parseFloat(purchasePrice),
        },
        unit: measuringUnit,
        secondary_unit: secondaryUnit ? {
          unit: secondaryUnit,
          conversion_rate: parseFloat(conversionRate)
        } : undefined,
        quantity: parseInt(quantity),
        expiry_date: expiryDate,
        mrp: parseFloat(MRP),
        hsn_code: hsnCode,
        pack,
      }
    };
    dispatch(createInventoryItem(itemData)).unwrap()
      .then(() => {
        toast({
          title: "Item added successfully",
          variant: "success",
        });
        onClose();
        handleReset();
      })
      .catch((error) => {
        toast({
          title: "Failed to add item",
          variant: "destructive",
        });
      })
  };

  const handleReset = () => {
    setName("");
    setPurchasePrice("");
    setSellPrice("");
    setQuantity("");
    setExpiryDate("");
    setMRP("");
    setCategory("");
    setGstRate("");
    setMeasuringUnit("");
    setPriceWithTax("withoutTax");
    setSellPriceWithTax("withoutTax");
    setHsnCode("");
    setManufactureName("");
    setSecondaryUnit("");
    setConversionRate("");
    setShowSecondaryUnit(false);
    setPack("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[700px] w-[90vw] max-h-[80vh] min-h-[60vh] gap-3 rounded-lg p-0 flex flex-col">
        <DialogHeader className="px-4 pt-4 shrink-0 ">
          <DialogTitle>Create New Item</DialogTitle>
        </DialogHeader>
        <Separator />
        <form onSubmit={(e) => { e.preventDefault(); handleAddItem(); }} className="flex flex-col flex-grow overflow-hidden">
          <div className="px-4 flex-grow overflow-y-auto ">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="basic">Basic Details</TabsTrigger>
                <TabsTrigger value="pricing">Pricing Details</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <Label htmlFor="name">Item Name<span className="text-red-500">*</span></Label>
                    <Input id="name" placeholder="eg: Paracetamol" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="col-span-1">
                    <Label htmlFor="manufactureName">Manufacture Name</Label>
                    <Input 
                      id="manufactureName" 
                      placeholder="eg: ABC Pharmaceuticals" 
                      value={manufactureName} 
                      onChange={(e) => setManufactureName(e.target.value)} 
                    />
                  </div>
                  <div className="col-span-1">
                    <Label htmlFor="pack">Pack</Label>
                    <Input 
                      id="pack" 
                      placeholder="eg: 10x10" 
                      value={pack} 
                      onChange={(e) => setPack(e.target.value)} 
                    />
                  </div>
                  <div className="col-span-1">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory} required>
                      <SelectTrigger id="category" className="w-full">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-[200px]">
                          {pharmacyItemCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="gstRate">GST Tax Rate (%)</Label>
                    <Select value={gstRate} onValueChange={setGstRate} required>
                      <SelectTrigger id="gstRate">
                        <SelectValue placeholder="Select GST Rate" />
                      </SelectTrigger>
                      <SelectContent>
                        {gstRates.map((rate) => (
                          <SelectItem key={rate} value={rate.toString()}>{rate}%</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="measuringUnit">Measuring Unit</Label>
                    <Select value={measuringUnit} onValueChange={setMeasuringUnit} required>
                      <SelectTrigger id="measuringUnit">
                        <SelectValue placeholder="Select Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {measuringUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="sellPrice">Sell Price</Label>
                    <div className="flex">
                      <Input
                        id="sellPrice"
                        placeholder="Sell Price"
                        value={sellPrice}
                        onChange={(e) => setSellPrice(e.target.value)}
                        required
                        className="rounded-r-none"
                      />
                      <Select
                        value={sellPriceWithTax}
                        onValueChange={setSellPriceWithTax}
                      >
                        <SelectTrigger className="w-[130px] rounded-l-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="withTax">With Tax</SelectItem>
                          <SelectItem value="withoutTax">Without Tax</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    {!showSecondaryUnit ? (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => setShowSecondaryUnit(true)}
                      >
                        + Add Additional Unit
                      </Button>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <Label htmlFor="secondaryUnit">Secondary Unit</Label>
                          <Select value={secondaryUnit} onValueChange={setSecondaryUnit}>
                            <SelectTrigger id="secondaryUnit">
                              <SelectValue placeholder="Select Secondary Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {measuringUnits.map((unit) => (
                                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-1">
                          <Label htmlFor="conversionRate">
                            Conversion Rate (1 {measuringUnit} = ? {secondaryUnit})
                          </Label>
                          <Input
                            id="conversionRate"
                            type="number"
                            step="0.01"
                            placeholder={`1 ${measuringUnit} = ? ${secondaryUnit}`}
                            value={conversionRate}
                            onChange={(e) => setConversionRate(e.target.value)}
                            required={!!secondaryUnit}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                </div>
              </TabsContent>
              <TabsContent value="pricing">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
                  <div>
                    <Label htmlFor="purchasePrice">Purchase Price (CP)</Label>
                    <div className="flex">
                      <Input
                        id="purchasePrice"
                        placeholder="Purchase Price"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        required
                        className="rounded-r-none"
                      />
                      <Select
                        value={priceWithTax}
                        onValueChange={setPriceWithTax}
                      >
                        <SelectTrigger className="w-[130px] rounded-l-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="withTax">With Tax</SelectItem>
                          <SelectItem value="withoutTax">Without Tax</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="sellPrice">Sell Price</Label>
                    <div className="flex">
                      <Input
                        id="sellPrice"
                        placeholder="Sell Price"
                        value={sellPrice}
                        onChange={(e) => setSellPrice(e.target.value)}
                        required
                        className="rounded-r-none"
                      />
                      <Select
                        value={sellPriceWithTax}
                        onValueChange={setSellPriceWithTax}
                      >
                        <SelectTrigger className="w-[130px] rounded-l-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="withTax">With Tax</SelectItem>
                          <SelectItem value="withoutTax">Without Tax</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="MRP">MRP</Label>
                    <Input id="MRP" placeholder="MRP" value={MRP} onChange={(e) => setMRP(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="hsnCode">HSN Code</Label>
                    <Input id="hsnCode" placeholder="HSN Code" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="month"
                      placeholder="Expiry Date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Opening Stock</Label>
                    <div className="flex">
                      <Input
                        id="quantity"
                        placeholder="Quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                        className="rounded-r-none"
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-input bg-background text-sm text-gray-500">
                        {measuringUnit || "Unit"}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <Separator className="mt-2" />
          <DialogFooter className="px-4 py-2 shrink-0">
            <Button className="hidden md:inline-flex" type="button" size="sm" variant="outline" onClick={handleReset}>Reset</Button>
            <Button type="button" size="sm" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={createItemStatus === "loading"}>
              {createItemStatus === "loading" ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}