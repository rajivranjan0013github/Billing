import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Button } from "../../ui/button";
import { FileDown, FileX } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import * as XLSX from "xlsx";
import { fetchLedgerEntries } from "../../../redux/slices/distributorSlice";
import { fetchCustomerLedgerEntries } from "../../../redux/slices/CustomerSlice";
import ExportDataDlg from "../mirgration/ExportDataDlg";

export default function LedgerTabContent({
  isActive,
  distributorId,
  customerId,
}) {
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchLedger = async () => {
      if (!isActive) return;

      setIsLoading(true);
      setError(null);
      try {
        let result;
        if (distributorId) {
          result = await dispatch(fetchLedgerEntries(distributorId)).unwrap();
        } else if (customerId) {
          result = await dispatch(
            fetchCustomerLedgerEntries(customerId)
          ).unwrap();
        } else {
          throw new Error(
            "Either distributorId or customerId must be provided"
          );
        }
        setLedgerEntries(result);
      } catch (error) {
        console.error("Error fetching ledger entries:", error);
        setError(error.toString());
      } finally {
        setIsLoading(false);
      }
    };

    fetchLedger();
  }, [distributorId, customerId, isActive, dispatch]);

  const exportColumns = [
    { 
      header: "Date", 
      field: "createdAt", 
      width: 15,
      format: "date" 
    },
    { 
      header: "Description", 
      field: "description", 
      width: 40 
    },
    { 
      header: "Invoice No.", 
      field: "invoiceNumber", 
      width: 15 
    },
    { 
      header: "Credit", 
      field: "credit", 
      width: 15, 
      format: "currency",
      addTotal: true 
    },
    { 
      header: "Debit", 
      field: "debit", 
      width: 15, 
      format: "currency",
      addTotal: true 
    },
    { 
      header: "Balance", 
      field: "balance", 
      width: 15, 
      format: "currency"
    }
  ];

  const formatters = {
    "Date": (value) => new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    "Credit": (value) => value || 0,
    "Debit": (value) => value || 0,
    "Balance": (value) => value || 0,
    "Invoice No.": (value) => value || "-"
  };

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
                  <p className="text-lg font-medium mb-1">
                    No Ledger Entries Found
                  </p>
                  <p className="text-sm">
                    There are no ledger entries available.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => setIsExportDialogOpen(true)}
          disabled={!ledgerEntries || ledgerEntries.length === 0}
          variant="outline"
          size="sm"
        >
          <FileDown className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
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
          <TableBody className="font-semibold">
            {ledgerEntries.map((entry, index) => (
              <TableRow key={entry._id || index}>
                <TableCell>
                  {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </TableCell>
                <TableCell>{entry.description}</TableCell>
                <TableCell>{entry.invoiceNumber}</TableCell>

                <TableCell className="text-right">
                  {entry.credit ? `₹ ${entry.credit.toLocaleString()}` : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {entry.debit ? `₹ ${entry.debit.toLocaleString()}` : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      entry.balance >= 0 ? "text-green-600" : "text-red-600"
                    }
                  >
                    ₹ {Math.abs(entry.balance).toLocaleString()}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ExportDataDlg
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        data={ledgerEntries}
        columns={exportColumns}
        formatters={formatters}
        fileName={`ledger_${distributorId || customerId}`}
        title="Export Ledger Data"
      />
    </div>
  );
}
