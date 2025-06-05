import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAccountTransactions } from '../redux/slices/accountSlice';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { FileX, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { format } from "date-fns";

const Transactions = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { accountId } = useParams();
  const { transactions, transactionsStatus, error, accounts, pagination } = useSelector((state) => state.accounts);
  
  // Find the current account details
  const currentAccount = accounts?.find(account => account._id === accountId);

  useEffect(() => {
    if (accountId) {
      dispatch(fetchAccountTransactions({ accountId, page: pagination.currentPage }));
    }
  }, [dispatch, accountId, pagination.currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      dispatch(fetchAccountTransactions({ accountId, page: newPage }));
    }
  };

  if (!accountId) {
    return <div className="p-4">Please select an account to view transactions.</div>;
  }

  if (transactionsStatus === 'loading') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (transactionsStatus === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-red-600">
        <FileX className="h-12 w-12 mb-3" />
        <p className="text-lg font-medium">Error Loading Transactions</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {/* Header Section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">Account Transactions</h1>
      </div>

      {/* Transactions Table */}
      {!transactions || transactions.length === 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-medium">Date</TableHead>
                <TableHead className="font-medium">Name</TableHead>
                <TableHead className="font-medium text-right">Credit</TableHead>
                <TableHead className="font-medium text-right">Debit</TableHead>
                <TableHead className="font-medium text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <FileX className="h-12 w-12 mb-3 text-gray-400" />
                    <p className="text-lg font-medium mb-1">No Transactions Found</p>
                    <p className="text-sm">There are no transactions available for this account.</p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium">Date & Time</TableHead>
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="font-medium">Payment Number</TableHead>
                  <TableHead className="font-medium ">Credit</TableHead>
                  <TableHead className="font-medium ">Debit</TableHead>
                  <TableHead className="font-medium ">Balance</TableHead>
                  <TableHead className="font-medium text-right">Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction._id || `${transaction.paymentDate}-${transaction.amount}`} className='hover:bg-muted/50' onClick={() => navigate(`/payment/${transaction._id}`)}>
                    <TableCell className="font-semibold">
                      { format(new Date(transaction.paymentDate), "dd-MM-yyyy")} {format(new Date(transaction.createdAt), "hh:mm a")}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {transaction.customerName || transaction.distributorName || 'N/A'}
                    </TableCell>
                    <TableCell>{transaction.paymentNumber || '---'}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {transaction.paymentType === 'Payment In' ? `₹ ${transaction.amount?.toLocaleString('en-IN')}` : '-'}
                    </TableCell>
                    <TableCell className="font-semibold text-red-600">
                      {transaction.paymentType === 'Payment Out' ? `₹ ${transaction.amount?.toLocaleString('en-IN')}` : '-'}
                    </TableCell>
                    <TableCell className="font-semibold">
                      <span className={transaction.accountBalance >= 0 ? "text-green-600" : "text-red-600"}>
                        ₹ {Math.abs(transaction.accountBalance)?.toLocaleString('en-IN')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.createdByName || '---'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-gray-600">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of {pagination.total} transactions
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter(page => {
                    const current = pagination.currentPage;
                    return page === 1 || 
                           page === pagination.pages || 
                           (page >= current - 1 && page <= current + 1);
                  })
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2">...</span>
                      )}
                      <Button
                        variant={pagination.currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="min-w-[32px]"
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.pages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;