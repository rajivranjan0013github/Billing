import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { ScrollArea } from "../../ui/scroll-area";
import { Backend_URL, convertQuantity } from '../../../assets/Data';
import { useToast } from '../../../hooks/use-toast';

export const SearchSuggestion = forwardRef(({value, setValue, onSuggestionSelect, inventoryId, inputRef, disabled}, ref) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionListRef = useRef(null);
  const {toast} = useToast();
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await fetch(`${Backend_URL}/api/inventory/batches/${inventoryId}`,{ credentials: "include" });
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

  useEffect(() => {
    const filtered = suggestions.filter(suggestion =>
      suggestion.batchNumber.toLowerCase().includes((value || '').toLowerCase())
    );
    setFilteredSuggestions(filtered);
    setSelectedIndex(-1);
  }, [value, suggestions]);

  const handleInputChange = (e) => {
    setValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setValue(suggestion.batchNumber);
    setShowSuggestions(false);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
    if (inputRef && inputRef.current['batchNumber']) {
      inputRef.current['batchNumber'].focus();
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
      setValue(filteredSuggestions[selectedIndex].batchNumber);
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
    <div className="relative w-full">
      <div className="relative ">
        <input
          disabled={disabled}
          ref={(el) => (inputRef.current["batchNumber"] = el)}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={'batch no'}
          className="h-8 w-full border-[1px] border-gray-300 px-2"
        />
        {/* <ChevronsUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50 " /> */}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-[700px] mt-1 bg-white border border-gray-300 rounded-sm shadow-lg">
           
          <ScrollArea className={`${filteredSuggestions.length > 5 ? 'h-[300px]' : 'max-h-300'} pr-2`}>
            <ul ref={suggestionListRef}>
              {filteredSuggestions.map((suggestion, index) => (
                <li
                  key={suggestion._id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full grid grid-cols-8 border-b-[1px] border-muted px-4 py-2 hover:bg-blue-200 ${index === selectedIndex ? 'bg-blue-200' : ''}`}
                >
                    <div>
                        <div className='text-xs text-gray-500'>BATCH NO</div>
                        <div className='text-sm uppercase font-medium'>{suggestion?.batchNumber}</div>
                    </div>
                    <div>
                        <div className='text-xs text-gray-500'>PACK</div>
                        <div className='text-sm uppercase font-medium'>{suggestion?.pack}</div>
                    </div>
                    <div>
                        <div className='text-xs text-gray-500'>EXPIRY</div>
                        <div className='text-sm uppercase font-medium'>{suggestion?.expiry}</div>
                    </div>
                    <div>
                        <div className='text-xs text-gray-500'>MRP</div>
                        <div className='text-sm uppercase font-medium'>₹{suggestion?.mrp}</div>
                    </div>
                    <div className='col-span-2'>
                        <div className='text-xs text-gray-500'>STOCKS</div>
                        <div className='text-sm uppercase font-medium'>{convertQuantity(suggestion?.quantity, suggestion?.pack)}</div>
                    </div>
                    <div>
                        <div className='text-xs text-gray-500'>PURC. RATE</div>
                        <div className='text-sm uppercase font-medium'>₹{suggestion?.purchaseRate}</div>
                    </div>
                    <div>
                        <div className='text-xs text-gray-500'>SALE RATE</div>
                        <div className='text-sm uppercase font-medium'>₹{suggestion?.ptr}</div>
                    </div>
                   
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
    </div>
  );
});

export default SearchSuggestion;