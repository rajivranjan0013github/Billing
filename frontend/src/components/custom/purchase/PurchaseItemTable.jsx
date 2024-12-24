import { useState, useRef, useEffect } from "react";
import { Button } from "../../ui/button";
import ProductSelector from "../inventory/SelectInventoryItem";
import { convertToFraction } from "../../../assets/Data";
import { Pen, Trash2, Check } from 'lucide-react'
import { useToast } from "../../../hooks/use-toast";
import BatchSuggestion from '../sales/BatchSuggestion';

export default function PurchaseTable({inputRef, products, setProducts, viewMode}) {
  const {toast} = useToast();
  const [editMode, setEditMode] = useState(true);
  const [newProduct, setNewProduct] = useState({});
  const [productSearch, setProductSearch] = useState("");
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [batchNumber, setBatchNumber] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editAll, setEditAll] = useState(false);
  const [editBatchNumbers, setEditBatchNumbers] = useState({});

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
    let tempData = {...newProduct};
    if(!tempData.batchNumber) tempData.batchNumber = batchNumber;
    setProducts((pre) => [...pre, tempData]);
    setBatchNumber("");
    setNewProduct({});
    setProductSearch("");
    inputRef.current['product'].focus();
  };

  // product selector from dialog
  const handleProductSeletor = (product) => {
    setNewProduct((prev) => ({
      ...prev,
      productName: product.name,
      inventoryId: product._id,
      productName: product.name,
      mrp : product.mrp,
      expiry : product.expiry,
      pack : product.pack,
      purchaseRate : product.purchaseRate,
      ptr : product.ptr,
      HSN : product.HSN,
      gstPer : product.gstPer
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

  const handleBatchSelect = (batch) => {
    Object.assign(batch, {quantity : ""});
    setBatchNumber(batch.batchNumber);
    setNewProduct({...newProduct, batchId : batch._id, ...batch });
    if(inputRef.current['quantity']) {
      inputRef.current['quantity'].focus();
    }
  }

  // edit all product togather
  const handleInputChangeEditMode = (index, field, value) => {
    setProducts(prevProducts => {
      const updatedProducts = [...prevProducts];
      const updatedProduct = { ...updatedProducts[index], [field]: value };
      
      // Recalculate amount when quantity or rates change
      if (field === 'quantity' || field === 'purchaseRate' || field === 'discount' || field === 'schemeInput1' || field === 'schemeInput2') {
        const quantity = Number(updatedProduct.quantity || 0);
        const purchaseRate = Number(updatedProduct.purchaseRate || 0);
        const discount = Number(updatedProduct.discount || 0);
        const gstPer = Number(updatedProduct.gstPer || 0);
        
        let schemePercent = 0;
        if (updatedProduct.schemeInput1 && updatedProduct.schemeInput2) {
          const temp1 = Number(updatedProduct.schemeInput1);
          const temp2 = Number(updatedProduct.schemeInput2);
          schemePercent = (temp2 / (temp1 + temp2)) * 100;
          updatedProduct.schemePercent = convertToFraction(schemePercent);
        }
        
        const subtotal = quantity * purchaseRate;
        const total = subtotal * (1 - discount / 100) * (1 - schemePercent / 100);
        updatedProduct.amount = convertToFraction(total * (1 + gstPer / 100));
      }
      
      updatedProducts[index] = updatedProduct;
      return updatedProducts;
    });
  };

  const handleDeleteProduct = (indexToDelete) => {
    const updatedProducts = products.filter((_, index) => index !== indexToDelete)
    setProducts(updatedProducts);
  }

  const handleEditProduct = (index) => {
    setEditingIndex(index);
    setEditMode(false);
  }

  const handleSaveEdit = (index) => {
    setEditingIndex(null);
    setEditMode(true);
  }

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
    // Don't reset quantity when editing
    setEditBatchNumbers(prev => ({...prev, [index]: batch.batchNumber}));
    
    // Update the products array with new batch details while preserving existing quantity
    setProducts(prevProducts => {
      const updatedProducts = [...prevProducts];
      const existingProduct = updatedProducts[index];
      updatedProducts[index] = {
        ...existingProduct,
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        expiry: batch.expiry,
        mrp: batch.mrp,
        pack: batch.pack,
        purchaseRate: batch.purchaseRate,
        ptr: batch.ptr,
        // Keep existing quantity and other fields
        quantity: existingProduct.quantity,
        free: existingProduct.free,
        discount: existingProduct.discount,
        schemeInput1: existingProduct.schemeInput1,
        schemeInput2: existingProduct.schemeInput2,
        schemePercent: existingProduct.schemePercent,
        gstPer: existingProduct.gstPer,
        amount: existingProduct.amount
      };
      return updatedProducts;
    });

    // Recalculate amount after batch update
    const updatedProduct = products[index];
    if (updatedProduct?.quantity && batch?.purchaseRate) {
      const quantity = Number(updatedProduct.quantity || 0);
      const purchaseRate = Number(batch.purchaseRate || 0);
      const discount = Number(updatedProduct.discount || 0);
      const gstPer = Number(updatedProduct.gstPer || 0);
      
      let schemePercent = 0;
      if (updatedProduct.schemeInput1 && updatedProduct.schemeInput2) {
        const temp1 = Number(updatedProduct.schemeInput1);
        const temp2 = Number(updatedProduct.schemeInput2);
        schemePercent = (temp2 / (temp1 + temp2)) * 100;
      }
      
      const subtotal = quantity * purchaseRate;
      const total = subtotal * (1 - discount / 100) * (1 - schemePercent / 100);
      
      setProducts(prevProducts => {
        const newProducts = [...prevProducts];
        newProducts[index] = {
          ...newProducts[index],
          amount: convertToFraction(total * (1 + gstPer / 100))
        };
        return newProducts;
      });
    }
  };

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
        <div className=" flex justify-center">
          <input 
            type="checkbox" 
            checked={editAll}
            onChange={handleEditAllChange}
            className="w-3 h-4"
            disabled={viewMode}
          />
          <p className="text-xs font-semibold">EDIT ALL</p>
        </div>
      </div>

      {/* Input row - only show when not in view mode -> taking main input for new product */}
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
            <BatchSuggestion
              inputRef={inputRef}
              value={batchNumber}
              setValue={setBatchNumber}
              onSuggestionSelect={handleBatchSelect}
              inventoryId={newProduct?.inventoryId}
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
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 tracking-widest opacity-80">1x</span>
              <input
                ref={(el) => (inputRef.current["pack"] = el)}
                onChange={(e) => handleInputChange("pack", e.target.value)}
                value={newProduct.pack || ""}
                type="text"
                className="h-8 w-full border-[1px] border-gray-300 px-1 pl-7"
              />
            </div>
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
                disabled
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
                  disabled={!editAll && editingIndex !== index}
                  onChange={(e) => handleInputChangeEditMode(index, "HSN", e.target.value)}
                  value={product?.HSN || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <BatchSuggestion
                  inputRef={inputRef}
                  value={editBatchNumbers[index] || product?.batchNumber || ''}
                  setValue={(value) => {
                    setEditBatchNumbers(prev => ({...prev, [index]: value}));
                    // Also update the product's batchNumber directly
                    handleInputChangeEditMode(index, "batchNumber", value);
                  }}
                  onSuggestionSelect={(batch) => handleEditBatchSelect(batch, index)}
                  inventoryId={product?.inventoryId}
                  disabled={!editAll && editingIndex !== index}
                />
              </div>
              <div className="space-y-2">
                <input
                  disabled={!editAll && editingIndex !== index}
                  onChange={(e) => handleInputChangeEditMode(index, "expiry", e.target.value)}
                  value={product.expiry || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-2"
                />
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 tracking-widest opacity-80">1x</span>
                  <input
                    disabled={!editAll && editingIndex !== index}
                    onChange={(e) => handleInputChangeEditMode(index,"pack", e.target.value)}
                    value={product?.pack || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 px-1 pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <input
                  disabled={!editAll && editingIndex !== index}
                  onChange={(e) => handleInputChangeEditMode(index,"quantity", e.target.value)}
                  value={product?.quantity || ""}
                  type="text"
                  placeholder=""
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div className="space-y-2">
                <input
                  disabled={!editAll && editingIndex !== index}
                  onChange={(e) => handleInputChangeEditMode(index,"free", e.target.value)}
                  value={product?.free || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2">₹</span>
                  <input
                    disabled={!editAll && editingIndex !== index}
                    onChange={(e) => handleInputChangeEditMode(index,"mrp", e.target.value)}
                    value={product?.mrp || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 pl-5 px-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2">₹</span>
                  <input
                    disabled={!editAll && editingIndex !== index}
                    onChange={(e) => handleInputChangeEditMode(index,"purchaseRate", e.target.value)}
                    value={product?.purchaseRate || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 pl-5 px-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <input
                  disabled={!editAll && editingIndex !== index}
                  onChange={(e) => handleInputChangeEditMode(index,"ptr", e.target.value)}
                  value={product?.ptr || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div className="space-y-2">
                <div className="flex">
                  <input
                   disabled={!editAll && editingIndex !== index}
                    value={product?.schemeInput1 || ""}
                    onChange={(e) => handleInputChangeEditMode(index,"schemeInput1", e.target.value)}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 px-1"
                  />
                  +
                  <input
                   disabled={!editAll && editingIndex !== index}
                    value={product?.schemeInput2 || ""}
                    onChange={(e) => handleInputChangeEditMode(index,"schemeInput2", e.target.value)}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 px-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    disabled
                    onChange={(e) => handleInputChangeEditMode(index,"schemePercent", e.target.value)}
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
                    disabled={!editAll && editingIndex !== index}
                    onChange={(e) => handleInputChangeEditMode(index,"discount", e.target.value)}
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
                    disabled={!editAll && editingIndex !== index}
                    onChange={(e) => handleInputChangeEditMode(index,"gstPer", e.target.value)}
                    value={product?.gstPer || ""}
                    type="text"
                    className="h-8 w-full border-[1px] border-gray-300 px-1 pr-5"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <input
                  disabled={!editAll && editingIndex !== index}
                  value={product?.amount || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div className="space-y-2 flex gap-4 items-center justify-center">
                {!editAll && (
                  <>
                    {editingIndex === index ? (
                      <button onClick={() => handleSaveEdit(index)}>
                        <Check className="h-4 w-4" />
                      </button>
                    ) : (
                      <button disabled={viewMode} onClick={() => handleEditProduct(index)}>
                        <Pen className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
                <button disabled={viewMode} onClick={() => handleDeleteProduct(index)}>
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
