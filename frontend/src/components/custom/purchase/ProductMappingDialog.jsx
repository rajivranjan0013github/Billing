import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { ScrollArea } from "../../ui/scroll-area";
import { Check, X, Search, AlertCircle, Percent, Plus } from "lucide-react";
import { Badge } from "../../ui/badge";
import Fuse from "fuse.js";
import { useSelector } from "react-redux";
import CreateDistributorDlg from "../distributor/CreateDistributorDlg";

const ProductMappingDialog = ({
  open,
  onOpenChange,
  productsToMap: initialProductsToMap,
  inventoryItems,
  onSubmit,
  isLoadingInventory,
  distributorName,
  onDistributorSelect,
}) => {
  const [mappedProducts, setMappedProducts] = useState([]);
  const [searchQueries, setSearchQueries] = useState({});
  const [distributorSearchQuery, setDistributorSearchQuery] = useState("");
  const [createDistributorOpen, setCreateDistributorOpen] = useState(false);
  const { distributors } = useSelector((state) => state.distributor);

  // Configure Fuse instance for products
  const fuse = useMemo(() => {
    const fuseOptions = {
      keys: [{ name: "name", weight: 1 }],
      threshold: 0.3,
      distance: 100,
      minMatchCharLength: 2,
      shouldSort: true,
      includeScore: true,
      includeMatches: true,
    };
    return new Fuse(inventoryItems || [], fuseOptions);
  }, [inventoryItems]);

  // Configure Fuse instance for distributors
  const distributorFuse = useMemo(() => {
    const fuseOptions = {
      keys: [{ name: "name", weight: 1 }],
      threshold: 0.3,
      distance: 100,
      minMatchCharLength: 2,
      shouldSort: true,
      includeScore: true,
      includeMatches: true,
    };
    return new Fuse(distributors || [], fuseOptions);
  }, [distributors]);

  // Effect for initial distributor search
  useEffect(() => {
    if (distributorName) {
      const results = distributorFuse.search(distributorName).slice(0, 5);
      setDistributorSearchResults(
        results.map((result) => ({
          item: result.item,
          confidence: 1 - (result.score || 0),
        }))
      );

      // Automatically select the first distributor if it has high confidence
      const firstResult = results[0];
      if (firstResult && 1 - firstResult.score >= 0.8) {
        onDistributorSelect(firstResult.item);
      }
    }
  }, [distributorName, distributorFuse]);

  const [distributorSearchResults, setDistributorSearchResults] = useState([]);

  const handleDistributorSearch = (searchTerm) => {
    setDistributorSearchQuery(searchTerm);
    if (!searchTerm.trim()) {
      setDistributorSearchResults([]);
      return;
    }

    const results = distributorFuse.search(searchTerm).slice(0, 5);
    setDistributorSearchResults(
      results.map((result) => ({
        item: result.item,
        confidence: 1 - (result.score || 0),
      }))
    );
  };

  useEffect(() => {
    if (initialProductsToMap) {
      const initialMapped = initialProductsToMap.map((product) => ({
        llmProduct: product,
        selectedInventoryItem: null,
        matchConfidence: 0,
        includeProduct: true,
        searchResults: [],
      }));

      const productsWithMatches = initialMapped.map((product) => {
        const initialSearchResults = fuse
          .search(product.llmProduct.productName)
          .slice(0, 5)
          .map((result) => ({
            item: result.item,
            confidence: 1 - (result.score || 0),
            score: result.score || 0,
            matches: result.matches || [],
          }));

        return {
          ...product,
          selectedInventoryItem: initialSearchResults[0]?.item || null,
          matchConfidence: initialSearchResults[0]?.confidence || 0,
          searchResults: initialSearchResults,
        };
      });

      setMappedProducts(productsWithMatches);
    }
  }, [initialProductsToMap, fuse]);

  const handleSearch = (productIndex, searchTerm) => {
    setSearchQueries((prev) => ({ ...prev, [productIndex]: searchTerm }));

    if (!searchTerm.trim()) {
      setMappedProducts((prev) =>
        prev.map((p, idx) =>
          idx === productIndex ? { ...p, searchResults: [] } : p
        )
      );
      return;
    }

    const searchResults = fuse
      .search(searchTerm)
      .slice(0, 5)
      .map((result) => ({
        item: result.item,
        confidence: 1 - (result.score || 0),
        score: result.score || 0,
        matches: result.matches || [],
      }));

    setMappedProducts((prev) =>
      prev.map((p, idx) => (idx === productIndex ? { ...p, searchResults } : p))
    );
  };

  const handleInventoryItemSelect = (
    productIndex,
    inventoryItem,
    confidence
  ) => {
    setMappedProducts((prev) =>
      prev.map((p, idx) =>
        idx === productIndex
          ? {
              ...p,
              selectedInventoryItem: inventoryItem,
              matchConfidence: confidence,
            }
          : p
      )
    );
  };

  const toggleIncludeProduct = (productIndex) => {
    setMappedProducts((prev) =>
      prev.map((p, idx) =>
        idx === productIndex ? { ...p, includeProduct: !p.includeProduct } : p
      )
    );
  };

  const handleConfirm = () => {
    const finalProducts = mappedProducts
      .filter((p) => p.includeProduct)
      .map((p) => {
        const llmProd = p.llmProduct;
        const invItem = p.selectedInventoryItem;
        if (invItem) {
          return {
            inventoryId: invItem._id,
            productName: invItem.name,
            quantity: Number(llmProd.quantity || 0),
            batchNumber: llmProd.batchNumber || "",
            free: Number(llmProd.free || 0),
            HSN: llmProd.HSN || invItem.HSN || "",
            expiry: llmProd.expiry || invItem.expiry || "",
            mfcName: llmProd.mfcName || invItem.mfcName || "",
            mrp: Number(llmProd.mrp || 0),
            purchaseRate: Number(llmProd.purchaseRate || 0),
            discount: Number(llmProd.discount || 0),
            gstPer: Number(llmProd.gstPer || 0),
            pack: Number(llmProd.pack || 1),
            amount: Number(llmProd.amount || 0),
          };
        } else {
          return {
            productName: llmProd.productName,
            quantity: Number(llmProd.quantity || 0),
            free: Number(llmProd.free || 0),
            mrp: Number(llmProd.mrp || 0),
            expiry: llmProd.expiry || "",
            batchNumber: llmProd.batchNumber || "",
            mfcName: llmProd.mfcName || "",
            purchaseRate: Number(llmProd.purchaseRate || 0),
            discount: Number(llmProd.discount || 0),
            gstPer: Number(llmProd.gstPer || 0),
            amount: Number(llmProd.amount || 0),
            pack: Number(llmProd.pack || 1),
            HSN: llmProd.HSN || "",
            mfcName: llmProd.mfcName || "",
          };
        }
      });
    console.log(finalProducts);
    console.log(mappedProducts);
    onSubmit(finalProducts);
    onOpenChange(false);
  };

  // Add handler for new distributor creation success
  const handleDistributorCreated = (newDistributor) => {
    onDistributorSelect(newDistributor);
    setCreateDistributorOpen(false);
  };

  if (isLoadingInventory) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading Inventory...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getMatchScore = (confidence) => {
    const percentage = Math.round(confidence * 100);
    return (
      <div className="flex items-center gap-1 text-sm">
        <span className="font-medium">{percentage}%</span>
        <Percent className="h-3 w-3" />
      </div>
    );
  };

  const getConfidenceBadge = (confidence) => {
    const matchScore = Math.round(confidence * 100);
    if (confidence >= 0.8) {
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          High Match {getMatchScore(confidence)}
        </Badge>
      );
    } else if (confidence >= 0.5) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          Moderate Match {getMatchScore(confidence)}
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
        Low Match {getMatchScore(confidence)}
      </Badge>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Map Products and Distributor
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Review and confirm product and distributor mappings from your
              invoice
            </DialogDescription>
          </DialogHeader>

          {/* Distributor Section */}
          <div className="mb-4 border-b pb-4">
            <div className="text-sm font-medium mb-2">DISTRIBUTOR MAPPING</div>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                {distributorSearchQuery ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search distributor..."
                      className="h-8 text-sm"
                      value={distributorSearchQuery}
                      onChange={(e) => handleDistributorSearch(e.target.value)}
                    />
                    <Button size="sm" variant="outline" className="h-8">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {distributorSearchResults.length > 0 ? (
                      <>
                        {distributorSearchResults.map((result, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="py-0.5 px-2 cursor-pointer transition-colors text-xs text-black"
                            onClick={() => onDistributorSelect(result.item)}
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{result.item.name}</span>
                            </div>
                          </Badge>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs px-2 hover:bg-primary/5"
                          onClick={() =>
                            setDistributorSearchQuery(distributorName)
                          }
                        >
                          More
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>No matching distributor found</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1"
                          onClick={() => setCreateDistributorOpen(true)}
                        >
                          <Plus className="h-4 w-4" />
                          Create New Distributor
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="">
            <div className="grid grid-cols-12 gap-4 px-4  bg-gray-50/80 rounded-md text-sm font-medium text-muted-foreground">
              <div className="col-span-1">#</div>
              <div className="col-span-3">PRODUCTS FROM PDF/IMAGE FILE</div>
              <div className="col-span-2">PACK</div>
              <div className="col-span-6">
                SUGGESTED PRODUCT MAPPING{" "}
                <span className="font-bold text-black">FROM INVENTORY</span>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[50vh]">
            <div className="space-y-0.5">
              {mappedProducts.map((product, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-12 gap-4 px-4 pb-1 rounded-md transition-all hover:shadow-sm ${
                    !product.includeProduct
                      ? "bg-gray-50/50 opacity-75"
                      : "bg-white"
                  }`}
                >
                  {/* Product Number */}
                  <div className="col-span-1 flex items-center text-sm text-muted-foreground">
                    {index + 1}
                  </div>

                  {/* Product Name */}
                  <div className="col-span-3 flex items-center">
                    <div>
                      <div className="font-medium text-sm">
                        {product.llmProduct.productName}
                      </div>
                    </div>
                  </div>

                  {/* Pack */}
                  <div className="col-span-2 flex items-center font-semibold ">
                    <div className="text-xs text-muted-foreground text-[16px]">
                      {product.llmProduct.pack
                        ? "1*" + product.llmProduct.pack
                        : "-"}
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="col-span-6 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      {searchQueries[index] ? (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Search inventory..."
                            className="h-8 text-sm"
                            value={searchQueries[index]}
                            onChange={(e) =>
                              handleSearch(index, e.target.value)
                            }
                          />
                          <Button size="sm" variant="outline" className="h-8">
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          {product.searchResults.length > 0 ? (
                            <>
                              {product.searchResults
                                .slice(0, 3)
                                .map((result, resultIndex) => (
                                  <Badge
                                    key={resultIndex}
                                    variant={
                                      product.selectedInventoryItem?._id ===
                                      result.item._id
                                        ? "default"
                                        : "outline"
                                    }
                                    className={`py-0.5 px-2 cursor-pointer  transition-colors text-xs text-black ${
                                      product.selectedInventoryItem?._id ===
                                      result.item._id
                                        ? "bg-green-500/50"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      handleInventoryItemSelect(
                                        index,
                                        result.item,
                                        result.confidence
                                      )
                                    }
                                  >
                                    <div className="flex items-center gap-1.5">
                                      {product.selectedInventoryItem?._id ===
                                        result.item._id && (
                                        <Check className="h-3 w-3" />
                                      )}
                                      <span>
                                        {result.item.name +
                                          " " +
                                          (result.item.pack
                                            ? "(1 X " + result.item.pack + ")"
                                            : "")}
                                      </span>
                                    </div>
                                  </Badge>
                                ))}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs px-2 hover:bg-primary/5"
                                onClick={() =>
                                  setSearchQueries((prev) => ({
                                    ...prev,
                                    [index]: product.llmProduct.productName,
                                  }))
                                }
                              >
                                More
                              </Button>
                            </>
                          ) : (
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              <span>
                                No matches found (
                                <span className="font-bold text-black">
                                  new
                                </span>{" "}
                                item will be created automatically)
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleIncludeProduct(index)}
                        className={`h-7 px-2 ${
                          !product.includeProduct ? "text-muted-foreground" : ""
                        }`}
                      >
                        EXCLUDE
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4 border-t pt-4">
            <div className="flex justify-between items-center w-full">
              <div className="text-sm text-muted-foreground">
                {
                  mappedProducts.filter(
                    (p) => p.includeProduct && p.selectedInventoryItem
                  ).length
                }{" "}
                of {mappedProducts.length} products mapped with existing
                inventory
              </div>
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  onClick={handleConfirm}
                  size="sm"
                  className="min-w-[100px]"
                >
                  Confirm
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateDistributorDlg
        open={createDistributorOpen}
        onOpenChange={setCreateDistributorOpen}
        onSuccess={handleDistributorCreated}
        initialData={{
          name: distributorName || "",
        }}
      />
    </>
  );
};

export default ProductMappingDialog;
