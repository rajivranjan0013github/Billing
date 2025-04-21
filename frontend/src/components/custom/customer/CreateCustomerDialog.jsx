import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useDispatch } from "react-redux";
import { useState, useEffect, useRef } from "react";
import { addCustomer, updateCustomer } from "../../../redux/slices/CustomerSlice";
import { useToast } from "../../../hooks/use-toast";
import { Separator } from "../../ui/separator";
import { Textarea } from "../../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

// Input keys in order of navigation
const inputKeys = ['name', 'openBalance', 'balance_type', 'mob', 'address', 'submitButton'];

export default function CreateCustomerDialog({
  open,
  onOpenChange,
  onSuccess,
  editingCustomer = null,
  initialData = null,
}) {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const inputRef = useRef({});
  const [formData, setFormData] = useState({
    name: "",
    mob: "",
    address: "",
    openBalance: "",
    balance_type: "collect",
  });

  useEffect(() => {
    if (editingCustomer) {
      setFormData({
        name: editingCustomer.name,
        mob: editingCustomer.mob,
        address: editingCustomer.address,
        openBalance: Math.abs(editingCustomer.currentBalance) || "",
        balance_type: editingCustomer.openBalance < 0 ? 'pay' : 'collect',
      });
    } else if (initialData) {
      setFormData({
        name: initialData.name || "",
        mob: initialData.mob || "",
        address: initialData.address || "",
        openBalance: initialData.openBalance || "",
      });
    } else {
      setFormData({
        name: "",
        mob: "",
        address: "",
        openBalance: "",
        balance_type: "collect",
      });
    }
  }, [editingCustomer, initialData]);

  const handleKeyDown = (e, currentKey) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentIndex = inputKeys.indexOf(currentKey);
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
    try {
      setLoading(true);
      let result;
      
      // Prepare the data with balance handling
      const customerData = { ...formData };
      let openBalance = Number(customerData.openBalance);
      if (customerData.balance_type === "pay" && openBalance > 0) {
        openBalance = -openBalance;
      } else if (customerData.balance_type === "collect" && openBalance < 0) {
        openBalance = Math.abs(openBalance);
      }
      customerData.openBalance = openBalance;
      
      if (editingCustomer) {
        result = await dispatch(
          updateCustomer({ 
            id: editingCustomer._id, 
            customerData 
          })
        ).unwrap();
        toast({
          title: "Success",
          description: "Customer updated successfully",
          variant: "success",
        });
      } else {
        result = await dispatch(addCustomer(customerData)).unwrap();
        toast({
          title: "Success",
          description: "Customer created successfully",
          variant: "success",
        });
      }
      
      onSuccess?.(result);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingCustomer ? 'update' : 'create'} customer`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
          <DialogTitle className="text-base font-semibold">
            {editingCustomer ? "Edit Customer" : "Create New Customer"}
          </DialogTitle>
        </DialogHeader>
        <Separator />

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Customer Name<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  data-dialog-autofocus="true"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter customer name"
                  required
                  className="h-9"
                  onKeyDown={(e) => handleKeyDown(e, 'name')}
                  ref={el => inputRef.current['name'] = el}
                />
              </div>

              <div className="flex gap-2">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="openBalance" className="text-sm font-medium text-gray-700">
                    Balance
                  </Label>
                  <Input
                    id="openBalance"
                    type="number"
                    value={formData.openBalance}
                    onChange={(e) => handleInputChange("openBalance", e.target.value)}
                    placeholder="₹ 0"
                    className="h-9"
                    onKeyDown={(e) => handleKeyDown(e, 'openBalance')}
                    ref={el => inputRef.current['openBalance'] = el}
                  />
                </div>
                <div className="space-y-2 w-[120px]">
                  <Label className="text-sm font-medium text-gray-700">Type</Label>
                  <Select
                    value={formData.balance_type}
                    onValueChange={(value) => handleInputChange("balance_type", value)}
                  >
                    <SelectTrigger 
                      className="h-9"
                      ref={el => inputRef.current['balance_type'] = el}
                      onKeyDown={(e) => handleKeyDown(e, 'balance_type')}
                    >
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collect">To Collect</SelectItem>
                      <SelectItem value="pay">To Pay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm font-medium text-gray-700">
                  Mobile Number<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="mobile"
                  value={formData.mob}
                  onChange={(e) => handleInputChange("mob", e.target.value)}
                  placeholder="Enter mobile number"
                  required
                  className="h-9"
                  onKeyDown={(e) => handleKeyDown(e, 'mob')}
                  ref={el => inputRef.current['mob'] = el}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                  Address
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter address"
                  className="h-9"
                  onKeyDown={(e) => handleKeyDown(e, 'address')}
                  ref={el => inputRef.current['address'] = el}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-3 bg-gray-100 border-t flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white hover:bg-blue-700"
            ref={el => inputRef.current['submitButton'] = el}
          >
            {loading 
              ? (editingCustomer ? "Updating..." : "Creating...") 
              : (editingCustomer ? "Update" : "Create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
