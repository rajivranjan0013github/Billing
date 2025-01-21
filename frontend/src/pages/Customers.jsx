import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCustomers,
  addCustomer,
  updateCustomer,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Pencil, Trash2, UserPlus, Phone, MapPin } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const Customers = () => {
  const dispatch = useDispatch();
  const customers = useSelector((state) => state.customers.customers);
  const status = useSelector((state) => state.customers.status);
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    mobileNumber: "",
    address: "",
  });

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCustomers());
    }
  }, [status, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await dispatch(
          updateCustomer({ id: editingCustomer._id, customerData: formData })
        ).unwrap();
        toast({
          title: "Success",
          description: "Customer updated successfully",
          variant: "success",
        });
      } else {
        await dispatch(addCustomer(formData)).unwrap();
        toast({
          title: "Success",
          description: "Customer added successfully",
          variant: "success",
        });
      }
      setIsOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      mobileNumber: customer.mobileNumber,
      address: customer.address,
    });
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

  const resetForm = () => {
    setFormData({
      name: "",
      mobileNumber: "",
      address: "",
    });
    setEditingCustomer(null);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, mobileNumber: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingCustomer ? "Update" : "Add"} Customer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Mobile Number</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Total Invoices</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer._id}>
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
                      onClick={() => handleEdit(customer)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(customer._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Customers;
