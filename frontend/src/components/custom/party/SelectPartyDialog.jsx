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
import { Edit, Search, Trash2 } from "lucide-react";
import { Badge } from "../../ui/badge";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { fetchParties } from "../../../redux/slices/partySlice";
import CreatePartyDialog from "./CreatePartyDialog";
import { ScrollArea } from "../../ui/scroll-area";

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

  useEffect(() => {
    if (fetchStatus === "idle") {
      dispatch(fetchParties());
    }
  }, [fetchStatus]);

  // Filter distributors based on search
  const filteredDistributors = distributors.filter((distributor) =>
    distributor.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl p-0 gap-0">
        <DialogHeader className="p-4 w-[90%] flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <DialogTitle className="text-lg">Select a Distributor</DialogTitle>
            <p className="text-xs text-muted-foreground">
              Select an option from the below list
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-gray-800"
              onClick={() => setCreatePartyOpen(true)}
            >
              Create New (F2)
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4 border-b">
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="text-xs mb-1.5">SEARCH DISTRIBUTOR</div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search..."
                  className="pl-8 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[400px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="py-2">DISTRIBUTOR NAME/ADDRESS</TableHead>
                <TableHead className="py-2">MOBILE NO</TableHead>
                <TableHead className="py-2">GSTIN / DRUG LIC</TableHead>
                <TableHead className="py-2">BALANCE</TableHead>
                <TableHead className="py-2">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDistributors.map((distributor) => (
                <TableRow
                  key={distributor._id}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => {
                    onSelect?.(distributor);
                    setOpen(false);
                  }}
                >
                  <TableCell className="py-2">
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        {distributor.name}
                        {distributor.verified && (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 h-5 px-1"
                          >
                            ✓
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {distributor.address}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">{distributor.mobile}</TableCell>
                  <TableCell className="py-2">
                    <div>
                      <div>{distributor.gstin}</div>
                      <div className="text-xs text-muted-foreground">
                        {distributor.drugLic}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div>
                      <div>{distributor.balance}</div>
                      <div className="text-xs text-muted-foreground">-</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-rose-500"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="p-2 bg-gray-50 text-xs text-muted-foreground flex items-center justify-center gap-2">
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
