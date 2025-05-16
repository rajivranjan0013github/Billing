import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSettings, updateSettings } from "../redux/slices/settingsSlice";
import { Switch } from "../components/ui/switch";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BillingSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, status, updateStatus } = useSelector(
    (state) => state.settings
  );
  const [localSettings, setLocalSettings] = useState({
    adjustment: false,
  });

  useEffect(() => {
    setLocalSettings({
      adjustment: settings?.adjustment,
    });
  }, [settings]);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchSettings());
    }
  }, [settings]);

  const handleAdjustmentToggle = (checked) => {
    setLocalSettings((prev) => ({
      ...prev,
      adjustment: checked,
    }));
  };

  const handleSave = async () => {
    try {
      await dispatch(updateSettings(localSettings)).unwrap();
      toast({
        title: "Settings saved",
        description: "Your billing settings have been updated successfully.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Billing Config</h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateStatus === "loading"}
          size="sm"
        >
          {updateStatus === "loading" ? "Saving..." : "Save changes"}
        </Button>
      </div>
      <div className="p-6">
        <Card className="max-w-xl mb-6">
          <CardHeader>
            <h3 className="text-lg font-medium">Adjustment Settings</h3>
            <p className="text-sm text-muted-foreground">
              Configure billing adjustment options
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Enable Adjustment</label>
                <p className="text-sm text-muted-foreground">
                  Allow adjustments in billing calculations
                </p>
              </div>
              <Switch
                checked={localSettings?.adjustment}
                onCheckedChange={handleAdjustmentToggle}
                aria-label="Toggle adjustment"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingSettings;
