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
import { fetchCustomers } from "../../../redux/slices/CustomerSlice";
import CreateCustomerDialog from "./CreateCustomerDialog";
import { ScrollArea } from "../../ui/scroll-area";
import { Separator } from "../../ui/separator";
import { cn } from "../../../lib/utils";

export default function SelectCustomerDialog({
  open,
  setOpen,
  search,
  setSearch,
  onSelect,
}) {
  const { customers, status } = useSelector((state) => state.customers);
  const dispatch = useDispatch();
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCustomers());
    }
  }, [status]);

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase())
  );

  // Add effect to set initial selection when dialog opens or search changes
  useEffect(() => {
    const filtered = customers.filter((customer) =>
      customer.name.toLowerCase().includes(search.trim().toLowerCase())
    );
    if (filtered.length > 0) {
      setSelectedId(filtered[0]._id);
    } else {
      setSelectedId(null);
    }
  }, [search, open, customers]);

  // Add keyboard navigation handler
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const filtered = filteredCustomers;
      const currentIndex = filtered.findIndex(d => d._id === selectedId);
      
      if (e.key === "ArrowDown") {
        const nextIndex = currentIndex < filtered.length - 1 ? currentIndex + 1 : 0;
        setSelectedId(filtered[nextIndex]._id);
      } else {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : filtered.length - 1;
        setSelectedId(filtered[prevIndex]._id);
      }
    } else if (e.key === "Enter" && selectedId) {
      const selected = filteredCustomers.find(d => d._id === selectedId);
      if (selected) {
        onSelect?.(selected);
        setOpen(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} hideCloseButton>
      <DialogContent className="max-w-5xl p-0 gap-0 font-roboto" onKeyDown={handleKeyDown}>
        <DialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
          <div>
            <DialogTitle className="text-base">Select a Customer</DialogTitle>
          </div>
          <div className="flex items-center gap-2 mr-6">
            <Button
              size="sm"
              className="bg-blue-600 text-white h-7 px-3 text-xs rounded-md hover:bg-blue-700"
              onClick={() => setCreateCustomerOpen(true)}
            >
              <Plus className="h-3 w-3" />
              Create New (F2)
            </Button>
          </div>
        </DialogHeader>
        <Separator />

        <div className="p-4 border-b bg-white">
          <div className="flex gap-3">
            <div className="flex-1">
            
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
                <Input
                  autoFocus
                  placeholder="Enter Customer Name..."
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
                <TableHead className="w-[40%] text-left text-sm font-semibold text-gray-600">CUSTOMER NAME/ADDRESS</TableHead>
                <TableHead className="w-[20%] text-left text-sm font-semibold text-gray-600">MOBILE NO</TableHead>
                <TableHead className="w-[25%] text-left text-sm font-semibold text-gray-600">BALANCE</TableHead>
                <TableHead className="w-[15%] text-left text-sm font-semibold text-gray-600">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
          </Table>

          <ScrollArea className="h-[400px] pr-2">
            <Table>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer._id}
                    className={cn(
                      "cursor-pointer hover:bg-gray-100 transition-colors",
                      selectedId === customer._id && "bg-gray-100"
                    )}
                    onClick={() => {
                      onSelect?.(customer);
                      setOpen(false);
                    }}
                  >
                    <TableCell className="w-[40%] py-3">
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          {customer.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {customer.address.length > 30
                            ? `${customer.address.substring(0, 30)}...`
                            : customer.address}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[20%] py-3">{customer.mob}</TableCell>
                    <TableCell className="w-[25%] py-3">
                      <div>
                        <div>₹0.00</div>
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

      <CreateCustomerDialog
        open={createCustomerOpen}
        onOpenChange={setCreateCustomerOpen}
        onSuccess={(newCustomer) => {
          setCreateCustomerOpen(false);
          onSelect?.(newCustomer);
          setOpen(false);
        }}
      />
    </Dialog>
  );
}
