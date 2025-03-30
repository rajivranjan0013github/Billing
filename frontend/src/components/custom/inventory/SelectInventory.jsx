import React, { useState, useEffect, useRef } from "react"
import { Check, Search, X, PackageX, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog'
import { Input } from '../../ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table'
import { cn } from '../../../lib/utils'
import { Button } from "../../ui/button"
import AddNewInventory from './AddNewInventory'
import {useSelector, useDispatch} from 'react-redux'
import {fetchItems} from '../../../redux/slices/inventorySlice'
import { ScrollArea } from "../../ui/scroll-area"
import { Separator } from "../../ui/separator"
  
export default function ProductSelector({ open, onOpenChange, onSelect, search, setSearch }) {
  const [selectedId, setSelectedId] = useState(null);
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);
  const {items : products, itemsStatus} = useSelector(state => state.inventory);
  const dispatch = useDispatch();
  const searchRef = useRef();

  useEffect(() => {
    if(!newItemDialogOpen) {
      setTimeout(() => {
        if(searchRef?.current) {
          searchRef?.current.focus();
        }
      }, 0);
    }
  }, [newItemDialogOpen])
  
  useEffect(() => {
    if(itemsStatus === 'idle'){
      dispatch(fetchItems());
    }
  }, [dispatch, itemsStatus]);
  
  // Update selectedId when dialog opens or filtered products change
  useEffect(() => {
    const filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.mfcName.toLowerCase().includes(search.toLowerCase())
    );
    // Set selectedId to the first item's ID if there are filtered results
    if (filteredProducts.length > 0) {
      setSelectedId(filteredProducts[0]._id);
    } else {
      setSelectedId(null);
    }
  }, [search, open, products]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.mfcName.toLowerCase().includes(search.toLowerCase())
  )

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const currentIndex = filteredProducts.findIndex(p => p._id === selectedId);
      let newIndex;

      if (e.key === "ArrowDown") {
        newIndex = currentIndex < filteredProducts.length - 1 ? currentIndex + 1 : 0;
      } else {
        newIndex = currentIndex > 0 ? currentIndex - 1 : filteredProducts.length - 1;
      }

      const newSelectedId = filteredProducts[newIndex]._id;
      setSelectedId(newSelectedId);

      // Scroll the new selected row into view
      document.getElementById(newSelectedId)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    } else if (e.key === "Enter" && selectedId) {
      // Handle selection
      handleSelect(filteredProducts.find(p => p._id === selectedId));
      onOpenChange(false);
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === "F2" &&  open) {
        setNewItemDialogOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [newItemDialogOpen, open]);

  // Add handling for selection
  const handleSelect = (product) => {
    onSelect?.(product)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl p-0 gap-0" onKeyDown={handleKeyDown}>
          <DialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
            <div>
              <DialogTitle className="text-base font-semibold">Select a Product</DialogTitle>
            </div>
            <div className="flex items-center gap-2 mr-6">
              <Button
                size="sm"
                className="bg-blue-600 text-white h-7 px-3 text-xs rounded-md hover:bg-blue-700"
                onClick={() => setNewItemDialogOpen(true)}
              >
                <Plus className="h-3 w-3" />
                Add Product (F2)
              </Button>
            </div>
          </DialogHeader>
          <Separator />

          <div className="p-4 border-b bg-white">
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-700 mb-1.5">Enter Product Name</div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
                  <Input
                    autoFocus
                    placeholder="Search products..."
                    className="pl-8 h-8 text-sm border rounded-md focus:ring-2 focus:ring-blue-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    ref={searchRef}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="relative mx-4 mt-3">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-50 z-10">
                <TableRow>
                  <TableHead className="w-[30%] text-left text-sm font-semibold text-gray-600">PRODUCT NAME/COMPANY</TableHead>
                  <TableHead className="w-[10%] text-left text-sm font-semibold text-gray-600">PACK</TableHead>
                  <TableHead className="w-[15%] text-left text-sm font-semibold text-gray-600">STATUS</TableHead>
                  <TableHead className="w-[15%] text-left text-sm font-semibold text-gray-600">MRP</TableHead>
                  <TableHead className="w-[15%] text-left text-sm font-semibold text-gray-600">EXPIRY</TableHead>
                  <TableHead className="w-[15%] text-left text-sm font-semibold text-gray-600">LOCATION</TableHead>
                </TableRow>
              </TableHeader>
            </Table>

            <ScrollArea className="h-[400px] pr-2">
              <Table>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow
                      key={product._id}
                      id={product._id}
                      className={cn(
                        "cursor-pointer hover:bg-gray-100 transition-colors",
                        selectedId === product._id && "bg-gray-100"
                      )}
                      onClick={() => handleSelect(product)}
                    >
                      <TableCell className="w-[30%] py-3">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.mfcName}</div>
                        </div>
                      </TableCell>
                      <TableCell className="w-[10%] py-3">{product.pack}</TableCell>
                      <TableCell className="w-[15%] py-3">
                        {product.quantity > 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                              In Stock
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="w-[15%] py-3">₹{product?.mrp?.toFixed(2)}</TableCell>
                      <TableCell className="w-[15%] py-3">{product?.expiry}</TableCell>
                      <TableCell className="w-[15%] py-3">{product?.location}</TableCell>
                    </TableRow>
                  ))}
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
      />
    </>
  )
}

