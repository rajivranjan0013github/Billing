import React, { useState, useEffect } from 'react';
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Card } from "../../ui/card";
import { ScrollArea } from "../../ui/scroll-area";
import { Badge } from "../../ui/badge";
import { Search, Filter, ArrowUpDown, Plus, CircleCheckBig } from "lucide-react";
import { useSelector, useDispatch } from 'react-redux';
import { fetchItems } from '../../../redux/slices/inventorySlice';
import ManageInventory from '../inventory/ManageInventory';
import {convertQuantity} from '../../../assets/Data'

const InventoryList = ({ onItemSelect, selectedItemId, setHasItems }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch();
  const { items, itemsStatus } = useSelector(state => state.inventory);
  const [isManageInventoryOpen, setIsManageInventoryOpen] = useState(false);

  useEffect(() => {
    if(itemsStatus === 'idle'){
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
    <ScrollArea className="h-[100vh] pr-3">
      {/* Header - reduced font sizes */}
      <div className="flex justify-between mb-2">
        <div>
          <h2 className="text-xl font-semibold">Stock on hand</h2>
          <p className="text-xs text-muted-foreground">SKU: 3</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold">₹22,022.11</h2>
          <p className="text-xs text-muted-foreground">Stock Value</p>
        </div>
      </div>

      {/* Search and Filter Section - more compact */}
      <div className="flex gap-3 mb-4">
        <Button 
          variant="outline" 
          className="w-[180px] justify-between text-sm"
        >
          <Filter className="h-3 w-3" />
          FILTER BY
        </Button>
        <Button 
          variant="outline" 
          className="w-[180px] justify-between text-sm"
        >
          <ArrowUpDown className="h-3 w-3" />
          SORT BY
        </Button>
        <Button onClick={() => setIsManageInventoryOpen(true)}>Add New Item</Button>
      </div>

      {/* Search Bar - more compact */}
      <div className="mb-2 px-1">
        <p className="text-sm font-medium mb-1">PRODUCT</p>
        <div className="relative">
          <Input
            placeholder="Search for Pharma Products"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Updated Inventory Items List */}
      <div className="space-y-2">
        {items.map((item) => (
          <Card 
            key={item?._id} 
            className={`p-3 rounded-none cursor-pointer hover:bg-accent ${
              selectedItemId === item?._id ? 'bg-accent' : ''
            }`}
            onClick={() => onItemSelect(item?._id)}
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-muted flex items-center justify-center rounded-md">
                <div className="text-red-500 text-sm">Rx</div>
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center gap-1">
                  <span className="font-medium">{item?.name}</span>
                  <CircleCheckBig className="h-3 w-3 text-blue-500" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {item?.mfcName}
                </p>
                <div className='flex items-center gap-2'>
                  <Badge variant={item?.quantity > 0 ? "success" : "destructive"} className="mt-1 h-5 text-xs">
                    {item?.quantity > 0 ? "In Stock" : "Out of Stock"}
                  </Badge>
                  <p className="text-sm mt-1">
                    Pack of {item?.pack}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-medium">₹{item.mrp}</p>
                <p className="text-xs text-muted-foreground">
                  Exp: {item?.expiry}
                </p>
                <p className="text-sm font-medium">
                  {item?.quantity ? convertQuantity(item.quantity, item.pack) : ""}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ManageInventory 
        open={isManageInventoryOpen} 
        onOpenChange={setIsManageInventoryOpen}
      />
    </ScrollArea>
  );
};

export default InventoryList;