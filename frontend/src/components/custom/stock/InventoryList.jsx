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

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Stock on hand</h2>
          <p className="text-xs text-muted-foreground">SKU: {items.length}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold">
            ₹
            {items
              .reduce(
                (acc, item) => acc + item.mrp * (item.quantity / item.pack),
                0
              )
              .toFixed(2)}
          </h2>
          <p className="text-xs text-muted-foreground">Stock Value</p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="space-y-3 mb-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 justify-between text-sm h-9"
          >
            <Filter className="h-3 w-3" />
            FILTER BY
          </Button>
          <Button
            variant="outline"
            className="flex-1 justify-between text-sm h-9"
          >
            <ArrowUpDown className="h-3 w-3" />
            SORT BY
          </Button>
        </div>
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
        <p className="text-sm font-medium mb-2">PRODUCT</p>
        <div className="relative">
          <Input
            placeholder="Search for Pharma Products"
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
          {items.map((item) => (
            <Card
              key={item?._id}
              className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                selectedItemId === item?._id ? "bg-accent" : ""
              }`}
              onClick={() => onItemSelect(item?._id)}
            >
              <div className="flex gap-3">
                <div className="w-14 h-14 bg-muted flex items-center justify-center rounded-md shrink-0">
                  <div className="text-red-500 text-sm">Rx</div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="font-medium truncate">{item?.name}</span>
                    <CircleCheckBig className="h-3 w-3 text-blue-500 shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {item?.mfcName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={item?.quantity > 0 ? "success" : "destructive"}
                      className="h-5 text-xs whitespace-nowrap"
                    >
                      {item?.quantity > 0 ? "In Stock" : "Out of Stock"}
                    </Badge>
                    <p className="text-xs truncate">Pack of {item?.pack}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-medium">₹{item.mrp}</p>
                  <p className="text-xs text-muted-foreground">
                    Exp: {item?.expiry}
                  </p>
                  <p className="text-sm font-medium">
                    {item?.quantity
                      ? convertQuantity(item.quantity, item.pack)
                      : ""}
                  </p>
                </div>
              </div>
            </Card>
          ))}
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
