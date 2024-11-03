import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { payExpense } from '../../../redux/slices/expenseSlice';
import { useToast } from "../../../hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Separator } from "../../ui/separator";
import { AlertCircle, CreditCard } from 'lucide-react';
import {useMediaQuery} from '../../../hooks/useMediaQuery';

const PaymentDialog = ({ isOpen, setIsOpen, expenseData }) => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useMediaQuery('(max-width: 640px)');

  useEffect(() => {
    if (isOpen) {
      setPaymentAmount('');
      setPaymentMethod('');
    }
  }, [isOpen]);

  const totalAmount = expenseData?.amount || 0;
  const paidAmount = expenseData?.amountPaid || 0;
  const dueAmount = totalAmount - paidAmount;
  const isFullyPaid = dueAmount <= 0;

  const handleAddPayment = () => {
    if (!paymentAmount || !paymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const paymentData = {
      amount: parseFloat(paymentAmount),
      paymentMethod,
    };

    dispatch(payExpense({ id: expenseData._id, paymentData }))
      .unwrap()
      .then(() => {
        toast({
          title: "Payment added successfully",
          description: `Payment of ₹${paymentAmount} has been added successfully.`,
          variant: "success",
        });
        setIsOpen(false);
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: `Failed to add payment: ${error.message}`,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleSetDueAmount = () => {
    setPaymentAmount(dueAmount.toFixed(2));
  };

  if (!expenseData) return null;

  const paymentMethods = ["Cash", "UPI", "Card", "Bank Transfer", "Other"];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[90vw] max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Payment</DialogTitle>
          <DialogDescription>Manage payments for the expense.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-1">
          <div className="flex flex-col sm:flex-row justify-between text-sm font-medium">
            <span>Total Amount: <span className="text-primary">₹{totalAmount.toLocaleString('en-IN')}</span></span>
            <span>Due Amount: <span className="text-red-600">₹{dueAmount.toLocaleString('en-IN')}</span></span>
          </div>
          
          <Separator />
          
          <div className="space-y-1">
            <Label htmlFor="paymentAmount">Payment Amount</Label>
            <div className="relative">
              <Input
                id="paymentAmount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                className="pr-10"
                disabled={isFullyPaid}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={handleSetDueAmount}
                title="Set Due Amount"
                disabled={isFullyPaid}
              >
                <CreditCard className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select onValueChange={setPaymentMethod} value={paymentMethod} disabled={isFullyPaid}>
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-0">
          <h4 className="text-sm font-semibold">Recent Payments</h4>
          {expenseData?.payments && expenseData?.payments?.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Date</TableHead>
                    {!isMobile && <TableHead className="w-[80px]">Time</TableHead>}
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseData.payments.map((payment, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs">{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                      {!isMobile && (
                        <TableCell className="text-xs">
                          {new Date(payment.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
                        </TableCell>
                      )}
                      <TableCell className="text-xs font-medium">₹{payment.amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                      <TableCell className="text-xs">{payment.paymentMethod}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-gray-500 py-4">
              <AlertCircle size={18} />
              <span>No recent payments found</span>
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-6 flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleAddPayment} disabled={isLoading || isFullyPaid} className="w-full sm:w-auto">
            {isLoading ? "Processing..." : isFullyPaid ? "Fully Paid" : "Add Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
