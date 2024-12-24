import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { Button } from "../../ui/button"
import { Card, CardContent } from "../../ui/card"
import { Checkbox } from "../../ui/checkbox"
import { Settings, ChevronRight, Loader2, PackageX } from 'lucide-react'
import { ScrollArea } from "../../ui/scroll-area"
import { useEffect, useState } from "react";
import { Backend_URL, convertQuantity } from "../../../assets/Data"
import ManageInventory from "../inventory/ManageInventory"
import Timeline from "./Timeline"
import SalesTab from "./SalesTab"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "../../ui/dropdown-menu"
import { Pencil, Trash2, Plus } from 'lucide-react'
import AddNewInventory from "../inventory/AddNewInventory"
import { useSelector, useDispatch } from "react-redux"
import { useToast } from "../../../hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog"
import PurchaseTab from "./PurchaseTab"

export default function InventoryDetails({inventoryId}) { 
  const [inventoryDetails, setItemDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManageInventoryOpen, setIsManageInventoryOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [updateBatchDetails, setUpdateBatchDetails] = useState(null);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const {items} = useSelector(state => state.inventory);
  const dispatch = useDispatch();
  const { toast } = useToast();
  // Fetch item details
  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${Backend_URL}/api/inventory/${inventoryId}`, {credentials: "include"});
        if(!response.ok) throw new Error("Failed to fetch item details");
        const data = await response.json();
        setItemDetails(data);
      } catch (error) {
        toast({title: "Something went wrong", variant: "destructive"});
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
      const response = await fetch(`${Backend_URL}/api/inventory/delete-batch/${batchId}`, {
        method: 'DELETE',
        credentials: "include"
      });
      if(!response.ok) throw new Error("Failed to delete batch");
      const data = await response.json();
      setItemDetails(data);
      toast({title: "Batch deleted successfully", variant: "destructive"});
    } catch (error) {
      toast({title: "Something went wrong", variant: "destructive"});
    }
  }

  if (isLoading) {
    return (
      <div className="h-[100vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleEditBatch = (batch) => {
    setIsManageInventoryOpen(true);
    setUpdateBatchDetails(batch);
  }

  return (
    <ScrollArea className="h-[100vh] pr-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-6">
          <Card className="w-48">
            <CardContent className="p-2">
              <img
                src={inventoryDetails?.imgUri || ""}
                alt={inventoryDetails?.name}
                width={100}
                height={100}
                className="object-contain"
              />
            </CardContent>
          </Card>
          <div>
            <h1 className="text-2xl font-semibold">{inventoryDetails?.name}</h1>
            <p className="text-muted-foreground">{inventoryDetails?.mfcName}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="bg-orange-500 text-white p-1 rounded-full">Rx</div>
              <div className="bg-red-500 text-white p-1 rounded-full">H</div>
              <span>{inventoryDetails?.composition}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
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

      {/* Product Info Grid */}
      <div className="grid grid-cols-8 gap-4 text-sm my-3">
        <div>
          <div className="text-muted-foreground">PACK</div>
          <div>{inventoryDetails?.pack}'s</div>
        </div>
        <div>
          <div className="text-muted-foreground">EXPIRY</div>
          <div>{inventoryDetails?.expiry || '-'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">LOCATION</div>
          <div>{inventoryDetails?.location || '-'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">MRP</div>
          <div>{inventoryDetails?.mrp ? `₹${inventoryDetails?.mrp?.toFixed(2)}` : '-'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">PURC RATE</div>
          <div>{inventoryDetails?.purchaseRate ? `₹${inventoryDetails?.purchaseRate?.toFixed(2)}` : '-'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">NET RATE</div>
          <div>{inventoryDetails?.netRate ? `₹${inventoryDetails?.netRate?.toFixed(2)}` : '-'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">PTR</div>
          <div>{inventoryDetails?.ptr ? `₹${inventoryDetails?.ptr?.toFixed(2)}` : '-'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">STOCK</div>
          <div>{convertQuantity(inventoryDetails?.quantity, inventoryDetails?.pack)}</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="batches">
        <div className="flex items-center justify-between border-b">
          <TabsList>
            <TabsTrigger value="batches" className="relative">BATCHES</TabsTrigger>
            <TabsTrigger value="purchases">PURCHASES</TabsTrigger>
            <TabsTrigger value="sales">SALES</TabsTrigger>
            <TabsTrigger value="timeline">TIMELINE</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Checkbox id="zero-qty" />
            <label htmlFor="zero-qty" className="text-sm">
              Show Zero Qty Batches
            </label>
          </div>
        </div>

        <TabsContent value="batches" className="mt-4">
          {(!inventoryDetails?.batch || inventoryDetails.batch.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <PackageX className="h-12 w-12 mb-2" />
              <p>No batches found for this item</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>BATCH NO</TableHead>
                  <TableHead>PACK</TableHead>
                  <TableHead>EXPIRY</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>PURC RATE</TableHead>
                  <TableHead>NET RATE</TableHead>
                  <TableHead>PTR</TableHead>
                  <TableHead>STOCK QTY</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryDetails.batch.map((batch) => (
                  <TableRow key={batch._id}>
                    <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                    <TableCell>{batch.pack}</TableCell>
                    <TableCell>{batch.expiry}</TableCell>
                    <TableCell>
                      <span className={`${batch.quantity > 0 ? 'bg-green-500' : 'bg-red-500'} text-white px-2 py-1 rounded-full text-xs`}>
                        {batch.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </TableCell>
                    <TableCell>₹{batch.mrp?.toFixed(2)}</TableCell>
                    <TableCell>₹{batch.purchaseRate?.toFixed(2)}</TableCell>
                    <TableCell>₹{batch.netRate?.toFixed(2)}</TableCell>
                    <TableCell>₹{batch.ptr?.toFixed(2)}</TableCell>
                    <TableCell>{convertQuantity(batch?.quantity, batch?.pack)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer flex items-center gap-2" onClick={()=>handleEditBatch(batch)}>
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
          <PurchaseTab inventoryId={inventoryDetails._id} />
        </TabsContent>
        <TabsContent value="sales">
          <SalesTab inventoryId={inventoryDetails._id} />
        </TabsContent>
        <TabsContent value="timeline">
          <Timeline inventoryId={inventoryDetails._id} />
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

      <AlertDialog open={!!batchToDelete} onOpenChange={() => setBatchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the batch {batchToDelete?.batchNumber}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                handleDeleteBatch(batchToDelete._id);
                setBatchToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  )
}

