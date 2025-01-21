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
import { fetchCustomers } from "../../../redux/slices/CustomerSlice";
import CreateCustomerDialog from "./CreateCustomerDialog";
import { ScrollArea } from "../../ui/scroll-area";

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

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCustomers());
    }
  }, [status]);

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl p-0 gap-0">
        <DialogHeader className="p-4 w-[90%] flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <DialogTitle className="text-lg">Select a Customer</DialogTitle>
            <p className="text-xs text-muted-foreground">
              Select an option from the below list
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-gray-800"
              onClick={() => setCreateCustomerOpen(true)}
            >
              Create New (F2)
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4 border-b">
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="text-xs mb-1.5">SEARCH CUSTOMER</div>
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
                <TableHead className="py-2">CUSTOMER NAME/ADDRESS</TableHead>
                <TableHead className="py-2">MOBILE NO</TableHead>
                <TableHead className="py-2">BALANCE</TableHead>
                <TableHead className="py-2">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow
                  key={customer._id}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => {
                    onSelect?.(customer);
                    setOpen(false);
                  }}
                >
                  <TableCell className="py-2">
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        {customer.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {customer.address}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    {customer.mobileNumber}
                  </TableCell>
                  <TableCell className="py-2">
                    <div>
                      <div>₹0.00</div>
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
