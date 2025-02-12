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
import { Edit, Search, Trash2, Plus } from "lucide-react";
import { Badge } from "../../ui/badge";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { fetchParties } from "../../../redux/slices/partySlice";
import CreatePartyDialog from "./CreatePartyDialog";
import { ScrollArea } from "../../ui/scroll-area";
import {Separator} from '../../ui/separator'
import { cn } from "../../../lib/utils";

export default function SelectPartyDialog({
  open,
  setOpen,
  search,
  setSearch,
  onSelect,
}) {
  const { parties: distributors, fetchStatus } = useSelector(
    (state) => state.party
  );
  const dispatch = useDispatch();
  const [createPartyOpen, setCreatePartyOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (fetchStatus === "idle") {
      dispatch(fetchParties());
    }
  }, [fetchStatus]);

  // Filter distributors based on search
  const filteredDistributors = distributors.filter((distributor) =>
    distributor.name.toLowerCase().includes(search.toLowerCase())
  );

  // Add effect to set initial selection when dialog opens or search changes
  useEffect(() => {
    const filtered = distributors.filter((distributor) =>
      distributor.name.toLowerCase().includes(search.toLowerCase())
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
      const currentIndex = filtered.findIndex(d => d._id === selectedId);
      
      if (e.key === "ArrowDown") {
        const nextIndex = currentIndex < filtered.length - 1 ? currentIndex + 1 : 0;
        setSelectedId(filtered[nextIndex]._id);
      } else {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : filtered.length - 1;
        setSelectedId(filtered[prevIndex]._id);
      }
    } else if (e.key === "Enter" && selectedId) {
      const selected = filteredDistributors.find(d => d._id === selectedId);
      if (selected) {
        onSelect?.(selected);
        setOpen(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} hideCloseButton >
      <DialogContent className="max-w-5xl p-0 gap-0" onKeyDown={handleKeyDown}>
        <DialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
          <div>
            <DialogTitle className="text-base font-semibold">Select a Distributor</DialogTitle>
          </div>
          <div className="flex items-center gap-2 mr-6">
            <Button
              size="sm"
              className="bg-blue-600 text-white h-7 px-3 text-xs rounded-md hover:bg-blue-700"
              onClick={() => setCreatePartyOpen(true)}
            >
              <Plus className="h-3 w-3" />
              Create New (F2)
            </Button>
          </div>
        </DialogHeader>
        <Separator className='' />

        <div className="p-4 border-b bg-white">
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-700 mb-1.5">Enter Distributor Name</div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
                <Input
                  autoFocus
                  placeholder="Enter Party Name..."
                  className="pl-8 h-8 text-sm border rounded-md focus:ring-2 focus:ring-blue-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative mx-6 mt-4">
          <Table>
            <TableHeader className="sticky top-0 bg-gray-50 z-10">
              <TableRow>
                <TableHead className="w-[30%] text-left text-sm font-semibold text-gray-600">DISTRIBUTOR NAME/ADDRESS</TableHead>
                <TableHead className="w-[15%] text-left text-sm font-semibold text-gray-600">MOBILE NO</TableHead>
                <TableHead className="w-[25%] text-left text-sm font-semibold text-gray-600">GSTIN / DRUG LIC</TableHead>
                <TableHead className="w-[15%] text-left text-sm font-semibold text-gray-600">BALANCE</TableHead>
                <TableHead className="w-[15%] text-left text-sm font-semibold text-gray-600">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
          </Table>
          
          <ScrollArea className="h-[400px] pr-2">
            <Table>
              <TableBody>
                {filteredDistributors.map((distributor) => (
                  <TableRow
                    key={distributor._id}
                    className={cn(
                      "cursor-pointer hover:bg-gray-100 transition-colors",
                      selectedId === distributor._id && "bg-gray-100"
                    )}
                    onClick={() => {
                      onSelect?.(distributor);
                      setOpen(false);
                    }}
                  >
                    <TableCell className="w-[30%] py-3">
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
                    <TableCell className="w-[15%] py-3">{distributor.mobile}</TableCell>
                    <TableCell className="w-[25%] py-3">
                      <div>
                        <div>{distributor.gstin}</div>
                        <div className="text-xs text-gray-500">
                          {distributor.drugLic}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[15%] py-3">
                      <div>
                        <div>{distributor.balance}</div>
                        <div className="text-xs text-gray-500">-</div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[15%] py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-blue-500 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <div className="p-3 bg-gray-50 text-xs text-gray-600 flex items-center justify-center gap-3">
          <span>Create New - F2</span>
          <span>|</span>
          <span>Edit Selected - F4</span>
          <span>|</span>
          <span>Delete Selected - DEL</span>
          <span>|</span>
          <span>Close - ESC</span>
        </div>
      </DialogContent>

      <CreatePartyDialog
        open={createPartyOpen}
        onOpenChange={setCreatePartyOpen}
        onSuccess={(newParty) => {
          setCreatePartyOpen(false);
          onSelect?.(newParty);
          setOpen(false);
        }}
      />
    </Dialog>
  );
}
