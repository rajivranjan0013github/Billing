import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../ui/table";
import { Badge } from "../../../ui/badge";
import { Button } from "../../../ui/button";
import { Eye, FileX, User, Calendar, CreditCard } from "lucide-react";
import ViewBillDialog from "../reports/ViewBillDialog";
import { format } from "date-fns";
import { useMediaQuery } from "../../../../hooks/useMediaQuery";

const BillsTableWithDialog = ({ bills }) => {
  const [selectedBill, setSelectedBill] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setIsViewDialogOpen(true);
  };

  const renderMobileCard = (bill) => (
    <div key={bill._id} className="bg-white p-3 rounded-lg shadow mb-3 border border-gray-200">
      <div className="flex justify-between items-center">
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-base font-semibold text-gray-800">₹{bill.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            <Badge variant={bill?.amountPaid === bill?.totalAmount ? "success" : "destructive"}>
              {bill?.amountPaid === bill?.totalAmount ? "Paid" : "Due"}
            </Badge>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center text-gray-600">
              <User className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="capitalize truncate">{bill.patientInfo.name}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{format(new Date(bill.createdAt), "MMM dd, yyyy HH:mm")}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <CreditCard className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{bill?.payment?.paymentMethod || "Not specified"}</span>
            </div>
          </div>
        </div>
        <div className="ml-2 flex items-center self-stretch">
          <Button variant="outline" size="sm" onClick={() => handleViewBill(bill)}>
            <Eye className="h-3 w-3 mr-1" /> View
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full overflow-hidden">
      {isDesktop ? (
        <div className="overflow-x-auto h-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.length === 0 ? (
                <TableRow className="hover:bg-white">
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <FileX className="w-8 h-8 mb-2" />
                      <p className="font-semibold">No bills available</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                bills.map((bill) => (
                  <TableRow key={bill._id}>
                    <TableCell>{`#B${bill._id.slice(-6)}`}</TableCell>
                    <TableCell className='capitalize'>{bill.patientInfo.name}</TableCell>
                    <TableCell>{format(new Date(bill.createdAt), "MMM dd, hh:mm a")}</TableCell>
                    <TableCell>₹{bill.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <Badge variant={bill?.amountPaid === bill?.totalAmount ? "success" : "destructive"}>
                        {bill?.amountPaid === bill?.totalAmount ? "Paid" : "Due"}
                      </Badge>
                    </TableCell>
                    <TableCell>{bill?.payment?.paymentMethod || "__"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleViewBill(bill)}><Eye className="h-3 w-3 mr-2" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="overflow-y-auto h-[400px] md:pb-4 pb-0 pr-1">
          {bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-500 py-8 bg-white rounded-lg shadow">
              <FileX className="w-12 h-12 mb-2" />
              <p className="font-semibold">No bills available</p>
            </div>
          ) : (
            bills.map(renderMobileCard)
          )}
        </div>
      )}

      <ViewBillDialog
        isOpen={isViewDialogOpen}
        setIsOpen={setIsViewDialogOpen}
        billData={selectedBill}
      />
    </div>
  );
};

export default BillsTableWithDialog;
