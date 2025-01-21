import React, { useState, useEffect, useRef, forwardRef } from "react";
import { ScrollArea } from "../../ui/scroll-area";
import { Backend_URL } from "../../../assets/Data";
import { useToast } from "../../../hooks/use-toast";
import { useSelector, useDispatch } from "react-redux";
import { fetchParties } from "../../../redux/slices/partySlice";

export const PartyNameSuggestion = forwardRef(
  ({ value, setValue, onSuggestionSelect, inputRef, disabled }, ref) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const suggestionListRef = useRef(null);
    const { toast } = useToast();
    const dispatch = useDispatch();

    // Get parties from Redux store
    const { parties, fetchStatus } = useSelector((state) => state.party);

    // Filter parties based on search value
    const filteredSuggestions = parties.filter((party) =>
      party.name.toLowerCase().includes((value || "").toLowerCase())
    );

    useEffect(() => {
      // Fetch parties when component mounts
      if (fetchStatus === "idle") {
        dispatch(fetchParties());
      }
    }, [dispatch, fetchStatus]);

    const handleInputChange = (e) => {
      setValue(e.target.value);
      setShowSuggestions(e.target.value.length > 0);
    };

    const handleSuggestionClick = (suggestion) => {
      setValue(suggestion.name);
      setShowSuggestions(false);
      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        setValue(filteredSuggestions[selectedIndex].name);
        setShowSuggestions(false);
        if (onSuggestionSelect) {
          onSuggestionSelect(filteredSuggestions[selectedIndex]);
        }
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

    // Reset selected index when filtered suggestions change
    useEffect(() => {
      setSelectedIndex(-1);
    }, [filteredSuggestions]);

    return (
      <div className="relative w-full">
        <div className="relative">
          <input
            disabled={disabled || fetchStatus === "loading"}
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(value.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={
              fetchStatus === "loading"
                ? "Loading parties..."
                : "Type distributor name"
            }
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {showSuggestions &&
          value.length > 0 &&
          filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-[700px] top-[100%] bg-white border border-gray-300 rounded-sm shadow-lg">
              <ScrollArea
                className={`${
                  filteredSuggestions.length > 5 ? "h-[300px]" : "max-h-300"
                } pr-2`}
              >
                <ul ref={suggestionListRef} className="py-1">
                  {filteredSuggestions.map((suggestion, index) => (
                    <li
                      key={suggestion._id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`w-full grid grid-cols-4 cursor-pointer border-b-[1px] border-muted px-4 py-2 hover:bg-blue-200 ${
                        index === selectedIndex ? "bg-blue-200" : ""
                      }`}
                    >
                      <div>
                        <div className="text-xs text-gray-500">NAME</div>
                        <div className="text-sm uppercase font-medium">
                          {suggestion?.name}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">PHONE</div>
                        <div className="text-sm uppercase font-medium">
                          {suggestion?.mob || "N/A"}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-gray-500">GST</div>
                        <div className="text-sm uppercase font-medium">
                          {suggestion?.gstin || "N/A"}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}

        {fetchStatus === "failed" && (
          <div className="text-sm text-red-500 mt-1">
            Failed to load parties. Please try again.
          </div>
        )}
      </div>
    );
  }
);

export default PartyNameSuggestion;
