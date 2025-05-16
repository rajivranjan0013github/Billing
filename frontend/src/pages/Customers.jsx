import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {fetchCustomers,deleteCustomer,setCustomerStatusIdle,setSearch} from "../redux/slices/CustomerSlice";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "../components/ui/table";
import { Button } from "../components/ui/button";
import CreateCustomerDialog from "../components/custom/customer/CreateCustomerDialog";
import { Input } from "../components/ui/input";
import { Pencil, Trash2, UserPlus, Phone, MapPin, Search, Users, X, ArrowLeft,ChevronLeft,ChevronRight, FileDown } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "../components/ui/select";
import { formatCurrency } from "../utils/Helper";
import * as XLSX from 'xlsx';

const Customers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const customers = useSelector((state) => state.customers.customers);
  const status = useSelector((state) => state.customers.status);
  const { currentPage, totalPages } = useSelector((state) => state.customers.pagination);
  const { query: searchQuery, type: searchType } = useSelector((state) => state.customers.search);
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  useEffect(() => {
   
      dispatch(fetchCustomers({ page: currentPage, searchQuery, searchType }));
    
  }, [ dispatch, currentPage, searchQuery, searchType]);

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await dispatch(deleteCustomer(id)).unwrap();
        toast({
          title: "Success",
          description: "Customer deleted successfully",
          variant: "success",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      }
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

  const exportToExcel = () => {
    // Prepare data for Excel export
    const dataToExport = customers.map(customer => ({
      'Customer Name': customer.name,
      'Mobile Number': customer.mob,
      'Address': customer.address,
      'Balance': customer.currentBalance || 0
    }));

    // Calculate total balance
    const totalBalance = customers.reduce((sum, customer) => sum + (customer.currentBalance || 0), 0);

    // Add total row
    dataToExport.push({
      'Customer Name': 'Total',
      'Mobile Number': '',
      'Address': '',
      'Balance': totalBalance
    });

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 }, // Customer Name
      { wch: 15 }, // Mobile Number
      { wch: 40 }, // Address
      { wch: 15 }  // Balance
    ];

    // Style the total row (make it bold)
    const totalRowIndex = dataToExport.length;
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellRef = XLSX.utils.encode_cell({ r: totalRowIndex - 1, c: C });
      if (!worksheet[cellRef]) worksheet[cellRef] = { v: '' };
      worksheet[cellRef].s = { font: { bold: true } };
    }

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `Customers_List.xlsx`);
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
          <Button 
            variant="outline"
            onClick={exportToExcel}
            disabled={customers.length === 0}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      <CreateCustomerDialog
        open={isOpen}
        onOpenChange={handleDialogClose}
        editingCustomer={editingCustomer}
        onSuccess={() => {
          handleDialogClose();
          dispatch(fetchCustomers());
        }}
      />

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
                  <TableHead>CUSTOMER NAME</TableHead>
                  <TableHead>MOBILE NUMBER</TableHead>
                  <TableHead>ADDRESS</TableHead>
                  <TableHead>BALANCE</TableHead>
                  <TableHead className="text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className='border'>
                {customers.map((customer) => (
                  <TableRow 
                    key={customer._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/customers/${customer._id}`)}
                  >
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {customer.mob}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {customer.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          customer.currentBalance > 0
                            ? "text-green-600"
                            : customer.currentBalance < 0
                            ? "text-red-600"
                            : ""
                        }
                      >
                        {customer.currentBalance > 0 ? "↓ " : customer.currentBalance < 0 ? "↑ " : ""}
                        {formatCurrency(Math.abs(customer.currentBalance || 0))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(customer);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(customer._id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
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
