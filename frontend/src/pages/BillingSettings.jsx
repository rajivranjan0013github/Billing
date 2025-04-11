import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, updateSettings } from '../redux/slices/settingsSlice';
import { Switch } from '../components/ui/switch';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { X, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BillingSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {toast} = useToast();
  const { settings, status, updateStatus } = useSelector((state) => state.settings);
  const [localSettings, setLocalSettings] = useState({
    adjustment: false,
    doctors: [],
  });
  const [newDoctor, setNewDoctor] = useState("");

  useEffect(() => {
    setLocalSettings({
      adjustment: settings?.adjustment,
      doctors: settings?.doctors || [],
    });
  }, [settings]);

  useEffect(() => {
    if(status === 'idle') {
        dispatch(fetchSettings());
    }
  }, [settings]);

  const handleAdjustmentToggle = (checked) => {
    setLocalSettings(prev => ({
      ...prev,
      adjustment: checked
    }));
  };

  const handleAddDoctor = (e) => {
    e.preventDefault();
    if (newDoctor.trim()) {
      setLocalSettings(prev => ({
        ...prev,
        doctors: [...prev.doctors, newDoctor.trim()]
      }));
      setNewDoctor("");
    }
  };

  const handleRemoveDoctor = (index) => {
    setLocalSettings(prev => ({
      ...prev,
      doctors: prev.doctors.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    try {
      await dispatch(updateSettings(localSettings)).unwrap();
      toast({
        title: "Settings saved",
        description: "Your billing settings have been updated successfully.",
        variant: 'success'
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
      <div className='flex justify-between items-center border-b border-gray-200 px-6 py-3'>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Billing Config</h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateStatus === 'loading'}
          size='sm'
        >
          {updateStatus === 'loading' ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
      <div className="p-6">
        <Card className="max-w-xl mb-6">
          <CardHeader>
            <h3 className="text-lg font-medium">Adjustment Settings</h3>
            <p className="text-sm text-muted-foreground">Configure billing adjustment options</p>
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

        <Card className="max-w-xl">
          <CardHeader>
            <h3 className="text-lg font-medium">Doctor Name</h3>
            <p className="text-sm text-muted-foreground">Add and manage doctor names for billing</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <form onSubmit={handleAddDoctor} className="flex space-x-2">
                <Input
                  value={newDoctor}
                  onChange={(e) => setNewDoctor(e.target.value)}
                  placeholder="Enter doctor name"
                  className="flex-grow"
                />
                <Button type="submit" disabled={!newDoctor.trim()}>
                  <Plus size={16} />
                </Button>
              </form>
              <ScrollArea className="h-[150px] w-full border rounded-md p-4">
                {localSettings.doctors?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {localSettings.doctors.map((doctor, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm py-1 px-2 flex items-center space-x-1"
                      >
                        <span>{doctor}</span>
                        <button
                          onClick={() => handleRemoveDoctor(index)}
                          className="ml-1 text-gray-500 hover:text-red-500 focus:outline-none"
                        >
                          <X size={14} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No doctors added yet.</p>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingSettings;