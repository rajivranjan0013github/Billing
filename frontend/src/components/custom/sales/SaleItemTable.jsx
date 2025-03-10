import { useState } from "react";
import { Button } from "../../ui/button";
import { convertToFraction } from "../../../assets/Data";
import { Pen, Trash2 } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import InventorySuggestion from "./InventorySuggestion";
import BatchSuggestion from "./BatchSuggestion";
import { Input } from "../../ui/input";

export default function SaleTable({ inputRef, products, setProducts, handleKeyDown, viewMode}) {
  console.log(products)
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(true);
  const [newProduct, setNewProduct] = useState({});
  const [productSearch, setProductSearch] = useState(""); // for product Input-> which is passing in inventory suggestion
  const [batchNumber, setBatchNumber] = useState("");

  // Input changes handler
  const handleInputChange = (field, value) => {
    const updatedProduct = { ...newProduct, [field]: value };

    // If MRP exists, set initial sale rate to MRP
    if (field === "mrp") {
      updatedProduct.saleRate = value;
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
      const discount = Number(updatedProduct?.discount) || 0;
      const gstPer = Number(updatedProduct?.gstPer) || 0;
      const packs = Number(updatedProduct?.packs || 0); // for quantity
      const loose = Number(updatedProduct?.loose || 0);

      const pack = Number(updatedProduct?.pack || 1);
      const saleRate = Number(updatedProduct?.saleRate || 0);
      const quantity = pack * packs + loose;
      const subtotal = quantity * (saleRate / pack);
      const total = subtotal;
      updatedProduct.amount = convertToFraction(total);
      updatedProduct.quantity = quantity;
    } else {
      updatedProduct.amount = "";
    }
    setNewProduct(updatedProduct);
  };

  // handle add product to list
  const handleAdd = () => {
    if (!newProduct.productName) {
      toast({ variant: "destructive", title: "Please add product" });
      return;
    }

    if (newProduct.batchNumber) {
      setProducts((pre) => [...pre, newProduct]);
    } else {
      setProducts((pre) => [...pre, { ...newProduct, batchNumber }]);
    }
    setNewProduct({});
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
    setNewProduct({
      productName: product.name,
      inventoryId: product._id,
      mrp: product.mrp,
      expiry: product.expiry,
      ptr: product.ptr,
      gstPer: product.gstPer,
      HSN: product.HSN,
      pack: product.pack,
    });
    if (inputRef?.current["batchNumber"]) {
      inputRef.current["batchNumber"].focus();
    }
  };

  const handleBatchSelect = (batch) => {
    setNewProduct({
      ...newProduct,
      batchNumber: batch.batchNumber,
      batchId: batch._id,
      mrp: batch.mrp,
      saleRate: batch.mrp,
      expiry: batch.expiry,
      ptr: batch.ptr,
      gstPer: batch.gstPer,
      HSN: batch.HSN,
      pack: batch.pack,
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
          <div className="text-xs font-semibold grid-cols-5">PRODUCT</div>
        </div>
        <div className="col-span-2">
          <p className="text-xs font-semibold">BATCH</p>
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
        <div className="grid grid-cols-16 w-full space-x-1">
          <div className="col-span-3 grid grid-cols-6">
            <div></div>
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
              onKeyDown={(e) => handleKeyDown(e, 'hsn')}
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
                onKeyDown={(e) => handleKeyDown(e, 'pack')}
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
              onKeyDown={(e) => handleKeyDown(e, 'expiry')}
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
                onKeyDown={(e) => handleKeyDown(e, 'mrp')}
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
              onKeyDown={(e) => handleKeyDown(e, 'packs')}
            />
          </div>
          <div>
            <Input
              ref={(el) => (inputRef.current["loose"] = el)}
              onChange={(e) => handleInputChange("loose", e.target.value)}
              value={newProduct.loose || ""}
              type="text"
              className="h-8 w-full border-[1px] border-gray-300 px-1"
              onKeyDown={(e) => handleKeyDown(e, 'loose')}
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
                onKeyDown={(e) => handleKeyDown(e, 'saleRate')}
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
                onKeyDown={(e) => handleKeyDown(e, 'discount')}
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
                onKeyDown={(e) => handleKeyDown(e, 'gstPer')}
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
              className="h-8"
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
                <span className="text-center font-semibold">{index + 1}.</span>
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
