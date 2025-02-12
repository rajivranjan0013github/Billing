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
import { fetchInventoryItems } from "../../../redux/slices/inventorySlice";
import CreateInventoryItemDialog from "./CreateInventoryItemDialog";
import { ScrollArea } from "../../ui/scroll-area";
import { Separator } from '../../ui/separator';

export default function SelectInventoryItemDialog({
  open,
  setOpen,
  search,
  setSearch,
  onSelect,
}) {
  const { items: inventoryItems, fetchStatus } = useSelector(
    (state) => state.inventory
  );
  const dispatch = useDispatch();
  const [createItemOpen, setCreateItemOpen] = useState(false);

  useEffect(() => {
    if (fetchStatus === "idle") {
      dispatch(fetchInventoryItems());
    }
  }, [fetchStatus]);

  // Filter inventory items based on search
  const filteredItems = inventoryItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen} hideCloseButton>
      <DialogContent className="max-w-5xl p-0 gap-0">
        <DialogHeader className="px-6 py-4 flex flex-row items-center justify-between bg-gray-100 border-b">
          <div className="space-y-0.5">
            <DialogTitle className="text-xl font-semibold">Select an Inventory Item</DialogTitle>
          </div>
          <div className="flex items-center gap-3 mr-6">
            <Button
              size="sm"
              className="bg-blue-600 text-white h-8 px-4 rounded-md hover:bg-blue-700"
              onClick={() => setCreateItemOpen(true)}
            >
              Create New (F2)
            </Button>
          </div>
        </DialogHeader>
        <Separator className='' />

        <div className="p-6 border-b bg-white">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700">Enter Item Name</div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  autoFocus
                  placeholder="Enter Item Name..."
                  className="pl-10 h-10 border rounded-md focus:ring-2 focus:ring-blue-500"
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
                <TableHead className="w-[30%] text-left text-sm font-semibold text-gray-600">ITEM NAME/DESCRIPTION</TableHead>
                <TableHead className="w-[15%] text-left text-sm font-semibold text-gray-600">QUANTITY</TableHead>
                <TableHead className="w-[25%] text-left text-sm font-semibold text-gray-600">PRICE</TableHead>
                <TableHead className="w-[15%] text-left text-sm font-semibold text-gray-600">CATEGORY</TableHead>
                <TableHead className="w-[15%] text-left text-sm font-semibold text-gray-600">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
          </Table>
          
          <ScrollArea className="h-[400px] pr-2">
            <Table>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow
                    key={item._id}
                    className="cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      onSelect?.(item);
                      setOpen(false);
                    }}
                  >
                    <TableCell className="w-[30%] py-3">
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          {item.name}
                          {item.verified && (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-800 h-5 px-2 rounded-full"
                            >
                              ✓
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.description.length > 30
                            ? `${item.description.substring(0, 30)}...`
                            : item.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[15%] py-3">{item.quantity}</TableCell>
                    <TableCell className="w-[25%] py-3">{item.price}</TableCell>
                    <TableCell className="w-[15%] py-3">{item.category}</TableCell>
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

      <CreateInventoryItemDialog
        open={createItemOpen}
        onOpenChange={setCreateItemOpen}
        onSuccess={(newItem) => {
          setCreateItemOpen(false);
          onSelect?.(newItem);
          setOpen(false);
        }}
      />
    </Dialog>
  );
} 