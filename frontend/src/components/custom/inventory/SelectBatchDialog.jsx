import React, { useState, useMemo, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "../../ui/table";
import { cn } from "../../../lib/utils";
import { useToast } from "../../../hooks/use-toast";
import { Backend_URL } from "../../../assets/Data";
import { ScrollArea } from "../../ui/scroll-area";

export default function SelectBatchDialog({open, setOpen, batchNumber, setBatchNumber, onSelect, inventoryId}) {
  const { toast } = useToast();
  const [batches, setBatches] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // fetching batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await fetch(`${Backend_URL}/api/inventory/batches/${inventoryId}`,{ credentials: "include" });
        if (!response.ok) {
          throw new Error("Something went wrong");
        }
        const data = await response.json();
        setBatches(data);
      } catch (err) {
        toast({ variant: "destructive", title: "Unable to fetch batches" });
      }
    };
    if (inventoryId) fetchBatches();
  }, [inventoryId]);

  const filteredData = useMemo(() => {
    if (!batches || batches.length === 0) return [];
    
    return batches.filter((batch) => {
      if (!batchNumber) return true;
      return batch.batchNumber?.toLowerCase().includes(batchNumber.toLowerCase());
    });
  }, [batches, batchNumber]);

  useEffect(() => {
    if (filteredData.length > 0) {
      setSelectedId(filteredData[0].batchNumber);
    } else {
      setSelectedId(null);
    }
  }, [batchNumber, open, filteredData]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const currentIndex = filteredData.findIndex(b => b.batchNumber === selectedId);
      if (e.key === "ArrowDown") {
        const nextIndex = currentIndex < filteredData.length - 1 ? currentIndex + 1 : 0;
        setSelectedId(filteredData[nextIndex].batchNumber);
      } else {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredData.length - 1;
        setSelectedId(filteredData[prevIndex].batchNumber);
      }
    } else if (e.key === "Enter" && selectedId) {
      const selectedBatch = filteredData.find(b => b.batchNumber === selectedId);
      if (selectedBatch) {
        onSelect?.(selectedBatch);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden h-[80vh]" onKeyDown={handleKeyDown}>
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold leading-tight">
                Select Batch
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Search and select a batch from your inventory
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search batches..."
              className="pl-10 py-5 text-base w-full"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 h-[calc(80vh-180px)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 sticky top-0">
                <TableHead className="font-semibold">Batch No.</TableHead>
                <TableHead className="font-semibold">Pack Size</TableHead>
                <TableHead className="font-semibold">Expiry Date</TableHead>
                <TableHead className="font-semibold">MRP</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Purchase Rate</TableHead>
                <TableHead className="font-semibold">HSN Code</TableHead>
                <TableHead className="font-semibold">GST Rate</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {
                filteredData.length === 0 ? (
                  <>
                  {batchNumber.length >= 3 ? (
                      <div className="p-4">Create New Batch "{batchNumber}"</div>
                  ) : (
                    <div>
                      batch not found
                    </div>
                  )}
                  </>
                ) : (
                  filteredData.map((batch) => (
                    <TableRow
                      key={batch.batchNumber}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-slate-100 relative group",
                        selectedId === batch.batchNumber && "bg-muted"
                      )}
                      onClick={() => {
                        onSelect?.(batch);
                        setOpen(false);
                      }}
                    >
                      <TableCell className="font-medium">
                        {batch.batchNumber}
                      </TableCell>
                      <TableCell>{batch.pack}</TableCell>
                      <TableCell>{batch.expiry}</TableCell>
                      <TableCell>{batch.mrp}</TableCell>
                      <TableCell>
                        {batch.status && (
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            {batch.status}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{batch.purchaseRate}</TableCell>
                      <TableCell>{batch.hsnCode}</TableCell>
                      <TableCell>{batch.gstPer}%</TableCell>
                      <TableCell>
                        <div
                          className={cn(
                            "absolute inset-y-0 right-4 flex items-center text-blue-600 font-medium",
                            "opacity-0 group-hover:opacity-100 transition-all duration-150"
                          )}
                        >
                          Select <span className="ml-1">→</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )
              }
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="text-sm text-muted-foreground text-center border-t p-4 space-x-4 bg-white">
          <span className="inline-flex items-center gap-1">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">↑↓</kbd>
            <span>Navigate</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Enter</kbd>
            <span>Select</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Esc</kbd>
            <span>Close</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
