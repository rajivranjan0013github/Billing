// toast is not shown when the item is updated->fixed this
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";
import { fetchItems } from "../redux/slices/inventorySlice";
import { Search, ChevronLeft, ChevronRight, Plus, ListFilter, PackageX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import AddItemDialog from "../components/custom/itemMaster/AddItemDialog";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { formatQuantityDisplay } from "../assets/utils";

export default function ItemsMaster() {
  const dispatch = useDispatch();
  const {items, itemsStatus} = useSelector((state) => state.inventory);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const navigate = useNavigate();

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

  const handleOpenAddItemDialog = () => {
    setIsAddItemDialogOpen(true);
  };

  const handleCloseAddItemDialog = () => {
    setIsAddItemDialogOpen(false);
  };

  const handleRowClick = (itemId) => {
    navigate(`/item-details/${itemId}`);
  };

  return (
    <Card className="w-full mx-auto shadow-none border-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="font-semibold">Pharmacy Inventory</CardTitle>
            <CardDescription>Manage and view item information</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search items..." value={searchTerm} onChange={handleSearch} className="pl-8" />
            </div>
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
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleOpenAddItemDialog}>
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </div>
        </div>
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <PackageX className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">No items found</p>
            <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filter to find what you're looking for.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Purchase</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Expiry Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((item) => (
                  <TableRow 
                    key={item._id} 
                    onClick={() => handleRowClick(item._id)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className='capitalize'>{item.name}</TableCell>
                    <TableCell>{item?.manufacturer_name || "-"}</TableCell>
                    <TableCell>{item?.item_category}</TableCell>
                    <TableCell>₹{item?.purchase_info?.price_per_unit?.toLocaleString('en-IN')}</TableCell>
                    <TableCell>₹{item?.sales_info?.price_per_unit?.toLocaleString('en-IN')}</TableCell>
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
                        {formatQuantityDisplay(item.quantity, item.unit, item?.secondary_unit, true)}
                      </Badge>
                    </TableCell>
                    <TableCell>{item?.expiry_date ? format(new Date(item?.expiry_date), 'MMM, yyyy') : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
      <AddItemDialog isOpen={isAddItemDialogOpen} onClose={handleCloseAddItemDialog} />
    </Card>
  );
}
