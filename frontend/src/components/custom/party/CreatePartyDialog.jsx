import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createParty } from "../../../redux/slices/partySlice";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { useToast } from "../../../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Separator } from "../../ui/separator";
import { Building2, CreditCard, FileText } from "lucide-react";

export default function CreatePartyDialog({ open, onOpenChange, onSuccess }) {
  const dispatch = useDispatch();
  const { createPartyStatus } = useSelector((state) => state.party);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    mob: "",
    email: "",
    openBalance: 0,
    balance_type: "collect",
    gstin: "",
    panNumber: "",
    DLNumber: "",
    address: "",
    credit_period: 30,
    credit_limit: 0,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const partyData = { ...formData };
      partyData.openBalance = Number(partyData.openBalance);
      const newParty = await dispatch(createParty(partyData)).unwrap();
      toast({
        title: "Party created successfully",
        variant: "success",
      });
      onSuccess?.(newParty);
    } catch (error) {
      toast({
        title: "Party creation failed",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">
            Create Supplier
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="name" className="text-sm font-medium">
                  Supplier Name<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter supplier name"
                  required
                  className="h-9 mt-1.5"
                />
              </div>
              <div className="w-[140px]">
                <Label htmlFor="openBalance" className="text-sm font-medium">
                  Balance
                </Label>
                <Input
                  id="openBalance"
                  name="openBalance"
                  type="number"
                  value={formData.openBalance}
                  onChange={handleInputChange}
                  placeholder="₹ 0"
                  className="h-9 mt-1.5"
                />
              </div>
              <div className="w-[120px]">
                <Label className="text-sm font-medium">Type</Label>
                <Select
                  value={formData.balance_type}
                  onValueChange={(value) =>
                    handleSelectChange("balance_type", value)
                  }
                >
                  <SelectTrigger className="h-9 mt-1.5">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collect">To Collect</SelectItem>
                    <SelectItem value="pay">To Pay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mob" className="text-sm font-medium">
                  Mobile Number
                </Label>
                <Input
                  id="mob"
                  name="mob"
                  value={formData.mob}
                  onChange={handleInputChange}
                  placeholder="Enter mobile"
                  className="h-9 mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                  className="h-9 mt-1.5"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700">
                Legal Information
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gstin" className="text-sm">
                  GSTIN
                </Label>
                <Input
                  id="gstin"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleInputChange}
                  placeholder="ex: 29XXXXX9438X1XX"
                  className="h-9 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="panNumber" className="text-sm">
                  PAN Number
                </Label>
                <Input
                  id="panNumber"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleInputChange}
                  placeholder="Enter PAN"
                  className="h-9 mt-1"
                />
              </div>
            </div>
            <div className="mt-3">
              <Label htmlFor="DLNumber" className="text-sm">
                Drug License Number
              </Label>
              <Input
                id="DLNumber"
                name="DLNumber"
                value={formData.DLNumber}
                onChange={handleInputChange}
                placeholder="Enter DL Number"
                className="h-9 mt-1"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700">
                Address & Credit Terms
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="address" className="text-sm">
                  Address Details
                </Label>
                <textarea
                  id="address"
                  name="address"
                  className="w-full h-[60px] p-2 mt-1 rounded-md border border-input text-sm resize-none focus:ring-1 focus:ring-ring"
                  placeholder="Enter complete address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="creditPeriod" className="text-sm">
                  Credit Period
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="creditPeriod"
                    name="credit_period"
                    type="number"
                    value={formData.credit_period}
                    onChange={handleInputChange}
                    className="h-9"
                  />
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                    Days
                  </span>
                </div>
              </div>
              <div>
                <Label htmlFor="creditLimit" className="text-sm">
                  Credit Limit
                </Label>
                <Input
                  id="creditLimit"
                  name="credit_limit"
                  type="number"
                  value={formData.credit_limit}
                  onChange={handleInputChange}
                  placeholder="₹ 0"
                  className="h-9 mt-1"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createPartyStatus === "loading"}
              className="h-9 px-8"
            >
              {createPartyStatus === "loading" ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
