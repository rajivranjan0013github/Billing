import { Button } from "../../ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "../../ui/dialog"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group"
import { Textarea } from "../../ui/textarea"
import { Separator } from "../../ui/separator"
import { useState } from "react"
import { useDispatch } from "react-redux"
import { adjustStock } from "../../../redux/slices/inventorySlice"
import { useToast } from "../../../hooks/use-toast"

export default function AdjustStockDialog({ open, onOpenChange, item, onStockAdjusted }) {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [adjustmentType, setAdjustmentType] = useState("add")
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("")
  const [remarks, setRemarks] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!adjustmentQuantity || adjustmentQuantity <= 0) {
      toast({title: "Please enter a valid quantity", variant: "destructive"});
      return;
    }
    setIsSubmitting(true);
    dispatch(adjustStock({
        itemId: item._id,
        adjustmentType,
        quantity: adjustmentQuantity,
        remarks
      })).unwrap().then(() => {
        toast({title: "Stock Adjusted Successfully", variant:"success"});
        onStockAdjusted(calculateNewQuantity());
        onOpenChange(false);
      }).catch((error) => {
        toast({title: "Failed to Adjust Stock", variant: "destructive"});
      }).finally(() => {
        setIsSubmitting(false);
      });
  };

  const calculateNewQuantity = () => {
    if (!adjustmentQuantity) return item.quantity
    const adjustment = parseInt(adjustmentQuantity) || 0
    return adjustmentType === "add" 
      ? item.quantity + adjustment 
      : item.quantity - adjustment
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] w-[90vw] gap-3 rounded-lg p-0 flex flex-col">
        <DialogHeader className="px-4 pt-4 shrink-0">
          <DialogTitle>Adjust Stock Quantity</DialogTitle>
        </DialogHeader>
        <Separator />
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          <div className="px-4 py-2 flex-grow">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label className="font-medium">Item Name</Label>
                <div className="text-sm text-muted-foreground bg-secondary/30 p-2 rounded-md">
                  {item.name}
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="font-medium">Add Or Reduce Stock</Label>
                <RadioGroup 
                  defaultValue="add" 
                  value={adjustmentType}
                  onValueChange={setAdjustmentType}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="add" id="add" />
                    <Label htmlFor="add" className="font-normal">Add (+)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="reduce" id="reduce" />
                    <Label htmlFor="reduce" className="font-normal">Reduce (-)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-2">
                <Label className="font-medium">Current Stock Level</Label>
                <div className="text-sm text-muted-foreground bg-secondary/30 p-2 rounded-md">
                  {item.quantity} {item.unit}
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="font-medium">Adjust Quantity<span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    placeholder="0" 
                    className="pr-16"
                    required
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                  />
                  <div className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                    {item.unit}
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="font-medium">Remarks</Label>
                <Textarea 
                  placeholder="Enter remarks (optional)" 
                  className="resize-none h-20"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label className="font-medium">New Stock Level</Label>
                <div className="text-sm text-muted-foreground bg-secondary/30 p-2 rounded-md">
                  {calculateNewQuantity()} {item.unit}
                </div>
              </div>
            </div>
          </div>

          <Separator className="mt-2" />
          <DialogFooter className="px-4 py-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              size="sm"
              className="bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}