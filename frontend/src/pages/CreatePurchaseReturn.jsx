import React, { useEffect, useCallback, useState, useRef } from "react";
import { ArrowLeft, Save, CirclePlus, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import SelectDistributorDlg from "../components/custom/distributor/SelectDistributorDlg";
import ProductSelector from "../components/custom/inventory/SelectInventory";
import BatchSuggestion from "../components/custom/sales/BatchSuggestion";
import { useToast } from "../hooks/use-toast";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import RefundDialog from "../components/custom/refund/RefundDialog";
import { formatCurrency } from "../utils/Helper";
import { createPurchaseReturn, searchByInvoice } from "../redux/slices/PurchaseBillSlice";

// Helper function for expiry validation (MM/YY)
const validateExpiry = (value) => {
  if (!value) return { valid: true, message: "" }; // Allow empty
  const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
  if (!regex.test(value)) {
    return { valid: false, message: "Use MM/YY format" };
  }
  // Optional: Add checks for valid month/year range if needed
  return { valid: true, message: "" };
};

const PurchaseReturn = () => {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [returnDate, setReturnDate] = useState(
    new Date()
      .toLocaleDateString("en-IN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .split("/")
      .reverse()
      .join("-")
  );
  const [claimGSTInReturn, setClaimGSTInReturn] = useState(true);
  const [adjustRateForDisc, setAdjustRateForDisc] = useState(true);
  const [distributorSelectDialog, setdistributorSelectDialog] = useState(false);
  const [distributorName, setdistributorName] = useState("");
  const [itemErrors, setItemErrors] = useState({});
  const [formData, setFormData] = useState({
    distributorName: "",
    distributorId: "",
    invoiceNumber: "",
    invoiceId: "",
    invoiceDate: "",
  });
  const dispatch = useDispatch();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmDialogContent, setConfirmDialogContent] = useState({title: "",description: "",});
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundDialogData, setRefundDialogData] = useState(null);

  // State for product selection
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [productSelectorTargetId, setProductSelectorTargetId] = useState(null); // ID of the item being edited
  const [productSearchTerm, setProductSearchTerm] = useState("");

  const inputRefs = useRef({}); // To manage focus on inputs

  const location = useLocation();

  // Define the order of focusable fields in a row
  const focusableFields = [
    "itemName",
    "batchNo",
    "pack",
    "expiry",
    "mrp",
    "qty",
    "pricePerItem",
    "discount",
    "effPurRate",
    "gst",
  ];

  // Handle key down for input navigation
  const handleKeyDown = useCallback(
    (event, rowIndex, fieldName) => {
      if (event.key !== "Enter" || items.length === 0) {
        return;
      }

      event.preventDefault();
      const currentFieldIndex = focusableFields.indexOf(fieldName);
      let targetRowIndex = rowIndex;
      let targetFieldIndex = currentFieldIndex;

      if (event.shiftKey) {
        // Shift + Enter: Move to previous input
        targetFieldIndex--;
        if (targetFieldIndex < 0) {
          // Move to the last field of the previous row
          targetFieldIndex = focusableFields.length - 1;
          targetRowIndex--;
          if (targetRowIndex < 0) {
            // Wrap around to the last field of the last row
            targetRowIndex = items.length - 1;
          }
        }
      } else {
        // Enter: Move to next input
        targetFieldIndex++;
        if (targetFieldIndex >= focusableFields.length) {
          // Move to the first field of the next row
          targetFieldIndex = 0;
          targetRowIndex++;
          if (targetRowIndex >= items.length) {
            // Wrap around to the first field of the first row
            targetRowIndex = 0;
          }
        }
      }

      // Use data-row-id and data-field for targeting
      const targetItemId = items[targetRowIndex]?.id;
      if (targetItemId === undefined) return; // Check if target row exists

      const targetFieldName = focusableFields[targetFieldIndex];
      // Adjusted querySelector to use data-row-id and data-field
      const targetInput = document.querySelector(
        `[data-row-id="${targetItemId}"] [data-field="${targetFieldName}"]` // Select within the row container
      );

      targetInput?.focus();
    },
    [items, focusableFields] // Add dependencies
  );

  // Handle distributor name input change
  const handleDistributorNameChange = (e) => {
    e.preventDefault();
    const value = e.target.value;
    setdistributorName(value);

    // Only open dialog if space is pressed or text is entered (not on backspace/delete)
    if (value.length === 1) {
      if (value === " ") {
        setdistributorSelectDialog(true);
      } else if (value[0] !== " " && distributorName.length === 0) {
        setdistributorSelectDialog(true);
      }
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

  // Update handleInputChange to include calculations and validation
  // Update handleInputChange to handle batch/product selection updates
  const handleInputChange = (id, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          let updatedItem = { ...item, [field]: value };

          // If product is selected
          if (field === "productSelection") {
            updatedItem = {
              ...updatedItem,
              itemName: value.name, // 'value' is the selected product object
              inventoryId: value._id,
              // Reset batch info when product changes
              batchNo: "",
              batchId: "",
              expiry: "",
              mrp: "",
              pack: "",
              pricePerItem: "",
              gst: "",
              effPurRate: "",
              amount: "0",
            };
            delete updatedItem.productSelection; // Remove temporary field
          }

          // If batch is selected
          if (field === "batchSelection") {
            const selectedBatch = value; // 'value' is the selected batch object
            updatedItem = {
              ...updatedItem,
              batchNo: selectedBatch.batchNumber,
              batchId: selectedBatch._id,
              expiry: selectedBatch.expiry,
              mrp: selectedBatch.mrp || "",
              pack: selectedBatch.pack || "",
              discount: selectedBatch.discount || "",
              pricePerItem: selectedBatch.purchaseRate || "", // Use purchase rate from batch
              gst: selectedBatch.gstPer || "", // Use GST from batch if available
              // Reset qty maybe? Or keep existing? Let's keep it for now.
            };
            delete updatedItem.batchSelection; // Remove temporary field
            // Recalculate effPurRate and amount after batch selection updates price/gst
            const purchaseRate = parseFloat(updatedItem.pricePerItem) || 0;
            const discount = parseFloat(updatedItem.discount) || 0;
            updatedItem.effPurRate = adjustRateForDisc
              ? purchaseRate - (purchaseRate * discount) / 100
              : purchaseRate;

            const qty = parseFloat(updatedItem.qty) || 0;
            const effRate = parseFloat(updatedItem.effPurRate) || 0;
            const amount = effRate * qty; // Note: Qty is not per pack here, needs check
            updatedItem.amount = amount.toFixed(2);
          }

          // --- Expiry Validation Start ---
          if (field === "expiry") {
            const expiryValidation = validateExpiry(value);
            setItemErrors((prevErrors) => {
              const newItemErrors = { ...prevErrors };
              if (!expiryValidation.valid) {
                newItemErrors[id] = {
                  ...newItemErrors[id],
                  expiry: expiryValidation.message,
                };
              } else {
                // Clear error if valid
                delete newItemErrors[id]?.expiry;
                if (Object.keys(newItemErrors[id] || {}).length === 0) {
                  delete newItemErrors[id];
                }
              }
              return newItemErrors;
            });
          }
          // --- Expiry Validation End ---

          // Recalculate effective purchase rate if price or discount changes manually
          if (
            (field === "pricePerItem" || field === "discount") &&
            field !== "batchSelection"
          ) {
            const purchaseRate =
              parseFloat(
                field === "pricePerItem" ? value : item.pricePerItem
              ) || 0;
            const discount =
              parseFloat(field === "discount" ? value : item.discount) || 0;
            updatedItem.effPurRate = adjustRateForDisc
              ? purchaseRate - (purchaseRate * discount) / 100
              : purchaseRate;
          }

          // Recalculate amount when qty, price, effective rate, pack, or gst changes manually
          if (
            (field === "qty" ||
              field === "pricePerItem" ||
              field === "effPurRate" ||
              field === "pack" ||
              field === "gst") &&
            field !== "batchSelection" // Avoid double calc after batch selection
          ) {
            const qty =
              parseFloat(field === "qty" ? value : updatedItem.qty) || 0;
            // const pack = parseFloat(field === "pack" ? value : updatedItem.pack) || 1; // Pack seems less relevant for return amount calc?
            const effRate = parseFloat(updatedItem.effPurRate) || 0;
            const amount = effRate * qty; // Amount = effRate * Qty (base units)
            // const gst = parseFloat(field === 'gst' ? value : updatedItem.gst) || 0;
            // const gstAmount = claimGSTInReturn ? (amount * gst) / 100 : 0; // GST amount isn't directly stored in item.amount
            updatedItem.amount = amount.toFixed(2);
          }

          // If manual itemName change, reset inventoryId and batch info
          if (
            field === "itemName" &&
            !updatedItem.inventoryId &&
            updatedItem.isManual
          ) {
            updatedItem = {
              ...updatedItem,
              inventoryId: "",
              batchNo: "",
              batchId: "",
              // Also clear derived fields if product name is manually cleared/changed
              expiry: "",
              mrp: "",
              pack: "",
              pricePerItem: "",
              gst: "",
              effPurRate: "",
              amount: "0",
            };
          }
          // If manual batchNo change, reset batchId
          if (
            field === "batchNo" &&
            !updatedItem.batchId &&
            updatedItem.isManual
          ) {
            updatedItem = {
              ...updatedItem,
              batchId: "",
              // Also clear derived fields if batch no is manually changed/cleared
              expiry: "",
              mrp: "",
              pack: "",
              pricePerItem: "",
              gst: "",
              effPurRate: "",
              amount: "0",
            };
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  // --- Product Selector Handlers ---
  const handleProductNameChange = (e, itemId) => {
    const value = e.target.value;
    // Update the item's name directly for display in input
    handleInputChange(itemId, "itemName", value);
    // Store search term and target item ID for the dialog
    setProductSearchTerm(value);
    setProductSelectorTargetId(itemId);

    // Open selector if needed
    if (value.length === 1 && value === " ") {
      e.preventDefault(); // Prevent space from being typed
      setProductSearchTerm(""); // Clear search term when opening with space
      setProductSelectorOpen(true);
    } else if (value.length > 0 && value[0] !== " ") {
      setProductSelectorOpen(true);
    } else {
      setProductSelectorOpen(false); // Close if input is cleared
      // If input is cleared, reset associated product data
      handleInputChange(itemId, "itemName", ""); // Ensures reset logic in handleInputChange runs
    }
  };

  const handleProductSelect = (product) => {
    if (productSelectorTargetId !== null) {
      // Use the temporary 'productSelection' field to pass the whole object
      handleInputChange(productSelectorTargetId, "productSelection", product);
      // Focus batch input after product selection
      setTimeout(() => {
        // Target the input *inside* the BatchSuggestion component for the specific row
        const targetInput = document.querySelector(
          `[data-row-id="${productSelectorTargetId}"] [data-field="batchNo"] input#batch-number-input`
        );
        targetInput?.focus();
      }, 0);
    }
    setProductSelectorOpen(false);
    setProductSelectorTargetId(null);
    setProductSearchTerm("");
  };
  // --- End Product Selector Handlers ---

  // --- Batch Suggestion Handler ---
  const handleBatchSelect = (batch, itemId) => {
    // Use the temporary 'batchSelection' field
    handleInputChange(itemId, "batchSelection", batch);
    // Focus next input (e.g., quantity) after batch selection
    setTimeout(() => {
      // Use data-row-id and data-field for targeting
      const targetInput = document.querySelector(
        `[data-row-id="${itemId}"] [data-field="qty"]` // Assuming 'qty' is the next logical field
      );
      targetInput?.focus();
    }, 0);
  };
  // --- End Batch Suggestion Handler ---

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const distributorId = queryParams.get("distributorId");
    const invoiceNumber = queryParams.get("invoiceNumber");
    const name = queryParams.get("distributorName");

    if (distributorId && invoiceNumber && name) {
      setdistributorName(name);
      setFormData({
        ...formData,
        distributorId,
        invoiceNumber,
        distributorName: name,
      });
      handleSearch(distributorId, invoiceNumber);
    }
  }, [location.search]);

  // Update handleSearch to use the thunk
  const handleSearch = async (distributorIdParam, invoiceNumberParam) => {
    const distId = formData.distributorId || distributorIdParam;
    const invNum = formData.invoiceNumber || invoiceNumberParam;

    if (!distId || !invNum) {
      toast({
        title: "Please select distributor and enter invoice number",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await dispatch(
        searchByInvoice({
          distributorId: distId,
          invoiceNumber: invNum,
        })
      ).unwrap();

      const { invoiceDetails, products } = result;

      // Update form data with invoice details and date
      setFormData((prev) => ({
        ...prev,
        invoiceId: invoiceDetails._id,
        distributorName: invoiceDetails.distributorName,
        distributorId: invoiceDetails.distributorId,
        invoiceNumber: invoiceDetails.invoiceNumber,
        invoiceDate: invoiceDetails.invoiceDate,
      }));

      // Directly format products into items structure
      const formattedItems = products.map((product, index) => {
        const purchaseRate = parseFloat(product.purchaseRate) || 0;
        const discount = parseFloat(product.discount) || 0;
        const effectivePurRate = adjustRateForDisc
          ? purchaseRate - (purchaseRate * discount) / 100
          : purchaseRate;
        const packValue = parseFloat(product.pack) || 1;
        const quantityValue = parseFloat(product.quantity) || 0;
        const adjustedQty = quantityValue / packValue;
        const calculatedAmount = effectivePurRate * adjustedQty;

        return {
          id: product._id || `inv-${index}`,
          inventoryId: product.inventoryId?._id || product.inventoryId,
          itemName: product.productName,
          batchId: product.batchId,
          batchNo: product.batchNumber,
          pack: packValue,
          expiry: product.expiry || "",
          mrp: product.mrp || "",
          qty: adjustedQty,
          pricePerItem: purchaseRate,
          discount: discount,
          effPurRate: effectivePurRate,
          gst: product.gstPer || "",
          amount: calculatedAmount.toFixed(2),
          isManual: false,
        };
      });

      setItems(formattedItems);
      setItemErrors({});
    } catch (error) {
      toast({
        title: "Failed to search invoice",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  // Update useEffect to recalculate when adjustRateForDisc changes
  // Update useEffect for adjustRateForDisc/claimGSTInReturn needs review, ensure it uses correct fields like pricePerItem
  useEffect(() => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        const purchaseRate = parseFloat(item.pricePerItem) || 0;
        const discount = parseFloat(item.discount) || 0;
        let effPurRate = adjustRateForDisc
          ? purchaseRate - (purchaseRate * discount) / 100
          : purchaseRate;

        const qty = parseFloat(item.qty) || 0; // Qty is already in base units
        // const pack = parseFloat(item.pack) || 1; // Pack not used in amount calc here
        const amount = effPurRate * qty;
        // const gst = parseFloat(item.gst) || 0; // GST not used directly in item.amount
        // const gstAmount = claimGSTInReturn ? (amount * gst) / 100 : 0;

        // Only update if effPurRate actually changed
        // Use a tolerance check for floating point comparison
        if (Math.abs(effPurRate - item.effPurRate) > 0.001) {
          return {
            ...item,
            effPurRate,
            amount: amount.toFixed(2),
          };
        }
        // If only claimGSTInReturn changed, no need to update individual item state here
        // The calculateTotals function will handle it based on the flag
        return item;
      })
    );
  }, [adjustRateForDisc, claimGSTInReturn]); // Keep claimGSTInReturn dependency for recalculating totals implicitly

  const calculateTotals = () => {
    const totalsBeforeRounding = items.reduce(
      (acc, item) => {
        const qty = parseFloat(item.qty) || 0; // Qty is base units
        const rate = parseFloat(item.effPurRate) || 0;
        const amount = qty * rate; // This is the taxable amount per item
        const gst = parseFloat(item.gst) || 0;
        const gstAmount = claimGSTInReturn ? (amount * gst) / 100 : 0;
        const itemTotal = amount + gstAmount;
        const pack = parseFloat(item.pack) || 1;
        const displayQty = qty / pack; // Calculate display quantity (packs/strips)

        return {
          products: acc.products + 1,
          totalQuantity: acc.totalQuantity + qty, // Accumulate base quantity
          discount: acc.discount, // Assuming discount calculation might be added later? Currently unused.
          taxableAmount: acc.taxableAmount + amount,
          cgstSgst: acc.cgstSgst + gstAmount,
          total: acc.total + itemTotal, // Accumulate precise total
        };
      },
      {
        products: 0,
        totalQuantity: 0, // This will be total base quantity
        discount: 0,
        taxableAmount: 0,
        cgstSgst: 0,
        total: 0, // Start precise total at 0
      }
    );

    // Perform rounding after reduce
    const roundedTotal = Math.round(totalsBeforeRounding.total);
    const roundOff = (roundedTotal - totalsBeforeRounding.total).toFixed(2); // Calculate roundOff

    return {
      ...totalsBeforeRounding,
      total: roundedTotal, // Final total is the rounded amount
      refundableAmt: roundedTotal, // Refundable amount should also be the rounded total
      roundOff: parseFloat(roundOff), // Store the calculated roundOff
    };
  };

  // Updated handleAddItem
  const handleAddItem = () => {
    setItems((prev) => {
      // Generate a unique temporary ID for the new row
      const nextId = `new-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const newItem = {
        id: nextId,
        inventoryId: "",
        itemName: "", // User input triggers product search
        batchId: "",
        batchNo: "", // User input triggers batch search or is selected
        pack: "",
        expiry: "",
        mrp: "",
        qty: "", // Qty represents base units internally
        pricePerItem: "",
        discount: 0,
        effPurRate: "",
        gst: "",
        amount: "0",
        isManual: true, // Flag to indicate manually added item
      };
      return [...prev, newItem];
    });

    // Focus the product name input of the new row
    setTimeout(() => {
      // Use the newly generated ID to find the input
      const newItemId = items.length ? items[items.length - 1].id : null; // Get the ID of the last item *before* potential state update finishes
      // A more robust way is needed if state update isn't immediate
      // Find the ID of the *actually* added item after state updates
      const addedItem = items.find(
        (item) => item.isManual && !item.inventoryId
      ); // Find the incomplete manual item
      const targetId = addedItem ? addedItem.id : null;

      if (targetId) {
        // Target the input within the specific row using data-row-id
        const targetInput = document.querySelector(
          `[data-row-id="${targetId}"] [data-field="itemName"]`
        );
        targetInput?.focus();
      }
    }, 100); // Increased timeout slightly
  };

  const handleDeleteItem = (id) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    setItemErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[id];
      return newErrors;
    });
  };

  // Function to save the return *with* refund details (called by RefundDialog)
  const handleRefundSubmit = async (refundDetailsFromDialog) => {
    try {
      const totals = calculateTotals(); // Recalculate totals or pass from proceedWithSave
      const formattedProducts = items.map((item) => ({
        inventoryId: item.inventoryId,
        batchId: item.batchId,
        productName: item.itemName,
        batchNumber: item.batchNo,
        expiry: item.expiry,
        HSN: item.HSN || "",
        mrp: parseFloat(item.mrp) || 0,
        quantity: parseFloat(item.qty * (item.pack || 1)) || 0,
        pack: parseFloat(item.pack) || 1,
        purchaseRate: parseFloat(item.pricePerItem) || 0,
        discount: parseFloat(item.discount) || 0,
        gstPer: parseFloat(item.gst) || 0,
        amount: parseFloat(item.amount) || 0,
        reason: item.reason || "other",
      }));
      const billSummary = {
        subtotal: totals.taxableAmount,
        discountAmount: totals.discount,
        taxableAmount: totals.taxableAmount,
        gstAmount: totals.cgstSgst,
        totalQuantity: totals.totalQuantity,
        productCount: totals.products,
        grandTotal: totals.total,
        roundOff: totals.roundOff,
        gstSummary: calculateGSTSummary(items),
      };

      const returnData = {
        returnDate,
        distributorId: formData.distributorId || null,
        ...(formData.invoiceId &&
          formData.invoiceNumber && {
            originalInvoice: formData.invoiceId,
            originalInvoiceNumber: formData.invoiceNumber,
            originalInvoiceDate: formData.invoiceDate,
          }),
        products: formattedProducts,
        claimGSTInReturn,
        adjustRateForDisc,
        billSummary,
        refundDetails: refundDetailsFromDialog,
      };

      // Use Redux slice instead of direct fetch
      await dispatch(createPurchaseReturn(returnData)).unwrap();
      
      toast({
        title: "Purchase return created successfully",
        variant: "success",
      });
      navigate("/purchase/return");
    } catch (error) {
      toast({
        title: "Failed to create purchase return",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsRefundDialogOpen(false);
    }
  };

  // Function to save the return *without* refund details
  const saveReturnWithoutRefund = async () => {
    try {
      const totals = calculateTotals();
      const formattedProducts = items.map((item) => ({
        inventoryId: item.inventoryId,
        batchId: item.batchId,
        productName: item.itemName,
        batchNumber: item.batchNo,
        expiry: item.expiry,
        HSN: item.HSN || "",
        mrp: parseFloat(item.mrp) || 0,
        quantity: parseFloat(item.qty) || 0,
        pack: parseFloat(item.pack) || 1,
        purchaseRate: parseFloat(item.pricePerItem) || 0,
        discount: parseFloat(item.discount) || 0,
        gstPer: parseFloat(item.gst) || 0,
        amount: parseFloat(item.amount) || 0,
        reason: item.reason || "other",
      }));
      const billSummary = {
        subtotal: totals.taxableAmount,
        discountAmount: totals.discount,
        taxableAmount: totals.taxableAmount,
        gstAmount: totals.cgstSgst,
        totalQuantity: totals.totalQuantity,
        productCount: totals.products,
        grandTotal: totals.total,
        roundOff: totals.roundOff,
        gstSummary: calculateGSTSummary(items),
      };

      const returnData = {
        returnDate,
        distributorId: formData.distributorId || null,
        ...(formData.invoiceId &&
          formData.invoiceNumber && {
            originalInvoice: formData.invoiceId,
            originalInvoiceNumber: formData.invoiceNumber,
            originalInvoiceDate: formData.invoiceDate,
          }),
        products: formattedProducts,
        claimGSTInReturn,
        adjustRateForDisc,
        billSummary,
        refundDetails: null,
      };

      // Use Redux slice instead of direct fetch
      await dispatch(createPurchaseReturn(returnData)).unwrap();
      
      toast({
        title: "Purchase return created successfully",
        variant: "success",
      });
      navigate("/purchase/return");
    } catch (error) {
      toast({
        title: "Failed to create purchase return",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
    }
  };

  // This function now decides whether to open the dialog or save directly
  const proceedWithSave = async () => {
    // --- Basic Validations (Expiry, Empty Items, Manual Item Completeness) ---
    const hasErrors = items.some((item) => itemErrors[item.id]?.expiry);
    if (hasErrors) {
      toast({
        title: "Invalid Expiry Date Format",
        description: "Please correct the highlighted expiry dates (MM/YY).",
        variant: "destructive",
      });
      return;
    }
    if (items.length === 0) {
      toast({
        title: "No Items Added",
        description: "Please add items to the return.",
        variant: "destructive",
      });
      return;
    }
    const manualItemErrors = items.some(
      (item) =>
        item.isManual &&
        (!item.inventoryId ||
          !item.batchId ||
          !item.qty ||
          isNaN(parseFloat(item.qty)) ||
          parseFloat(item.qty) <= 0)
    );
    if (manualItemErrors) {
      toast({
        title: "Incomplete Manual Items",
        description:
          "Please ensure all manually added items have a product, batch, and a valid quantity (> 0).",
        variant: "destructive",
      });
      return;
    }
    // --- End Basic Validations ---

    // --- Refund Validation (moved here, basic check if refund method exists if needed, full check in RefundDialog/handleRefundSubmit) ---
    const totals = calculateTotals();

    // --- Decision Point ---
    if (totals.refundableAmt > 0) {
      // Open Refund Dialog
      setRefundDialogData({
        refundableAmount: totals.refundableAmt,
        distributorName: formData.distributorName || "Selected Distributor", // Pass distributor name
        distributorId: formData.distributorId, // Pass ID if needed by dialog/submission
        // Add any other relevant data for the dialog
      });
      setIsRefundDialogOpen(true);
      // Don't save yet, wait for handleRefundSubmit
    } else {
      // Save directly without refund
      await saveReturnWithoutRefund();
    }
  };

  // Modified handleSave to check for missing info and trigger dialog
  const handleSave = () => {
    const missingDistributor = !formData.distributorId;
    const missingInvoice = !formData.invoiceNumber;

    if (missingDistributor || missingInvoice) {
      let description = "";
      if (missingDistributor && missingInvoice) {
        description =
          "Distributor and Invoice Number are not selected. This return will not be linked to an original purchase.";
      } else if (missingDistributor) {
        description =
          "Distributor is not selected. This return will not be linked to an original purchase.";
      } else {
        // missingInvoice
        description =
          "Invoice Number is not provided. This return may not be correctly linked to the original purchase.";
      }
      setConfirmDialogContent({
        title: "Proceed Without Linking?",
        description: `${description} Do you want to continue?`,
      });
      setIsConfirmDialogOpen(true);
    } else {
      // If both are provided, proceed directly
      proceedWithSave();
    }
  };

  // Helper function to calculate GST summary
  const calculateGSTSummary = (itemsToSummarize) => {
    const gstRates = [0, 5, 12, 18, 28];
    const summary = {};

    gstRates.forEach((rate) => {
      summary[rate] = {
        taxable: 0,
        cgst: 0,
        sgst: 0,
        igst: 0, // Assuming only CGST/SGST for now
        total: 0,
      };
    });

    itemsToSummarize.forEach((item) => {
      const gstRate = parseFloat(item.gst); // Use item.gst
      const qty = parseFloat(item.qty) || 0; // Qty is base units
      const rate = parseFloat(item.effPurRate) || 0;
      const amount = qty * rate; // Taxable amount for the item

      if (!isNaN(gstRate) && gstRates.includes(gstRate)) {
        summary[gstRate].taxable += amount;
        if (claimGSTInReturn) {
          // Apply GST only if claimed
          const gstAmount = (amount * gstRate) / 100;
          summary[gstRate].cgst += gstAmount / 2;
          summary[gstRate].sgst += gstAmount / 2;
          summary[gstRate].total += amount + gstAmount;
        } else {
          summary[gstRate].total += amount; // If not claiming GST, total is just taxable
        }
      }
    });
    // Round the values in the summary
    Object.keys(summary).forEach((rate) => {
      summary[rate].taxable = parseFloat(summary[rate].taxable.toFixed(2));
      summary[rate].cgst = parseFloat(summary[rate].cgst.toFixed(2));
      summary[rate].sgst = parseFloat(summary[rate].sgst.toFixed(2));
      summary[rate].igst = parseFloat(summary[rate].igst.toFixed(2));
      summary[rate].total = parseFloat(summary[rate].total.toFixed(2));
    });
    return summary;
  };

  const totals = calculateTotals();
  const { isCollapsed } = useSelector((state) => state.loader);

  // Add selector for loading state
  const { createPurchaseReturnStatus } = useSelector((state) => state.purchaseBill);

  // Add selector for search status
  const { searchByInvoiceStatus } = useSelector((state) => state.purchaseBill);

  return (
    <div className="relative h-screen flex flex-col">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-300 px-4 pt-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Create Purchase Return</h1>
        </div>
        <div className="flex items-center ">
          <Button onClick={handleSave} disabled={createPurchaseReturnStatus === "loading"} size='sm' className='gap-2 px-2'>
            {createPurchaseReturnStatus === "loading" ? (
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
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <ScrollArea className="flex-1 px-4 pb-20">
        <div className="space-y-4">
          {/* Top Section */}
          <div className="grid grid-cols-4 gap-4">
            {/* Left Section - Distributor */}
            <div className="col-span-3 border rounded-lg p-4 font-semibold">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-7">
                  <Label className="text-sm font-medium mb-2 block">
                    DISTRIBUTOR
                  </Label>
                  <Input
                    type="text"
                    placeholder="Type or Press space"
                    value={distributorName}
                    onChange={handleDistributorNameChange}
                    className="w-full"
                  />
                </div>
                <div className="col-span-3">
                  <Label className="text-sm font-medium mb-2 block">
                    INVOICE NO
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter Invoice No."
                    value={formData.invoiceNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, invoiceNumber: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2 flex items-end">
                  <Button
                    className="w-full h-10"
                    onClick={handleSearch}
                    disabled={searchByInvoiceStatus === "loading"}
                  >
                    {searchByInvoiceStatus === "loading" ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Section - Return Info */}
            <div className="border rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    RETURN DATE<span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="claim-gst"
                      checked={claimGSTInReturn}
                      onCheckedChange={setClaimGSTInReturn}
                    />
                    <Label htmlFor="claim-gst" className="text-sm">
                      Claim GST in Debit Note
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="adjust-rate"
                      checked={adjustRateForDisc}
                      onCheckedChange={setAdjustRateForDisc}
                    />
                    <Label htmlFor="adjust-rate" className="text-sm">
                      Adjust Rate for Disc, Scheme, Free Qty
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="w-full border-[1px] border-inherit py-4 rounded-sm space-y-2">
            {/* Table Headers */}
            <div className="grid grid-cols-[3fr_2fr_0.75fr_1fr_1fr_0.75fr_1fr_0.5fr_1fr_0.5fr_1fr_50px] w-full gap-1 px-4 items-center">
              <div>
                <p className="text-xs font-semibold ">PRODUCT</p>
              </div>
              <div className="">
                <p className="text-xs font-semibold">BATCH NO</p>
              </div>
              <div className="">
                <p className="text-xs font-semibold">PACK</p>
              </div>
              <div className="">
                <p className="text-xs font-semibold">EXPIRY</p>
              </div>
              <div className="">
                <p className="text-xs font-semibold">MRP</p>
              </div>
              <div className="">
                <p className="text-xs font-semibold">QTY</p>
              </div>
              <div className="">
                <p className="text-xs font-semibold">PUR RATE</p>
              </div>
              <div className="">
                <p className="text-xs font-semibold">DISC %</p>
              </div>
              <div className="">
                <p className="text-xs font-semibold">EFF PUR RATE</p>
              </div>
              <div className="">
                <p className="text-xs font-semibold">GST</p>
              </div>
              <div className="">
                <p className="text-xs font-semibold">AMOUNT</p>
              </div>
              <div className="">
                <p className="text-xs font-semibold">ACTION</p>
              </div>
            </div>

            {/* Table Body */}
            <div className="w-full space-y-2 px-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  // Add data-row-id for easier targeting
                  data-row-id={item.id}
                  className="grid grid-cols-[3fr_2fr_0.75fr_1fr_1fr_0.75fr_1fr_0.5fr_1fr_0.5fr_1fr_50px] w-full gap-1 items-start relative font-semibold" // Changed items-center to items-start for error message positioning
                >
                  {/* PRODUCT Input */}
                  <div >
                    <Input
                      type="text"
                      value={
                        item.id === productSelectorTargetId
                          ? productSearchTerm
                          : item.itemName
                      } // Show search term for target row, else show item name
                      placeholder="Type or Press Space"
                      data-row-index={index} // Keep for potential handleKeyDown usage
                      data-field="itemName"
                      onKeyDown={(e) => {
                        if (e.key === " " && e.target.value.length === 0) {
                          e.preventDefault(); // Prevent space if field is empty
                          handleProductNameChange(e, item.id);
                        }
                        // Add Enter key navigation if needed, careful not to conflict
                        // else if (e.key === 'Enter') {
                        //    handleKeyDown(e, index, "itemName");
                        // }
                      }}
                      onChange={(e) => handleProductNameChange(e, item.id)}
                      className="h-8 w-full border-[1px] border-gray-300 px-1"
                      // ref={(el) => inputRefs.current[`item-${item.id}-itemName`] = el} // Example ref
                    />
                  </div>
                  {/* BATCH NO Input */}
                  <div data-field="batchNo">
                    {" "}
                    {/* Wrapper div with data-field */}
                    <BatchSuggestion
                      // Use item.id for unique identification if needed by BatchSuggestion internally
                      inventoryId={item.inventoryId}
                      value={item.batchNo}
                      setValue={(value) =>
                        handleInputChange(item.id, "batchNo", value)
                      } // Update batchNo for display typing
                      onSuggestionSelect={(batch) =>
                        handleBatchSelect(batch, item.id)
                      }
                      inputRef={inputRefs} // Pass refs if BatchSuggestion needs them for internal navigation
                      disabled={!item.inventoryId} // Disable if no product selected
                      //   ref={(el) => inputRefs.current[`item-${item.id}-batchNo`] = el} // Ref for BatchSuggestion input wrapper if needed
                      // Add onKeyDown to BatchSuggestion if Enter navigation is needed from it
                    />
                  </div>
                  {/* PACK Input */}
                  <div>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs">1 x</span>
                      <Input
                        type="text" // Keep as text? Or number?
                        value={item.pack}
                        data-row-index={index}
                        data-field="pack"
                        onKeyDown={(e) => handleKeyDown(e, index, "pack")}
                        onChange={(e) =>
                          handleInputChange(item.id, "pack", e.target.value)
                        }
                        className="h-8 w-full border-[1px] border-gray-300 px-1 pl-6"
                        readOnly={!item.isManual && item.batchId} // Pack usually comes from batch
                      />
                    </div>
                  </div>
                  {/* EXPIRY Input */}
                  <div className="relative">
                    {" "}
                    {/* Relative positioning for error message */}
                    <Input
                      type="text"
                      value={item.expiry}
                      placeholder="MM/YY"
                      data-row-index={index}
                      data-field="expiry"
                      onKeyDown={(e) => handleKeyDown(e, index, "expiry")}
                      onChange={(e) =>
                        handleInputChange(item.id, "expiry", e.target.value)
                      }
                      className={`h-8 w-full border-[1px] px-1 ${
                        itemErrors[item.id]?.expiry
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      readOnly={!item.isManual && item.batchId} // Expiry comes from batch
                    />
                    {itemErrors[item.id]?.expiry && (
                      <p className="text-xs text-red-500 absolute -bottom-4 left-0">
                        {itemErrors[item.id].expiry}
                      </p>
                    )}
                  </div>
                  {/* MRP Input */}
                  <div>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs">
                        ₹
                      </span>
                      <Input
                        type="text"
                        value={item.mrp}
                        data-row-index={index}
                        data-field="mrp"
                        onKeyDown={(e) => handleKeyDown(e, index, "mrp")}
                        onChange={(e) =>
                          handleInputChange(item.id, "mrp", e.target.value)
                        }
                        className="h-8 w-full border-[1px] border-gray-300 px-1 pl-5"
                        step="any"
                        readOnly={!item.isManual && item.batchId} // MRP comes from batch
                      />
                    </div>
                  </div>
                  {/* QTY Input */}
                  <div>
                    <Input
                      type="text"
                      value={item.qty} // Display base unit qty internally
                      placeholder="Units" // Placeholder clarification
                      data-row-index={index}
                      data-field="qty"
                      onKeyDown={(e) => handleKeyDown(e, index, "qty")}
                      onChange={(e) =>
                        handleInputChange(item.id, "qty", e.target.value)
                      }
                      className="h-8 w-full border-[1px] border-gray-300 px-1"
                      step="any"
                      data-row-id={item.id} // Add data-row-id for easier targeting by focus logic
                    />
                  </div>
                  {/* PUR RATE Input */}
                  <div>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs">
                        ₹
                      </span>
                      <Input
                        type="text"
                        value={item.pricePerItem}
                        data-row-index={index}
                        data-field="pricePerItem"
                        onKeyDown={(e) => handleKeyDown(e, index, "pricePerItem")}
                        onChange={(e) =>
                          handleInputChange(
                            item.id,
                            "pricePerItem",
                            e.target.value
                          )
                        }
                        className="h-8 w-full border-[1px] border-gray-300 px-1 pl-5"
                        step="any"
                        readOnly={!item.isManual && item.batchId} // Rate comes from batch
                      />
                    </div>
                  </div>
                  {/* DISC % Input */}
                  <div>
                    <div className="relative">
                      <Input
                        type="text"
                        value={item.discount}
                        data-row-index={index}
                        data-field="discount"
                        onKeyDown={(e) => handleKeyDown(e, index, "discount")}
                        onChange={(e) =>
                          handleInputChange(item.id, "discount", e.target.value)
                        }
                        className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5"
                        step="any"
                      />
                    </div>
                  </div>
                  {/* EFF PUR RATE Input */}
                  <div>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs">
                        ₹
                      </span>
                      <Input
                        type="text"
                        value={item.effPurRate}
                        readOnly // Calculated field
                        className="h-8 w-full border-[1px] border-gray-300 px-1 pl-5 bg-gray-100"
                        tabIndex={-1}
                        step="any"
                      />
                    </div>
                  </div>
                  {/* GST Input */}
                  <div>
                    <div className="relative">
                      <Input
                        type="text"
                        value={item.gst}
                        data-row-index={index}
                        data-field="gst"
                        onKeyDown={(e) => handleKeyDown(e, index, "gst")}
                        onChange={(e) =>
                          handleInputChange(item.id, "gst", e.target.value)
                        }
                        className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5"
                        step="any"
                        readOnly={!item.isManual && item.batchId} // GST might come from batch
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">
                        %
                      </span>
                    </div>
                  </div>
                  {/* AMOUNT Input */}
                  <div>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs">
                        ₹
                      </span>
                      <Input
                        type="text" // Use text as it's formatted
                        value={item.amount}
                        readOnly // Calculated field
                        className="h-8 w-full border-[1px] border-gray-300 px-1 pl-5 bg-gray-100"
                        tabIndex={-1}
                      />
                    </div>
                  </div>
                  {/* ACTION Button */}
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="hover:text-red-500"
                      tabIndex={-1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Item Button */}
            <div className="px-4 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleAddItem}
              >
                <CirclePlus size={16} /> Add Item
              </Button>
            </div>
          </div>

          {/* Additional Options */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <Label className="text-sm font-medium mb-4 block">DISCOUNT</Label>
              <div className="flex gap-4">
                <Input placeholder="Value" className="w-24" />
                <span className="flex items-center">%</span>
                <span className="flex items-center px-2">OR</span>
                <Input placeholder="₹ Value" className="flex-1" />
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <Label className="text-sm font-medium mb-4 block">
                REFUNDABLE AMOUNT
              </Label>
              <Input placeholder="₹ Value" />
            </div>
            <div className="flex items-center justify-center p-4 border rounded-lg">
              <div className="text-center">
                <div className="mb-1">Click on Save to Process Return</div>
                <div className="text-sm text-muted-foreground">
                  Use 'Alt+S' Key
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer - Fixed */}
      <div
        className={`fixed bottom-0 ${
          isCollapsed ? "w-[calc(100%-95px)]" : "w-[calc(100%-225px)]"
        } text-sm grid grid-cols-8 gap-4 text-white bg-gray-900 rounded-lg transition-all duration-300 text-center`}
      >
        <div className="py-2">
          <div>Total Products: {totals.products}</div>
          <div>Total Quantity: {totals.totalQuantity}</div>
        </div>
        <div className="py-2">
          <div>Taxable</div>
          <div className="text-lg">{formatCurrency(totals.taxableAmount)}</div>
        </div>
        <div className="py-2">
          <div className="">(-) Discount</div>
          <div className="text-lg">{formatCurrency(totals.discount)}</div>
        </div>
        <div className="py-2">
          <div className="">(+) GST Amount</div>
          <div className="text-lg">{formatCurrency(totals.cgstSgst)}</div>
        </div>
        <div className="py-2">
          <div className="">Round Off</div>
          <div className="text-lg">{formatCurrency(totals.roundOff)}</div>
        </div>
        <div className="py-2">
          <div className="">Refundable Amt</div>
          <div className="text-lg">{formatCurrency(totals.refundableAmt)}</div>
        </div>
        <div className="py-2">
          <div className="">Balance</div>
          <div className="text-lg">{formatCurrency(totals.total)}</div>
        </div>
        <div className="bg-rose-500 py-2">
          <div className="">Total Amount</div>
          <div className="text-lg">{formatCurrency(totals.total)}</div>
        </div>
      </div>

      {/* Dialogs */}
      <ProductSelector
        open={productSelectorOpen}
        onOpenChange={setProductSelectorOpen}
        onSelect={handleProductSelect}
        search={productSearchTerm}
        setSearch={setProductSearchTerm}
      />

      <SelectDistributorDlg
        open={distributorSelectDialog}
        setOpen={setdistributorSelectDialog}
        search={distributorName}
        setSearch={setdistributorName}
        onSelect={handleDistributorSelect}
      />

      <RefundDialog
        open={isRefundDialogOpen}
        onOpenChange={setIsRefundDialogOpen}
        refundData={refundDialogData}
        onSubmit={handleRefundSubmit}
        loadingStatus={createPurchaseReturnStatus}
      />

      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialogContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={proceedWithSave}>
              Yes, Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PurchaseReturn;
