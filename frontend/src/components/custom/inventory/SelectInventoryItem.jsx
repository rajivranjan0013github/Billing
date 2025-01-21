import React, { useState, useEffect, useRef } from "react"
import { Check, Search, X, PackageX, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/dialog'
import { Input } from '../../ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table'
import { cn } from '../../../lib/utils'
import { Button } from "../../ui/button"
import AddNewInventory from './AddNewInventory'
import {useSelector, useDispatch} from 'react-redux'
import {fetchItems} from '../../../redux/slices/inventorySlice'
  
export default function ProductSelector({ open, onOpenChange, onSelect, search, setSearch }) {
  const [selectedId, setSelectedId] = useState(null);
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);
  const {items : products, itemsStatus} = useSelector(state => state.inventory);
  const dispatch = useDispatch();
  
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
      const currentIndex = filteredProducts.findIndex(p => p._id === selectedId)
      if (e.key === "ArrowDown") {
        const nextIndex = currentIndex < filteredProducts.length - 1 ? currentIndex + 1 : 0
        setSelectedId(filteredProducts[nextIndex]._id)
      } else {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredProducts.length - 1
        setSelectedId(filteredProducts[prevIndex]._id)
      }
    } else if (e.key === "Enter" && selectedId) {
      // Handle selection
      // console.log("Selected product:", filteredProducts.find(p => p._id === selectedId))
      handleSelect(filteredProducts.find(p => p._id === selectedId))
      onOpenChange(false)
    } else if (e.key === "Escape") {
      onOpenChange(false)
    }
  }

  // Add handling for selection
  const handleSelect = (product) => {
    onSelect?.(product)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl" onKeyDown={handleKeyDown}>
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle>Select a Product</DialogTitle>
              <DialogDescription>Select an option from the below list</DialogDescription>
            </div>
            <Button 
              onClick={() => setNewItemDialogOpen(true)} 
              variant="outline" 
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Item
            </Button>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Select an option from the below list"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="h-[60vh] overflow-auto relative">
            {filteredProducts.length > 0 ? (
              <Table>
                <TableHeader className="sticky top-0 z-10 border-b bg-white shadow-sm">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[250px] bg-gray-50 py-3 first:rounded-tl-lg">
                      <div className="font-semibold text-xs uppercase tracking-wider text-gray-700">
                        Product's Name/Company
                      </div>
                    </TableHead>
                    <TableHead className="bg-gray-50 py-3">
                      <div className="font-semibold text-xs uppercase tracking-wider text-gray-700">Pack</div>
                    </TableHead>
                    <TableHead className="bg-gray-50 py-3">
                      <div className="font-semibold text-xs uppercase tracking-wider text-gray-700">Status</div>
                    </TableHead>
                    <TableHead className="bg-gray-50 py-3">
                      <div className="font-semibold text-xs uppercase tracking-wider text-gray-700">MRP</div>
                    </TableHead>
                    <TableHead className="bg-gray-50 py-3">
                      <div className="font-semibold text-xs uppercase tracking-wider text-gray-700">Expiry</div>
                    </TableHead>
                    <TableHead className="bg-gray-50 py-3">
                      <div className="font-semibold text-xs uppercase tracking-wider text-gray-700">Location</div>
                    </TableHead>
                    <TableHead className="w-[30px] bg-gray-50 py-3 last:rounded-tr-lg"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow
                      key={product._id}
                      className={cn(
                        "cursor-pointer",
                        selectedId === product._id && "bg-muted"
                      )}
                      onClick={() => handleSelect(product)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div>
                            <div>{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.mfcName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.pack}</TableCell>
                      <TableCell>
                        {product.quantity > 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                              In Stock
                            </span>
                            {product.expiry && (
                              <div className="text-xs text-muted-foreground">
                                Expires: {product.expiry}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                              Out of Stock
                            </span>
                            {product.expiry && (
                              <div className="text-xs text-muted-foreground">
                                Expires: {product.expiry}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>₹{product?.mrp?.toFixed(2)}</TableCell>
                      <TableCell>{product?.expiry}</TableCell>
                      <TableCell>{product?.location}</TableCell>
                      <TableCell>
                        <div className="text-right">›</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <PackageX className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm">Try adjusting your search terms</p>
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground text-center border-t pt-4 space-x-4">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">↑↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Enter</kbd>
              <span>Select</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Esc</kbd>
              <span>Close</span>
            </span>
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

