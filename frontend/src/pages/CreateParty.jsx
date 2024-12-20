import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createParty } from "../redux/slices/partySlice";
import { ArrowLeft, Settings } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Checkbox } from "../components/ui/checkbox"
import { useToast } from "../hooks/use-toast"
import { useNavigate } from "react-router-dom"

export default function CreateParty() {
  const dispatch = useDispatch();
  const { createPartyStatus } = useSelector((state) => state.party);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    mob: "",
    email: "",
    openBalance: 0,
    balance_type: "collect",
    gstin: "",
    panNumber: "",
    DLNumber: "",
    partyType: "customer",
    address: "",
    shipping_address: "",
    credit_period: 30,
    credit_limit: 0,
    sameAsBilling: false,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (checked) => {
    setFormData((prevData) => ({
      ...prevData,
      sameAsBilling: checked,
      shipping_address: checked ? prevData.address : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const partyData = { ...formData };
      partyData.openBalance = Number(partyData.openBalance);
      await dispatch(createParty(partyData)).unwrap();
      toast({
        title: "Party created successfully",
        variant:"success"
      });
      navigate('/parties')
    } catch (error) {
      toast({
        title: "Party creation failed",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Create Party</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="text-gray-600">
            <Settings className="h-4 w-4 mr-2" />
            Party Settings
          </Button>
          <Button variant="outline" size="sm" onClick={handleSubmit} disabled={createPartyStatus === "loading"}>
            {createPartyStatus === "loading" ? "Saving..." : "Save & New"}
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={createPartyStatus === "loading"}>
            {createPartyStatus === "loading" ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-lg font-medium mb-4">General Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Party Name*</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter name" required />
            </div>
            <div>
              <Label htmlFor="mob">Mobile Number</Label>
              <Input id="mob" name="mob" value={formData.mob} onChange={handleInputChange} placeholder="Enter mobile number" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Enter email" />
            </div>
            <div className="flex items-end space-x-2">
              <div className="flex-grow">
                <Label htmlFor="openBalance">Opening Balance</Label>
                <Input id="openBalance" name="openBalance" type="number" value={formData.openBalance} onChange={handleInputChange} placeholder="₹ 0" />
              </div>
              <Select value={formData.balance_type} onValueChange={(value) => handleSelectChange("balance_type", value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collect">To Collect</SelectItem>
                  <SelectItem value="pay">To Pay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="gstin">GSTIN</Label>
            <div className="flex space-x-2">
              <Input id="gstin" name="gstin" value={formData.gstin} onChange={handleInputChange} placeholder="ex: 29XXXXX9438X1XX" />
            </div>
          </div>
          <div>
            <Label htmlFor="panNumber">PAN Number</Label>
            <Input id="panNumber" name="panNumber" value={formData.panNumber} onChange={handleInputChange} placeholder="Enter party PAN Number" />
          </div>
          <div>
            <Label htmlFor="drugLicenseNumber">Drug License Number</Label>
            <Input 
              id="drugLicenseNumber" 
              name="DLNumber" 
              value={formData.DLNumber} 
              onChange={handleInputChange} 
              placeholder="Enter Drug License Number" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="partyType">Party Type*</Label>
            <Select value={formData.partyType} onValueChange={(value) => handleSelectChange("partyType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Party Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="billingAddress">Billing Address</Label>
              <textarea
                id="billingAddress"
                name="address"
                className="w-full min-h-[100px] p-2 border rounded-md"
                placeholder="Enter billing address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="shippingAddress">Shipping Address</Label>
                <div className="flex items-center">
                  <Checkbox 
                    id="sameAsBilling" 
                    checked={formData.sameAsBilling}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <label htmlFor="sameAsBilling" className="ml-2 text-sm text-gray-600">
                    Same as Billing address
                  </label>
                </div>
              </div>
              <textarea
                id="shippingAddress"
                name="shipping_address"
                className={`w-full min-h-[100px] p-2 border rounded-md ${formData.sameAsBilling ? 'bg-gray-100' : ''}`}
                placeholder="Enter shipping address"
                disabled={formData.sameAsBilling}
                value={formData.shipping_address}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="creditPeriod">Credit Period</Label>
            <div className="flex items-center space-x-2">
              <Input id="creditPeriod" name="credit_period" type="number" value={formData.credit_period} onChange={handleInputChange} className="w-24" />
              <span>Days</span>
            </div>
          </div>
          <div>
            <Label htmlFor="creditLimit">Credit Limit</Label>
            <Input id="creditLimit" name="credit_limit" type="number" value={formData.credit_limit} onChange={handleInputChange} placeholder="₹ 0" />
          </div>
        </div>
      </form>
    </div>
  )
}
