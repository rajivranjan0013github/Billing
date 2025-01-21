import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createParty } from "../redux/slices/partySlice";
import { ArrowLeft, Settings } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";

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
      await dispatch(createParty(partyData)).unwrap();
      toast({
        title: "Party created successfully",
        variant: "success",
      });
      navigate("/parties");
    } catch (error) {
      toast({
        title: "Party creation failed",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <header className="flex items-center justify-between mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-3 hover:bg-blue-50 text-blue-600"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create Supplier
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Add a new supplier to your business
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="text-gray-600 hover:bg-gray-50 border-gray-200"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSubmit}
            disabled={createPartyStatus === "loading"}
            className="hover:bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-300"
          >
            {createPartyStatus === "loading" ? "Saving..." : "Save & New"}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={createPartyStatus === "loading"}
            className="min-w-[100px] bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            {createPartyStatus === "loading" ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card className="p-6 border-l-4 border-l-blue-500 border-t-0 border-b-0 border-r-0 shadow-md hover:shadow-lg transition-all duration-200">
          <div className="flex items-center mb-6">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
              <span className="text-blue-600 font-medium">1</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-gray-900 font-medium">
                Supplier Name<span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter supplier name"
                required
                className="mt-1.5 bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-gray-400 hover:border-gray-400 shadow-sm"
              />
            </div>
            <div>
              <Label htmlFor="mob" className="text-gray-900 font-medium">
                Mobile Number
              </Label>
              <Input
                id="mob"
                name="mob"
                value={formData.mob}
                onChange={handleInputChange}
                placeholder="Enter mobile number"
                className="mt-1.5 bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-gray-400 hover:border-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-gray-900 font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email"
                className="mt-1.5 bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-gray-400 hover:border-gray-400"
              />
            </div>
            <div className="flex items-end space-x-3">
              <div className="flex-grow">
                <Label
                  htmlFor="openBalance"
                  className="text-gray-900 font-medium"
                >
                  Opening Balance
                </Label>
                <Input
                  id="openBalance"
                  name="openBalance"
                  type="number"
                  value={formData.openBalance}
                  onChange={handleInputChange}
                  placeholder="₹ 0"
                  className="mt-1.5 bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-gray-400 hover:border-gray-400"
                />
              </div>
              <Select
                value={formData.balance_type}
                onValueChange={(value) =>
                  handleSelectChange("balance_type", value)
                }
                className="w-[180px]"
              >
                <SelectTrigger className="border-gray-300 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500 hover:border-gray-400">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collect">To Collect</SelectItem>
                  <SelectItem value="pay">To Pay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-purple-500 border-t-0 border-b-0 border-r-0 shadow-md hover:shadow-lg transition-all duration-200">
          <div className="flex items-center mb-6">
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center mr-3">
              <span className="text-purple-600 font-medium">2</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Legal Information
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="gstin" className="text-gray-900 font-medium">
                GSTIN
              </Label>
              <Input
                id="gstin"
                name="gstin"
                value={formData.gstin}
                onChange={handleInputChange}
                placeholder="ex: 29XXXXX9438X1XX"
                className="mt-1.5 bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-gray-400 hover:border-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="panNumber" className="text-gray-900 font-medium">
                PAN Number
              </Label>
              <Input
                id="panNumber"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleInputChange}
                placeholder="Enter PAN Number"
                className="mt-1.5 bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-gray-400 hover:border-gray-400"
              />
            </div>
            <div>
              <Label
                htmlFor="drugLicenseNumber"
                className="text-gray-900 font-medium"
              >
                Drug License Number
              </Label>
              <Input
                id="drugLicenseNumber"
                name="DLNumber"
                value={formData.DLNumber}
                onChange={handleInputChange}
                placeholder="Enter DL Number"
                className="mt-1.5 bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-gray-400 hover:border-gray-400"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-green-500 border-t-0 border-b-0 border-r-0 shadow-md hover:shadow-lg transition-all duration-200">
          <div className="flex items-center mb-6">
            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center mr-3">
              <span className="text-green-600 font-medium">3</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Address</h2>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-gray-900 font-medium">
                Address Details
              </Label>
              <textarea
                id="address"
                name="address"
                className="w-full min-h-[120px] p-3 mt-1.5 bg-white border-gray-300 rounded-md focus:border-green-500 focus:ring-2 focus:ring-green-200 placeholder:text-gray-400 hover:border-gray-400 shadow-sm"
                placeholder="Enter complete address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-orange-500 border-t-0 border-b-0 border-r-0 shadow-md hover:shadow-lg transition-all duration-200">
          <div className="flex items-center mb-6">
            <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center mr-3">
              <span className="text-orange-600 font-medium">4</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Credit Terms
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label
                htmlFor="creditPeriod"
                className="text-gray-900 font-medium"
              >
                Credit Period
              </Label>
              <div className="flex items-center space-x-2 mt-1.5">
                <Input
                  id="creditPeriod"
                  name="credit_period"
                  type="number"
                  value={formData.credit_period}
                  onChange={handleInputChange}
                  className="w-32 bg-white border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 placeholder:text-gray-400 hover:border-gray-400 shadow-sm"
                />
                <span className="text-gray-700 bg-orange-50 px-3 py-2 rounded-md">
                  Days
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="creditLimit"
                className="text-gray-900 font-medium"
              >
                Credit Limit
              </Label>
              <Input
                id="creditLimit"
                name="credit_limit"
                type="number"
                value={formData.credit_limit}
                onChange={handleInputChange}
                placeholder="₹ 0"
                className="mt-1.5 bg-white border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 placeholder:text-gray-400 hover:border-gray-400 shadow-sm"
              />
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
