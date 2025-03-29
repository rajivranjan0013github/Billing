import React, { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Card } from "../../ui/card";
import { ScrollArea } from "../../ui/scroll-area";
import { Badge } from "../../ui/badge";
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  CircleCheckBig,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { fetchItems } from "../../../redux/slices/inventorySlice";
import ManageInventory from "../inventory/ManageInventory";
import { convertQuantity } from "../../../assets/Data";
import { formatCurrency } from "../../../utils/Helper"; 

const InventoryList = ({ onItemSelect, selectedItemId, setHasItems }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const dispatch = useDispatch();
  const { items, itemsStatus } = useSelector((state) => state.inventory);
  const [isManageInventoryOpen, setIsManageInventoryOpen] = useState(false);

  useEffect(() => {
    if (itemsStatus === "idle") {
      dispatch(fetchItems());
    }
  }, [dispatch, itemsStatus]);

  useEffect(() => {
    if (items.length > 0 && !selectedItemId) {
      onItemSelect(items[0]._id);
    }
  }, [items, selectedItemId, onItemSelect]);

  useEffect(() => {
    setHasItems(items.length > 0);
  }, [items, setHasItems]);

  // Filter items based on search query
  const filteredItems = items.filter((item) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      item?.name?.toLowerCase().includes(searchTerm) ||
      item?.mfcName?.toLowerCase().includes(searchTerm) ||
      item?.expiry?.toLowerCase().includes(searchTerm) ||
      item?.mrp?.toString().includes(searchTerm) ||
      item?.pack?.toString().includes(searchTerm)
    );
  });

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex justify-between mb-2">
        <div>
          <h2 className="text-xl font-semibold">Inventory Value</h2>
          <p className="text-xs text-muted-foreground">SKU: {items.length}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold">
            {formatCurrency(items.reduce((acc, item) => acc + item.mrp * (item.quantity / item.pack),0))}
          </h2>
          <p className="text-xs text-muted-foreground">total</p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="space-y-3 mb-2">
        <Button
          onClick={() => setIsManageInventoryOpen(true)}
          className="w-full h-9"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Item
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Input
            placeholder="Search by name, manufacturer, expiry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-8"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Inventory Items List */}
      <ScrollArea className="flex-1 -mx-4">
        <div className="px-4 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No items found matching your search.
            </div>
          ) : (
            filteredItems.map((item) => (
              <Card
                key={item?._id}
                className={`p-3 cursor-pointer hover:bg-accent transition-colors rounded-none ${
                  selectedItemId === item?._id ? "bg-accent" : ""
                }`}
                onClick={() => onItemSelect(item?._id)}
              >
                <div className="flex gap-3">
                  <div className="w-14 h-14 bg-muted flex items-center justify-center shrink-0">
                    <div className="text-red-500 text-sm">Rx</div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="font-medium truncate capitalize">{item?.name}</span>
                      <CircleCheckBig className="h-3 w-3 text-blue-500 shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {item?.mfcName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      
                      <p className="text-xs truncate">Pack of {item?.pack}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 justify-center">
                    <Badge
                        variant={item?.quantity > 0 ? "success" : "destructive"}
                        className="h-5 text-xs font-medium rounded-none"
                      >
                        {item?.quantity > 0 ? "In Stock" : "Out of Stock"}
                      </Badge>
                      <p className="text-sm font-medium">
                      {item?.quantity ? convertQuantity(item.quantity, item.pack) : ""}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <ManageInventory
        open={isManageInventoryOpen}
        onOpenChange={setIsManageInventoryOpen}
        inventoryDetails={null}
        setItemDetails={() => {
          dispatch(fetchItems());
        }}
        batchDetails={null}
        setUpdateBatchDetails={null}
      />
    </div>
  );
};

export default InventoryList;
