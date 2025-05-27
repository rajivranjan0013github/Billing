import React, { useState, useEffect, useRef, forwardRef } from "react";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge"; // Add this import
import { formatCurrency } from "../../../utils/Helper";

export const SearchSuggestion = forwardRef(
  (
    {
      suggestions = [],
      placeholder,
      value,
      setValue,
      onSuggestionSelect,
      showAmount = false,
      onKeyDown,
      disabled = false,
    },
    ref
  ) => {
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const suggestionListRef = useRef(null);
    const suggestionContainerRef = useRef(null); // Ref for the suggestions' container
    const inputRefInternal = useRef(null); // Internal ref for the input

    // Combine the external ref with the internal ref
    useEffect(() => {
      if (ref) {
        if (typeof ref === "function") {
          ref(inputRefInternal.current);
        } else {
          ref.current = inputRefInternal.current;
        }
      }
    }, [ref]);

    useEffect(() => {
      const filtered = suggestions.filter((suggestion) =>
        suggestion.name.toLowerCase().includes((value || "").toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setSelectedIndex(-1);
    }, [value]);

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
      if (inputRefInternal.current) {
        inputRefInternal.current.focus();
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
      } else if (e.key === "Enter") {
        if (selectedIndex >= 0) {
          e.preventDefault();
          setValue(filteredSuggestions[selectedIndex].name);
          setShowSuggestions(false);
          if (onSuggestionSelect) {
            onSuggestionSelect(filteredSuggestions[selectedIndex]);
          }
          if (inputRefInternal.current) {
            // Focus back to input after selection
            inputRefInternal.current.focus();
          }
        } else {
          // If no suggestion is selected, handle the navigation
          if (onKeyDown) {
            onKeyDown(e);
          }
        }
      } else if (e.key === "Escape") {
        // Handle Escape key
        e.preventDefault();
        setShowSuggestions(false);
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

    const handleFocus = () => {
      setShowSuggestions(true);
    };

    const handleBlur = (e) => {
      // Delay hiding suggestions to allow click event on suggestion item
      requestAnimationFrame(() => {
        const relatedTarget = e.relatedTarget;
        // Check if the focus is moving outside the component (input and suggestion list)
        if (
          !suggestionContainerRef.current ||
          (!suggestionContainerRef.current.contains(relatedTarget) &&
            relatedTarget !== inputRefInternal.current) // Check if focus moved away from input too
        ) {
          setShowSuggestions(false);
        }
      });
    };

    return (
      <div className="relative w-full max-w-md" onBlur={handleBlur}>
        {" "}
        {/* Attach onBlur here */}
        <div className="relative ">
          <Input
            ref={inputRefInternal} // Use internal ref here
            type="text"
            disabled={disabled}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus} // Keep onFocus
            placeholder={placeholder || "Search or type"}
            className="pr-8 hover:cursor-pointer font-semibold"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls={showSuggestions ? "suggestion-listbox" : undefined}
            aria-activedescendant={
              selectedIndex >= 0
                ? `suggestion-item-${selectedIndex}`
                : undefined
            }
          />
          {/* <ChevronsUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50 " /> */}
        </div>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            ref={suggestionContainerRef} // Attach ref to the container
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            tabIndex={-1} // Make it focusable for blur check, but not via Tab
          >
            <ul
              ref={suggestionListRef}
              id="suggestion-listbox" // Add id for aria-controls
              role="listbox" // Add role
            >
              {filteredSuggestions.map((suggestion, index) => (
                <li
                  key={suggestion._id}
                  id={`suggestion-item-${index}`} // Add id for aria-activedescendant
                  role="option" // Add role
                  aria-selected={index === selectedIndex} // Add aria-selected
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)} // Add mouse enter to highlight
                  className={`px-4 py-2 font-semibold cursor-pointer hover:bg-blue-100 focus:bg-blue-100 focus:outline-none ${
                    // Update styles
                    index === selectedIndex ? "bg-blue-200" : ""
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="capitalize text-sm">
                      {suggestion.name}
                    </span>
                    {showAmount && suggestion?.currentBalance !== undefined && (
                      <Badge
                        variant={
                          suggestion?.currentBalance <= 0
                            ? "destructive"
                            : "success"
                        }
                        className={"font-medium"}
                      >
                        {formatCurrency(suggestion?.currentBalance || 0)}
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

// Add displayName for better debugging
SearchSuggestion.displayName = "SearchSuggestion";

export default SearchSuggestion;
