import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge"; // Add this import
import { ChevronsUpDown } from "lucide-react";

export const SearchSuggestion = forwardRef(({ suggestions=[], placeholder, value, setValue, onSuggestionSelect, showStock=false }, ref) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionListRef = useRef(null);

  useEffect(() => {
    const filtered = suggestions.filter(suggestion =>
      suggestion.name.toLowerCase().includes((value || '').toLowerCase())
    );
    setFilteredSuggestions(filtered);
    setSelectedIndex(-1);
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
    if (ref && ref.current) {
      ref.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      setValue(filteredSuggestions[selectedIndex].name);
      setShowSuggestions(false);
      if(onSuggestionSelect){
        onSuggestionSelect(filteredSuggestions[selectedIndex]);
      }
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && suggestionListRef.current) {
      const selectedElement = suggestionListRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative ">
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder || "Search or type"}
          className="pr-8 hover:cursor-pointer font-semibold" // Add right padding to accommodate the icon
        />
        <ChevronsUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50 " />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul
          ref={suggestionListRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={suggestion._id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                index === selectedIndex ? 'bg-gray-100' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <span className='capitalize'>{suggestion.name}</span>
                {showStock && suggestion.quantity !== undefined && (
                  <Badge variant={suggestion.quantity <= 100 ? "destructive" : "success"}>
                    {suggestion.quantity}
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default SearchSuggestion;