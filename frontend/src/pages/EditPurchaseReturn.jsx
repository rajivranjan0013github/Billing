import React, { useRef, useState, useMemo, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { ArrowLeft, Pencil, Save, Settings2, ChevronRight, Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import PurchaseItemTable from "../components/custom/purchase/PurchaseItemTable";
import { Backend_URL } from "../assets/Data";
import { useToast } from "../hooks/use-toast";
import SelectdistributorDialog from "../components/custom/distributor/SelectDistributorDlg";
import { calculateTotals } from "./CreatePurchaseInvoice";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchItems } from "../redux/slices/inventorySlice";
import AmountSettingsDialog from "../components/custom/purchase/AmountSettingDialog";
import { ScrollArea } from "../components/ui/scroll-area";
import { formatCurrency } from "../utils/Helper";
import { Separator } from "../components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const inputKeys = ['distributorName', 'debitNoteNumber', 'returnDate', 'originalInvoiceNumber', 'originalInvoiceDate', 'product', 'HSN', 'batchNumber', 'expiry', 'pack', 'quantity', 'purchaseRate', 'discount', 'gstPer', 'addButton'];

const roundToTwo = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

// Helper function to format date to YYYY-MM-DD
const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

// Helper function to format date for API
const formatDateForAPI = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
};

