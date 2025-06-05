import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {fetchCustomers,deleteCustomer,setCustomerStatusIdle,setSearch} from "../redux/slices/CustomerSlice";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "../components/ui/table";
import { Button } from "../components/ui/button";
import CreateCustomerDialog from "../components/custom/customer/CreateCustomerDialog";
import { Input } from "../components/ui/input";
import { Pencil, Trash2, UserPlus, Phone, MapPin, Search, Users, X, ArrowLeft,ChevronLeft,ChevronRight, FileDown, Upload, EllipsisVertical } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "../components/ui/select";
import { formatCurrency } from "../utils/Helper";
import ExportDataDlg from "../components/custom/mirgration/ExportDataDlg";
import ImportDataDlg from "../components/custom/mirgration/ImportDataDlg";
import { importCustomers } from "../redux/slices/exportImportSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import Loader from "../components/ui/loader";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

const columns = [
  { header: "Customer Name", field: "name", width: 30, required: true },
  { header: "Mobile Number", field: "mob", width: 15, },
  { header: "Address", field: "address", width: 40, },
  { header: "Open Balance", field: "openBalance", width: 15, format: "currency",  },
  { header: "Balance", field: "currentBalance", width: 15, format: "currency",  }
]

const Customers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const customers = useSelector((state) => state.customers.customers);
  const status = useSelector((state) => state.customers.status);
  const { currentPage, totalPages } = useSelector((state) => state.customers.pagination);
  const { query: searchQuery, type: searchType } = useSelector((state) => state.customers.search);
  const { importStatus } = useSelector((state) => state.exportImport);
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState('idle');

  useEffect(() => {
    if( status === "idle" || importStatus === "succeeded" ) {
      dispatch(fetchCustomers({ page: currentPage, searchQuery, searchType }));
    }
  }, [ dispatch, currentPage, searchQuery, searchType, status, importStatus]);

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    setCustomerToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    
    setDeleteStatus('loading');
    try {
      await dispatch(deleteCustomer(customerToDelete)).unwrap();
      toast({
        title: "Success",
        description: "Customer deleted successfully",
        variant: "success",
      });
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setDeleteStatus('idle');
    }
  };

  const handleDialogClose = () => {
    setIsOpen(false);
    setEditingCustomer(null);
  };

  const handleSearch = (value) => {
    dispatch(setSearch({ query: value, type: searchType }));
    dispatch(setCustomerStatusIdle());
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      handleSearch(localSearchQuery);
    }
  };

  const clearSearch = () => {
    setLocalSearchQuery("");
    handleSearch("");
  };

  const handleSearchTypeChange = (value) => {
    dispatch(setSearch({ query: searchQuery, type: value }));
    dispatch(setCustomerStatusIdle());
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      dispatch(setCustomerStatusIdle());
      dispatch(fetchCustomers({ page: newPage, searchQuery, searchType }));
    }
  };


  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="relative p-2 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Customers</h1>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          <Select
            value={searchType}
            onValueChange={handleSearchTypeChange}
          >
            <SelectTrigger className="w-[100px] focus:ring-0">
              <SelectValue placeholder="Search by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Input
              className="w-[250px] pl-8"
              placeholder={`Search ${searchType === "name" ? "customer name" : "mobile number"}...`}
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
            />
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            {localSearchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="h-full aspect-square absolute right-0 top-0 hover:bg-transparent"
                onClick={clearSearch}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        <div className="ml-auto flex gap-2">
        <Button onClick={() => setIsOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)} disabled={importStatus === 'loading'}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsExportDialogOpen(true)}
                disabled={customers.length === 0}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
        </div>
      </div>

      {importStatus === 'loading' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <Loader text="Importing customers..." />
          </div>
        </div>
      )}

      <CreateCustomerDialog
        open={isOpen}
        onOpenChange={handleDialogClose}
        editingCustomer={editingCustomer}
        onSuccess={() => {
          handleDialogClose();
          dispatch(fetchCustomers());
        }}
      />

      <ExportDataDlg
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        data={customers}
        columns={columns}
        formatters={{
          "Balance": (value) => value || 0
        }}
        fileName="customers"
        title="Export Customers Data"
      />

      <ImportDataDlg
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        importFunction={importCustomers}
        title="Import Customers"
        columns={columns}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-xl p-0 gap-0">
          <AlertDialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
            <AlertDialogTitle className="text-base font-semibold">Delete Customer</AlertDialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDialogHeader>
          <div className="p-6">
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This action will permanently delete all associated records and cannot be undone.
            </AlertDialogDescription>
          </div>
          <div className="p-3 bg-gray-100 border-t flex items-center justify-end gap-2">
            <Button 
              onClick={() => setIsDeleteDialogOpen(false)} 
              variant="outline" 
              size="sm"
              disabled={deleteStatus === "loading"}
              className='px-4'
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete}
              size="sm"
              className='px-4 bg-red-500 text-white hover:bg-red-600'
              disabled={deleteStatus === "loading"}
            >
              {deleteStatus === "loading" ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <div className="relative overflow-x-auto">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mb-4" />
            <p className="text-lg">No customers found</p>
            <p className="text-sm">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Create a new customer to get started"}
            </p>
            <Button
              className="mt-4"
              onClick={() => setIsOpen(true)}
            >
              Add Customer
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8">CUSTOMER NAME</TableHead>
                  <TableHead className="h-8">MOBILE NUMBER </TableHead>
                  <TableHead className="h-8">ADDRESS</TableHead>
                  <TableHead className="text-right h-8">BALANCE (₹)</TableHead>
                  <TableHead className="text-right h-8">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className='border'>
                {customers.map((customer) => (
                  <TableRow 
                    key={customer._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/customers/${customer._id}`)}
                  >
                    <TableCell className="font-medium capitalize h-8">{customer.name}</TableCell>
                    <TableCell className="h-8">
                      <div className="flex items-center gap-2">
                      
                        {customer.mob}
                      </div>
                    </TableCell>
                    <TableCell className="h-8"  >
                      <div className="flex items-center gap-2">
                       
                        {customer.address}
                      </div>
                    </TableCell>
                    <TableCell className="text-right h-8">
                      <span
                        className={`${
                          customer.currentBalance > 0
                            ? "text-green-600"
                            : customer.currentBalance < 0
                            ? "text-red-600"
                            : "" 
                        } font-semibold text-right`}
                      >
                        {customer.currentBalance > 0 ? "↓ " : customer.currentBalance < 0 ? "↑ " : ""}
                        {(Math.abs(customer.currentBalance || 0))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right h-8">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(customer);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(customer._id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Customers;
