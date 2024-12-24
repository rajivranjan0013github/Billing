import React, {useState, useEffect} from 'react'
import { Calendar, ChevronDown, Filter, Search, Users } from 'lucide-react'
import { Button } from "../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "../components/ui/select"
import { Input } from "../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "../components/ui/table"
import { cn } from "../lib/utils"
import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import {fetchPurchaseBills} from '../redux/slices/PurchaseBillSlice'

export default function PurchasesTransactions() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {purchaseBills, fetchStatus} = useSelector(state=> state.purchaseBill);

  useEffect(() => {
    if(fetchStatus === 'idle') {
      dispatch(fetchPurchaseBills());
    }
  }, [fetchStatus])

  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount).replace(/^(\D+)/, '₹');
  };

  const summary = purchaseBills.reduce((acc, bill) => {
    acc.count++;
    acc.purchaseAmount += bill.grandTotal || 0;
    acc.amountPaid += bill.amountPaid || 0;
    return acc;
  }, { count: 0, purchaseAmount: 0, amountPaid: 0 });

  return (
    <div className="relative p-6 rounded-lg space-y-6  ">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Purchases Transactions</h1>
          <p className="text-muted-foreground ">
            View List of all your Purchases Transactions here
          </p>
        </div>
        <div className="grid grid-cols-5 gap-4 text-right">
          <div>
            <div className="font-semibold">{summary.count}</div>
            <div className="text-sm text-muted-foreground">Purc Count</div>
          </div>
          <div>
            <div className="font-semibold">{formatCurrency(summary.purchaseAmount)}</div>
            <div className="text-sm text-muted-foreground">Purc Amt Sum</div>
          </div>
          <div>
            <div className="font-semibold">{formatCurrency(summary.amountPaid)}</div>
            <div className="text-sm text-muted-foreground">Payable Sum</div>
          </div>
          <div>
            <div className="font-semibold">{formatCurrency(summary.amountPaid)}</div>
            <div className="text-sm text-muted-foreground">Amt Paid Sum</div>
          </div>
          <div>
            <div className="font-semibold text-pink-500">₹957</div>
            <div className="text-sm text-muted-foreground">You'll Pay</div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Select defaultValue="invoice">
            <SelectTrigger className="absolute left-0 w-[140px] rounded-r-none border-r-0">
              <SelectValue>INVOICE NO</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invoice">INVOICE NO</SelectItem>
              <SelectItem value="distributor">DISTRIBUTOR</SelectItem>
              <SelectItem value="grn">GRN NO</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex">
            <Input 
              className="pl-[150px]" 
              placeholder="Search using Invoice No"
            />
            <Button variant="ghost" className="absolute right-0" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative w-[300px]">
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <Calendar className="mr-2 h-4 w-4" />
            NOV 21, 2024 - DEC 20, 2024
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </div>

        <div className="relative w-[200px]">
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <Filter className="mr-2 h-4 w-4" />
            FILTER BY
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </div>

        <div className="relative w-[200px]">
          <Button variant="outline" className="w-full justify-start text-left ">
            SORT BY
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </div>
        <div className="relative w-[200px]">
          <Button className="w-full justify-start text-left" onClick={()=>navigate(`/purchase/create-purchase-invoice`)}>
            Create Purchase Invoice
          </Button>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        {purchaseBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mb-4" />
            <p className="text-lg">No purchase bills found</p>
            <p className="text-sm">Create a new purchase invoice to get started</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>INVOICE NO</TableHead>
                <TableHead>DISTRIBUTOR / GSTIN</TableHead>
                <TableHead>GRN NO</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>BILLED ON</TableHead>
                <TableHead>INV AMT</TableHead>
                <TableHead>ADJ AMT</TableHead>
                <TableHead>PAYABLE</TableHead>
                <TableHead>BALANCE</TableHead>
                <TableHead>PAID / DUE</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseBills.map((bill) => (
                <TableRow key={bill._id} className="group cursor-pointer" onClick={()=> navigate(`/purchase/${bill._id}`)}>
                  <TableCell>{bill.invoiceNumber}</TableCell>
                  <TableCell>
                    <div>{bill.partyName}</div>
                    <div className="text-sm text-muted-foreground">
                      {bill.mob}
                    </div>
                  </TableCell>
                  <TableCell>{bill.grnNo || '-'}</TableCell>
                  <TableCell>{bill.withGst ? 'With GST' : 'Without GST'}</TableCell>
                  <TableCell>
                    <div>{new Date(bill.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</div>
                  </TableCell>
                  <TableCell>{formatCurrency(bill.grandTotal)}</TableCell>
                  <TableCell>{formatCurrency(bill.adjustmentAmount || 0)}</TableCell>
                  <TableCell>{formatCurrency(bill.payableAmount || bill.grandTotal)}</TableCell>
                  <TableCell>
                    {formatCurrency(bill.grandTotal - (bill.amountPaid || 0))}
                    {bill.paymentDueDate && (
                      <div className="text-sm text-muted-foreground">
                        {new Date(bill.paymentDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                          {
                            "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20":
                              bill.paymentStatus === "paid",
                            "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20":
                              bill.paymentStatus === "due",
                          }
                        )}
                      >
                        {bill.paymentStatus === 'paid' ? 'Paid' : 'Due'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="opacity-0 group-hover:opacity-100 text-pink-500 transition-opacity">
                      →
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="fixed  bottom-2 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Create New Purchases - <span className="font-medium">F2</span> | Move Up or Down - <span className="font-medium">Arrow Keys</span> | To Open - <span className="font-medium">Enter</span>
        </div>
      </div>
    </div>
  )
}

