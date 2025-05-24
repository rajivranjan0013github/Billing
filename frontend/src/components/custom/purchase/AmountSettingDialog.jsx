import { Label } from "../../ui/label";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { convertToFraction } from "../../../assets/Data";
import { Separator } from "../../ui/separator";

const AmountSettingsDialog = ({
  open,
  onOpenChange,
  value,
  onChange,
  products,
  setProducts,
  calculateProductAmount,
}) => {
  const handleModeChange = (newMode) => {
    // First update the mode
    onChange(newMode);

    // Then recalculate amounts for all existing products using the passed function
    if (products && products.length > 0 && typeof calculateProductAmount === 'function') {
      setProducts(
        products.map((product) => {
          // The calculateProductAmount function now expects the product and the new mode
          const newAmount = calculateProductAmount(product, newMode);
          return {
            ...product,
            // convertToFraction should be applied here if the main function returns a raw number
            amount: convertToFraction(newAmount),
          };
        })
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} hideCloseButton>
      <DialogContent className="p-0 gap-0">
        <DialogHeader className="px-6 py-4 flex flex-row items-center justify-between bg-gray-100 border-b">
          <div className="space-y-0.5">
            <DialogTitle className="text-xl font-semibold">Amount Calculation Settings</DialogTitle>
          </div>
        </DialogHeader>
        <Separator />

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                How should the amount be calculated for each product?
              </Label>
              <RadioGroup
                className="space-y-3"
                value={value}
                onValueChange={handleModeChange}
              >
                <Label
                  htmlFor="settings-exclusive"
                  className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer transition-colors ${
                    value === "exclusive" ? "bg-blue-100" : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleModeChange("exclusive")}
                >
                  <RadioGroupItem value="exclusive" id="settings-exclusive" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Rate</div>
                    <div className="text-sm text-gray-500">
                      Shows pure rate × quantity without any adjustments
                    </div>
                  </div>
                </Label>

                <Label
                  htmlFor="settings-inclusive_all"
                  className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer transition-colors ${
                    value === "inclusive_all" ? "bg-blue-100" : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleModeChange("inclusive_all")}
                >
                  <RadioGroupItem
                    value="inclusive_all"
                    id="settings-inclusive_all"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Discounted Rate</div>
                    <div className="text-sm text-gray-500">
                      Shows rate after applying discount × quantity
                    </div>
                  </div>
                </Label>

                <Label
                  htmlFor="settings-inclusive_gst"
                  className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer transition-colors ${
                    value === "inclusive_gst" ? "bg-blue-100" : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleModeChange("inclusive_gst")}
                >
                  <RadioGroupItem
                    value="inclusive_gst"
                    id="settings-inclusive_gst"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Discounted Rate + GST</div>
                    <div className="text-sm text-gray-500">
                      Shows rate after discount and GST × quantity
                    </div>
                  </div>
                </Label>
              </RadioGroup>
            </div>
          </div>
        </div>

        <div className="p-3 bg-gray-50 text-xs text-gray-600 flex items-center justify-center gap-3 border-t">
          <span>Select Option - ↑↓</span>
          <span>|</span>
          <span>Confirm - Enter</span>
          <span>|</span>
          <span>Close - ESC</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AmountSettingsDialog;
