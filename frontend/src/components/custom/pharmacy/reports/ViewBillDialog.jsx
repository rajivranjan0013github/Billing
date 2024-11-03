import * as React from "react";
import { useRef, useState } from "react";
import { useReactToPrint } from 'react-to-print';
import { Button } from "../../../ui/button";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../ui/dialog";
import { Label } from "../../../ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../ui/table";
import { PrinterIcon } from "lucide-react";
import PharmacyHeader from "../../../../utils/print/PharmacyHeader";

export default function ViewBillDialog({ isOpen, setIsOpen, billData }) {
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
          padding: 20mm;
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

  if (!billData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <div 
          ref={componentRef}
          className={isPrinting ? 'print-content' : ''}
        >
          <div className="hidden print:block mb-4">
            <PharmacyHeader />
          </div>
          <div className="no-print">
            <DialogHeader className="flex flex-row items-center justify-between mr-7 pb-2">
              <div>
                <DialogTitle>Bill Details</DialogTitle>
                <DialogDescription>Full details of the bill</DialogDescription>
              </div>
              <Badge status={billData.amountPaid === billData.totalAmount ? "Paid" : "Due"} />
            </DialogHeader>
          </div>
          <div className="grid gap-2 py-0">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-right">Customer Name</Label>
                <p className="mt-1 font-medium">{billData.patientInfo.name}</p>
              </div>
              <div>
                <Label className="text-right">Bill Number</Label>
                <p className="mt-1 font-medium">{`#B${billData._id.slice(-6)}`}</p>
              </div>
              <div>
                <Label className="text-right">Date and Time</Label>
                <p className="mt-1 font-medium">{format(new Date(billData.createdAt), "MMM dd, hh:mm a")}</p>
              </div>
            </div>
            <div className="mt-1">
              <h3 className="text-lg font-semibold mb-1">Bill Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>MRP</TableHead>
                    <TableHead>Discount(%)</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item?.item?.name || "Item deleted"}</TableCell>
                      <TableCell>{item?.item?.type || "Item deleted"}</TableCell>
                      <TableCell>{item?.quantity || "Item deleted"}</TableCell>
                      <TableCell>₹{item?.MRP?.toFixed(2)}</TableCell>
                      <TableCell>{item?.discount?.toFixed(0)}%</TableCell>
                      <TableCell>
                        ₹{(item?.quantity * item?.MRP * (1 - item?.discount / 100)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 border-t border-gray-200 pt-2">
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex justify-between w-72">
                    <span className="text-sm text-gray-600">Sub Total:</span>
                    <span className="text-sm">₹{billData.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-72">
                    <span className="text-sm text-gray-600">Additional Discount  ({((billData.subtotal - billData.totalAmount) / billData.subtotal * 100).toFixed(0)}%):</span>
                    <span className="text-sm">-₹{(billData.subtotal - billData.totalAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-72 border-t border-gray-200 pt-2 font-semibold">
                    <span>Total Amount:</span>
                    <span>₹{billData.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-start pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
          <Button type="button" variant="outline" onClick={handlePrint}>
            <PrinterIcon className="mr-2 h-4 w-4" />
            Print Bill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Add this new Badge component
const Badge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "due":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
        status
      )}`}
    >
      {status}
    </span>
  );
};
