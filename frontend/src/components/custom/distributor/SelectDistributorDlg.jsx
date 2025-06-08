import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Search, Plus, PackageX } from "lucide-react";
import { Badge } from "../../ui/badge";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState, useRef } from "react";
import { fetchDistributors } from "../../../redux/slices/distributorSlice";
import CreateDistributorDlg from "./CreateDistributorDlg";
import { ScrollArea } from "../../ui/scroll-area";
import { Separator } from "../../ui/separator";
import { cn } from "../../../lib/utils";
import { formatCurrency } from "../../../utils/Helper";

export default function SelectDistributorDlg({
  open,
  setOpen,
  search,
  setSearch,
  onSelect,
  initialDataForCreate,
}) {
  const { distributors, fetchStatus } = useSelector(
    (state) => state.distributor
  );
  const dispatch = useDispatch();
  const [createDistributorOpen, setCreateDistributorOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const searchRef = useRef();

  useEffect(() => {
    if (open && !createDistributorOpen) {
      setTimeout(() => {
        if (searchRef?.current) {
          searchRef?.current.focus();
        }
      }, 0);
    }
  }, [open, createDistributorOpen]);

  useEffect(() => {
    if (fetchStatus === "idle") {
      dispatch(fetchDistributors());
    }
  }, [fetchStatus]);

  // Filter distributors based on search
  const filteredDistributors = (distributors || []).filter((distributor) =>
    distributor?.name?.toLowerCase().includes(search?.toLowerCase())
  );

  // Add effect to set initial selection when dialog opens or search changes
  useEffect(() => {
    const filtered = (distributors || []).filter((distributor) =>
      distributor?.name?.toLowerCase().includes(search?.toLowerCase())
    );
    if (filtered.length > 0) {
      setSelectedId(filtered[0]._id);
    } else {
      setSelectedId(null);
    }
  }, [search, open, distributors]);

  // Add keyboard navigation handler
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const filtered = filteredDistributors;
      const currentIndex = filtered.findIndex((d) => d._id === selectedId);

      if (e.key === "ArrowDown") {
        const nextIndex =
          currentIndex < filtered.length - 1 ? currentIndex + 1 : 0;
        setSelectedId(filtered[nextIndex]._id);
      } else {
        const prevIndex =
          currentIndex > 0 ? currentIndex - 1 : filtered.length - 1;
        setSelectedId(filtered[prevIndex]._id);
      }
    } else if (e.key === "Enter" && selectedId) {
      const selected = filteredDistributors.find((d) => d._id === selectedId);
      if (selected) {
        onSelect?.(selected);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === "F2" && open) {
        setCreateDistributorOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [open, createDistributorOpen]);

  const handleOnSuccess = (newDistributor) => {
    setCreateDistributorOpen(false);
    onSelect?.(newDistributor);
    setOpen(false);
  };

  const finalInitialData = {
    ...(initialDataForCreate || {}),
    name: search || initialDataForCreate?.name || "",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl p-0 gap-0" onKeyDown={handleKeyDown}>
        <DialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
          <div>
            <DialogTitle className="text-base font-semibold">
              Select a Distributor
            </DialogTitle>
          </div>
        </DialogHeader>
        <Separator />

        <div className="py-2 px-4 flex justify-between">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
            <Input
              autoFocus
              placeholder="Search distributors..."
              className="pl-8 h-8 text-sm border rounded-md focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              ref={searchRef}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="px-2"
              onClick={() => setCreateDistributorOpen(true)}
            >
              <Plus className="h-3 w-3" />
              Add Distributor (F2)
            </Button>
          </div>
        </div>

        <div className="relative mx-4">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[35%] text-left text-sm font-semibold">
                  DISTRIBUTOR NAME/ADDRESS
                </TableHead>
                <TableHead className="w-[20%] text-left text-sm font-semibold">
                  MOBILE NO
                </TableHead>
                <TableHead className="w-[25%] text-left text-sm font-semibold">
                  GSTIN / DRUG LIC
                </TableHead>
                <TableHead className="w-[20%] text-left text-sm font-semibold">
                  BALANCE
                </TableHead>
              </TableRow>
            </TableHeader>
          </Table>

          <ScrollArea className="h-[400px] pr-2 py-1">
            <Table>
              <TableBody>
                {filteredDistributors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-[300px] text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <PackageX className="w-12 h-12 mb-2 text-gray-400" />
                        <p className="text-base font-medium">
                          No distributors found
                        </p>
                        <p className="text-sm text-gray-400">
                          Add new distributor press F2
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDistributors.map((distributor) => (
                    <TableRow
                      key={distributor._id}
                      id={distributor._id}
                      className={cn(
                        "cursor-pointer hover:bg-blue-50 transition-colors",
                        selectedId === distributor._id && "bg-blue-200"
                      )}
                      onClick={() => {
                        onSelect?.(distributor);
                        setOpen(false);
                      }}
                    >
                      <TableCell className="w-[35%] py-3">
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            {distributor.name}
                            {distributor.verified && (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800 h-5 px-2 rounded-full"
                              >
                                ✓
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {distributor.address.length > 30
                              ? `${distributor.address.substring(0, 30)}...`
                              : distributor.address}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="w-[20%] py-3">
                        {distributor.mob}
                      </TableCell>
                      <TableCell className="w-[25%] py-3">
                        <div>
                          <div>{distributor.gstin}</div>
                          <div className="text-xs text-gray-500">
                            {distributor.DLNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="w-[20%] py-3">
                        <span
                          className={
                            distributor.currentBalance > 0
                              ? "text-green-600"
                              : distributor.currentBalance < 0
                              ? "text-red-600"
                              : ""
                          }
                        >
                          {distributor.currentBalance > 0
                            ? "↓ "
                            : distributor.currentBalance < 0
                            ? "↑ "
                            : ""}
                          {formatCurrency(
                            Math.abs(distributor.currentBalance || 0)
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <div className="p-3 bg-gray-100 text-xs text-gray-600 flex items-center justify-center gap-3">
          <span>Add New - F2</span>
          <span>|</span>
          <span>Navigate - ↑↓</span>
          <span>|</span>
          <span>Select - Enter</span>
          <span>|</span>
          <span>Close - ESC</span>
        </div>
      </DialogContent>

      <CreateDistributorDlg
        open={createDistributorOpen}
        onOpenChange={setCreateDistributorOpen}
        onSuccess={handleOnSuccess}
        initialData={finalInitialData}
      />
    </Dialog>
  );
}
