import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Button } from "../../ui/button"
import { Lightbulb } from 'lucide-react'
import { useDispatch } from "react-redux";
import { manageInventory } from "../../../redux/slices/inventorySlice";
import { useToast } from "../../../hooks/use-toast";

const FORMDATAINITIAL = {
  name: '',
  mfc_name: '',
  item_category: '',
  mrp: '',
  pack: '',
  composition: ''
}

export default function AddNewInventory({ open, onOpenChange, itemDetails }) {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(FORMDATAINITIAL);

  useEffect(() => {
    if (itemDetails) {
      setFormData({ 
        name : itemDetails.name || '',
        mfc_name : itemDetails.mfc_name || '',
        item_category : itemDetails.item_category || '',
        mrp : itemDetails.mrp || '',
        pack : itemDetails.pack || '',
        composition : itemDetails.composition || ''
      });
    }
  }, [itemDetails]);

  // submit form data to backend
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true);
    console.log('running');
    
    
    const action = itemDetails 
      ? manageInventory({ ...formData, _id: itemDetails._id }) // Update existing item
      : manageInventory(formData); // Create new item
    
    dispatch(action).unwrap()
      .then(() => {
        toast({
          title: itemDetails 
            ? `Product updated successfully`
            : `New product added successfully`,
          variant: 'success'
        });
        onOpenChange(false);
        if (!itemDetails) setFormData(FORMDATAINITIAL);
      })
      .catch((error) => {
        toast({
          title: itemDetails 
            ? `Failed to update product`
            : `Failed to add new product`,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  const handleKeyDown = (e, nextInputId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextInput = document.getElementById(nextInputId);
      if (nextInput) nextInput.focus();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {itemDetails ? 'Edit Product' : 'Create New Product'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Product Name<span className="text-red-500">*</span>
            </Label>
            <Input 
              data-dialog-autofocus="true"
              placeholder="Enter Product Name" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required 
              onKeyDown={(e) => handleKeyDown(e, 'mfc_name')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mfc_name">
              Company Name<span className="text-red-500">*</span>
            </Label>
            <Input 
              id="mfc_name" 
              placeholder="Enter Company Name"
              required
              value={formData.mfc_name}
              onChange={(e) => setFormData({ ...formData, mfc_name: e.target.value })}
              onKeyDown={(e) => handleKeyDown(e, 'item_category')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item_category">
              Product Category<span className="text-red-500">*</span>
            </Label>
            <Input 
              id="item_category" 
              placeholder="Enter Product Category"
              required 
              value={formData.item_category}
              onChange={(e) => setFormData({ ...formData, item_category: e.target.value })}
              onKeyDown={(e) => handleKeyDown(e, 'mrp-input')}
            />
          </div>


          <div className="grid grid-cols-2 gap-4">

          <div className="space-y-2">
              <Label htmlFor="mrp">
                MRP<span className="text-red-500">*</span>
              </Label>
              <Input 
                id="mrp-input" 
                placeholder="Enter Product MRP here"
                type="number"
                required 
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, 'pack')}
              />
            </div>
         
            <div className="space-y-2">
              <Label htmlFor="pack">
                Units Per Pack<span className="text-red-500">*</span>
              </Label>
              <Input 
                id="pack" 
                placeholder="No of Tablets in a Strip"
                type="number"
                required 
                value={formData.pack}
                onChange={(e) => setFormData({ ...formData, pack: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, 'composition')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="composition">Composition</Label>
            <Input 
              id="composition" 
              placeholder="Enter Composition"
              onKeyDown={(e) => handleKeyDown(e, 'submitButton')}
              value={formData.composition}
              onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
            />
          </div>

          <div className="bg-muted p-3 rounded-lg flex items-start gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Mention Volume or Weight at the end of Product Name
              <br />
              'Electral Sachet 4.4gm' is better than 'Electral Sachet'
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={(e) => {e.preventDefault(); onOpenChange(false)}}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              id="submitButton" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (itemDetails ? "Updating..." : "Creating...") : (itemDetails ? "Update" : "Create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
