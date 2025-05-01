import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { FileX } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchLedgerEntries } from "../../../redux/slices/distributorSlice";

export default function LedgerTabContent({ isActive, distributorId }) {
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchLedger = async () => {
      if (!isActive) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const result = await dispatch(fetchLedgerEntries(distributorId)).unwrap();
        setLedgerEntries(result);
      } catch (error) {
        console.error('Error fetching ledger entries:', error);
        setError(error.toString());
      } finally {
        setIsLoading(false);
      }
    };

    fetchLedger();
  }, [distributorId, isActive, dispatch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-red-600">
        <FileX className="h-12 w-12 mb-3" />
        <p className="text-lg font-medium">Error Loading Ledger</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!ledgerEntries || ledgerEntries.length === 0) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-medium">Date</TableHead>
              <TableHead className="font-medium">Description</TableHead>
              <TableHead className="font-medium text-right">Debit</TableHead>
              <TableHead className="font-medium text-right">Credit</TableHead>
              <TableHead className="font-medium text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5}>
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <FileX className="h-12 w-12 mb-3 text-gray-400" />
                  <p className="text-lg font-medium mb-1">No Ledger Entries Found</p>
                  <p className="text-sm">There are no ledger entries available for this distributor.</p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-medium">Date</TableHead>
            <TableHead className="font-medium">Description</TableHead>
            <TableHead className="font-medium">Invoice No.</TableHead>
            <TableHead className="font-medium text-right">Credit</TableHead>
            <TableHead className="font-medium text-right">Debit</TableHead>
            <TableHead className="font-medium text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ledgerEntries.map((entry, index) => (
            <TableRow key={entry._id || index}>
              <TableCell>
                {new Date(entry.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </TableCell>
              <TableCell>{entry.description}</TableCell>
              <TableCell>{entry.invoiceNumber}</TableCell>
              
              <TableCell className="text-right">
                {entry.credit ? `₹ ${entry.credit.toLocaleString()}` : '-'}
              </TableCell>
              <TableCell className="text-right">
                {entry.debit ? `₹ ${entry.debit.toLocaleString()}` : '-'}
              </TableCell>
              <TableCell className="text-right">
                <span className={entry.balance >= 0 ? "text-green-600" : "text-red-600"}>
                  ₹ {Math.abs(entry.balance).toLocaleString()}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 