export default function EditPurchaseReturn() {
  const inputRef = useRef([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { returnId } = useParams();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState(true);
  const [returnDate, setReturnDate] = useState();
  const [originalInvoiceDate, setOriginalInvoiceDate] = useState();
  const [products, setProducts] = useState([]);
  const [distributorSelectDialog, setdistributorSelectDialog] = useState(false);
  const [distributorName, setdistributorName] = useState("");
  const [billSummary, setBillSummary] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    distributorName: "",
    distributorId: "",
    debitNoteNumber: "",
    returnDate: "",
    originalInvoiceNumber: "",
    originalInvoiceDate: "",
    originalInvoice: "",
    claimGSTInReturn: true,
    adjustRateForDisc: true,
  });

  // fetching return data from server
  useEffect(() => {
    const fetchReturn = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${Backend_URL}/api/purchase/return/${returnId}`,
          { credentials: "include" }
        );
        if (!response.ok) {
          throw new Error("Something went wrong");
        }
        const data = await response.json();

        const {
          distributorName,
          distributorId,
          debitNoteNumber,
          returnDate,
          originalInvoiceNumber,
          originalInvoiceDate,
          originalInvoice,
          products,
          claimGSTInReturn,
          adjustRateForDisc,
          billSummary,
          mob,
        } = data;

        // Transform products data
        const tempData = products.map((p) => ({
          ...p,
          quantity: p.quantity / (p.pack || 1),
          reason: p.reason || "other",
        }));

        setProducts(tempData);
        setReturnDate(formatDateForInput(returnDate));
        setOriginalInvoiceDate(formatDateForInput(originalInvoiceDate));

        setFormData({
          ...formData,
          distributorName,
          distributorId,
          debitNoteNumber,
          originalInvoiceNumber,
          originalInvoiceDate,
          originalInvoice,
          claimGSTInReturn,
          adjustRateForDisc,
          mob: mob || "",
        });

        if (billSummary) {
          setBillSummary(billSummary);
        }
        setdistributorName(distributorName);
      } catch (error) {
        console.error("Error fetching return:", error);
        toast({
          title: "Error",
          description: "Failed to fetch return details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (returnId) {
      fetchReturn();
    }
  }, [returnId]);

  // calculating total of the products
  const amountData = useMemo(
    () => calculateTotals(products, "exclusive"),
    [products]
  );

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle key navigation
  const handleKeyDown = (e, nextInputId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        const nextInputIndex = inputKeys.indexOf(nextInputId);
        if(nextInputIndex > 1) {
          const newInputId = inputKeys[nextInputIndex-2];
          if (newInputId && inputRef.current[newInputId]) {
            inputRef.current[newInputId].focus();
          }
        }
      } else {
        if (nextInputId && inputRef.current[nextInputId]) {
          inputRef.current[nextInputId].focus();
        }
      }
    }
  };

  // shortcut for saving return
  const handleShortcutKeyPressed = (e) => {
    if(e.altKey && e.key === "s") {
      e.preventDefault()
      handleSaveReturn();
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleShortcutKeyPressed);

    return () => {
      document.removeEventListener("keydown", handleShortcutKeyPressed);
    };
  }, []);

  // Handle distributor name input change
  const handleDistributorNameChange = (e) => {
    e.preventDefault();
    const value = e.target.value;

    // Open dialog if space is pressed or text is entered
    if (value.length === 1 && value === " ") {
      setdistributorSelectDialog(true);
      return;
    }
    if (value.length > 0 && value[0] !== " ") {
      setdistributorName(value);
      setdistributorSelectDialog(true);
    }
  };

  // Handle distributor selection from dialog
  const handleDistributorSelect = (distributor) => {
    setdistributorName(distributor.name);
    setFormData({
      ...formData,
      distributorId: distributor._id,
      distributorName: distributor.name,
    });
    setdistributorSelectDialog(false);
  };

  const handleSaveReturn = async () => {
    try {
      setLoading(true);
      // Validate required fields
      if (!formData.distributorName || !formData.debitNoteNumber || !returnDate || !formData.originalInvoiceNumber || !originalInvoiceDate) {
        throw new Error("Please fill all required fields");
      }

      if (products.length === 0) { 
        throw new Error("Please add at least one product");
      }

      // Validate that all products have a reason
      const missingReasons = products.some(p => !p.reason);
      if (missingReasons) {
        throw new Error("Please specify a reason for all returned products");
      }

      // Format products data to match schema
      const formattedProducts = products.map((product) => ({
        inventoryId: product.inventoryId,
        productName: product.productName,
        batchNumber: product.batchNumber,
        batchId: product.batchId,
        expiry: product.expiry,
        HSN: product.HSN || "",
        mrp: roundToTwo(Number(product.mrp)),
        quantity: Number(product.quantity) * (Number(product.pack) || 1),
        pack: Number(product.pack),
        purchaseRate: roundToTwo(Number(product.purchaseRate)),
        discount: roundToTwo(Number(product.discount || 0)),
        gstPer: roundToTwo(Number(product.gstPer)),
        amount: roundToTwo(Number(product.amount)),
        reason: product.reason || "other",
      }));

      const finalData = {
        _id: returnId,
        debitNoteNumber: formData.debitNoteNumber,
        returnDate: formatDateForAPI(returnDate),
        distributorName: formData.distributorName,
        distributorId: formData.distributorId,
        mob: formData.mob || "",
        originalInvoiceNumber: formData.originalInvoiceNumber,
        originalInvoiceDate: formatDateForAPI(originalInvoiceDate),
        originalInvoice: formData.originalInvoice,
        products: formattedProducts,
        claimGSTInReturn: formData.claimGSTInReturn,
        adjustRateForDisc: formData.adjustRateForDisc,
        billSummary: {
          subtotal: roundToTwo(amountData.subtotal),
          discountAmount: roundToTwo(amountData.discountAmount),
          taxableAmount: roundToTwo(amountData.taxable),
          gstAmount: roundToTwo(amountData.gstAmount),
          totalQuantity: amountData.totalQuantity,
          productCount: amountData.productCount,
          grandTotal: roundToTwo(amountData.grandTotal),
        },
      };

      const response = await fetch(`${Backend_URL}/api/purchase/return/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save return");
      }

      await response.json();
      
      toast({
        title: "Purchase return updated successfully",
        variant: "success",
      });

      // Refresh inventory items
      dispatch(fetchItems());

      // Navigate back
      navigate(-1);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save return",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReturn = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${Backend_URL}/api/purchase/return/delete/${returnId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete return");
      }

      toast({
        title: "Success",
        description: "Purchase return deleted successfully",
        variant: "success",
      });

      // Refresh inventory items
      dispatch(fetchItems());

      navigate(-1);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete return",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="relative rounded-lg h-[100vh] pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">
            {viewMode ? "View" : "Edit"} Purchase Return
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Column Settings
          </Button>
          {viewMode ? (
            <>
              <Button
                size="sm"
                variant="destructive"
                className="gap-2"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setViewMode(false)}
              >
                <Pencil className="w-4 h-4" /> Edit
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="gap-2"
              onClick={handleSaveReturn}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save (Alt + S)
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <Separator className="my-2" />

      <ScrollArea className="h-[calc(100vh-9rem)] pr-4">
        {/* Return Information */}
        <div className="grid gap-4">
          <div className="grid gap-4 grid-cols-5">
            <div>
              <Label className="text-sm font-medium">
                DISTRIBUTOR NAME<span className="text-rose-500">*REQUIRED</span>
              </Label>
              <Input
                ref={el => inputRef.current['distributorName'] = el}
                value={distributorName || ""}
                onChange={handleDistributorNameChange}
                onKeyDown={(e) => handleKeyDown(e, 'debitNoteNumber')}
                placeholder="Type or Press space"
                disabled={viewMode}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">
                DEBIT NOTE NO<span className="text-rose-500">*REQUIRED</span>
              </Label>
              <Input
                ref={el => inputRef.current['debitNoteNumber'] = el}
                value={formData?.debitNoteNumber}
                onChange={(e) =>
                  handleInputChange("debitNoteNumber", e.target.value)
                }
                onKeyDown={(e) => handleKeyDown(e, 'returnDate')}
                placeholder="Debit Note No"
                disabled={viewMode}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">
                RETURN DATE<span className="text-rose-500">*REQUIRED</span>
              </Label>
              <Input
                ref={el => inputRef.current['returnDate'] = el}
                type="date"
                value={returnDate || ''}
                onChange={(e) => {
                  setReturnDate(e.target.value);
                }}
                onKeyDown={(e) => handleKeyDown(e, 'originalInvoiceNumber')}
                disabled={viewMode}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">
                ORIGINAL INVOICE NO<span className="text-rose-500">*REQUIRED</span>
              </Label>
              <Input
                ref={el => inputRef.current['originalInvoiceNumber'] = el}
                value={formData?.originalInvoiceNumber}
                onChange={(e) =>
                  handleInputChange("originalInvoiceNumber", e.target.value)
                }
                onKeyDown={(e) => handleKeyDown(e, 'originalInvoiceDate')}
                placeholder="Original Invoice No"
                disabled={viewMode}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">
                ORIGINAL INVOICE DATE<span className="text-rose-500">*REQUIRED</span>
              </Label>
              <Input
                ref={el => inputRef.current['originalInvoiceDate'] = el}
                type="date"
                value={originalInvoiceDate || ''}
                onChange={(e) => {
                  setOriginalInvoiceDate(e.target.value);
                }}
                onKeyDown={(e) => handleKeyDown(e, 'product')}
                disabled={viewMode}
              />
            </div>
          </div>

          <div className="flex gap-8">
            <div>
              <Label className="text-sm font-medium">CLAIM GST IN RETURN?</Label>
              <RadioGroup
                value={formData?.claimGSTInReturn ? "yes" : "no"}
                onValueChange={(value) =>
                  handleInputChange("claimGSTInReturn", value === "yes")
                }
                className="gap-4 mt-2"
                disabled={viewMode}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="claim_gst_yes" />
                  <Label htmlFor="claim_gst_yes">YES</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="claim_gst_no" />
                  <Label htmlFor="claim_gst_no">NO</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label className="text-sm font-medium">ADJUST RATE FOR DISCOUNT?</Label>
              <RadioGroup
                value={formData?.adjustRateForDisc ? "yes" : "no"}
                onValueChange={(value) =>
                  handleInputChange("adjustRateForDisc", value === "yes")
                }
                className="gap-4 mt-2"
                disabled={viewMode}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="adjust_rate_yes" />
                  <Label htmlFor="adjust_rate_yes">YES</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="adjust_rate_no" />
                  <Label htmlFor="adjust_rate_no">NO</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        {/* Return Items Table */}
        <div className="my-4">
          <div className="mb-4">
            <h2 className="text-lg font-medium mb-2">Return Items</h2>
            <div className="text-sm text-muted-foreground">
              Add items to return. Each item must have a return reason.
            </div>
          </div>
          <PurchaseItemTable
            inputRef={inputRef}
            products={products}
            setProducts={setProducts}
            viewMode={viewMode}
            gstMode="exclusive"
            handleKeyDown={handleKeyDown}
            isReturn={true}
            extraColumns={[
              {
                header: "Return Reason",
                cell: (row, index) => (
                  <Select
                    value={row.reason || "other"}
                    onValueChange={(value) => {
                      const updatedProducts = [...products];
                      updatedProducts[index] = {
                        ...updatedProducts[index],
                        reason: value,
                      };
                      setProducts(updatedProducts);
                    }}
                    disabled={viewMode}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="damaged">Damaged</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="wrong_item">Wrong Item</SelectItem>
                      <SelectItem value="excess_stock">Excess Stock</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ),
              },
            ]}
          />
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="fixed bottom-0 w-[cal(100%-200px)] grid grid-cols-7 gap-4 p-4 text-sm text-white bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="mb-1 text-gray-400">
            Total Products: {amountData?.productCount}
          </div>
          <div className="text-gray-400">
            Total Quantity: {amountData?.totalQuantity}
          </div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-gray-400">Subtotal</div>
          <div>{formatCurrency(amountData?.subtotal)}</div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-gray-400">(-) Discount</div>
          <div>{formatCurrency(amountData?.discountAmount)}</div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-gray-400">Taxable</div>
          <div>{formatCurrency(amountData?.taxable)}</div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-gray-400">(+) GST Amount</div>
          <div>{formatCurrency(amountData?.gstAmount)}</div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-gray-400">(-) Adjustment</div>
          <div>₹0</div>
        </div>
        <div className="bg-rose-500 -m-4 p-4 rounded-r-lg text-center">
          <div className="mb-1">Total Amount</div>
          <div>{formatCurrency(amountData?.grandTotal)}</div>
        </div>
      </div>

      {/* Dialogs */}
      <SelectdistributorDialog
        open={distributorSelectDialog}
        setOpen={setdistributorSelectDialog}
        search={distributorName}
        setSearch={setdistributorName}
        onSelect={handleDistributorSelect}
      />
      <AmountSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        value="exclusive"
        onChange={() => {}}
        products={products}
        setProducts={setProducts}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-xl p-0 gap-0">
          <AlertDialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
            <AlertDialogTitle className="text-base font-semibold">Delete Purchase Return</AlertDialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setDeleteDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDialogHeader>
          <div className="p-6">
            <AlertDialogDescription>
              Are you sure you want to delete this purchase return? This action will permanently delete the return
              and revert all associated inventory adjustments.
            </AlertDialogDescription>
          </div>
          <div className="p-3 bg-gray-100 border-t flex items-center justify-end gap-2">
            <Button 
              onClick={() => setDeleteDialogOpen(false)} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteReturn} 
              size="sm"
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}