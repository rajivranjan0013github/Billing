import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Badge } from "../../ui/badge";
import drugsPic from "../../../assets/drugspic.png";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import { Settings, ChevronRight, Loader2, PackageX, X } from "lucide-react";
import { ScrollArea } from "../../ui/scroll-area";
import { useEffect, useState } from "react";
import { Backend_URL, convertQuantity } from "../../../assets/Data";
import ManageInventory from "../inventory/ManageInventory";
import Timeline from "./Timeline";
import SalesTab from "./SalesTab";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Pencil, Trash2, Plus } from "lucide-react";
import AddNewInventory from "../inventory/AddNewInventory";
import { useSelector, useDispatch } from "react-redux";
import { useToast } from "../../../hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import PurchaseTab from "./PurchaseTab";
import {formatCurrency} from '../../../utils/Helper'

export default function InventoryDetails({ inventoryId }) {
  const [inventoryDetails, setItemDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManageInventoryOpen, setIsManageInventoryOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [updateBatchDetails, setUpdateBatchDetails] = useState(null);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { items } = useSelector((state) => state.inventory);
  const dispatch = useDispatch();
  const { toast } = useToast();
  // Fetch item details
  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${Backend_URL}/api/inventory/${inventoryId}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch item details");
        const data = await response.json();
        setItemDetails(data);
      } catch (error) {
        toast({ title: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    if (inventoryId) {
      fetchItemDetails();
    }
  }, [inventoryId, items]);

  const handleDeleteBatch = async (batchId) => {
    try {
      setIsDeleting(true);
      const response = await fetch(
        `${Backend_URL}/api/inventory/delete-batch/${batchId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to delete batch");
      const data = await response.json();
      setItemDetails(data);
      toast({ title: "Batch deleted successfully", variant: "destructive" });
      setBatchToDelete(null);
    } catch (error) {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[100vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleEditBatch = (batch) => {
    setIsManageInventoryOpen(true);
    setUpdateBatchDetails(batch);
  };

  return (
    <ScrollArea className="h-[100vh] pr-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-6">
          <Card className="w-48">
            <CardContent className="p-2 flex items-center justify-center">
              <img
                src={inventoryDetails?.imgUri || drugsPic}
                alt={inventoryDetails?.name}
                width={80}
                height={60}
                className="object-contain"
              />
            </CardContent>
          </Card>
          <div>
            <h1 className="text-2xl font-semibold capitalize">{inventoryDetails?.name}</h1>
            <p className="text-muted-foreground">{inventoryDetails?.mfcName}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="bg-orange-500 text-white p-1 rounded-full">
                Rx
              </div>
              <div className="bg-red-500 text-white p-1 rounded-full">H</div>
              <span>{inventoryDetails?.composition}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <div className="text-end text-lg">
            <p>{inventoryDetails?.location || '-'}</p>
            <p className="text-xs text-gray-500">Location</p>
          </div>
          <div className="flex gap-4">
            {/* <Button variant="outline" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button> */}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsEditItemOpen(true)}
            >
              <Pencil className="w-4 h-4" />
              Edit Item
            </Button>
            <Button
              variant="default"
              className="gap-2"
              onClick={() => setIsManageInventoryOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add Batch
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="batches">
        <div className="flex items-center justify-between border-b mt-2">
          <TabsList>
            <TabsTrigger value="batches" className="relative">
              BATCHES
            </TabsTrigger>
            <TabsTrigger value="purchases">PURCHASES</TabsTrigger>
            <TabsTrigger value="sales">SALES</TabsTrigger>
            <TabsTrigger value="timeline">TIMELINE</TabsTrigger>
          </TabsList> 
        </div>

        <TabsContent value="batches" className="mt-2">
          {!inventoryDetails?.batch || inventoryDetails.batch.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <PackageX className="h-12 w-12 mb-2" />
              <p>No batches found for this item</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='pl-4'>BATCH NO</TableHead>
                  <TableHead>PACK</TableHead>
                  <TableHead>EXPIRY</TableHead>
                  <TableHead className='text-center'>STATUS</TableHead>
                  <TableHead className='text-center'>MRP</TableHead>
                  <TableHead className='text-center'>PURC RATE</TableHead>
                  <TableHead className='text-center'>NET PURC RATE</TableHead>
                  <TableHead className='text-center'>SALE RATE</TableHead>
                  <TableHead className='text-center'>QUANTITY</TableHead>
                  <TableHead className='text-center'>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className='border'>
                {inventoryDetails.batch.map((batch) => (
                  <TableRow key={batch?._id}>
                    <TableCell className="font-medium pl-6">
                      {batch?.batchNumber}
                    </TableCell>
                    <TableCell>{batch.pack}</TableCell>
                    <TableCell>{batch.expiry}</TableCell>
                    <TableCell className='text-center'>
                      <Badge
                        variant={batch.quantity > 0 ? "success" : "destructive"}
                      >
                        {batch.quantity > 0 ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-center'>{formatCurrency(batch?.mrp)}</TableCell>
                    <TableCell className='text-center'>{formatCurrency(batch?.purchaseRate)}</TableCell>
                    <TableCell className='text-center'>
                      <p>{formatCurrency(batch?.purchaseRate * (1 + (batch?.gstPer||0)/100) * (1-(batch?.discount||0)/100) )}</p>
                      <p className="text-xs font-normal">Dis: {batch?.discount || 0}% | GST:{batch?.gstPer}%</p>
                    </TableCell>
                    <TableCell className='text-center'>
                      <p>{batch.saleRate ? formatCurrency(batch?.saleRate) : formatCurrency(batch?.mrp)}</p>
                      <p className="text-xs font-normal">inc {batch?.gstPer}% GST</p>
                    </TableCell>
                    {/* <TableCell className='text-center'>{batch.saleRate ? formatCurrency(batch?.saleRate) : formatCurrency(batch?.mrp)}</TableCell> */}
                    <TableCell className='text-center'>
                      {convertQuantity(batch?.quantity, batch?.pack)}
                    </TableCell>
                    <TableCell className='text-center'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer flex items-center gap-2"
                            onClick={() => handleEditBatch(batch)}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer flex items-center gap-2 text-red-600"
                            onClick={() => setBatchToDelete(batch)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
        <TabsContent value="purchases">
          <PurchaseTab inventoryId={inventoryDetails?._id} />
        </TabsContent>
        <TabsContent value="sales">
          <SalesTab inventoryId={inventoryDetails?._id} />
        </TabsContent>
        <TabsContent value="timeline">
          <Timeline inventoryId={inventoryDetails?._id} />
        </TabsContent>
      </Tabs>

      <ManageInventory
        open={isManageInventoryOpen}
        onOpenChange={setIsManageInventoryOpen}
        inventoryDetails={inventoryDetails}
        setItemDetails={setItemDetails}
        batchDetails={updateBatchDetails}
        setUpdateBatchDetails={setUpdateBatchDetails}
      />

      <AddNewInventory
        open={isEditItemOpen}
        onOpenChange={setIsEditItemOpen}
        inventoryDetails={inventoryDetails}
      />

      <AlertDialog
        open={!!batchToDelete}
        onOpenChange={() => setBatchToDelete(null)}
      >
        <AlertDialogContent className="max-w-xl p-0 gap-0">
          <AlertDialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
            <AlertDialogTitle className="text-base font-semibold">Delete Batch</AlertDialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setBatchToDelete(null)}
              disabled={isDeleting}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDialogHeader>
          <div className="p-6">
            <AlertDialogDescription>
              This will permanently delete the batch {batchToDelete?.batchNumber}. This action cannot be undone.
            </AlertDialogDescription>
          </div>
          <div className="p-3 bg-gray-100 border-t flex items-center justify-end gap-2">
            <Button 
              onClick={() => setBatchToDelete(null)} 
              variant="outline" 
              size="sm"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleDeleteBatch(batchToDelete._id)}
              size="sm"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  );
}
