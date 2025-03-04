import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCustomers,
  deleteCustomer,
} from "../redux/slices/CustomerSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import CreateCustomerDialog from "../components/custom/customer/CreateCustomerDialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { 
  Pencil, 
  Trash2, 
  UserPlus, 
  Phone, 
  MapPin, 
  Search, 
  Users, 
  X, 
  ArrowLeft 
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const Customers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const customers = useSelector((state) => state.customers.customers);
  const status = useSelector((state) => state.customers.status);
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("name");

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCustomers());
    }
  }, [status, dispatch]);

  // Calculate summary statistics
  const summary = {
    count: customers.length,
    totalInvoices: customers.reduce((sum, customer) => sum + (customer.invoices?.length || 0), 0),
    averageInvoices: customers.length 
      ? (customers.reduce((sum, customer) => sum + (customer.invoices?.length || 0), 0) / customers.length).toFixed(1)
      : 0,
  };

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

  // Filter customers based on search
  const getFilteredCustomers = () => {
    if (!searchQuery) return customers;

    return customers.filter((customer) => {
      if (searchType === "name") {
        return customer.name.toLowerCase().includes(searchQuery.toLowerCase());
      } else if (searchType === "mobile") {
        return customer.mobileNumber.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="relative p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Customers</h1>
        </div>
        <div className="grid grid-cols-3 gap-4 text-right">
          <div>
            <div className="font-semibold">{summary.count}</div>
            <div className="text-sm text-muted-foreground">Total Customers</div>
          </div>
          <div>
            <div className="font-semibold">{summary.totalInvoices}</div>
            <div className="text-sm text-muted-foreground">Total Invoices</div>
          </div>
          <div>
            <div className="font-semibold">{summary.averageInvoices}</div>
            <div className="text-sm text-muted-foreground">Avg. Invoices/Customer</div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <div className="relative flex items-center bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden">
            <div className="relative flex items-center px-3 border-r border-slate-200">
              <Select
                defaultValue="name"
                onValueChange={(value) => setSearchType(value)}
              >
                <SelectTrigger className="h-9 w-[120px] border-0 bg-transparent hover:bg-slate-100 focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Search by" />
                </SelectTrigger>
                <SelectContent align="start" className="w-[120px]">
                  <SelectItem value="name" className="text-sm">
                    Name
                  </SelectItem>
                  <SelectItem value="mobile" className="text-sm">
                    Mobile
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 relative flex items-center">
              <div className="absolute left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                className="w-full h-9 pl-10 pr-10 border-0 focus-visible:ring-0 placeholder:text-slate-400"
                placeholder={`Search by ${searchType === "name" ? "customer name" : "mobile number"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <div className="absolute right-3 flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-slate-100 rounded-full"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3 text-slate-500" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <Button className="w-[200px]" onClick={() => setIsOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
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
        {getFilteredCustomers().length === 0 ? (
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CUSTOMER NAME</TableHead>
                <TableHead>MOBILE NUMBER</TableHead>
                <TableHead>ADDRESS</TableHead>
                <TableHead>TOTAL INVOICES</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredCustomers().map((customer) => (
                <TableRow 
                  key={customer._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/customers/${customer._id}`)}
                >
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {customer.mobileNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {customer.address}
                    </div>
                  </TableCell>
                  <TableCell>{customer.invoices?.length || 0}</TableCell>
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
        )}
      </div>
    </div>
  );
};

export default Customers;
