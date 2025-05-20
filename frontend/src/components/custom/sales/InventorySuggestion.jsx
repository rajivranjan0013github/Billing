import React, { useState, useEffect, useRef, forwardRef } from "react";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Search } from "lucide-react";
import { ScrollArea } from "../../ui/scroll-area";
import { useDispatch, useSelector } from "react-redux";
import { fetchItems } from "../../../redux/slices/inventorySlice";
import { convertQuantity } from "../../../assets/Data";
import AddNewInventory from "../inventory/AddNewInventory";

const SearchSuggestion = forwardRef(
  ({ value, setValue, onSuggestionSelect, inputRef }, ref) => {
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showAddNewInventoryDialog, setShowAddNewInventoryDialog] =
      useState(false);
    const suggestionListRef = useRef(null);
    const suggestionContainerRef = useRef(null);
    const searchInputRef = useRef(null);

    const { items: suggestions, itemsStatus } = useSelector(
      (state) => state.inventory
    );
    const dispatch = useDispatch();

    useEffect(() => {
      if (inputRef) {
        if (typeof inputRef === "function") {
          inputRef(searchInputRef.current);
        } else if (inputRef.hasOwnProperty("current")) {
          if (!inputRef.current) inputRef.current = {};
          inputRef.current["product"] = searchInputRef.current;
        }
      }
    }, [inputRef]);

    useEffect(() => {
      if (itemsStatus === "idle") {
        dispatch(fetchItems());
      }
    }, [itemsStatus, dispatch]);

    useEffect(() => {
      const filtered = suggestions.filter((suggestion) =>
        suggestion.name.toLowerCase().includes((value || "").toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setSelectedIndex(0);
    }, [value, suggestions]);

    const handleInputChange = (e) => {
      setValue(e.target.value);
      setShowSuggestions(true);
    };

    const handleSuggestionClick = (suggestion) => {
      setValue(suggestion.name);
      setShowSuggestions(false);
      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion);
      }
      if (inputRef?.current?.["batchNumber"]) {
        inputRef.current["batchNumber"].focus();
      } else {
        searchInputRef.current?.focus();
      }
    };

    const handleKeyDown = (e) => {
      if (!showSuggestions || filteredSuggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        handleSuggestionClick(filteredSuggestions[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
      }
    };

    useEffect(() => {
      if (
        selectedIndex >= 0 &&
        suggestionListRef.current?.children[selectedIndex]
      ) {
        suggestionListRef.current.children[selectedIndex].scrollIntoView({
          block: "nearest",
        });
      }
    }, [selectedIndex]);

    const handleFocus = () => {
      if (value || filteredSuggestions.length > 0) {
        setShowSuggestions(true);
      }
    };

    const handleBlur = (e) => {
      requestAnimationFrame(() => {
        const relatedTarget = e.relatedTarget;
        if (
          !suggestionContainerRef.current ||
          !suggestionContainerRef.current.contains(relatedTarget)
        ) {
          setShowSuggestions(false);
        }
      });
    };

    const handleNewProductCreated = (newProduct) => {
      if (onSuggestionSelect) {
        onSuggestionSelect(newProduct);
      }
      setValue(newProduct.name);
      setShowSuggestions(false);
      setShowAddNewInventoryDialog(false);
      dispatch(fetchItems());
    };

    return (
      <div className="relative w-full" onBlur={handleBlur}>
        <div className="relative ">
          <Input
            ref={searchInputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            autoComplete="off"
            placeholder={"Search product"}
            className="h-8 w-full border-[1px] border-gray-300 px-2"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls="suggestion-listbox"
            aria-activedescendant={
              selectedIndex >= 0
                ? `suggestion-item-${selectedIndex}`
                : undefined
            }
          />
          <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
        </div>

        {showSuggestions && (
          <div
            ref={suggestionContainerRef}
            className="absolute z-10 w-[600px] mt-1 bg-white border border-gray-300 rounded-sm shadow-lg"
            tabIndex={-1}
          >
            <div className="w-full grid grid-cols-7 border-b-[1px] border-muted-foreground px-4 py-1 sticky top-0 bg-white z-10 text-[12px]">
              <div className="col-span-2 ">PRODUCT</div>
              <div></div>
              <div className=" font-semibold">BATCHES</div>
              <div className=" font-semibold col-span-2">QUANTITY</div>
              <div className=" font-semibold">LOCATION</div>
            </div>
            <ScrollArea
              className={`${
                filteredSuggestions.length > 5 ? "h-[300px]" : "max-h-[300px]"
              } pr-2`}
            >
              {itemsStatus === "loading" && (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              )}
              {itemsStatus !== "loading" && filteredSuggestions.length > 0 ? (
                <ul
                  ref={suggestionListRef}
                  id="suggestion-listbox"
                  role="listbox"
                >
                  {filteredSuggestions.map((suggestion, index) => (
                    <li
                      key={suggestion._id}
                      id={`suggestion-item-${index}`}
                      role="option"
                      aria-selected={index === selectedIndex}
                      onClick={() => handleSuggestionClick(suggestion)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full grid grid-cols-7 border-b-[1px] border-muted px-4 py-2 cursor-pointer hover:bg-blue-100 focus:bg-blue-100 focus:outline-none ${
                        index === selectedIndex ? "bg-blue-200" : ""
                      }`}
                    >
                      <div className="col-span-2 ">
                        <div className="text-sm uppercase font-medium">
                          {suggestion?.name}
                        </div>
                        <div className="text-[10px] tracking-wide">
                          {suggestion?.mfcName}
                        </div>
                      </div>
                      <div>
                        <Badge
                          variant={
                            suggestion?.quantity > 0 ? "success" : "destructive"
                          }
                          className="mt-1 h-5 text-xs rounded-xl"
                        >
                          {suggestion?.quantity > 0 ? "In Stock" : "Out Stock"}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        {suggestion?.batch?.length
                          ? `${suggestion.batch.length} batch${
                              suggestion.batch.length !== 1 ? "es" : ""
                            }`
                          : "-"}
                      </div>
                      <div className="text-sm col-span-2">
                        {convertQuantity(
                          suggestion?.quantity,
                          suggestion?.pack
                        )}
                      </div>
                      <div className="text-sm text-center">
                        {suggestion?.location || "-"}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                itemsStatus !== "loading" && (
                  <div className="p-4 text-center text-gray-500" role="status">
                    No products found matching your search.
                  </div>
                )
              )}
              {itemsStatus !== "loading" &&
                filteredSuggestions.length === 0 && (
                  <div className="p-4 text-center">
                    <button
                      onClick={() => setShowAddNewInventoryDialog(true)}
                      className="text-blue-600 hover:underline"
                    >
                      Create New Product
                    </button>
                  </div>
                )}
            </ScrollArea>
          </div>
        )}
        <AddNewInventory
          open={showAddNewInventoryDialog}
          onOpenChange={setShowAddNewInventoryDialog}
          onProductCreated={handleNewProductCreated}
          initialProductName={value}
        />
      </div>
    );
  }
);

SearchSuggestion.displayName = "SearchSuggestion";

export default SearchSuggestion;
