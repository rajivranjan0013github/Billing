import React, { useState, useEffect, useRef } from "react";
import { Search, PackageX, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Badge } from "../../ui/badge";
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
import AddNewInventory from "./AddNewInventory";
import { useSelector, useDispatch } from "react-redux";
import { fetchItems } from "../../../redux/slices/inventorySlice";
import { ScrollArea } from "../../ui/scroll-area";
import { Separator } from "../../ui/separator";

export default function ProductSelector({
  open,
  onOpenChange,
  onSelect,
  search,
  setSearch,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);
  const { items: products, itemsStatus } = useSelector(
    (state) => state.inventory
  );
  const dispatch = useDispatch();
  const searchRef = useRef();

  useEffect(() => {
    if (!newItemDialogOpen || !open) {
      setTimeout(() => {
        if (searchRef?.current) {
          searchRef?.current.focus();
        }
      }, 0);
    }
  }, [open, newItemDialogOpen]);

  useEffect(() => {
    if (itemsStatus === "idle") {
      dispatch(fetchItems());
    }
  }, [dispatch, itemsStatus]);

  // Global F2 shortcut handler
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === "F2" && open) {
        e.preventDefault();
        setNewItemDialogOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [open]);

  // Update selectedId when dialog opens or filtered products change
  useEffect(() => {
    const filteredProducts = products?.filter(
      (product) =>
        product.name?.toLowerCase().includes(search?.toLowerCase()) ||
        product.mfcName?.toLowerCase().includes(search?.toLowerCase())
    );
    // Set selectedId to the first item's ID if there are filtered results
    if (filteredProducts.length > 0) {
      setSelectedId(filteredProducts[0]._id);
    } else {
      setSelectedId(null);
    }
  }, [search, open, products]);

  const filteredProducts = products?.filter(
    (product) =>
      product.name?.toLowerCase().includes(search?.toLowerCase()) ||
      product.mfcName?.toLowerCase().includes(search?.toLowerCase())
  );

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const currentIndex = filteredProducts.findIndex(
        (p) => p._id === selectedId
      );
      let newIndex;

      if (e.key === "ArrowDown") {
        newIndex =
          currentIndex < filteredProducts.length - 1 ? currentIndex + 1 : 0;
      } else {
        newIndex =
          currentIndex > 0 ? currentIndex - 1 : filteredProducts.length - 1;
      }

      const newSelectedId = filteredProducts[newIndex]._id;
      setSelectedId(newSelectedId);

      // Scroll the new selected row into view
      document.getElementById(newSelectedId)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    } else if (e.key === "Enter") {
      // If there are no filtered products, open the new item dialog
      if (filteredProducts.length === 0) {
        setNewItemDialogOpen(true);
        return;
      }
      // Otherwise handle product selection as before
      if (selectedId) {
        handleSelect(filteredProducts.find((p) => p._id === selectedId));
        onOpenChange(false);
      }
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  // Add handling for selection
  const handleSelect = (product) => {
    onSelect?.(product);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-3xl p-0 gap-0"
          onKeyDown={handleKeyDown}
        >
          <DialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
            <div>
              <DialogTitle className="text-base font-semibold">
                Select a Product
              </DialogTitle>
            </div>
          </DialogHeader>
          <Separator />

          <div className=" py-2 px-4 flex justify-between">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
              <Input
                autoFocus
                placeholder="Search products..."
                className="pl-8 h-8 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 font-semibold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                ref={searchRef}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="px-2"
                onClick={() => setNewItemDialogOpen(true)}
              >
                <Plus className="h-3 w-3" />
                Add Product (F2)
              </Button>
            </div>
          </div>

          <div className="relative mx-4">
            <Table>
              <TableHeader className="sticky top-0  z-10">
                <TableRow>
                  <TableHead className="w-[30%] text-left text-sm font-semibold h-8">
                    PRODUCT NAME
                  </TableHead>
                  <TableHead className="w-[30%] text-left text-sm font-semibold h-8">
                    COMPANY
                  </TableHead>
                  <TableHead className="w-[10%] text-sm font-semibold text-center h-8">
                    PACK
                  </TableHead>
                  <TableHead className="w-[20%] text-sm font-semibold text-center h-8">
                    STATUS
                  </TableHead>
                  <TableHead className="w-[10%] text-sm font-semibold text-center h-8">
                    LOCATION
                  </TableHead>
                </TableRow>
              </TableHeader>
            </Table>

            <ScrollArea className="h-[400px] pr-2 py-1">
              <Table>
                <TableBody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <TableRow
                        key={product._id}
                        id={product._id}
                        className={cn(
                          "cursor-pointer hover:bg-blue-50 transition-colors",
                          selectedId === product._id && "bg-blue-200"
                        )}
                        onClick={() => handleSelect(product)}
                      >
                        <TableCell className="w-[30%] py-3">
                          <div className="font-medium">{product.name}</div>
                        </TableCell>
                        <TableCell className="w-[30%] py-3">
                          <div className="text-sm text-gray-600">
                            {product.mfcName}
                          </div>
                        </TableCell>
                        <TableCell className="w-[10%] py-3 text-center">
                          {product.pack}
                        </TableCell>
                        <TableCell className="w-[20%] py-3 text-center">
                          <Badge
                            variant={
                              product.quantity > 0 ? "success" : "destructive"
                            }
                          >
                            {product.quantity > 0 ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-[10%] py-3 text-center">
                          {product?.location}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-3">
                          <PackageX className="h-12 w-12 text-gray-400" />
                          <div className="text-gray-500">No products found</div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setNewItemDialogOpen(true);
                            }}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Add new product
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          <div className="p-3 bg-gray-100 text-xs text-gray-600 flex items-center justify-center gap-3">
            <span>Add New - F2</span>
            <span>|</span>
            <span>Navigate - ↑↓</span>
            <span>|</span>
            <span>Select - Enter</span>
            <span>|</span>
            <span>Close - ESC</span>
          </div>
        </DialogContent>
      </Dialog>

      <AddNewInventory
        open={newItemDialogOpen}
        onOpenChange={setNewItemDialogOpen}
        initialProductName={search}
      />
    </>
  );
}
