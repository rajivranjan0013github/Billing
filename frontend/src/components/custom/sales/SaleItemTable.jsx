import { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { convertToFraction, convertQuantity } from "../../../assets/Data";
import { Pen, Trash2 } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import InventorySuggestion from "./InventorySuggestion";
import BatchSuggestion from "./BatchSuggestion";
import { Input } from "../../ui/input";
import { Checkbox } from "../../ui/checkbox";

const roundToTwo = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export default function SaleTable({
  inputRef,
  products,
  setProducts,
  handleKeyDown,
  saleType,
  viewMode,
}) {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(true);
  const [newProduct, setNewProduct] = useState({
    types: saleType === "return" ? "return" : "sale",
  });
  const [productSearch, setProductSearch] = useState(""); // for product Input-> which is passing in inventory suggestion
  const [batchNumber, setBatchNumber] = useState("");

  // --- Effect to update product types when saleType changes --- START
  useEffect(() => {
    // Update the default type for new products
    setNewProduct((prev) => ({
      ...prev,
      types: saleType === "return" ? "return" : "sale",
    }));

    // Update existing products
    if (products.length > 0) {
      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          const updatedType = saleType === "return" ? "return" : "sale";
          // Recalculate amount based on new type
          const packs = Number(product?.packs || 0);
          const loose = Number(product?.loose || 0);
          const pack = Number(product?.pack || 1);
          const saleRate = Number(product?.saleRate || 0);
          const quantity = pack * packs + loose;
          const subtotal = quantity * (saleRate / pack);
          const total = subtotal;
          const updatedAmount =
            (updatedType === "return" ? -1 : 1) * convertToFraction(total);

          return { ...product, types: updatedType, amount: updatedAmount };
        })
      );
    }
  }, [saleType, setProducts]); // Rerun when saleType or setProducts changes
  // --- Effect to update product types when saleType changes --- END

  // Input changes handler
  const handleInputChange = (field, value) => {
    const updatedProduct = { ...newProduct, [field]: value };

    // If MRP changes, recalculate sale rate based on existing discount
    if (field === "mrp") {
      const existingDiscount = Number(newProduct.discount || 0);
      if (existingDiscount > 0) {
        updatedProduct.saleRate = (
          value *
          (1 - existingDiscount / 100)
        ).toFixed(2);
      } else {
        updatedProduct.saleRate = value;
      }
    }

    // Handle sale rate changes - calculate discount based on new sale rate
    if (field === "saleRate") {
      const mrp = Number(updatedProduct.mrp || 0);
      if (mrp > 0) {
        const newDiscount = ((mrp - Number(value)) / mrp) * 100;
        updatedProduct.discount = newDiscount.toFixed(2);
      }
    }

    // Handle discount changes - calculate sale rate based on new discount
    if (field === "discount") {
      const mrp = Number(updatedProduct.mrp || 0);
      const discount = Number(value || 0);
      if (mrp > 0) {
        updatedProduct.saleRate = (mrp * (1 - discount / 100)).toFixed(2);
      }
    }

    // Calculate amount if we have quantity and pricing info
    if (
      (updatedProduct?.packs || updatedProduct?.loose) &&
      updatedProduct?.mrp
    ) {
      // const discount = Number(updatedProduct?.discount) || 0;
      // const gstPer = Number(updatedProduct?.gstPer) || 0;
      const packs = Number(updatedProduct?.packs || 0); // for quantity
      const loose = Number(updatedProduct?.loose || 0);

      const pack = Number(updatedProduct?.pack || 1);
      const saleRate = Number(updatedProduct?.saleRate || 0);
      const quantity = pack * packs + loose;
      const subtotal = quantity * (saleRate / pack);
      const total = subtotal;
      updatedProduct.amount =
        (updatedProduct.types === "return" ? -1 : 1) * convertToFraction(total);
      updatedProduct.quantity = quantity;
    } else {
      updatedProduct.amount = "";
    }
    setNewProduct(updatedProduct);
  };

  // --- Refactored handleKeyDown for focus management ---
  const handleInputKeyDown = (e, currentField) => {
    // Define the full order of fields for navigation
    const fullFieldOrder = [
      "product",
      "batchNumber",
      "HSN",
      "pack",
      "expiry",
      "mrp",
      "packs",
      "loose",
      "saleRate",
      "discount",
      "gstPer",
      "add",
    ];

    // Handle Shift+Enter first - Go back to the previous input
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      const currentIndex = fullFieldOrder.indexOf(currentField);
      if (currentIndex > 0) {
        // Find the *previous* field regardless of its value
        const previousField = fullFieldOrder[currentIndex - 1];
        if (inputRef.current[previousField]) {
          // Check if the previous field is 'batchNumber' or 'product' and handle refs correctly
          if (previousField === "batchNumber") {
            // BatchSuggestion forwards its ref to the input
            if (inputRef.current["batchNumber"]) {
              inputRef.current["batchNumber"].focus();
            }
          } else if (previousField === "product") {
            // InventorySuggestion manages its own internal input ref
            if (inputRef.current["product"]?.focus) {
              // Access the actual input ref inside InventorySuggestion
              inputRef.current["product"].focus();
            }
          } else if (inputRef.current[previousField]) {
            inputRef.current[previousField].focus();
          }
        }
      }
    }
    // Handle Enter (without Shift) - Move to next *empty* field or 'add' button
    else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent default form submission

      const currentIndex = fullFieldOrder.indexOf(currentField);

      if (currentIndex !== -1) {
        let nextIndex = currentIndex + 1;
        let nextField = null;

        // Find the next focusable field (either empty input or the 'add' button)
        while (nextIndex < fullFieldOrder.length) {
          const potentialNextField = fullFieldOrder[nextIndex];

          // Special handling for 'product' and 'batchNumber' suggestions
          if (potentialNextField === "product") {
            if (!productSearch && inputRef.current[potentialNextField]) {
              nextField = potentialNextField;
              break;
            }
          } else if (potentialNextField === "batchNumber") {
            if (!batchNumber && inputRef.current[potentialNextField]) {
              nextField = potentialNextField;
              break;
            }
          }
          // Check normal inputs in newProduct state
          else if (
            potentialNextField !== "add" &&
            !newProduct[potentialNextField] && // Check if the field in state is empty
            inputRef.current[potentialNextField] // Check if the ref exists
          ) {
            nextField = potentialNextField;
            break; // Found the next empty field
          }
          // Always allow focusing the 'add' button
          else if (potentialNextField === "add" && inputRef.current["add"]) {
            nextField = "add";
            break;
          }

          nextIndex++;
        }

        // Focus the determined next field or the add button
        if (nextField) {
          if (nextField === "product" && inputRef.current["product"]) {
            inputRef.current["product"].focus(); // Focus the input inside InventorySuggestion
          } else if (
            nextField === "batchNumber" &&
            inputRef.current["batchNumber"]
          ) {
            inputRef.current["batchNumber"].focus(); // Focus the input inside BatchSuggestion
          } else if (inputRef.current[nextField]) {
            inputRef.current[nextField].focus();
          }
        } else if (inputRef.current["add"]) {
          // If no other empty field is found, default to the 'add' button
          inputRef.current["add"].focus();
        }
      } else if (currentField === "add") {
        // If Enter is pressed on the 'Add' button itself, trigger the add action
        handleAdd();
      }
    }
  };
  // --- End of Refactored handleKeyDown ---

  // handle add product to list
  const handleAdd = () => {
    if (!newProduct.productName) {
      toast({ variant: "destructive", title: "Please select item" });
      if (inputRef.current["product"]) inputRef.current["product"].focus(); // Focus product input if item not selected
      return;
    }

    if (!newProduct.batchNumber && !batchNumber) {
      toast({ variant: "destructive", title: "Please select batch" });
      if (inputRef.current["batchNumber"])
        inputRef.current["batchNumber"].focus(); // Focus batch input if not selected
      return;
    }

    if (!newProduct?.quantity && !(newProduct?.packs || newProduct?.loose)) {
      toast({
        variant: "destructive",
        title: "Please add quantity (packs or loose)",
      });
      if (inputRef.current["packs"]) inputRef.current["packs"].focus(); // Focus packs if quantity missing
      return;
    }

    // --- Expiry Date Check START ---
    if (newProduct.types !== "return" && newProduct.expiry) {
      const expiryString = newProduct.expiry;
      const expiryParts = expiryString.split("/");
      if (expiryParts.length === 2) {
        const month = parseInt(expiryParts[0], 10);
        const year = parseInt(expiryParts[1], 10);

        if (
          !isNaN(month) &&
          !isNaN(year) &&
          month >= 1 &&
          month <= 12 &&
          year >= 0 &&
          year <= 99
        ) {
          const fullYear = 2000 + year;
          // The product expires at the end of the expiry month.
          // So, the first day it's invalid is the 1st of the *next* month.
          const expiryLimitDate = new Date(fullYear, month, 1); // month is 1-based, Date constructor uses 0-based index directly

          const currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0); // Compare dates only

          if (currentDate >= expiryLimitDate) {
            toast({ variant: "destructive", title: "Product has expired." });
            return;
          }
        } else {
          toast({
            variant: "destructive",
            title: "Invalid expiry date format (MM/YY).",
          });
          return;
        }
      } else {
        toast({
          variant: "destructive",
          title: "Invalid expiry date format (MM/YY).",
        });
        return;
      }
    }
    // --- Expiry Date Check END ---

    const { pack, currentStocks, quantity } = newProduct;

    if (currentStocks < quantity && newProduct?.types === "sale") {
      toast({
        title: `${convertQuantity(currentStocks, pack)} are in stocks`,
        variant: "destructive",
      });
      return;
    }

    if (newProduct.batchNumber) {
      setProducts((pre) => [...pre, newProduct]);
    } else {
      setProducts((pre) => [...pre, { ...newProduct, batchNumber }]);
    }
    // Reset newProduct state, ensuring type is 'sale' unless saleType is 'return'
    setNewProduct({ types: saleType === "return" ? "return" : "sale" });
    setProductSearch("");
    setBatchNumber("");
    inputRef.current["product"].focus();
  };
  // edit all product togather
  const handleInputChangeEditMode = (index, field, value) => {};

  const handleDeleteProduct = (indexToDelete) => {
    const updatedProducts = products.filter(
      (_, index) => index !== indexToDelete
    );
    setProducts(updatedProducts);
  };

  const handleEditProduct = (index) => {
    const product = products[index];
    setNewProduct(product);
    setBatchNumber(product?.batchNumber);
    setProductSearch(product?.productName || product?.product);
    handleDeleteProduct(index);
  };

  const handleProductSelect = (product) => {
    console.log(product);
    setNewProduct((pre) => ({
      ...pre,
      productName: product.name,
      mfcName: product.mfcName,
      inventoryId: product._id,
    }));
    if (inputRef?.current["batchNumber"]) {
      inputRef.current["batchNumber"].focus();
    }
  };

  const handleBatchSelect = (batch) => {
    let tempDiscount = 0,
      tempSaleRate;
    if (batch?.saleRate) {
      tempDiscount = ((batch.mrp - batch.saleRate) / batch.mrp) * 100;
      tempSaleRate = batch.saleRate;
    } else {
      tempSaleRate = batch.mrp;
    }
    setNewProduct({
      ...newProduct,
      batchNumber: batch.batchNumber,
      batchId: batch._id,
      mrp: batch.mrp,
      saleRate: batch.mrp,
      expiry: batch.expiry,
      saleRate: tempSaleRate,
      gstPer: batch.gstPer,
      HSN: batch.HSN,
      pack: batch.pack,
      currentStocks: batch.quantity,
      discount: roundToTwo(tempDiscount),
    });
    if (inputRef?.current["packs"]) {
      inputRef?.current["packs"].focus();
    }
  };

  return (
    <div className="w-full border-[1px] border-inherit py-4 rounded-sm space-y-2">
      <div className="grid grid-cols-16 w-full space-x-1 ">
        <div className="col-span-3 grid grid-cols-6">
          <div className="text-xs font-semibold text-center">#</div>
          <div className="text-xs font-semibold col-span-5">PRODUCT</div>
        </div>
        <div className="col-span-2">
          <p className="text-xs font-semibold tracking-wide">BATCH</p>
        </div>
        <div className=" ">
          <p className="text-xs font-semibold">HSN</p>
        </div>
        <div className=" ">
          <p className="text-xs font-semibold">PACK</p>
        </div>
        <div className=" ">
          <p className="text-xs font-semibold">EXPIRY</p>
        </div>
        <div className=" ">
          <p className="text-xs font-semibold">MRP</p>
        </div>
        <div className=" ">
          <p className="text-xs font-semibold">PACKS</p>
        </div>
        <div className=" ">
          <p className="text-xs font-semibold">LOOSE</p>
        </div>
        <div className=" ">
          <p className="text-xs font-semibold">SALE RATE</p>
        </div>
        <div className=" ">
          <p className="text-xs font-semibold">DISC</p>
        </div>
        <div className=" ">
          <p className="text-xs font-semibold">GST</p>
        </div>
        <div className=" ">
          <p className="text-xs font-semibold">AMT</p>
        </div>
        <div>
          <p className="text-xs font-semibold">EDIT ALL</p>
        </div>
      </div>

      {/* Input row */}
      {!viewMode && (
        <div className="grid grid-cols-16 w-full space-x-1 font-semibold">
          <div className="col-span-3 grid grid-cols-6">
            <div className="flex items-center justify-center">
              {saleType === "return" && (
                <>
                  <span className="text-red-500 text-sm">R</span>
                  <Checkbox
                    checked={newProduct.types === "return"}
                    onCheckedChange={(checked) => {
                      handleInputChange("types", checked ? "return" : "sale");
                    }}
                  />
                </>
              )}
            </div>
            <div className="col-span-5">
              <InventorySuggestion
                inputRef={inputRef}
                value={productSearch}
                setValue={setProductSearch}
                onSuggestionSelect={handleProductSelect}
              />
            </div>
          </div>
          <div className="col-span-2">
            <BatchSuggestion
              inputRef={inputRef}
              value={batchNumber}
              setValue={setBatchNumber}
              onSuggestionSelect={handleBatchSelect}
              inventoryId={newProduct?.inventoryId}
              ref={(el) => (inputRef.current["batchNumber"] = el)}
            />
          </div>
          <div>
            <Input
              ref={(el) => (inputRef.current["HSN"] = el)}
              onChange={(e) => handleInputChange("HSN", e.target.value)}
              value={newProduct.HSN || ""}
              type="text"
              className="h-8 w-full border-[1px] border-gray-300 px-1"
              onKeyDown={(e) => handleInputKeyDown(e, "HSN")}
            />
          </div>
          <div>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 tracking-widest opacity-80">
                1x
              </span>
              <Input
                ref={(el) => (inputRef.current["pack"] = el)}
                onChange={(e) => handleInputChange("pack", e.target.value)}
                value={newProduct.pack || ""}
                type="text"
                className="h-8 w-full border-[1px] border-gray-300 px-1 pl-7"
                onKeyDown={(e) => handleInputKeyDown(e, "pack")}
              />
            </div>
          </div>
          <div>
            <Input
              ref={(el) => (inputRef.current["expiry"] = el)}
              onChange={(e) => handleInputChange("expiry", e.target.value)}
              value={newProduct.expiry || ""}
              type="text"
              placeholder="MM/YY"
              className="h-8 w-full border-[1px] border-gray-300 px-2"
              onKeyDown={(e) => handleInputKeyDown(e, "expiry")}
            />
          </div>
          <div>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 z-10">
                ₹
              </span>
              <Input
                ref={(el) => (inputRef.current["mrp"] = el)}
                onChange={(e) => handleInputChange("mrp", e.target.value)}
                value={newProduct.mrp || ""}
                type="text"
                className="h-8 w-full border-[1px] border-gray-300 pl-5 rounded-sm"
                onKeyDown={(e) => handleInputKeyDown(e, "mrp")}
              />
            </div>
          </div>
          <div>
            <Input
              ref={(el) => (inputRef.current["packs"] = el)}
              onChange={(e) => handleInputChange("packs", e.target.value)}
              value={newProduct.packs || ""}
              type="text"
              className="h-8 w-full border-[1px] border-gray-300 px-1"
              onKeyDown={(e) => handleInputKeyDown(e, "packs")}
            />
          </div>
          <div>
            <Input
              ref={(el) => (inputRef.current["loose"] = el)}
              onChange={(e) => handleInputChange("loose", e.target.value)}
              value={newProduct.loose || ""}
              type="text"
              className="h-8 w-full border-[1px] border-gray-300 px-1"
              onKeyDown={(e) => handleInputKeyDown(e, "loose")}
            />
          </div>
          <div>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 z-10">
                ₹
              </span>
              <Input
                ref={(el) => (inputRef.current["saleRate"] = el)}
                onChange={(e) => handleInputChange("saleRate", e.target.value)}
                value={newProduct.saleRate || ""}
                type="text"
                className="h-8 w-full border-[1px] border-gray-300 pl-5 rounded-sm"
                onKeyDown={(e) => handleInputKeyDown(e, "saleRate")}
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <Input
                ref={(el) => (inputRef.current["discount"] = el)}
                onChange={(e) => handleInputChange("discount", e.target.value)}
                value={newProduct.discount || ""}
                type="text"
                className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5"
                onKeyDown={(e) => handleInputKeyDown(e, "discount")}
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
                onChange={(e) => handleInputChange("gstPer", e.target.value)}
                value={newProduct.gstPer || ""}
                type="text"
                className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5"
                onKeyDown={(e) => handleInputKeyDown(e, "gstPer")}
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
              className="h-8 w-full border-[1px] border-gray-300 px-1"
              disabled
            />
          </div>
          <div>
            <Button
              onClick={handleAdd}
              className="h-8 focus:bg-blue-800 focus:text-white bg"
              ref={(el) => (inputRef.current["add"] = el)}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Product list */}
      <div className="w-full space-y-2">
        {products.length !== 0 &&
          products.map((product, index) => (
            <div
              className="grid grid-cols-16 w-full space-x-1"
              key={product?.inventoryId}
            >
              <div className="col-span-3 grid grid-cols-6">
                <div className="items-center font-semibold justify-center flex">
                  {index + 1}.
                  <span className="text-sm text-red-500">
                    {product.types === "return" && "R"}
                  </span>
                </div>
                <Input
                  disabled
                  value={product?.productName}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-2 col-span-5 uppercase"
                />
              </div>
              <div className="col-span-2">
                <Input
                  disabled={editMode}
                  type="text"
                  value={product?.batchNumber || ""}
                  className="h-8 w-full border-[1px] border-gray-300 px-1 uppercase"
                />
              </div>
              <div>
                <Input
                  disabled={editMode}
                  value={product?.HSN || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 tracking-widest opacity-80">
                    1x
                  </span>
                  <Input
                    disabled={editMode}
                    ref={(el) => (inputRef.current["pack"] = el)}
                    onChange={(e) => handleInputChange("pack", e.target.value)}
                    value={product.pack || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 px-1 pl-7"
                  />
                </div>
              </div>
              <div>
                <Input
                  disabled={editMode}
                  value={product.expiry || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-2"
                />
              </div>
              <div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 z-10">
                    ₹
                  </span>
                  <Input
                    disabled={editMode}
                    value={product?.mrp || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 pl-5 rounded-sm"
                  />
                </div>
              </div>
              <div>
                <Input
                  disabled={editMode}
                  value={product?.packs || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div>
                <Input
                  disabled={editMode}
                  value={product?.loose || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 z-10">
                    ₹
                  </span>
                  <Input
                    disabled={editMode}
                    value={product?.saleRate || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 pl-5 rounded-sm"
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <Input
                    disabled={editMode}
                    value={product?.discount || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">
                    %
                  </span>
                </div>
              </div>
              <div>
                <div className="relative">
                  <Input
                    disabled={editMode}
                    value={product?.gstPer || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">
                    %
                  </span>
                </div>
              </div>
              <div>
                <Input
                  disabled
                  value={product?.amount || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div className="flex gap-4 items-center justify-center">
                <button
                  disabled={viewMode}
                  onClick={() => handleEditProduct(index)}
                >
                  <Pen className="h-4 w-4" />
                </button>
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
    </div>
  );
}
