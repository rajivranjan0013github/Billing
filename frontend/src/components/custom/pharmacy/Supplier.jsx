import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSuppliers, fetchSupplierDetails } from "../../../redux/slices/pharmacySlice";
import { formatDate } from "../../../assets/Data";
import { ChevronRight, BriefcaseMedicalIcon, Building2, Phone, Mail, Info, PlusIcon } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import { ScrollArea } from "../../ui/scroll-area";
import { Badge } from "../../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import OrderDetailsDialog from './supplier/OrderDetailsDialog';
import SupplierRegDialog from './supplier/SupplierRegDialog';

const Supplier = () => {
  const dispatch = useDispatch();
  const { suppliers, suppliersStatus,selectedSupplier } = useSelector((state) => state.pharmacy);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSupplierRegDialogOpen, setIsSupplierRegDialogOpen] = useState(false);

  useEffect(() => {
    if (suppliersStatus === "idle") {
      dispatch(fetchSuppliers());
    }
  }, [suppliersStatus, dispatch]);


  const handleSupplierClick = (supplier) => {
    dispatch(fetchSupplierDetails(supplier._id));
  };

  const calculateOrderQuantity = (order) => {
    if (order.items && order.items.length > 0) {
      return order.items.reduce((acc, item) => acc + item.quantity, 0);
    }
    return order.quantity || 0;
  };

  const calculateOverallDiscount = (order) => {
    const discount = ((1-order.totalAmount/order.subtotal)*100).toFixed(2);
    return discount || 'N/A';
  };

  const handleOpenOrderDialog = (order) => {
    setSelectedOrder(order);
    setIsOrderDialogOpen(true);
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full w-full flex flex-col">
      {/* header */}
      <div className="flex items-center space-x-1 bg-gray-100 p-1 justify-between">
       <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="text-gray-600">
               <BriefcaseMedicalIcon className="h-4 w-4" />
            </Button>
            <ChevronRight className="h-3 w-3 text-gray-400" />
            <span className="font-semibold text-gray-700 text-sm">Supplier</span>
       </div>
       <Button 
         variant="outline" 
         size="sm" 
         className="text-gray-600 hover:bg-gray-100"
         onClick={() => setIsSupplierRegDialogOpen(true)}
       >
         <PlusIcon className="h-4 w-4" /> <span className="font-semibold text-gray-700 text-sm">Add Supplier</span>
       </Button>
      </div>
      {/* body */}
      <div className="grid grid-cols-4 w-full flex-grow">
        {/* supplier details */}
        <div className="col-span-3 border-r-2 border-gray-200 p-4">
          {selectedSupplier ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="capitalize">
                      {selectedSupplier.name} <span className="text-sm text-gray-500">({selectedSupplier._id.slice(-6)})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedSupplier.address && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Building2 size={16} />
                        <span className="text-sm">{selectedSupplier.address}</span>
                      </div>
                    )}
                    {selectedSupplier.phone && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone size={16} />
                        <span className="text-sm">+91-{selectedSupplier.phone}</span>
                      </div>
                    )}
                    {selectedSupplier.email && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Mail size={16} />
                        <span className="text-sm">{selectedSupplier.email}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Purchase Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedSupplier.lastPurchased && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Last Purchase:</span>
                        <span className="text-sm">{formatDate(selectedSupplier.lastPurchased)}</span>
                      </div>
                    )}
                    {selectedSupplier.amountPaid !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Purchase Value:</span>
                        <span className="text-sm">₹{((Number(selectedSupplier.amountPaid) + Number(selectedSupplier.amountDue)).toLocaleString())}</span>
                      </div>
                    )}
                    {selectedSupplier.amountDue !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Amount Due:</span>
                        <span className="text-sm">₹{selectedSupplier.amountDue.toLocaleString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Items Offered</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedSupplier.items && selectedSupplier.items.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedSupplier.items.map((item, index) => (
                          <Badge key={index} variant="outline" className="capitalize">{item.name}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No items offered</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <h4 className="text-lg font-medium">Orders</h4>
              {selectedSupplier.orders && selectedSupplier.orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Payments</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSupplier.orders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className='capitalize'>ORD{order._id.slice(-5)}</TableCell>
                        <TableCell>{formatDate(order.orderDate)}</TableCell>
                        <TableCell>{calculateOrderQuantity(order)}</TableCell>
                        <TableCell>₹{order.totalAmount.toLocaleString()}</TableCell>
                        <TableCell>{calculateOverallDiscount(order)}%</TableCell>
                        <TableCell>₹{order.paidAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenOrderDialog(order)}>
                            <Info size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500">No orders found</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Select a supplier to view details</p>
          )}
        </div>
        {/* supplier list */}
        <div className="px-2 py-4 flex flex-col h-full">
          <h2 className="text-lg font-semibold mb-4">Supplier List</h2>
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
          <ScrollArea className="flex-grow">
            {filteredSuppliers.length > 0 ? (
              <div className="space-y-2 pr-4">
                {filteredSuppliers.map((supplier) => (
                  <div
                    key={supplier._id}
                    className={`py-2 px-4 bg-white shadow rounded-lg mb-2 cursor-pointer transition-colors duration-200 hover:bg-gray-100 ${
                      selectedSupplier && selectedSupplier._id === supplier._id
                        ? 'border-2 border-blue-400 shadow-md'
                        : ''
                    }`}
                    onClick={() => handleSupplierClick(supplier)}
                  >
                    <h3 className="font-semibold capitalize">
                      {supplier.name}{" "}
                      <span className="text-xs text-gray-500">
                        ({supplier._id.slice(-6)})
                      </span>
                    </h3>
                    <p className="text-sm text-gray-500">
                      Last purchase: {formatDate(supplier.lastPurchased)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Total Purchase Value: ₹{supplier.amountPaid+supplier.amountDue}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No suppliers found</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
      
      <SupplierRegDialog 
        open={isSupplierRegDialogOpen} 
        setOpen={setIsSupplierRegDialogOpen} 
      />
      
      <OrderDetailsDialog 
        isOpen={isOrderDialogOpen}
        setIsOpen={setIsOrderDialogOpen}
        order={selectedOrder}
      />
    </div>
  );
};

export default Supplier;
