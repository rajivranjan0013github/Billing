import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createDistributor } from "../../../redux/slices/distributorSlice";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
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

const INITIAL_FORM_DATA = {
  name: "",
  mob: "",
  email: "",
  openBalance: "",
  balance_type: "collect",
  gstin: "",
  panNumber: "",
  DLNumber: "",
  address: "",
  credit_period: 30,
  credit_limit: 0,
}

export default function CreateDistributorDlg({ open, onOpenChange, onSuccess }) {
  const inputRef = useRef([]);
  const dispatch = useDispatch();
  const { createDistributorStatus } = useSelector((state) => state.distributor);
  const { toast } = useToast();
  
  const inputKeys = [
    'name',
    'openBalance',
    'balance_type',
    'mob',
    'email',
    'gstin',
    'panNumber',
    'DLNumber',
    'address',
    'credit_period',
    'credit_limit',
    'save_button'
  ];

  // handling button shortcuts
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

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

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
      const distributorData = { ...formData };
      distributorData.openBalance = Number(distributorData.openBalance);
      const newDistributor = await dispatch(createDistributor(distributorData)).unwrap();
      toast({
        title: "Distributor created successfully",
        variant: "success",
      });
      onOpenChange(false);
      onSuccess?.(newDistributor);
      setFormData(INITIAL_FORM_DATA);
    } catch (error) {
      toast({
        title: "Distributor creation failed",
        variant: "destructive",
      });
    }
  };

  // when dialog is open autofocus on first input
  useEffect(()=> {
    if(open && inputRef.current['name']) {
      inputRef.current['name']?.focus();
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0">
        <DialogHeader className="px-6 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
          <DialogTitle className="text-base font-semibold">
            Create Distributor
          </DialogTitle>
        </DialogHeader>
        <Separator />

        <form id="createDistributorForm" onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="name" className="text-xs font-medium text-gray-700">
                    Distributor Name<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, 'name')}
                    ref={el => inputRef.current['name'] = el}
                    placeholder="Enter Distributor name"
                    required
                    className="h-8 mt-1.5 text-sm"
                  />
                </div>
                <div className="w-[180px]">
                  <Label htmlFor="openBalance" className="text-xs font-medium text-gray-700">
                    Balance
                  </Label>
                  <Input
                    id="openBalance"
                    name="openBalance"
                    type="number"
                    value={formData.openBalance}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, 'openBalance')}
                    ref={el => inputRef.current['openBalance'] = el}
                    placeholder="₹ 0"
                    className="h-8 mt-1.5 text-sm"
                  />
                </div>
                <div className="w-[160px]">
                  <Label className="text-xs font-medium text-gray-700">Type</Label>
                  <Select
                    value={formData.balance_type}
                    onValueChange={(value) => handleSelectChange("balance_type", value)}
                  >
                    <SelectTrigger 
                      className="h-8 mt-1.5 text-sm"
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

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="mob" className="text-xs font-medium text-gray-700">
                    Mobile Number
                  </Label>
                  <Input
                    id="mob"
                    name="mob"
                    value={formData.mob}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, 'mob')}
                    ref={el => inputRef.current['mob'] = el}
                    placeholder="Enter mobile"
                    className="h-8 mt-1.5 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-xs font-medium text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, 'email')}
                    ref={el => inputRef.current['email'] = el}
                    placeholder="Enter email"
                    className="h-8 mt-1.5 text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="gstin" className="text-xs font-medium text-gray-700">
                    GSTIN
                  </Label>
                  <Input
                    id="gstin"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, 'gstin')}
                    ref={el => inputRef.current['gstin'] = el}
                    placeholder="ex: 29XXXXX9438X1XX"
                    className="h-8 mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="panNumber" className="text-xs font-medium text-gray-700">
                    PAN Number
                  </Label>
                  <Input
                    id="panNumber"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, 'panNumber')}
                    ref={el => inputRef.current['panNumber'] = el}
                    placeholder="Enter PAN"
                    className="h-8 mt-1 text-sm"
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="DLNumber" className="text-xs font-medium text-gray-700">
                  Drug License Number
                </Label>
                <Input
                  id="DLNumber"
                  name="DLNumber"
                  value={formData.DLNumber}
                  onChange={handleInputChange}
                  onKeyDown={(e) => handleKeyDown(e, 'DLNumber')}
                  ref={el => inputRef.current['DLNumber'] = el}
                  placeholder="Enter DL Number"
                  className="h-8 mt-1 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="address" className="text-xs font-medium text-gray-700">
                    Address Details
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    className="w-full h-[60px] p-2 mt-1 rounded-md border border-input text-sm resize-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter complete address"
                    value={formData.address}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, 'address')}
                    ref={el => inputRef.current['address'] = el}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="creditPeriod" className="text-xs font-medium text-gray-700">
                      Credit Period
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="creditPeriod"
                        name="credit_period"
                        type="number"
                        value={formData.credit_period}
                        onChange={handleInputChange}
                        onKeyDown={(e) => handleKeyDown(e, 'credit_period')}
                        ref={el => inputRef.current['credit_period'] = el}
                        className="h-8 text-sm pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                        Days
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="creditLimit" className="text-xs font-medium text-gray-700">
                      Credit Limit
                    </Label>
                    <Input
                      id="creditLimit"
                      name="credit_limit"
                      type="number"
                      value={formData.credit_limit}
                      onChange={handleInputChange}
                      onKeyDown={(e) => handleKeyDown(e, 'credit_limit')}
                      ref={el => inputRef.current['credit_limit'] = el}
                      placeholder="₹ 0"
                      className="h-8 mt-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="p-3 bg-gray-50 border-t flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 text-sm px-4"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="createDistributorForm"
            ref={el => inputRef.current['save_button'] = el}
            disabled={createDistributorStatus === "loading"}
            className="h-8 px-10 text-sm bg-blue-600 text-white hover:bg-blue-700"
          >
            {createDistributorStatus === "loading" ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
