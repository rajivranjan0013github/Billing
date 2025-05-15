import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../hooks/use-toast";
import { s3Domain } from "../assets/Data";
import { Backend_URL } from "../assets/Data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchPharmacyInfo,
  updatePharmacyInfo,
} from "../redux/slices/pharmacySlice";
import { X, Plus, Upload } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";

const PharmacyInfo = () => {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const { pharmacyInfo, pharmacyInfoStatus, updateStatus } = useSelector(
    (state) => state.pharmacy
  );
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
    address: "",
    contactNumber: "",
    email: "",
    website: "",
    pharmacyId: "",
    gstNumber: "",
    drugLicenceNumber: "",
    itemExpiryThreshold: 3,
    itemCategories: [],
  });

  const [newCategory, setNewCategory] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    if (pharmacyInfoStatus === "idle") {
      dispatch(fetchPharmacyInfo());
    }
  }, [dispatch, pharmacyInfoStatus]);

  useEffect(() => {
    if (pharmacyInfo) {
      setFormData((prevData) => ({
        ...prevData,
        ...pharmacyInfo,
      }));
      setLogoPreview(null);
    }
  }, [pharmacyInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCategoryChange = (e, field) => {
    const categories = e.target.value.split(",").map((cat) => cat.trim());
    setFormData((prevData) => ({
      ...prevData,
      [field]: categories,
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return null;

    try {
      const response = await fetch(
        `${Backend_URL}/api/pharmacies/getUploadUrl`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload logo");
      }

      const data = await response.json();

      const res = await fetch(data.url, {
        method: "PUT",
        body: logoFile,
        headers: {
          "Content-Type": "image/png",
        },
      });
      if (!res.ok) {
        throw new Error("Failed to upload logo");
      } else {
        return `${s3Domain}/${data.key}`;
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Logo Upload Failed",
        description: "Failed to upload the logo. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const triggerLogoUpload = () => {
    document.getElementById("logo-upload").click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let updatedFormData = { ...formData };

      if (logoFile) {
        const logoUrl = await uploadLogo();
        if (logoUrl) {
          updatedFormData.logo = logoUrl;
        }
      }

      await dispatch(updatePharmacyInfo(updatedFormData)).unwrap();
      toast({
        variant: "success",
        title: "Updated Successfully",
        description: "Pharmacy information has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Unable to update",
        description: "Failed to update pharmacy information. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = (field) => {
    if (newCategory.trim()) {
      setFormData((prevData) => ({
        ...prevData,
        [field]: [...prevData[field], newCategory.trim()],
      }));
      setNewCategory("");
    }
  };

  const handleRemoveCategory = (field, index) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: prevData[field].filter((_, i) => i !== index),
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader className="border-b pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="mb-4 sm:mb-0">
            <CardTitle className="text-xl sm:text-2xl font-bold">
              Pharmacy Information Management
            </CardTitle>
            <CardDescription className="text-gray-500">
              Manage your pharmacy's details
            </CardDescription>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={updateStatus === "loading"}
            className="w-full sm:w-auto"
          >
            {updateStatus === "loading" ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="pharmacy" className="w-full">
          <TabsList className="grid w-full sm:w-1/2 grid-cols-2 mb-6">
            <TabsTrigger value="pharmacy" className="text-sm font-medium">
              <span className="hidden sm:inline">Pharmacy Information</span>
              <span className="sm:hidden">Pharmacy</span>
            </TabsTrigger>
            <TabsTrigger
              value="pharmacySetting"
              className="text-sm font-medium"
            >
              <span className="hidden sm:inline">Detailed Setting</span>
              <span className="sm:hidden">Detailed Setting</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pharmacy">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputField
                  label="Pharmacy ID"
                  name="pharmacyId"
                  value={formData.pharmacyId}
                  onChange={handleChange}
                  disabled
                />
                <InputField
                  label="Pharmacy Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <InputField
                  label="Contact Number"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                />
                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <InputField
                  label="Website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                />
                <InputField
                  label="GST Number"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                />
                <InputField
                  label="Drug Licence Number"
                  name="drugLicenceNumber"
                  value={formData.drugLicenceNumber}
                  onChange={handleChange}
                />
                <TextareaField
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-span-1">
                <div className="mb-6">
                  <Label htmlFor="logo-upload" className="text-sm font-medium">
                    Pharmacy Logo
                  </Label>
                  <div
                    className="mt-2 flex justify-center items-center rounded-lg border border-dashed border-gray-900/25 w-full sm:w-40 h-40 cursor-pointer"
                    onClick={triggerLogoUpload}
                  >
                    <div className="text-center">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="mx-auto h-32 w-32 object-cover"
                        />
                      ) : pharmacyInfo?.logoUsable ? (
                        <img
                          src={pharmacyInfo.logoUsable}
                          alt="Pharmacy Logo"
                          className="mx-auto h-32 w-32 object-cover"
                        />
                      ) : formData.logo ? (
                        <img
                          src={formData.logo}
                          alt="Pharmacy Logo"
                          className="mx-auto h-32 w-32 object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload
                            className="h-10 w-10 text-gray-300"
                            aria-hidden="true"
                          />
                          <span className="mt-2 block text-sm font-semibold text-gray-900">
                            Upload
                          </span>
                        </div>
                      )}
                      <input
                        id="logo-upload"
                        name="logo-upload"
                        type="file"
                        className="hidden"
                        onChange={handleLogoUpload}
                        accept="image/*"
                      />
                    </div>
                  </div>
                </div>
                <CategoryField
                  label="Pharmacy Service Categories"
                  categories={formData.pharmacyServiceCategories}
                  newCategory={newCategory}
                  setNewCategory={setNewCategory}
                  onAdd={() => handleAddCategory("pharmacyServiceCategories")}
                  onRemove={(index) =>
                    handleRemoveCategory("pharmacyServiceCategories", index)
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pharmacySetting"></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const InputField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
}) => (
  <div className="space-y-2">
    <Label htmlFor={name} className="text-sm font-medium">
      {label}
    </Label>
    <Input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={`Enter ${label.toLowerCase()}`}
      required={required}
      disabled={disabled}
      className="w-full"
    />
  </div>
);

const TextareaField = ({ label, name, value, onChange, required = false }) => (
  <div className="space-y-2">
    <Label htmlFor={name} className="text-sm font-medium">
      {label}
    </Label>
    <Textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={`Enter ${label.toLowerCase()}`}
      required={required}
      className="w-full"
    />
  </div>
);

const CategoryField = ({
  label,
  categories,
  newCategory,
  setNewCategory,
  onAdd,
  onRemove,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd();
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-col space-y-2">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Enter a new category"
            className="flex-grow"
          />
          <Button type="submit" disabled={!newCategory.trim()}>
            <Plus size={16} />
          </Button>
        </form>
        <ScrollArea className="h-[150px] w-full border rounded-md p-4">
          {categories?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((category, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-sm py-1 px-2 flex items-center space-x-1"
                >
                  <span>{category}</span>
                  <button
                    onClick={() => onRemove(index)}
                    className="ml-1 text-gray-500 hover:text-red-500 focus:outline-none"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No categories added yet.</p>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default PharmacyInfo;
