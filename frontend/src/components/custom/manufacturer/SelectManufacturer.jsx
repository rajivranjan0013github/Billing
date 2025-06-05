import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Store, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { useSelector, useDispatch } from "react-redux";
import { fetchItems } from "../../../redux/slices/inventorySlice";
import { ScrollArea } from "../../ui/scroll-area";
import { Separator } from "../../ui/separator";

export default function SelectManufacturer({
  open,
  onOpenChange,
  onSelect,
  search,
  setSearch,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const { items: products, itemsStatus } = useSelector(
    (state) => state.inventory
  );
  const dispatch = useDispatch();
  const searchRef = useRef();

  useEffect(() => {
    if (itemsStatus === "idle") {
      dispatch(fetchItems());
    }
  }, [dispatch, itemsStatus]);

  // Get unique manufacturers from products
  const manufacturers = useMemo(() => {
    const uniqueMfcs = new Set();
    products?.forEach((product) => {
      if (product.mfcName) {
        uniqueMfcs.add(product.mfcName);
      }
    });
    return Array.from(uniqueMfcs).sort();
  }, [products]);

  // Filter manufacturers based on search
  const filteredManufacturers = manufacturers.filter((mfc) =>
    mfc.toLowerCase().includes(search?.toLowerCase())
  );

  // Update selectedId when dialog opens or filtered manufacturers change
  useEffect(() => {
    if (filteredManufacturers.length > 0) {
      setSelectedId(filteredManufacturers[0]);
    } else {
      setSelectedId(null);
    }
  }, [search, open, filteredManufacturers]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const currentIndex = filteredManufacturers.indexOf(selectedId);
      let newIndex;

      if (e.key === "ArrowDown") {
        newIndex =
          currentIndex < filteredManufacturers.length - 1
            ? currentIndex + 1
            : 0;
      } else {
        newIndex =
          currentIndex > 0
            ? currentIndex - 1
            : filteredManufacturers.length - 1;
      }

      const newSelectedId = filteredManufacturers[newIndex];
      setSelectedId(newSelectedId);

      // Scroll the new selected row into view
      document.getElementById(newSelectedId)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    } else if (e.key === "Enter" && selectedId) {
      // Handle selection
      handleSelect(selectedId);
      onOpenChange(false);
      setSearch("");
    } else if (e.key === "Escape") {
      onOpenChange(false);
      setSearch("");
    }
  };

  // Add handling for selection
  const handleSelect = (manufacturer) => {
    onSelect?.(manufacturer);
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0" onKeyDown={handleKeyDown}>
        <DialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
          <div>
            <DialogTitle className="text-base font-semibold">
              Select a Manufacturer
            </DialogTitle>
          </div>
        </DialogHeader>
        <Separator />

        <div className="py-2 px-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
            <Input
              autoFocus
              placeholder="Search manufacturers..."
              className="pl-8 h-8 text-sm border rounded-md focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              ref={searchRef}
            />
          </div>
        </div>

        <div className="px-2">
          <ScrollArea className="h-[400px] pr-2 py-1">
            <Table>
              <TableBody>
                {filteredManufacturers.map((manufacturer) => (
                  <TableRow
                    key={manufacturer}
                    id={manufacturer}
                    className={cn(
                      "cursor-pointer hover:bg-blue-50 transition-colors",
                      selectedId === manufacturer && "bg-blue-200"
                    )}
                    onClick={() => handleSelect(manufacturer)}
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center">
                        <Store className="h-4 w-4 mr-2 text-gray-500" />
                        <div className="font-medium">{manufacturer}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-500">
                      {
                        products.filter((p) => p.mfcName === manufacturer)
                          .length
                      }{" "}
                      products
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <div className="p-3 bg-gray-100 text-xs text-gray-600 flex items-center justify-center gap-3">
          <span>Navigate - ↑↓</span>
          <span>|</span>
          <span>Select - Enter</span>
          <span>|</span>
          <span>Close - ESC</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
