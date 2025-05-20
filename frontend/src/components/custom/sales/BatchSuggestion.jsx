import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  forwardRef,
} from "react";
import { ScrollArea } from "../../ui/scroll-area";
import { Backend_URL, convertQuantity } from "../../../assets/Data";
import { useToast } from "../../../hooks/use-toast";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";

const BatchSuggestion = forwardRef(
  (
    {
      value,
      setValue,
      onSuggestionSelect,
      inventoryId,
      inputRef,
      disabled,
      onKeyDown,
    },
    ref
  ) => {
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const suggestionListRef = useRef(null);
    const suggestionContainerRef = useRef(null);
    const { toast } = useToast();
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
      const fetchBatches = async () => {
        try {
          const response = await fetch(
            `${Backend_URL}/api/inventory/batches/${inventoryId}`,
            { credentials: "include" }
          );
          if (!response.ok) {
            throw new Error("Something went wrong");
          }
          const data = await response.json();
          setSuggestions(data);
        } catch (err) {
          toast({ variant: "destructive", title: "Unable to fetch batches" });
        }
      };
      if (inventoryId) fetchBatches();
      else setSuggestions([]);
    }, [inventoryId]);

    const filtered = useMemo(() => {
      return suggestions
        .filter((suggestion) =>
          suggestion?.batchNumber
            ?.toLowerCase()
            ?.includes((value || "").toLowerCase())
        )
        .sort((a, b) => {
          // First sort by quantity (out of stock at bottom)
          if (a?.quantity <= 0 !== b?.quantity <= 0) {
            return a?.quantity <= 0 ? 1 : -1;
          }

          // Then sort by expiry date
          const [aMonth, aYear] = a?.expiry?.split("/").map(Number) || [0, 0];
          const [bMonth, bYear] = b?.expiry?.split("/").map(Number) || [0, 0];

          if (aYear !== bYear) {
            return aYear - bYear;
          }
          return aMonth - bMonth;
        });
    }, [value, suggestions]);

    useEffect(() => {
      setFilteredSuggestions(filtered);
      setSelectedIndex(0);
    }, [filtered]);

    const handleInputChange = useCallback(
      (e) => {
        setValue(e.target.value);
        setShowSuggestions(true);
      },
      [setValue, setShowSuggestions]
    );

    const handleSuggestionClick = (suggestion) => {
      setValue(suggestion.batchNumber);
      setShowSuggestions(false);
      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion);
      }
    };

    const handleKeyDown = (e) => {
      // First handle any custom keydown handler passed as prop
      if (onKeyDown) {
        onKeyDown(e);
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter") {
        if (e.shiftKey) {
          e.preventDefault();
          if (inputRef?.current?.["product"]) {
            inputRef.current["product"].focus();
          }
          return;
        }
        if (selectedIndex >= 0 && filteredSuggestions.length > 0) {
          e.preventDefault();
          setValue(filteredSuggestions[selectedIndex]?.batchNumber);
          setShowSuggestions(false);
          if (onSuggestionSelect) {
            onSuggestionSelect(filteredSuggestions[selectedIndex]);
          }
        }
        // if (inputRef?.current?.["packs"]) {
        //   inputRef.current["packs"].focus();
        // }
      }
    };

    useEffect(() => {
      if (selectedIndex >= 0 && suggestionListRef.current) {
        const selectedElement =
          suggestionListRef.current.children[selectedIndex];
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: "nearest" });
        }
      }
    }, [selectedIndex]);

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

    return (
      <div className="relative w-full" onBlur={handleBlur}>
        <div className="relative ">
          <Input
            id="batch-number-input"
            disabled={disabled}
            ref={ref}
            type="text"
            value={value}
            onChange={handleInputChange}
            autoComplete="off"
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={"batch no"}
            className="h-8 w-full border-[1px] border-gray-300 px-2"
          />
          {/* <ChevronsUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50 " /> */}
        </div>

        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            ref={suggestionContainerRef}
            className="absolute z-10 w-[700px] mt-1 bg-white border border-gray-300 rounded-sm shadow-lg"
            tabIndex={-1}
          >
            <ScrollArea
              className={`${
                filteredSuggestions.length > 5 ? "h-[300px]" : "max-h-300"
              } pr-2`}
            >
              <ul ref={suggestionListRef}>
                {filteredSuggestions.map((suggestion, index) => (
                  <li
                    key={suggestion._id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full grid grid-cols-8 border-b-[1px] border-muted px-4 py-2 hover:bg-blue-200 cursor-pointer ${
                      index === selectedIndex ? "bg-blue-200" : ""
                    }`}
                  >
                    <div>
                      <div className="text-xs text-gray-500">BATCH NO</div>
                      <div className="text-sm uppercase font-medium">
                        {suggestion?.batchNumber}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">PACK</div>
                      <div className="text-sm uppercase font-medium">
                        {suggestion?.pack}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">EXPIRY</div>
                      <div className="text-sm uppercase font-medium">
                        {suggestion?.expiry}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">MRP</div>
                      <div className="text-sm uppercase font-medium">
                        ₹{suggestion?.mrp}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500">STOCKS</div>
                      <div className="text-sm uppercase font-medium">
                        {suggestion?.quantity <= 0 ? (
                          <Badge variant="destructive">OUT OF STOCKS</Badge>
                        ) : (
                          <Badge variant="success" className={"font-medium"}>
                            {convertQuantity(
                              suggestion?.quantity,
                              suggestion?.pack
                            )}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">PURC. RATE</div>
                      <div className="text-sm uppercase font-medium">
                        ₹{suggestion?.purchaseRate}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">SALE RATE</div>
                      <div className="text-sm uppercase font-medium">
                        ₹{suggestion?.saleRate}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}
      </div>
    );
  }
);

export default BatchSuggestion;
