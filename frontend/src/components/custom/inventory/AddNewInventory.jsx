import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { Lightbulb } from "lucide-react";
import { useDispatch } from "react-redux";
import { manageInventory } from "../../../redux/slices/inventorySlice";
import { useToast } from "../../../hooks/use-toast";
import { MEDICINE_FORMS } from "../../../assets/Data";
import SearchSuggestion from "../custom-fields/CustomSearchSuggestion";

const FORMDATAINITIAL = {
  name: "",
  mfcName: "",
  mrp: "",
  pack: "",
  composition: "",
  medicine_form: "",
  form_primary_pack: 1,
};

// Convert MEDICINE_FORMS to format expected by SearchSuggestion
const medicineFormSuggestions = MEDICINE_FORMS.map((form) => ({
  _id: form.medicine_form,
  name: `${form.medicine_form}${
    form.short_medicine_form ? ` (${form.short_medicine_form})` : ""
  }`,
  ...form,
}));

export default function AddNewInventory({
  open,
  onOpenChange,
  inventoryDetails,
}) {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(FORMDATAINITIAL);
  const [categorySearchValue, setCategorySearchValue] = useState("");

  useEffect(() => {
    if (inventoryDetails) {
      const category = inventoryDetails.category || "";
      const form = MEDICINE_FORMS.find((f) => f.medicine_form === category);
      setFormData({
        name: inventoryDetails.name || "",
        mfcName: inventoryDetails.mfcName || "",
        mrp: inventoryDetails.mrp || "",
        pack: inventoryDetails.pack || "",
        composition: inventoryDetails.composition || "",
        medicine_form: category,
      });
      setCategorySearchValue(
        form
          ? `${form.medicine_form}${
              form.short_medicine_form ? ` (${form.short_medicine_form})` : ""
            }`
          : category
      );
    }
  }, [inventoryDetails]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const submitData = {
      ...formData,
      category: formData.medicine_form,
    };

    const action = inventoryDetails
      ? manageInventory({ ...submitData, _id: inventoryDetails._id })
      : manageInventory(submitData);

    dispatch(action)
      .unwrap()
      .then(() => {
        toast({
          title: inventoryDetails
            ? `Product updated successfully`
            : `New product added successfully`,
          variant: "success",
        });
        onOpenChange(false);
        if (!inventoryDetails) {
          setFormData(FORMDATAINITIAL);
          setCategorySearchValue("");
        }
      })
      .catch((error) => {
        toast({
          title: inventoryDetails
            ? `Failed to update product`
            : `Failed to add new product`,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleKeyDown = (e, nextInputId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextInput = document.getElementById(nextInputId);
      if (nextInput) nextInput.focus();
    }
  };

  const handleCategorySelect = (suggestion) => {
    const selectedForm = MEDICINE_FORMS.find(
      (form) => form.medicine_form === suggestion.medicine_form
    );
    setFormData((prev) => ({
      ...prev,
      medicine_form: selectedForm.medicine_form,
      pack: selectedForm?.form_primary_pack || 1,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {inventoryDetails ? "Edit Product" : "Create New Product"}
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
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              onKeyDown={(e) => handleKeyDown(e, "mfcName")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mfcName">
              Company Name<span className="text-red-500">*</span>
            </Label>
            <Input
              id="mfcName"
              placeholder="Enter Company Name"
              required
              value={formData.mfcName}
              onChange={(e) =>
                setFormData({ ...formData, mfcName: e.target.value })
              }
              onKeyDown={(e) => handleKeyDown(e, "medicine-form")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicine-form">
              Product Category<span className="text-red-500">*</span>
            </Label>
            <SearchSuggestion
              id="medicine-form"
              suggestions={medicineFormSuggestions}
              placeholder="Search or select category"
              value={categorySearchValue}
              setValue={setCategorySearchValue}
              onSuggestionSelect={handleCategorySelect}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
           

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
                onChange={(e) =>
                  setFormData({ ...formData, pack: e.target.value })
                }
                onKeyDown={(e) => handleKeyDown(e, "composition")}
              />
            </div>
            <div className="space-y-2">
            <Label htmlFor="composition">Composition</Label>
            <Input
              id="composition"
              placeholder="Enter Composition"
              onKeyDown={(e) => handleKeyDown(e, "submitButton")}
              value={formData.composition}
              onChange={(e) =>
                setFormData({ ...formData, composition: e.target.value })
              }
            />
          </div>
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
              onClick={(e) => {
                e.preventDefault();
                onOpenChange(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button id="submitButton" type="submit" disabled={isLoading}>
              {isLoading
                ? inventoryDetails
                  ? "Updating..."
                  : "Creating..."
                : inventoryDetails
                ? "Update"
                : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
