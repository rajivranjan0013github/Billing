import { useState, useRef, useEffect } from "react";
import ProductSelector from "../inventory/SelectInventory";
import { convertToFraction } from "../../../assets/Data";
import { Pen, Trash2, Check, X, Plus } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import BatchSuggestion from "../sales/BatchSuggestion";
import { Input } from "../../ui/input";

// Helper function to format expiry date input
const formatExpiryInput = (currentValue) => {
  let value = currentValue.replace(/\D/g, ""); // Remove all non-digits first

  if (value.length === 1 && Number(value) > 1) {
    value = "0" + value + "/";
  } else if (value.length > 2) {
    // If more than 2 digits, format as MM/YY (limit year to 2 digits)
    value = value.substring(0, 2) + "/" + value.substring(2, 4);
  } else if (value.length === 2 && currentValue.length === 2) {
    // If exactly 2 digits were just typed (currentValue confirms no existing slash), add slash
    value = value + "/";
  } else if (
    value.length === 2 &&
    currentValue.length === 3 &&
    currentValue.endsWith("/")
  ) {
    // Handles backspace from 'MM/Y' -> 'MM/'. We want the result to be 'MM'.
    value = value;
  }

  // Limit final length if needed (though formatting above should handle it)
  return value.slice(0, 5);
};

