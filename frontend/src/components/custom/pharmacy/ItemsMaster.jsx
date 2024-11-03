// toast is not shown when the item is updated->fixed this
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";
import { fetchItems, deleteInventoryItem } from "../../../redux/slices/pharmacySlice";
import { Search, ChevronLeft, ChevronRight, Pencil, Trash, FileDown, Plus, ListFilter, PackageX, ChevronDown, Filter, MoreVertical, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Badge } from "../../ui/badge";
import EditItemDialog from "./itemMaster/EditItemDialog";
import { useToast } from "../../../hooks/use-toast";
import AddItemDialog from "./itemMaster/AddItemDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { useMediaQuery } from "../../../hooks/useMediaQuery"
import { motion, AnimatePresence } from "framer-motion"

export default function ItemsMaster() {
  const dispatch = useDispatch();
  const {items, itemsStatus, deleteInventoryItemStatus} = useSelector((state) => state.pharmacy);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const isSmallScreen = useMediaQuery("(max-width: 640px)")
  const isMediumScreen = useMediaQuery("(max-width: 1024px)")
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  const types = ["All", ...new Set(items.map((item) => item.item_category))];

  useEffect(() => {
    if (itemsStatus === "idle") {
      dispatch(fetchItems());
    }
  }, [itemsStatus, dispatch]);

  const filteredItems = items
    .filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((item) => typeFilter === "All" || item.item_category === typeFilter);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleTypeChange = (type) => {
    setTypeFilter(type);
    setCurrentPage(1);
  };

  const handlePageChange = (direction) => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (direction === "next" && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleEdit = (item) => {
    setItemToEdit(item);
    setIsEditItemDialogOpen(true);
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    dispatch(deleteInventoryItem(itemToDelete._id))
      .unwrap()
      .then(() => {
        toast({
          title: "Item deleted successfully",
          description: `${itemToDelete.name} has been removed from the inventory.`,
          variant: "success",
        });
      })
      .catch((error) => {
        toast({
          title: "Failed to delete item",
          description: error.message || "An error occurred while deleting the item.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsDeleteDialogOpen(false);
      });
  };

  const handleCloseEditItemDialog = () => {
    setIsEditItemDialogOpen(false);
    setItemToEdit(null);
  };

  const handleOpenAddItemDialog = () => {
    setIsAddItemDialogOpen(true);
  };

  const handleCloseAddItemDialog = () => {
    setIsAddItemDialogOpen(false);
  };

  const ItemCard = ({ item }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center flex-grow">
              <h3 className="text-lg font-semibold capitalize">
                {item.name}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({item.item_category})
                </span>
              </h3>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(item)}>Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(item)}>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-sm">Stock: {item.quantity}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-semibold">MRP: ₹{item.mrp.toFixed(2)}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm">CP: ₹{item.purchase_info.price_per_unit.toFixed(2)}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm">SP: ₹{item.sales_info.price_per_unit.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm">Expiry: {item.expiry_date ? format(new Date(item.expiry_date), 'MMM, yyyy') : "-"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Card className="w-full mx-auto shadow-none border-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="font-semibold">Pharmacy Inventory</CardTitle>
            <CardDescription>Manage and view item information</CardDescription>
          </div>
          {isSmallScreen && (
            <Button variant="outline" size="icon" onClick={handleOpenAddItemDialog}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
            <div className="flex w-full space-x-2">
              <div className="relative flex-grow">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search items..." value={searchTerm} onChange={handleSearch} className="pl-8 w-full" />
              </div>
              {isSmallScreen && (
                <Button
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              )}
            </div>
            {isSmallScreen ? (
              <AnimatePresence>
                {isFilterExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden w-full"
                  >
                    <div className="pt-2 space-y-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <ListFilter className="mr-2 h-4 w-4" /> 
                            {typeFilter === 'All' ? 'Select type' : typeFilter}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[200px]">
                          {types.map((type) => (
                            <DropdownMenuItem key={type} onClick={() => handleTypeChange(type)}>
                              {type}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <ListFilter className="mr-2 h-4 w-4" />
                    {typeFilter === "All" ? "Select type" : typeFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {types.map((type) => (
                    <DropdownMenuItem key={type} onClick={() => handleTypeChange(type)}>
                      {type}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {!isSmallScreen && (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleOpenAddItemDialog}>
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>
          )}
        </div>
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <PackageX className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">No items found</p>
            <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filter to find what you're looking for.</p>
          </div>
        ) : (
          isSmallScreen ? (
            <div>
              {paginatedItems.map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    {!isMediumScreen && (
                      <>
                        <TableHead>Purchase</TableHead>
                        <TableHead>Rate</TableHead>
                      </>
                    )}
                    <TableHead>MRP</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className='capitalize'>{item.name}</TableCell>
                      <TableCell>{item?.item_category}</TableCell>
                      {!isMediumScreen && (
                        <>
                          <TableCell>₹{item?.purchase_info?.price_per_unit.toLocaleString('en-IN')}</TableCell>
                          <TableCell>₹{item?.sales_info?.price_per_unit.toLocaleString('en-IN')}</TableCell>
                        </>
                      )}
                      <TableCell>₹{item?.mrp?.toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item?.quantity <= 100
                              ? "destructive"
                              : item?.quantity <= 200
                              ? "secondary"
                              : "success"
                          }
                        >
                          {item?.quantity}{" "}{item?.unit}
                        </Badge>
                      </TableCell>
                      <TableCell>{item?.expiry_date ? format(new Date(item?.expiry_date), 'MMM, yyyy') : "-"}</TableCell>
                      <TableCell className="flex">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
                          <Trash className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        )}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredItems.length)} to {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
          </p>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => handlePageChange("prev")} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePageChange("next")} disabled={currentPage === totalPages}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
      <EditItemDialog isOpen={isEditItemDialogOpen} onClose={handleCloseEditItemDialog} item={itemToEdit} />
      <AddItemDialog isOpen={isAddItemDialogOpen} onClose={handleCloseAddItemDialog} />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-lg w-[95vw]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the item from your inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteInventoryItemStatus === "loading"}
            >
              {deleteInventoryItemStatus === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
