import { useState, useRef, useEffect } from "react";
import { Button } from "../../ui/button";
import ProductSelector from "../inventory/SelectInventoryItem";
import { convertToFraction } from "../../../assets/Data";
import {Pen, Trash2} from 'lucide-react'

export default function PurchaseTable() {
  const inputRef = useRef([]);
  const [editMode, setEditMode] = useState(true)
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    // product : "",
    // product_id : "",
    // hsn_code : "",
    // batch_number : "",
    // expiry: "",
    // pack : "",
    // quantity : "",
    // free : "",
    // mrp : "",
    // purchase_rate : "",
    // ptr : "",
    // gst_percentage : "",
    // amount : "",
  });

  // some inputs state
  const [productSearch, setProductSearch] = useState("");
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);

  // input changes handler
  const handleInputChange = (field, value) => {
    const updatedProduct = { ...newProduct, [field]: value };
    if (updatedProduct?.quantity && updatedProduct?.purchase_rate) {
      const discount = Number(updatedProduct?.discount) || 0;
      const gst_percentage = Number(updatedProduct?.gst_percentage) || 0;
      const quantity = Number(updatedProduct?.quantity || 0);
      const purchase_rate = Number(updatedProduct?.purchase_rate || 0);
      let schemePercent = 0;
      if (updatedProduct.schemeInput1 && updatedProduct.schemeInput2) {
        const temp1 = Number(updatedProduct.schemeInput1);
        const temp2 = Number(updatedProduct.schemeInput2);
        schemePercent = (temp2 / (temp1 + temp2)) * 100;
        updatedProduct.schemePercent = convertToFraction(schemePercent);
      } else {
        updatedProduct.schemePercent = "";
      }
      const subtotal = quantity * purchase_rate;
      const total = subtotal * (1 - discount / 100) * (1 - schemePercent / 100);
      updatedProduct.amount = convertToFraction(
        total * (1 + gst_percentage / 100)
      );
    } else {
      updatedProduct.amount = "";
    }
    setNewProduct(updatedProduct);
  };

  // handle add product to list
  const handleAdd = () => {
    if (!newProduct.product) return;
    setProducts((pre) => [...pre, newProduct]);
    setNewProduct({});
    setProductSearch("");
    inputRef.current['product'].focus();
  };

  // product selector from dialog
  const handleProductSeletor = (product) => {
    setNewProduct((prev) => ({
      ...prev,
      product: product.name,
      product_id: product._id,
    }));
    setProductSearch(product.name);
    if (inputRef.current["hsn_code"]) {
      inputRef.current["hsn_code"].focus();
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

  // edit all product togather
  const handleInputChangeEditMode = (index, field, value) => {}

  const handleDeleteProduct = (indexToDelete) => {
    const updatedProducts = products.filter((_, index) => index !== indexToDelete)
    setProducts(updatedProducts);
  }

  const handleEditProduct = (index) => {
    const product = products[index];
    setNewProduct(product);
    setProductSearch(product?.product)
    handleDeleteProduct(index);
  }

  return (
    <div className="w-full border-[1px] border-inherit py-4 rounded-sm">
      <div className="grid grid-cols-20 w-full space-x-1">
        <div className="flex justify-center">#</div>
        <div className="col-span-3 space-y-2">
          <p className="text-xs font-semibold">PRODUCT</p>
          <input
            ref={(el) => (inputRef.current["product"] = el)}
            onChange={handleProductNameChange}
            value={productSearch}
            type="text"
            placeholder="Type or Press Space"
            className="h-8 w-full border-[1px] border-gray-300 px-2"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">HSN</p>
          <input
            ref={(el) => (inputRef.current["hsn_code"] = el)}
            onChange={(e) => handleInputChange("hsn_code", e.target.value)}
            value={newProduct.hsn_code || ""}
            type="text"
            placeholder=""
            className="h-8 w-full border-[1px] border-gray-300 px-1"
          />
        </div>
        <div className="space-y-2 col-span-2">
          <p className="text-xs font-semibold">BATCH</p>
          <input
            ref={(el) => (inputRef.current["batch_number"] = el)}
            type="text"
            onChange={(e) => handleInputChange("batch_number", e.target.value)}
            value={newProduct.batch_number || ""}
            placeholder="batch no"
            className="h-8 w-full border-[1px] border-gray-300 px-1"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">EXPIRY</p>
          <input
            onChange={(e) => handleInputChange("expiry", e.target.value)}
            value={newProduct.expiry || ""}
            type="text"
            placeholder="MM/YY"
            className="h-8 w-full border-[1px] border-gray-300 px-2"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">PACK</p>
          <input
            onChange={(e) => handleInputChange("pack", e.target.value)}
            value={newProduct.pack || ""}
            type="text"
            placeholder="1*"
            className="h-8 w-full border-[1px] border-gray-300 px-1"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">QTY</p>
          <input
            onChange={(e) => handleInputChange("quantity", e.target.value)}
            value={newProduct.quantity || ""}
            type="text"
            placeholder=""
            className="h-8 w-full border-[1px] border-gray-300 px-1"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">FREE</p>
          <input
            onChange={(e) => handleInputChange("free", e.target.value)}
            value={newProduct.free || ""}
            type="text"
            placeholder=""
            className="h-8 w-full border-[1px] border-gray-300 px-1"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">MRP</p>
          <input
            onChange={(e) => handleInputChange("mrp", e.target.value)}
            value={newProduct.mrp || ""}
            type="text"
            placeholder=""
            className="h-8 w-full border-[1px] border-gray-300 px-1"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">RATE</p>
          <input
            onChange={(e) => handleInputChange("purchase_rate", e.target.value)}
            value={newProduct.purchase_rate || ""}
            type="text"
            placeholder=""
            className="h-8 w-full border-[1px] border-gray-300 px-1"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">P-T-R</p>
          <input
            onChange={(e) => handleInputChange("ptr", e.target.value)}
            value={newProduct.ptr || ""}
            type="text"
            placeholder=""
            className="h-8 w-full border-[1px] border-gray-300 px-1"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">SCHEME</p>
          <div className="flex">
            <input
              value={newProduct.schemeInput1 || ""}
              onChange={(e) =>
                handleInputChange("schemeInput1", e.target.value)
              }
              type="text"
              placeholder=""
              className="h-8 w-full border-[1px] border-gray-300 px-1"
            />
            +
            <input
              value={newProduct.schemeInput2 || ""}
              onChange={(e) =>
                handleInputChange("schemeInput2", e.target.value)
              }
              type="text"
              placeholder=""
              className="h-8 w-full border-[1px] border-gray-300 px-1"
            />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">SCH%</p>
          <input
            readOnly
            onChange={(e) => handleInputChange("schemePercent", e.target.value)}
            value={newProduct.schemePercent || ""}
            type="text"
            placeholder=""
            className="h-8 w-full border-[1px] border-gray-300 px-1"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">DISC</p>
          <input
            onChange={(e) => handleInputChange("discount", e.target.value)}
            value={newProduct.discount || ""}
            type="text"
            placeholder=""
            className="h-8 w-full border-[1px] border-gray-300 px-1"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">GST</p>
          <input
            onChange={(e) =>
              handleInputChange("gst_percentage", e.target.value)
            }
            value={newProduct.gst_percentage || ""}
            type="text"
            placeholder=""
            className="h-8 w-full border-[1px] border-gray-300 px-1"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold">AMT</p>
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
        <div className="space-y-2">
          <p className="text-xs font-semibold">EDIT ALL</p>
          <Button onClick={handleAdd} className="h-8">
            Add
          </Button>
        </div>
      </div>
      {/* showing all added product */}
      <div className="w-full">
        {products.length !== 0 &&
          products.map((product, index) => (
            <div className="grid grid-cols-20 w-full space-x-1 space-y-2" index={product?.product_id}>
              <div className="flex justify-center items-center text-md font-semibold">{index+1}</div>
              <div className="col-span-3 space-y-2">
                <input
                  disabled
                  value={product?.product}
                  type="text"
                  placeholder="Type or Press Space"
                  className="h-8 w-full border-[1px] border-gray-300 px-2"
                />
              </div>
              <div className="space-y-2">
                <input
                  disabled={editMode}
                  onChange={(e) =>
                    handleInputChangeEditMode(index, "hsn_code", e.target.value)
                  }
                  value={product?.hsn_code || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <input
                  disabled={editMode}
                  type="text"
                  onChange={(e) =>
                    handleInputChangeEditMode(index, "batch_number", e.target.value)
                  }
                  value={product?.batch_number || ""}
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
                <input
                  onChange={(e) => handleInputChangeEditMode(index,"mrp", e.target.value)}
                  value={product?.mrp || ""}
                  disabled={editMode}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div className="space-y-2">
                <input
                  onChange={(e) =>
                    handleInputChangeEditMode(index,"purchase_rate", e.target.value)
                  }
                  disabled={editMode}
                  value={product?.purchase_rate || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
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
                <input
                  onChange={(e) =>
                    handleInputChangeEditMode(index,"schemePercent", e.target.value)
                  }
                  disabled
                  value={product?.schemePercent || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div className="space-y-2">
                <input
                  onChange={(e) =>
                    handleInputChangeEditMode(index,"discount", e.target.value)
                  }
                  disabled={editMode}
                  value={product?.discount || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
              </div>
              <div className="space-y-2">
                <input
                  onChange={(e) =>
                    handleInputChangeEditMode(index,"gst_percentage", e.target.value)
                  }
                  disabled={editMode}
                  value={product?.gst_percentage || ""}
                  type="text"
                  className="h-8 w-full border-[1px] border-gray-300 px-1"
                />
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
                  <button className='' onClick={() => handleEditProduct(index)} ><Pen className="h-4 w-4" /></button>
                  <button className='' onClick={() => handleDeleteProduct(index)} ><Trash2 className="h-4 w-4" /></button>
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
