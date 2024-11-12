import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Search, Plus, Minus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "../../ui/table";
import { Separator } from "../../ui/separator";
import { Checkbox } from "../../ui/checkbox";
import { useDispatch, useSelector } from "react-redux";
import { fetchItems } from "../../../redux/slices/inventorySlice";
import AddItemDialog from "../itemMaster/AddItemDialog";

const SelectItemDialog = ({ open, onOpenChange, onSelectItem, mode = "sale" }) => {
  const dispatch = useDispatch();
  const { items, itemsStatus } = useSelector((state) => state.inventory);  
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);

  const quantityInputRefs = useRef({});

  const getDisplayPrice = (item) => {
    if (mode === "sale") {
      return item.sales_info?.price_per_unit || 0;
    }
    return item.purchase_info?.price_per_unit || 0;
  };

  useEffect(() => {
    if (itemsStatus === "idle") {
      dispatch(fetchItems());
    }
  }, [dispatch, itemsStatus]);

  useEffect(() => {
    setFilteredItems(items);
  }, [items]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = items.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  const handleItemSelect = (item) => {
    setSelectedItems((prev) => {
      const isSelected = prev.find((i) => i._id === item._id);
      if (isSelected) {
        setQuantities(prevQuantities => {
          const { [item._id]: removed, ...rest } = prevQuantities;
          return rest;
        });
        return prev.filter((i) => i._id !== item._id);
      } else {
        setQuantities(prev => ({
          ...prev,
          [item._id]: 1
        }));
        setTimeout(() => {
          quantityInputRefs.current[item._id]?.focus();
        }, 0);
        return [...prev, item];
      }
    });
  };

  const handleQuantityChange = (itemId, value) => {
    const numValue = parseInt(value) || 1;
    const item = filteredItems.find(item => item._id === itemId);
    
    if (mode === "sale") {
      // For sales: Limit by available stock
      const maxStock = item?.quantity || 0;
      setQuantities(prev => ({
        ...prev,
        [itemId]: Math.max(1, Math.min(numValue, maxStock))
      }));
    } else {
      // For purchase: No upper limit
      setQuantities(prev => ({
        ...prev,
        [itemId]: Math.max(1, numValue)
      }));
    }
  };

  const incrementQuantity = (itemId) => {
    const item = filteredItems.find(item => item._id === itemId);
    
    setQuantities(prev => {
      const currentQty = prev[itemId] || 1;
      if (mode === "sale") {
        // For sales: Check stock limit
        const maxStock = item?.quantity || 0;
        return {
          ...prev,
          [itemId]: Math.min(currentQty + 1, maxStock)
        };
      } else {
        // For purchase: No upper limit
        return {
          ...prev,
          [itemId]: currentQty + 1
        };
      }
    });
  };

  const decrementQuantity = (itemId) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max((prev[itemId] || 1) - 1, 1)
    }));
  };

  const handleDone = () => {
    const itemsWithQuantities = selectedItems.map(item => ({
      ...item,
      qty: quantities[item._id] || 1
    }));
    onSelectItem(itemsWithQuantities);
    setSelectedItems([]);
    setQuantities({});
    onOpenChange(false);
  };

  const calculateTotalAmount = () => {
    return selectedItems.reduce((total, item) => {
      const quantity = quantities[item._id] || 1;
      const price = getDisplayPrice(item);
      return total + (quantity * price);
    }, 0);
  };

  const getDisplayItems = () => {
    if (showSelectedOnly) {
      return filteredItems.filter(item => 
        selectedItems.some(selected => selected._id === item._id)
      );
    }
    return filteredItems;
  };

  // Function to get the appropriate price based on mode
  const getItemPrice = (item) => {
    if (mode === "sale") {
      return item.sales_info?.price_per_unit || 0;
    }
    return item.purchase_info?.price_per_unit || 0;
  };

  // Function to check if item can be selected based on mode
  const canSelectItem = (item) => {
    if (mode === "sale") {
      return item.quantity > 0; // Only allow selection if stock available
    }
    return true; // Always allow selection for purchase
  };

  // Modify the table to show relevant information
  const renderTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Manufacturer</TableHead>
          <TableHead>{mode === "sale" ? "Sale Price" : "Purchase Price"}</TableHead>
          <TableHead>Current Stock</TableHead>
          <TableHead className="w-[180px]">Quantity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {getDisplayItems().map((item) => {
          const isSelected = selectedItems.some((i) => i._id === item._id);
          const itemPrice = getItemPrice(item);
          const isDisabled = mode === "sale" && item.quantity <= 0;
          
          return (
            <TableRow 
              key={item._id}
              className={`cursor-pointer hover:bg-gray-50 ${isDisabled ? 'opacity-50' : ''}`}
              onClick={() => !isDisabled && handleItemSelect(item)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => !isDisabled && handleItemSelect(item)}
                  disabled={isDisabled}
                />
              </TableCell>
              <TableCell className="font-medium">
                {item.name}
                {mode === "sale" && item.quantity <= 0 && (
                  <span className="text-xs text-red-500 ml-2">(Out of Stock)</span>
                )}
              </TableCell>
              <TableCell>{item?.manufacturer_name || "_"}</TableCell>
              <TableCell>₹{itemPrice}</TableCell>
              <TableCell>{item.quantity || 0} {item.unit}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                {isSelected ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        decrementQuantity(item._id);
                      }}
                      disabled={quantities[item._id] <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      ref={el => quantityInputRefs.current[item._id] = el}
                      type="number"
                      min="1"
                      max={mode === "sale" ? item.quantity : undefined}
                      value={quantities[item._id] || 1}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(item._id, e.target.value);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-16 h-8 text-center"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        incrementQuantity(item._id);
                      }}
                      disabled={mode === "sale" && quantities[item._id] >= item.quantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
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
                    disabled={isDisabled}
                  >
                    Select
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] w-[90vw] max-h-[80vh] min-h-[80vh] gap-3 rounded-lg p-0 flex flex-col">
        <DialogHeader className="px-4 pt-4 shrink-0">
          <DialogTitle>Select Item for {mode === "sale" ? "Sale" : "Purchase"}</DialogTitle>
        </DialogHeader>
        <Separator />
        
        <div className="px-4 flex-grow overflow-y-auto space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button 
              size="sm"
              className="shrink-0"
              onClick={() => setShowAddItemDialog(true)}
            >
              Create New Item
            </Button>
          </div>

          <div className="rounded-md border">
            {renderTable()}
          </div>
        </div>

        {/* Footer Section */}
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

export default SelectItemDialog;