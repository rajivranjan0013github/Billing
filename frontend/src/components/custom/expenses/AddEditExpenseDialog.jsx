import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createExpense, updateExpense } from '../../../redux/slices/expenseSlice';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { useToast } from "../../../hooks/use-toast";
import { format, parseISO, startOfDay } from 'date-fns';

const AddEditExpenseDialog = ({ isOpen, onClose, expenseToEdit }) => {
  const dispatch = useDispatch();
  const { createExpenseStatus, updateExpenseStatus } = useSelector((state) => state.expenses);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    date: '',
    amountPaid: '',
    paymentMethod: '' // Add this line
  });

  useEffect(() => {
    if (expenseToEdit) {
      const expenseDate = new Date(expenseToEdit.date);
      setFormData({
        category: expenseToEdit.category,
        description: expenseToEdit.description,
        amount: expenseToEdit.amount.toString(),
        date: format(expenseDate, 'yyyy-MM-dd'),
        amountPaid: expenseToEdit.amountPaid.toString(),
        paymentMethod: expenseToEdit.paymentMethod || '' // Add this line
      });
    } else {
      setFormData({
        category: '',
        description: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        amountPaid: '',
        paymentMethod: '' // Add this line
      });
    }
  }, [expenseToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => {
      const updatedData = {
        ...prevData,
        [name]: value
      };
      
      // If the amount field is changed, update the amountPaid field
      if (name === 'amount') {
        updatedData.amountPaid = value;
      }
      
      return updatedData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount),
      amountPaid: parseFloat(formData.amountPaid),
      date: new Date(formData.date).toISOString()
    };

    const action = expenseToEdit
      ? updateExpense({ ...expenseData, _id: expenseToEdit._id })
      : createExpense(expenseData);

    dispatch(action)
      .unwrap()
      .then(() => {
        toast({
          title: `Expense ${expenseToEdit ? 'updated' : 'added'} successfully`,
          description: `The expense has been ${expenseToEdit ? 'updated' : 'added'}.`,
          variant: "success",
        });
        // Reset form fields
        setFormData({
          category: '',
          description: '',
          amount: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          amountPaid: '',
          paymentMethod: ''
        });
        onClose();
      })
      .catch((error) => {
        toast({
          title: `Failed to ${expenseToEdit ? 'update' : 'add'} expense`,
          description: error.message || `There was an error ${expenseToEdit ? 'updating' : 'adding'} the expense. Please try again.`,
          variant: "destructive",
        });
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className=" sm:max-w-[425px] max-w-[90vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {expenseToEdit ? 'Edit Expense' : 'Add New Expense'}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            {expenseToEdit ? 'Update the expense details below.' : 'Fill in the details to add a new expense.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                name="category" 
                value={formData.category} 
                onValueChange={(value) => handleChange({ target: { name: 'category', value } })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Supplies">Supplies</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Salaries">Salaries</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter expense description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amountPaid">Amount Paid</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="amountPaid"
                    name="amountPaid"
                    type="number"
                    value={formData.amountPaid}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date" 
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select 
                  name="paymentMethod" 
                  value={formData.paymentMethod} 
                  onValueChange={(value) => handleChange({ target: { name: 'paymentMethod', value } })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              type="submit" 
              disabled={expenseToEdit ? updateExpenseStatus === "loading" : createExpenseStatus === "loading"}
              className="px-4 py-2"
            >
              {expenseToEdit
                ? (updateExpenseStatus === "loading" ? "Updating..." : "Update Expense")
                : (createExpenseStatus === "loading" ? "Adding..." : "Add Expense")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditExpenseDialog;