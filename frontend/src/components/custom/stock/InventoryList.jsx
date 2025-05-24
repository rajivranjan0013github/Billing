import React, { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Card } from "../../ui/card";
import { ScrollArea } from "../../ui/scroll-area";
import { Badge } from "../../ui/badge";
import {
  Search,
  Plus,
  EllipsisVertical,
  Upload,
  Download,
  ArrowLeft
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { useSelector, useDispatch } from "react-redux";
import { fetchItems } from "../../../redux/slices/inventorySlice";
import { exportInventory } from "../../../redux/slices/exportImportSlice";
import ManageInventory from "../inventory/ManageInventory";
import ExportDataDlg from "../mirgration/ExportDataDlg";
import ImportDataDlg from "../mirgration/ImportDataDlg";
import { convertQuantity } from "../../../assets/Data";
import { useNavigate } from "react-router-dom";
import { importInventory } from "../../../redux/slices/exportImportSlice";

// Export configuration
const exportColumns = [
  { header: 'Name', field: 'name', width: 30, required: true },
  { header: 'Pack', field: 'pack', width: 15},
  { header: 'Unit', field: 'unit', width: 15},
  { header: 'Code', field: 'code', width: 15},
  { header: 'Category', field: 'category', width: 20 },
  { header: 'Manufacturer', field: 'mfcName', width: 25 },
  { header: 'Composition', field: 'composition', width: 30 },
  { header: 'Location', field: 'location', width: 20 },
  { header: 'Batch Number', field: 'batchNumber', width: 20 },
  { header: 'HSN', field: 'HSN', width: 15 },
  { header: 'Quantity', field: 'quantity', width: 15 },
  { header: 'Expiry', field: 'expiry', width: 15 },
  { header: 'MRP', field: 'mrp', width: 15, format: 'currency' },
  { header: 'GST', field: 'gstPer', width: 15 },
  { header: 'Purchase Rate', field: 'purchaseRate', width: 20, format: 'currency' },
  { header: 'Sale Rate', field: 'saleRate', width: 20, format: 'currency' },
];

const exportFormatters = {
  'MRP': (value) => `₹${value}`,
  'Purchase Rate': (value) => `₹${value}`,
  'Sale Rate': (value) => `₹${value}`,
};

const InventoryList = ({ onItemSelect, selectedItemId, setHasItems }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items} = useSelector((state) => state.inventory);
  const [isManageInventoryOpen, setIsManageInventoryOpen] = useState(false);
  const { importStatus } = useSelector((state) => state.exportImport);

  useEffect(() => {
      dispatch(fetchItems());
  }, [dispatch]);

  useEffect(() => {
    if(importStatus === "succeeded") {
      dispatch(fetchItems());
    }
  }, [importStatus, dispatch]);

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
  }).sort((a, b) => {
    // If both items have quantity <= 0 or both have quantity > 0, maintain original order
    if ((a.quantity <= 0 && b.quantity <= 0) || (a.quantity > 0 && b.quantity > 0)) {
      return 0;
    }
    // If a has quantity <= 0, move it to the end
    if (a.quantity <= 0) {
      return 1;
    }
    // If b has quantity <= 0, move it to the end
    return -1;
  });

  // Custom validation for inventory import
  const customValidation = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      return "No data found in the Excel file";
    }

    // Add any specific validation rules here
    return null;
  };

  return (
    <div className="flex flex-col h-full p-2">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">Inventory</h1>
      </div>
      <div className="mb-4 flex flex-row gap-4 items-center">
        <div className="relative w-[95%]">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-8"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsManageInventoryOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsExportOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors rounded-none ${
                  selectedItemId === item?._id ? "bg-accent hover:bg-accent" : ""
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
                    </div>
                    <p className="text-xs text-muted-foreground truncate font-semibold">
                      {item?.mfcName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      
                      <p className="text-xs truncate">Pack of {item?.pack}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 justify-center">
                    <Badge
                        variant={item?.quantity > 0 ? "success" : "destructive"}
                        
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

      <ExportDataDlg
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        columns={exportColumns}
        fileName="inventory_report"
        title="Export Inventory"
        formatters={exportFormatters}
        fetchData={exportInventory}
        isFetchData={true}
      />

      <ImportDataDlg
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        importFunction={importInventory}
        title="Import Inventory"
        columns={exportColumns}
        customValidation={customValidation}
      />
    </div>
  );
};

export default InventoryList;
