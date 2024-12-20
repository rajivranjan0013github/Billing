import { useState, useRef, useEffect } from "react";
import { Button } from "../../ui/button";
import ProductSelector from "../inventory/SelectInventoryItem";
import { convertToFraction } from "../../../assets/Data";
import { Pen, Trash2 } from 'lucide-react'
import SelectBatchDialog from "../inventory/SelectBatchDialog";
import { useToast } from "../../../hooks/use-toast";

export default function PurchaseTable({inputRef, products, setProducts, viewMode}) {
  const {toast} = useToast();
  const [editMode, setEditMode] = useState(true)
  const [newProduct, setNewProduct] = useState({});
  const [productSearch, setProductSearch] = useState("");
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [batchDialog, setBatchDialog] = useState(false);
  const [batchNumber, setBatchNumber] = useState('');

  // input changes handler
  const handleInputChange = (field, value) => {
    const updatedProduct = { ...newProduct, [field]: value };
    if (updatedProduct?.quantity && updatedProduct?.purchaseRate) {
      const discount = Number(updatedProduct?.discount) || 0;
      const gstPer = Number(updatedProduct?.gstPer) || 0;
      const quantity = Number(updatedProduct?.quantity || 0);
      const purchaseRate = Number(updatedProduct?.purchaseRate || 0);
      let schemePercent = 0;
      if (updatedProduct.schemeInput1 && updatedProduct.schemeInput2) {
        const temp1 = Number(updatedProduct.schemeInput1);
        const temp2 = Number(updatedProduct.schemeInput2);
        schemePercent = (temp2 / (temp1 + temp2)) * 100;
        updatedProduct.schemePercent = convertToFraction(schemePercent);
      } else {
        updatedProduct.schemePercent = "";
      }
      const subtotal = quantity * purchaseRate;
      const total = subtotal * (1 - discount / 100) * (1 - schemePercent / 100);
      updatedProduct.amount = convertToFraction(total * (1 + gstPer / 100));
    } else {
      updatedProduct.amount = "";
    }
    setNewProduct(updatedProduct);
  };

  // handle add product to list
  const handleAdd = () => {
    if (!newProduct.productName || !newProduct.inventoryId){
      toast({variant : 'destructive', title:'Please add product'})
      return;
    };
    setProducts((pre) => [...pre, newProduct]);
    setNewProduct({});
    setProductSearch("");
    setBatchNumber("");
    inputRef.current['product'].focus();
  };

  // product selector from dialog
  const handleProductSeletor = (product) => {
    setNewProduct((prev) => ({
      ...prev,
      productName: product.name,
      inventoryId: product._id,
      productName: product.name,
    }));
    setProductSearch(product.name);
    if (inputRef.current["batchNumber"]) {
      inputRef.current["batchNumber"].focus();
    }
  };

  // product seach input handler
  const handleProductNameChange = (e) => {
    e.preventDefault();
    const value = e.target.value;
    if(value.length === 1 && value === ' ') {
      setIsProductSelectorOpen(true);
      return;
    }
    if (value.length > 0 && value[0] !== " ") {
      setProductSearch(value);
      setIsProductSelectorOpen(true);
    }
  };

  const handleBatchNameChange = (e) => {
    e.preventDefault();
    const value = e.target.value;
    setBatchDialog(true);
    if(value.length === 1 && value === ' ') {
      return;
    }
    setBatchNumber(value);
  }

  // edit all product togather
  const handleInputChangeEditMode = (index, field, value) => {}

  const handleDeleteProduct = (indexToDelete) => {
    const updatedProducts = products.filter((_, index) => index !== indexToDelete)
    setProducts(updatedProducts);
  }

  const handleEditProduct = (index) => {
    const product = products[index];
    setNewProduct(product);
    setProductSearch(product?.productName || product?.product);
    handleDeleteProduct(index);
  }

  const handleSelectBatch = (batch) => {
    Object.assign(batch, {quantity : ""});
    setBatchNumber(batch?.batchNumber);
    setNewProduct({...newProduct, batchId : batch._id, ...batch });
    if(inputRef.current['quantity']) {
      inputRef.current['quantity'].focus();
    }
  }

  return (
    <div className="w-full border-[1px] border-inherit py-4 rounded-sm">
      <div className="grid grid-cols-20 w-full space-x-1">
        <div className="flex justify-center">#</div>
        <div className="col-span-3 space-y-2">
          <p className="text-xs font-semibold">PRODUCT</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">HSN</p>
        </div>
        <div className="space-y-2 col-span-2">
          <p className="text-xs font-semibold">BATCH</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">EXPIRY</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">PACK</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">QTY</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">FREE</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">MRP</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">RATE</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">P-T-R</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">SCHEME</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">SCH%</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">DISC</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">GST</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">AMT</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">EDIT ALL</p>
        </div>
      </div>

      {/* Input row - only show when not in view mode */}
      {!viewMode && (
        <div className="grid grid-cols-20 w-full space-x-1 mt-0">
          <div className="flex justify-center"></div>
          <div className="col-span-3">
            <input
              ref={(el) => (inputRef.current["product"] = el)}
              onChange={handleProductNameChange}
              value={productSearch}
              type="text"
              placeholder="Type or Press Space"
              className="h-8 w-full border-[1px] border-gray-300 px-2"
            />
          </div>
          <div>
            <input
              ref={(el) => (inputRef.current["HSN"] = el)}
              onChange={(e) => handleInputChange("HSN", e.target.value)}
              value={newProduct.HSN || ""}
              type="text"
              placeholder=""
              className="h-8 w-full border-[1px] border-gray-300 px-1"
            />
          </div>
          <div className="col-span-2">
            <input
              ref={(el) => (inputRef.current["batchNumber"] = el)}
              type="text"
              onChange={handleBatchNameChange}
              value={batchNumber || ""}
              placeholder="batch no"
              className="h-8 w-full border-[1px] border-gray-300 px-1"
            />
          </div>
          <div>
            <input
             ref={(el) => (inputRef.current["expiry"] = el)}
              onChange={(e) => handleInputChange("expiry", e.target.value)}
              value={newProduct.expiry || ""}
              type="text"
              placeholder="MM/YY"
              className="h-8 w-full border-[1px] border-gray-300 px-2"
            />
          </div>
          <div>
            <input
              ref={(el) => (inputRef.current["pack"] = el)}
              onChange={(e) => handleInputChange("pack", e.target.value)}
              value={newProduct.pack || ""}
              type="text"
              placeholder="1*"
              className="h-8 w-full border-[1px] border-gray-300 px-1"
            />
          </div>
          <div>
            <input
             ref={(el) => (inputRef.current["quantity"] = el)}
              onChange={(e) => handleInputChange("quantity", e.target.value)}
              value={newProduct.quantity || ""}
              type="text"
              placeholder=""
              className="h-8 w-full border-[1px] border-gray-300 px-1"
            />
          </div>
          <div>
            <input
              ref={(el) => (inputRef.current["free"] = el)}
              onChange={(e) => handleInputChange("free", e.target.value)}
              value={newProduct.free || ""}
              type="text"
              placeholder=""
              className="h-8 w-full border-[1px] border-gray-300 px-1"
            />
          </div>
          <div>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2">₹</span>
              <input
                 ref={(el) => (inputRef.current["mrp"] = el)}
                onChange={(e) => handleInputChange("mrp", e.target.value)}
                value={newProduct.mrp || ""}
                type="text"
                placeholder=""
                className="h-8 w-full border-[1px] border-gray-300 pl-5 px-1"
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2">₹</span>
              <input
                onChange={(e) => handleInputChange("purchaseRate", e.target.value)}
                value={newProduct.purchaseRate || ""}
                type="text"
                placeholder=""
                className="h-8 w-full border-[1px] border-gray-300 pl-5 px-1"
              />
            </div>
          </div>
          <div>
            <input
              onChange={(e) => handleInputChange("ptr", e.target.value)}
              value={newProduct.ptr || ""}
              type="text"
              placeholder=""
              className="h-8 w-full border-[1px] border-gray-300 px-1"
            />
          </div>
          <div>
            <div className="flex">
              <input
                value={newProduct.schemeInput1 || ""}
                onChange={(e) => handleInputChange("schemeInput1", e.target.value)}
                type="text"
                placeholder=""
                className="h-8 w-full border-[1px] border-gray-300 px-1"
              />
              +
              <input
                value={newProduct.schemeInput2 || ""}
                onChange={(e) => handleInputChange("schemeInput2", e.target.value)}
                type="text"
                placeholder=""
                className="h-8 w-full border-[1px] border-gray-300 px-1"
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <input
                readOnly
                onChange={(e) => handleInputChange("schemePercent", e.target.value)}
                value={newProduct.schemePercent || ""}
                type="text"
                placeholder=""
                className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2">%</span>
            </div>
          </div>
          <div>
            <div className="relative">
              <input
                onChange={(e) => handleInputChange("discount", e.target.value)}
                value={newProduct.discount || ""}
                type="text"
                placeholder=""
                className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2">%</span>
            </div>
          </div>
          <div>
            <div className="relative">
              <input
                onChange={(e) => handleInputChange("gstPer", e.target.value)}
                value={newProduct.gstPer || ""}
                type="text"
                placeholder=""
                className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2">%</span>
            </div>
          </div>
          <div>
            <input
              readOnly
              onChange={(e) => handleInputChange("amount", e.target.value)}
              value={newProduct.amount || ""}
              type="text"
              placeholder=""
              className="h-8 w-full border-[1px] border-gray-300 px-1"
              disabled
            />
          </div>
          <div>
            <Button onClick={handleAdd} className="h-8">
              Add
            </Button>
          </div>
        </div>
      )}

      {/* showing all added product */}
      <div className="w-full mt-0">
        {products.length !== 0 &&
          products.map((product, index) => (
            <div className="grid grid-cols-20 w-full space-x-1 space-y-2" key={product?.inventoryId}>
              <div className="flex justify-center items-center text-md font-semibold">{index+1}</div>
              <div className="col-span-3 space-y-2">
                <input
                  disabled
                  value={product?.productName}
                  type="text"
                  placeholder="Type or Press Space"
                  className="h-8 w-full border-[1px] border-gray-300 px-2"
                />
              </div>
              <div className="space-y-2">
                <input
                  disabled={editMode}
                  onChange={(e) =>
                    handleInputChangeEditMode(index, "HSN", e.target.value)
                  }
                  value={product?.HSN || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <input
                  disabled={editMode}
                  type="text"
                  onChange={(e) =>
                    handleInputChangeEditMode(index, "batchNumber", e.target.value)
                  }
                  value={product?.batchNumber || ""}
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div className="space-y-2">
                <input
                  disabled={editMode}
                  onChange={(e) => handleInputChangeEditMode(index, "expiry", e.target.value)}
                  value={product.expiry || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-2"
                />
              </div>
              <div className="space-y-2">
                <input
                  disabled={editMode}
                  onChange={(e) => handleInputChangeEditMode(index,"pack", e.target.value)}
                  value={product?.pack || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div className="space-y-2">
                <input
                  onChange={(e) =>
                    handleInputChangeEditMode(index,"quantity", e.target.value)
                  }
                  disabled={editMode}
                  value={product?.quantity || ""}
                  type="text"
                  placeholder=""
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div className="space-y-2">
                <input
                  onChange={(e) => handleInputChangeEditMode(index,"free", e.target.value)}
                  value={product?.free || ""}
                  disabled={editMode}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2">₹</span>
                  <input
                    onChange={(e) => handleInputChangeEditMode(index,"mrp", e.target.value)}
                    value={product?.mrp || ""}
                    disabled={editMode}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 pl-5 px-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2">₹</span>
                  <input
                    onChange={(e) =>
                      handleInputChangeEditMode(index,"purchaseRate", e.target.value)
                    }
                    disabled={editMode}
                    value={product?.purchaseRate || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 pl-5 px-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <input
                  onChange={(e) => handleInputChangeEditMode(index,"ptr", e.target.value)}
                  value={product?.ptr || ""}
                  disabled={editMode}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div className="space-y-2">
                <div className="flex">
                  <input
                    value={product?.schemeInput1 || ""}
                    onChange={(e) =>
                      handleInputChangeEditMode(index,"schemeInput1", e.target.value)
                    }
                    disabled={editMode}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 px-1"
                  />
                  +
                  <input
                    value={product?.schemeInput2 || ""}
                    onChange={(e) =>
                      handleInputChangeEditMode(index,"schemeInput2", e.target.value)
                    }
                    disabled={editMode}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 px-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    onChange={(e) =>
                      handleInputChangeEditMode(index,"schemePercent", e.target.value)
                    }
                    disabled
                    value={product?.schemePercent || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    onChange={(e) =>
                      handleInputChangeEditMode(index,"discount", e.target.value)
                    }
                    disabled={editMode}
                    value={product?.discount || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    onChange={(e) =>
                      handleInputChangeEditMode(index,"gstPer", e.target.value)
                    }
                    disabled={editMode}
                    value={product?.gstPer || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <input
                  disabled
                  value={product?.amount || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div className="space-y-2  flex gap-4  items-center justify-center">
                  <button disabled={viewMode} onClick={() => handleEditProduct(index)} ><Pen className="h-4 w-4" /></button>
                  <button disabled={viewMode} onClick={() => handleDeleteProduct(index)} ><Trash2 className="h-4 w-4" /></button>
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
      <SelectBatchDialog
        open={batchDialog}
        setOpen={setBatchDialog}
        batchNumber={batchNumber}
        setBatchNumber={setBatchNumber}
        onSelect={handleSelectBatch}
        inventoryId={newProduct?.inventoryId}
      />
    </div>
  );
}
