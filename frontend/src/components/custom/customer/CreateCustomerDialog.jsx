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

// Input keys in order of navigation
const inputKeys = ['name', 'mobileNumber', 'address', 'submitButton'];

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
    mobileNumber: "",
    address: "",
  });

  useEffect(() => {
    if (editingCustomer) {
      setFormData({
        name: editingCustomer.name,
        mobileNumber: editingCustomer.mobileNumber,
        address: editingCustomer.address,
      });
    } else if (initialData) {
      setFormData({
        name: initialData.name || "",
        mobileNumber: initialData.mobileNumber || "",
        address: initialData.address || "",
      });
    } else {
      setFormData({
        name: "",
        mobileNumber: "",
        address: "",
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
      
      if (editingCustomer) {
        result = await dispatch(
          updateCustomer({ 
            id: editingCustomer._id, 
            customerData: formData 
          })
        ).unwrap();
        toast({
          title: "Success",
          description: "Customer updated successfully",
          variant: "success",
        });
      } else {
        result = await dispatch(addCustomer(formData)).unwrap();
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

              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm font-medium text-gray-700">
                  Mobile Number<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="mobile"
                  value={formData.mobileNumber}
                  onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                  placeholder="Enter mobile number"
                  required
                  className="h-9"
                  onKeyDown={(e) => handleKeyDown(e, 'mobileNumber')}
                  ref={el => inputRef.current['mobileNumber'] = el}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                  Address
                </Label>
                <Input
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
