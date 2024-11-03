import React, { useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../ui/dialog"
import { Button } from "../../../ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card"
import { Badge } from "../../../ui/badge"
import { CalendarIcon, PackageIcon, PrinterIcon } from "lucide-react"
import { formatDate } from '../../../../assets/Data'

const PrintHeader = () => (
  <div className="hidden print:block mb-4">
    <h1 className="text-2xl font-bold text-center">Your Pharmacy Name</h1>
    <p className="text-center">123 Pharmacy Street, City, Country</p>
    <p className="text-center">Phone: (123) 456-7890</p>
  </div>
);

export default function OrderDetailsDialog({ order, isOpen, setIsOpen }) {
  const componentRef = useRef();
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    onBeforeGetContent: () => {
      setIsPrinting(true);
      return new Promise((resolve) => {
        setTimeout(() => {
          setIsPrinting(false);
          resolve();
        }, 0);
      });
    },
    pageStyle: `
      @media print {
        @page {
          size: auto;
          margin: 0;
        }
        body {
          padding: 10mm;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        .print-only {
          display: block !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
  });

  if (!order) return null;

  // Calculate total amount and discount
  const totalAmount = order.totalAmount;
  const totalDiscount = order.subtotal - order.totalAmount;

  // Calculate total amount paid
  const totalPaid = order.paidAmount;
  
  // Calculate remaining amount to be paid
  const remainingAmount = totalAmount - totalPaid;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[70vh] overflow-y-auto p-6">
        <div 
          ref={componentRef}
          className={isPrinting ? 'print-content' : ''}
        >
          <PrintHeader />
          <div className="no-print">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Order Details</DialogTitle>
            </DialogHeader>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Card>
                <CardHeader className="py-2 flex flex-row justify-between items-center">
                  <CardTitle className="text-base">Order Summary</CardTitle>
                  <div className="flex space-x-2">
                    <Badge variant={remainingAmount <= 0 ? 'success' : totalPaid > 0 ? 'warning' : 'destructive'}>
                      {remainingAmount <= 0 ? 'Paid' : totalPaid > 0 ? 'Partially Paid' : 'Due'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-2 py-2">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <PackageIcon className="w-5 h-5 text-gray-500" />
                      <span className="font-semibold">Order ID:</span>
                      <span>ORD{order._id.slice(-5)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-5 h-5 text-gray-500" />
                      <span className="font-semibold">Order Date:</span>
                      <span>{formatDate(order.orderDate)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-base">Payment</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Payment ID</TableHead>
                        <TableHead className="text-xs text-right">Amount</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-sm py-1">{order?.payment?._id.slice(-5)}</TableCell>
                        <TableCell className="text-sm py-1 text-right">₹{order.payment.amount.toFixed(2).toLocaleString()}</TableCell>
                        <TableCell className="text-sm py-1">{formatDate(order.payment.createdAt)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-base">Order Items</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Item Name</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Quantity</TableHead>
                      <TableHead className="text-xs">MRP</TableHead>
                      <TableHead className="text-xs">Discount</TableHead>
                      <TableHead className="text-xs">Total</TableHead>
                      <TableHead className="text-xs ">Expiry Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items && order.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-sm py-1 capitalize">{item?.item?.name || 'Deleted Item'}</TableCell>
                        <TableCell className="text-sm py-1 capitalize">{item?.item?.type || 'N/A'}</TableCell>
                        <TableCell className="text-sm py-1">{item?.quantity.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell className="text-sm py-1">₹{item?.MRP.toFixed(2).toLocaleString() || 'N/A'}</TableCell>
                        <TableCell className="text-sm py-1">{item?.discount}%</TableCell>
                        <TableCell className="text-sm py-1">₹{(item?.quantity * item?.MRP * (1 - item?.discount / 100)).toLocaleString() || 'N/A'}</TableCell>
                        <TableCell className="text-sm py-1">{formatDate(item?.expiryDate) || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-base">Order Total</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-sm py-1 font-semibold">Subtotal:</TableCell>
                      <TableCell className="text-sm py-1 text-right">₹{order.subtotal.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm py-1 font-semibold">Total Discount ({((totalDiscount/order.subtotal)*100).toFixed(2)}%):</TableCell>
                      <TableCell className="text-sm py-1 text-right">₹{totalDiscount.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm py-1 font-semibold">Total Amount:</TableCell>
                      <TableCell className="text-sm py-1 text-right">₹{totalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm py-1 font-semibold">Total Amount Paid:</TableCell>
                      <TableCell className="text-sm py-1 text-right">₹{totalPaid.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-base py-1 font-semibold">Remaining Amount to be Paid:</TableCell>
                      <TableCell className="text-base py-1 text-right font-bold">₹{remainingAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2 mt-2 no-print">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <PrinterIcon className="mr-2 h-4 w-4" />
                Print Order
              </Button>
              <Button size="sm" onClick={() => setIsOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}