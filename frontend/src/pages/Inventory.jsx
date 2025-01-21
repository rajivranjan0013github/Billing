import React, { useState } from "react";
import InventoryList from "../components/custom/stock/InventoryList";
import InventoryDetails from "../components/custom/stock/InventoryDetails";
import { PackageX } from "lucide-react";

const Inventory = () => {
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [hasItems, setHasItems] = useState(true);

  return (
    <div className="grid grid-cols-7 gap-4 h-[100vh]">
      <div className="col-span-2 h-[100vh]">
        <InventoryList
          onItemSelect={setSelectedItemId}
          selectedItemId={selectedItemId}
          setHasItems={setHasItems}
        />
      </div>
      <div className="col-span-5 h-[100vh]">
        {!hasItems ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <PackageX className="h-12 w-12 mb-2" />
            <p className="text-lg">No items in inventory</p>
          </div>
        ) : (
          <InventoryDetails inventoryId={selectedItemId} />
        )}
      </div>
    </div>
  );
};
export default Inventory;
