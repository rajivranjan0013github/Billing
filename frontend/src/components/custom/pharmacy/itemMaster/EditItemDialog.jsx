import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../../ui/dialog";
import { Input } from "../../../ui/input";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../../../ui/select"; // Import Select components
import { useToast } from "../../../../hooks/use-toast";
import { useDispatch, useSelector } from "react-redux";
import { updateInventoryItem } from "../../../../redux/slices/pharmacySlice";
import { Loader2 } from 'lucide-react'

export default function EditItemDialog({ isOpen, onClose, item }) {
  const dispatch = useDispatch();
  const { updateInventoryStatus } = useSelector((state) => state.pharmacy);
  const { toast } = useToast();
  const [name, setName] = useState(item?.name || "");
  const [price, setPrice] = useState(item?.CP || "");
  const [quantity, setQuantity] = useState(item?.quantity || "");
  const [expiryDate, setExpiryDate] = useState(item?.expiryDate ? new Date(item.expiryDate).toISOString().slice(0, 7) : "");
  const [MRP, setMRP] = useState(item?.MRP || "");
  const [types, setTypes] = useState(item?.type || "");
  const [supplierName, setSupplierName] = useState(item?.supplier?.name || "");
  const {hospitalInfo} = useSelector((state) => state.hospital);
  const pharmacyItemCategories = hospitalInfo?.pharmacyItemCategories || [];

  useEffect(() => {
    if (item) {
      setName(item.name || "");
      setPrice(item.CP || "");
      setQuantity(item.quantity || "");
      setExpiryDate(item.expiryDate ? new Date(item.expiryDate).toISOString().slice(0, 7) : "");
      setMRP(item.MRP || "");
      setTypes(item.type || "");
      setSupplierName(item.supplier?.name || "");
    }
  }, [item]);

  const handleEditItem = () => {
    const changedValues = {};
    if (name !== item.name) changedValues.name = name;
    if (price !== item.CP) changedValues.CP = price;
    if (quantity !== item.quantity) changedValues.quantity = quantity;
    if (expiryDate !== new Date(item.expiryDate).toISOString().slice(0, 7)) changedValues.expiryDate = expiryDate;
    if (MRP !== item.MRP) changedValues.MRP = MRP;
    if (types !== item.type) changedValues.type = types;

    if (Object.keys(changedValues).length === 0) {
      toast({title: "No changes made", description: "No items were modified.", variant: "success",});
    } else {
      dispatch(updateInventoryItem({ itemId: item._id, updateData: changedValues })).unwrap().then(()=>{
        toast({ title: "Item updated successfully", description: "The item has been successfully updated.", variant: "success",});
      }).catch((error) => {
        toast({title: "Failed to update item", description: error.message, variant: "destructive",});
      }).finally(()=>{
        onClose();
      });
    }
  };

  const handleReset = () => {
    setName("");
    setPrice("");
    setQuantity("");
    setExpiryDate("");
    setMRP("");
    setTypes("");
    setSupplierName("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] w-[95vw] rounded-lg">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Edit the details of the item
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleEditItem(); }}>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="name">Item Name</Label>
              <Input id="name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="types">Type</Label>
              <Select onValueChange={(value) => setTypes(value)} value={types}>
                <SelectTrigger id="types">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {pharmacyItemCategories.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="MRP">MRP</Label>
              <Input id="MRP" placeholder="MRP" value={MRP} onChange={(e) => setMRP(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="price">Cost Price</Label>
              <Input id="price" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
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
            <div className="sm:col-span-2 md:col-span-3">
              <Label htmlFor="supplierName">Supplier Name</Label>
              <Input disabled id="supplierName" placeholder="Supplier Name" readOnly value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="mt-4 flex-col-reverse sm:flex-row gap-2">
            <Button className="hidden md:block" type="button" size="sm" variant="outline" onClick={handleReset}>Reset</Button>
            <Button type="button" size="sm" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={updateInventoryStatus === "loading"}>
              {updateInventoryStatus === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}  
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