export default function PurchaseTable({
  inputRef,
  products,
  setProducts,
  viewMode,
  gstMode = "exclusive",
  calculateProductAmount,
}) {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(true);
  const [newProduct, setNewProduct] = useState({});
  const [productSearch, setProductSearch] = useState("");
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [batchNumber, setBatchNumber] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editAll, setEditAll] = useState(false);
  const [editBatchNumbers, setEditBatchNumbers] = useState({});
  // Add useEffect to recalculate current product amount when gstMode changes
  useEffect(() => {
    if (newProduct?.quantity && newProduct?.purchaseRate && typeof calculateProductAmount === 'function') {
      // For newProduct, we pass it directly to the calculation function
      const amount = calculateProductAmount(newProduct, gstMode);
      setNewProduct((prev) => ({
        ...prev,
        amount: convertToFraction(amount),
      }));
    }
  }, [
    gstMode,
    newProduct?.quantity,
    newProduct?.purchaseRate,
    newProduct?.discount,
    newProduct?.schemeInput1,
    newProduct?.schemeInput2,
    newProduct?.gstPer,
    calculateProductAmount, // Added to dependency array
  ]);

  // Input changes handler
  const handleInputChange = (field, value) => {
    const updatedProductInterim = { ...newProduct, [field]: value };

    // Handle schemePercent display separately if scheme inputs change
    if (field === "schemeInput1" || field === "schemeInput2") {
      if (updatedProductInterim.schemeInput1 && updatedProductInterim.schemeInput2) {
        const s1 = Number(updatedProductInterim.schemeInput1);
        const s2 = Number(updatedProductInterim.schemeInput2);
        if (s1 > 0 && s1 + s2 > 0) {
          const schemePercent = (s2 / (s1 + s2)) * 100;
          updatedProductInterim.schemePercent = convertToFraction(schemePercent);
        } else {
          updatedProductInterim.schemePercent = "";
        }
      } else {
        updatedProductInterim.schemePercent = "";
      }
    }

    // Recalculate amount using the prop function
    if (updatedProductInterim?.quantity && updatedProductInterim?.purchaseRate && typeof calculateProductAmount === 'function') {
      const amount = calculateProductAmount(updatedProductInterim, gstMode);
      updatedProductInterim.amount = convertToFraction(amount);
    } else {
      updatedProductInterim.amount = "";
    }
    setNewProduct(updatedProductInterim);
  };

  // Internal keydown handler for the table's input row
  const handleTableKeyDown = (e, currentKey) => {
    const fieldOrder = [
      "product",
      "batchNumber",
      "HSN",
      "expiry",
      "pack",
      "quantity",
      "free",
      "mrp",
      "purchaseRate",
      "schemeInput1",
      "schemeInput2",
      "discount",
      "gstPer",
      "addButton",
    ];

    if (e.key === "Enter") {
      e.preventDefault();

      if (e.shiftKey) {
        // Move backwards
        const currentIndex = fieldOrder.indexOf(currentKey);
        if (currentIndex > 0) {
          const prevField = fieldOrder[currentIndex - 1];
          if (inputRef.current[prevField]) {
            inputRef.current[prevField].focus();
          }
        }
        return;
      }

      // Move forwards
      const currentIndex = fieldOrder.indexOf(currentKey);
      if (currentIndex === -1) return;

      // If we're on the last field (addButton), trigger add
      if (currentKey === "addButton") {
        handleAdd();
        return;
      }

      // Find next empty field
      for (let i = currentIndex + 1; i < fieldOrder.length; i++) {
        const nextField = fieldOrder[i];

        // Check if the field is empty
        const isEmpty =
          !newProduct[nextField] || String(newProduct[nextField]).trim() === "";

        if (isEmpty || nextField === "addButton") {
          if (inputRef.current[nextField]) {
            inputRef.current[nextField].focus();
            return;
          }
        }
      }

      // If no empty field found, focus the add button
      if (inputRef.current["addButton"]) {
        inputRef.current["addButton"].focus();
      }
    }
  };
 
  // handle add product to list
  const handleAdd = () => {
    if (!newProduct.productName || !newProduct.inventoryId) {
      toast({ variant: "destructive", title: "Please add product" });
      return;
    }
    if (!newProduct?.quantity) {
      toast({ variant: "destructive", title: "Please add quantity" });
      return;
    }
    if(newProduct?.expiry){
      const tempExpiry = newProduct?.expiry.split("/");
      if(tempExpiry.length === 1){
        toast({ variant: "destructive", title: "Please add expiry" });
        return;
      } else if(tempExpiry.length === 2){
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const expiryYear = 2000 + Number(tempExpiry[1]);
        const expiryMonth = Number(tempExpiry[0]);
        if(expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)){
          toast({ variant: "destructive", title: "You cannot add expired product" });
          return;
        }
      }
    }
    else{
      toast({ variant: "destructive", title: "Please add expiry" });
      return;
    }

    let tempData = { ...newProduct };
    if (!tempData.batchNumber) tempData.batchNumber = batchNumber;
    setProducts((pre) => [...pre, tempData]);
    setBatchNumber("");
    setNewProduct({});
    setProductSearch("");
    inputRef.current["product"].focus();
  };

  // product selector from dialog
  const handleProductSeletor = (product) => {
    setNewProduct((prev) => ({
      ...prev,
      mfcName: product.mfcName,
      productName: product.name,
      inventoryId: product._id,
      HSN: product.HSN || "", // Pre-fill HSN if available
      pack: product.pack || 1, // Pre-fill default pack
      location: product.location || "", // Pre-fill location if available
    }));
    setProductSearch(product.name);
    setTimeout(() => {
      if (inputRef && inputRef.current["batchNumber"]) {
        inputRef.current["batchNumber"].focus();
      }
    }, 100);
  };

  // product seach Input handler
  const handleProductNameChange = (e) => {
    e.preventDefault();
    const value = e.target.value;
    if (value.length === 1 && value === " ") {
      setIsProductSelectorOpen(true);
      return;
    }
    if (value.length > 0 && value[0] !== " ") {
      setProductSearch(value);
      setIsProductSelectorOpen(true);
    }
  };

  const handleBatchSelect = (batch) => {
    if (!batch) return;
    setBatchNumber(batch.batchNumber);
    setNewProduct((prev) => ({
      ...prev,
      batchId: batch._id,
      batchNumber: batch.batchNumber,
      expiry: batch.expiry || "",
      mrp: batch.mrp || "",
      pack: batch.pack || prev.pack, // Override pack if batch has specific pack
      purchaseRate: batch.purchaseRate || "",
      gstPer: batch.gstPer || "",
      HSN: batch.HSN || prev.HSN, // Keep existing HSN if batch doesn't have one
    }));
    // Focus HSN field after batch selection
  };

  useEffect(() => {
    if (newProduct.productName && newProduct.batchNumber) {
      const syntheticEvent = new KeyboardEvent("keydown", { key: "Enter" });
      handleTableKeyDown(syntheticEvent, "batchNumber");
    }
  }, [ newProduct.batchNumber]);
  // edit all product togather
  const handleInputChangeEditMode = (index, field, value) => {
    setProducts((prevProducts) => {
      const updatedProducts = [...prevProducts];
      const productToUpdate = { ...updatedProducts[index], [field]: value };

      if (
        field === "quantity" ||
        field === "purchaseRate" ||
        field === "discount" ||
        field === "schemeInput1" ||
        field === "schemeInput2" ||
        field === "gstPer"
      ) {
        // Recalculate amount using the prop function
        if (typeof calculateProductAmount === 'function') {
            const amount = calculateProductAmount(productToUpdate, gstMode);
            productToUpdate.amount = convertToFraction(amount);
        }

        // Handle schemePercent display separately if scheme inputs change
        if (field === "schemeInput1" || field === "schemeInput2") {
            if (productToUpdate.schemeInput1 && productToUpdate.schemeInput2) {
                const s1 = Number(productToUpdate.schemeInput1);
                const s2 = Number(productToUpdate.schemeInput2);
                if (s1 > 0 && s1 + s2 > 0) {
                    const schemePercent = (s2 / (s1 + s2)) * 100;
                    productToUpdate.schemePercent = convertToFraction(schemePercent);
                } else {
                    productToUpdate.schemePercent = "";
                }
            } else {
                productToUpdate.schemePercent = "";
            }
        }
      }

      updatedProducts[index] = productToUpdate;
      return updatedProducts;
    });
  };

  const handleDeleteProduct = (indexToDelete) => {
    const updatedProducts = products.filter(
      (_, index) => index !== indexToDelete
    );
    setProducts(updatedProducts);
  };

  const handleEditProduct = (index) => {
    setEditingIndex(index);
    setEditMode(false);
  };

  const handleSaveEdit = (index) => {
    setEditingIndex(null);
    setEditMode(true);
  };

  const handleEditAllChange = (e) => {
    setEditAll(e.target.checked);
    if (e.target.checked) {
      setEditMode(false);
    } else {
      setEditMode(true);
      setEditingIndex(null);
    }
  };

  const handleEditBatchSelect = (batch, index) => {
    setEditBatchNumbers((prev) => ({ ...prev, [index]: batch.batchNumber }));

    setProducts((prevProducts) => {
      const updatedProducts = [...prevProducts];
      const existingProduct = updatedProducts[index];

      // Create the base updated product with batch details
      let productToUpdate = {
        ...existingProduct,
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        expiry: batch.expiry,
        mrp: batch.mrp,
        pack: batch.pack,
        purchaseRate: batch.purchaseRate, // Update purchase rate from batch
        // Keep existing quantity, free, discount, scheme, gst, amount for now
      };

      // Now, recalculate amount based on the updated product state using the prop function
      if (typeof calculateProductAmount === 'function') {
        const amount = calculateProductAmount(productToUpdate, gstMode);
        productToUpdate.amount = convertToFraction(amount);
      }

      // Always recalculate schemePercent based on current schemeInput1 and schemeInput2
      // as these are part of the productToUpdate from existingProduct, not directly from batch
      if (productToUpdate.schemeInput1 && productToUpdate.schemeInput2) {
        const s1 = Number(productToUpdate.schemeInput1);
        const s2 = Number(productToUpdate.schemeInput2);
        if (s1 > 0 && s1 + s2 > 0) {
          const schemePercent = (s2 / (s1 + s2)) * 100;
          productToUpdate.schemePercent = convertToFraction(schemePercent);
        } else {
          productToUpdate.schemePercent = "";
        }
      } else {
        productToUpdate.schemePercent = "";
      }

      updatedProducts[index] = productToUpdate; // Put the final updated product back
      return updatedProducts;
    });
  };

  const clearInputRow = () => {
    setNewProduct({});
    setProductSearch("");
    setBatchNumber("");
    inputRef.current["product"].focus();
  };

  return (
    <div className="w-full border-[1px] border-inherit py-4 rounded-sm">
      {/* Header row */}
      <div className="grid grid-cols-[30px_3fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_50px] gap-1 px-2">
        <div className="flex justify-center">#</div>
        <div>
          <p className="text-xs font-semibold">PRODUCT</p>
        </div>
        <div>
          <p className="text-xs font-semibold">BATCH</p>
        </div>
        <div>
          <p className="text-xs font-semibold">HSN</p>
        </div>
        <div>
          <p className="text-xs font-semibold">EXPIRY</p>
        </div>
        <div>
          <p className="text-xs font-semibold">PACK</p>
        </div>
        <div>
          <p className="text-xs font-semibold">QTY</p>
        </div>
        <div>
          <p className="text-xs font-semibold">FREE</p>
        </div>
        <div>
          <p className="text-xs font-semibold">MRP(₹)</p>
        </div>
        <div>
          <p className="text-xs font-semibold">RATE(₹)</p>
        </div>
        <div>
          <p className="text-xs font-semibold">Scheme</p>
        </div>
        <div>
          <p className="text-xs font-semibold">SCH%</p>
        </div>
        <div>
          <p className="text-xs font-semibold">DISC</p>
        </div>
        <div>
          <p className="text-xs font-semibold">GST</p>
        </div>
        <div>
          <p className="text-xs font-semibold">AMT</p>
        </div>
        <div className="flex items-center justify-center">
          <Input
            type="checkbox"
            checked={editAll}
            onChange={handleEditAllChange}
            className="w-3 h-4"
            disabled={viewMode}
          />
        </div>
      </div>

      {/* Input row */}
      {!viewMode && (
        <div className="grid grid-cols-[30px_3fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_50px] gap-1 px-2 mt-2 font-semibold">
          <div></div>
          <div>
            <Input
              ref={(el) => (inputRef.current["product"] = el)}
              onChange={handleProductNameChange}
              onKeyDown={(e) => handleTableKeyDown(e, "product")}
              value={productSearch}
              type="text"
              placeholder="Type or Press Space"
              className="h-8 w-full border-[1px] border-gray-300 px-2 rounded-sm"
            />
          </div>
          <div>
            <BatchSuggestion
              inputRef={inputRef}
              value={batchNumber}
              setValue={setBatchNumber}
              onSuggestionSelect={handleBatchSelect}
              inventoryId={newProduct?.inventoryId}
              ref={(el) => (inputRef.current["batchNumber"] = el)}
              onKeyDown={(e) => handleTableKeyDown(e, "batchNumber")}
            />
          </div>
          <div>
            <Input
              id="HSN"
              ref={(el) => (inputRef.current["HSN"] = el)}
              onKeyDown={(e) => handleTableKeyDown(e, "HSN")}
              onChange={(e) => handleInputChange("HSN", e.target.value)}
              value={newProduct.HSN || ""}
              type="text"
              className="h-8 w-full border-[1px] border-gray-300 px-1 rounded-sm"
            />
          </div>
          <div>
            <Input
              ref={(el) => (inputRef.current["expiry"] = el)}
              onChange={(e) => {
                const formattedValue = formatExpiryInput(e.target.value);
                handleInputChange("expiry", formattedValue);
              }}
              onKeyDown={(e) => handleTableKeyDown(e, "expiry")}
              value={newProduct.expiry || ""}
              type="text"
              placeholder="MM/YY"
              className="h-8 w-full border-[1px] border-gray-300 px-2 rounded-sm"
            />
          </div>
          <div>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 tracking-widest opacity-80">
                1x
              </span>
              <Input
                ref={(el) => (inputRef.current["pack"] = el)}
                onKeyDown={(e) => handleTableKeyDown(e, "pack")}
                onChange={(e) => handleInputChange("pack", e.target.value)}
                value={newProduct.pack || ""}
                type="text"
                className="h-8 w-full border-[1px] border-gray-300 px-1 pl-7 rounded-sm"
              />
            </div>
          </div>
          <div>
            <Input
              ref={(el) => (inputRef.current["quantity"] = el)}
              onKeyDown={(e) => handleTableKeyDown(e, "quantity")}
              onChange={(e) => handleInputChange("quantity", e.target.value)}
              value={newProduct.quantity || ""}
              type="text"
              className="h-8 w-full border-[1px] border-gray-300 px-1 rounded-sm"
            />
          </div>
          <div>
            <Input
              ref={(el) => (inputRef.current["free"] = el)}
              onKeyDown={(e) => handleTableKeyDown(e, "free")}
              onChange={(e) => handleInputChange("free", e.target.value)}
              value={newProduct.free || ""}
              type="text"
              className="h-8 w-full border-[1px] border-gray-300 px-1 rounded-sm"
            />
          </div>
          <div>
            <div className="relative">
              <Input
                ref={(el) => (inputRef.current["mrp"] = el)}
                onKeyDown={(e) => handleTableKeyDown(e, "mrp")}
                onChange={(e) => handleInputChange("mrp", e.target.value)}
                value={newProduct.mrp || ""}
                type="text"
                className="h-8 w-full border-[1px] border-gray-300 px-1 rounded-sm"
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <Input
                ref={(el) => (inputRef.current["purchaseRate"] = el)}
                onKeyDown={(e) => handleTableKeyDown(e, "purchaseRate")}
                onChange={(e) =>
                  handleInputChange("purchaseRate", e.target.value)
                }
                value={newProduct.purchaseRate || ""}
                type="text"
                className="h-8 w-full border-[1px] border-gray-300 px-1 rounded-sm"
              />
            </div>
          </div>
          <div>
            <div className="flex gap-1">
              <Input
                ref={(el) => (inputRef.current["schemeInput1"] = el)}
                onKeyDown={(e) => handleTableKeyDown(e, "schemeInput1")}
                value={newProduct.schemeInput1 || ""}
                onChange={(e) =>
                  handleInputChange("schemeInput1", e.target.value)
                }
                type="text"
                className="h-8 w-full border-[1px] border-gray-300 px-1 rounded-sm"
              />
              +
              <Input
                ref={(el) => (inputRef.current["schemeInput2"] = el)}
                onKeyDown={(e) => handleTableKeyDown(e, "schemeInput2")}
                value={newProduct.schemeInput2 || ""}
                onChange={(e) =>
                  handleInputChange("schemeInput2", e.target.value)
                }
                type="text"
                className="h-8 w-full border-[1px] border-gray-300 px-1 rounded-sm"
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <Input
                disabled
                value={newProduct.schemePercent || ""}
                type="text"
                className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5 rounded-sm"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2">
                %
              </span>
            </div>
          </div>
          <div>
            <div className="relative">
              <Input
                ref={(el) => (inputRef.current["discount"] = el)}
                onKeyDown={(e) => handleTableKeyDown(e, "discount")}
                onChange={(e) => handleInputChange("discount", e.target.value)}
                value={newProduct.discount || ""}
                type="text"
                className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5 rounded-sm"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2">
                %
              </span>
            </div>
          </div>
          <div>
            <div className="relative">
              <Input
                ref={(el) => (inputRef.current["gstPer"] = el)}
                onKeyDown={(e) => handleTableKeyDown(e, "gstPer")}
                onChange={(e) => handleInputChange("gstPer", e.target.value)}
                value={newProduct.gstPer || ""}
                type="text"
                className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5 rounded-sm"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2">
                %
              </span>
            </div>
          </div>
          <div>
            <Input
              readOnly
              value={newProduct.amount || ""}
              type="text"
              className="h-8 w-full border-[1px] border-gray-300 px-1 rounded-sm"
              disabled
            />
          </div>
          <div className="flex gap-1 items-center ml-2 justify-center">
            <button
              onClick={handleAdd}
              ref={(el) => (inputRef.current["addButton"] = el)}
              className="bg-primary p-1 rounded-sm"
              title="Add Item"
              onKeyDown={(e) => handleTableKeyDown(e, "addButton")}
            >
              <Plus className="h-5 w-5 text-white" />
            </button>
            <button onClick={clearInputRow} title="Clear Field">
              <X className="h-5 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Product list */}
      <div className="mt-2">
        {products.length !== 0 &&
          products.map((product, index) => (
            <div
              className="grid grid-cols-[30px_3fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_50px] gap-1 px-2 mt-1 font-semibold"
              key={product?.inventoryId}
            >
              <div className="flex justify-center items-center font-semibold">
                {index + 1}
              </div>
              <div>
                <Input
                  disabled
                  value={product?.productName}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-2 rounded-sm"
                />
              </div>
              <div>
                <BatchSuggestion
                  inputRef={inputRef}
                  value={editBatchNumbers[index] || product?.batchNumber || ""}
                  setValue={(value) => {
                    setEditBatchNumbers((prev) => ({
                      ...prev,
                      [index]: value,
                    }));
                    handleInputChangeEditMode(index, "batchNumber", value);
                  }}
                  onSuggestionSelect={(batch) =>
                    handleEditBatchSelect(batch, index)
                  }
                  inventoryId={product?.inventoryId}
                  disabled={!editAll && editingIndex !== index}
                />
              </div>
              <div>
                <Input
                  disabled={!editAll && editingIndex !== index}
                  onChange={(e) =>
                    handleInputChangeEditMode(index, "HSN", e.target.value)
                  }
                  value={product?.HSN || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1 rounded-sm"
                />
              </div>
              <div>
                <Input
                  disabled={!editAll && editingIndex !== index}
                  onChange={(e) => {
                    const formattedValue = formatExpiryInput(e.target.value);
                    handleInputChangeEditMode(index, "expiry", formattedValue);
                  }}
                  value={product?.expiry || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-2 rounded-sm"
                />
              </div>
              <div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 tracking-widest opacity-80">
                    1x
                  </span>
                  <Input
                    disabled={!editAll && editingIndex !== index}
                    onChange={(e) =>
                      handleInputChangeEditMode(index, "pack", e.target.value)
                    }
                    value={product?.pack || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 px-1 pl-7 rounded-sm"
                  />
                </div>
              </div>
              <div>
                <Input
                  disabled={!editAll && editingIndex !== index}
                  onChange={(e) =>
                    handleInputChangeEditMode(index, "quantity", e.target.value)
                  }
                  value={product?.quantity || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1 rounded-sm"
                />
              </div>
              <div>
                <Input
                  disabled={!editAll && editingIndex !== index}
                  onChange={(e) =>
                    handleInputChangeEditMode(index, "free", e.target.value)
                  }
                  value={product?.free || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1 rounded-sm"
                />
              </div>
              <div>
                <div className="relative">
                  <Input
                    disabled={!editAll && editingIndex !== index}
                    onChange={(e) =>
                      handleInputChangeEditMode(
                        index,
                        "mrp",
                        e.target.value
                      )
                    }
                    value={Number(product?.mrp || 0)?.toFixed(2) || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300  rounded-sm text-right"
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  
                  <Input
                    disabled={!editAll && editingIndex !== index}
                    onChange={(e) =>
                      handleInputChangeEditMode(
                        index,
                        "purchaseRate",
                        e.target.value
                      )
                    }
                    value={Number(product?.purchaseRate || 0)?.toFixed(2) || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300  rounded-sm text-right"
                  />
                </div>
              </div>
              <div>
                <div className="flex gap-1">
                  <Input
                    disabled={!editAll && editingIndex !== index}
                    value={product?.schemeInput1 || ""}
                    onChange={(e) =>
                      handleInputChangeEditMode(
                        index,
                        "schemeInput1",
                        e.target.value
                      )
                    }
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 px-1 rounded-sm"
                  />
                  +
                  <Input
                    disabled={!editAll && editingIndex !== index}
                    value={product?.schemeInput2 || ""}
                    onChange={(e) =>
                      handleInputChangeEditMode(
                        index,
                        "schemeInput2",
                        e.target.value
                      )
                    }
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 px-1 rounded-sm"
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <Input
                    disabled
                    value={product?.schemePercent || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5 rounded-sm"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">
                    %
                  </span>
                </div>
              </div>
              <div>
                <div className="relative">
                  <Input
                    disabled={!editAll && editingIndex !== index}
                    onChange={(e) =>
                      handleInputChangeEditMode(
                        index,
                        "discount",
                        e.target.value
                      )
                    }
                    value={product?.discount || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5 rounded-sm"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">
                    %
                  </span>
                </div>
              </div>
              <div>
                <div className="relative">
                  <Input
                    disabled={!editAll && editingIndex !== index}
                    onChange={(e) =>
                      handleInputChangeEditMode(index, "gstPer", e.target.value)
                    }
                    value={product?.gstPer || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5 rounded-sm"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">
                    %
                  </span>
                </div>
              </div>
              <div>
                <Input
                  disabled
                  value={Number(product?.amount || 0)?.toFixed(2) || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1 text-right rounded-sm"
                />
              </div>
              <div className="flex gap-2 items-center justify-center">
                {!editAll && (
                  <>
                    {editingIndex === index ? (
                      <button onClick={() => handleSaveEdit(index)}>
                        <Check className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        disabled={viewMode}
                        onClick={() => handleEditProduct(index)}
                      >
                        <Pen className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
                <button
                  disabled={viewMode}
                  onClick={() => handleDeleteProduct(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
      </div>

      <ProductSelector
        open={isProductSelectorOpen}
        onOpenChange={setIsProductSelectorOpen}
        onSelect={handleProductSeletor}
        search={productSearch}
        setSearch={setProductSearch}
      />
    </div>
  );
}
