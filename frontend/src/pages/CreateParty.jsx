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
    mobile_number: "",
    email: "",
    opening_balance: 0,
    balance_type: "collect",
    gstin: "",
    pan_number: "",
    party_type: "customer",
    party_category: "",
    billing_address: "",
    shipping_address: "",
    credit_period: 30,
    credit_limit: 0,
    sameAsBilling: false, // Add this new state
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
      shipping_address: checked ? prevData.billing_address : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createParty(formData)).unwrap();
      toast({
        title: "Party created successfully",
        description: "The new party has been added to the system.",
        variant:"success"
      });
      navigate('/parties')
      // Reset form or redirect to party list
    } catch (error) {
      toast({
        title: "Error creating party",
        description: error.message || "An error occurred while creating the party.",
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
              <Label htmlFor="mobile_number">Mobile Number</Label>
              <Input id="mobile_number" name="mobile_number" value={formData.mobile_number} onChange={handleInputChange} placeholder="Enter mobile number" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Enter email" />
            </div>
            <div className="flex items-end space-x-2">
              <div className="flex-grow">
                <Label htmlFor="opening_balance">Opening Balance</Label>
                <Input id="opening_balance" name="opening_balance" type="number" value={formData.opening_balance} onChange={handleInputChange} placeholder="₹ 0" />
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
              <Button variant="secondary">Get Details</Button>
            </div>
            <p className="text-sm text-gray-500 mt-1">Note: You can auto populate party details from GSTIN</p>
          </div>
          <div>
            <Label htmlFor="panNumber">PAN Number</Label>
            <Input id="panNumber" name="pan_number" value={formData.pan_number} onChange={handleInputChange} placeholder="Enter party PAN Number" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="partyType">Party Type*</Label>
            <Select value={formData.party_type} onValueChange={(value) => handleSelectChange("party_type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Party Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="partyCategory">Party Category</Label>
            <Select value={formData.party_category} onValueChange={(value) => handleSelectChange("party_category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category1">Category 1</SelectItem>
                <SelectItem value="category2">Category 2</SelectItem>
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
                name="billing_address"
                className="w-full min-h-[100px] p-2 border rounded-md"
                placeholder="Enter billing address"
                value={formData.billing_address}
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
