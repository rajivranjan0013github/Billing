import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "../../ui/table";
import { Separator } from "../../ui/separator";
import { Checkbox } from "../../ui/checkbox";
import { useDispatch, useSelector } from "react-redux";
import { fetchItems } from "../../../redux/slices/inventorySlice";
import AddItemDialog from "../itemMaster/AddItemDialog";
import { formatQuantityDisplay } from "../../../assets/utils";
import { calculateQuantityValue } from "../../../assets/utils";

const SelectPurchaseItemDialog = ({ open, onOpenChange, onSelectItem }) => {
  const dispatch = useDispatch();
  const { items, itemsStatus } = useSelector((state) => state.inventory);  
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);

  useEffect(() => {
    if (itemsStatus === "idle") {
      dispatch(fetchItems());
    }
  }, [dispatch, itemsStatus]);

  useEffect(() => {
    const filtered = items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [items, searchQuery]);

  const handleItemSelect = (item) => {
    setSelectedItems((prev) => {
      const isSelected = prev.find((i) => i._id === item._id);
      if (isSelected) {
        setQuantities(prevQuantities => {
          const { [item._id]: removed, ...rest } = prevQuantities;
          return rest;
        });
        return prev.filter((i) => i._id !== item._id);
      }
      setQuantities(prev => ({
        ...prev,
        [item._id]: ''
      }));
      return [...prev, item];
    });
  };

  const handleQuantityChange = (inventoryId, value) => {
    setQuantities(prev => ({
      ...prev,
      [inventoryId]: value
    }));
  };

  const handleDone = () => {
    const itemsWithQuantities = selectedItems.map(item => ({
      ...item,
      qty: quantities[item._id]?.toString() || "1"
    }));
    
    onSelectItem(itemsWithQuantities);
    setSelectedItems([]);
    setQuantities({});
    onOpenChange(false);
  };

  const calculateTotalAmount = () => 
    selectedItems.reduce((total, item) => {
      let value = 0;
      let price = item.purchase_info?.price_per_unit || 0;
      if(quantities[item._id]){
        value = calculateQuantityValue(quantities[item._id], item?.secondary_unit?.conversion_rate) * price;
      }
      return total + value;
    }, 0);

  const getDisplayItems = () => 
    showSelectedOnly 
      ? filteredItems.filter(item => selectedItems.some(selected => selected._id === item._id))
      : filteredItems;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] w-[90vw] max-h-[80vh] min-h-[80vh] gap-3 rounded-lg p-0 flex flex-col">
        <DialogHeader className="px-4 pt-4 shrink-0">
          <DialogTitle>Select Items for Purchase</DialogTitle>
        </DialogHeader>
        <Separator />
        
        <div className="px-4 flex-grow overflow-y-auto space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button size="sm"className="shrink-0"onClick={() => setShowAddItemDialog(true)}>Create New Item</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Pack</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead className="w-[180px]">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getDisplayItems().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-gray-500">No items found</p>
                        <Button 
                          size="sm" 
                          onClick={() => setShowAddItemDialog(true)}
                        >
                          Create New Item
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  getDisplayItems().map((item) => {
                    const isSelected = selectedItems.some((i) => i._id === item._id);
                    const purchasePrice = item.purchase_info?.price_per_unit || 0;
                    const taxIncluded = item.purchase_info?.is_tax_included || false;
                    
                    return (
                      <TableRow   key={item._id}  className="cursor-pointer hover:bg-gray-50"  onClick={() => handleItemSelect(item)}>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleItemSelect(item)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item?.manufacturer_name || "_"}</TableCell>
                        <TableCell>{item?.pack || "_"}</TableCell>
                        <TableCell>₹{purchasePrice} {taxIncluded ? "(GST Incl.)" : ""}</TableCell>
                        <TableCell>{formatQuantityDisplay(item.quantity, item.unit, item?.secondary_unit, true)}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {isSelected ? (
                           <div className="flex items-center gap-2">
                             <Input
                              type="text"
                              value={quantities[item._id] || ""}
                              onChange={(e) => handleQuantityChange(item._id, e.target.value)}
                              className="w-20 text-center"
                              min="1"
                              step="1"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <p>{item.unit}</p>
                           </div>
                          ) : (
                            <Button 
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemSelect(item);
                              }}
                            >
                              Select
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Separator className="mt-2" />
        <DialogFooter className="px-4 py-2 shrink-0">
          <div className="flex justify-between w-full">
            <div className="space-y-1">
              <div 
                className="text-sm text-blue-600 cursor-pointer hover:text-blue-700"
                onClick={() => setShowSelectedOnly(!showSelectedOnly)}
              >
                {showSelectedOnly 
                  ? "View all items" 
                  : `Show ${selectedItems.length} items selected`
                }
              </div>
              {selectedItems.length > 0 && (
                <div className="text-sm font-medium">
                  Total Amount: ₹{calculateTotalAmount().toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              )}
            </div>
            <div className="space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={handleDone}
                disabled={selectedItems.length === 0}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>

      <AddItemDialog 
        isOpen={showAddItemDialog} 
        onClose={() => setShowAddItemDialog(false)} 
      />
    </Dialog>
  );
};

export default SelectPurchaseItemDialog; 