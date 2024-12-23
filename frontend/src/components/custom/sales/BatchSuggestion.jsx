import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge"; // Add this import
import { ChevronsUpDown } from "lucide-react";
import { ScrollArea } from "../../ui/scroll-area";
import { Backend_URL, convertQuantity } from '../../../assets/Data';
import { useToast } from '../../../hooks/use-toast';

// const suggestions  = [
//     {
//       batchNumber: "B2024001",
//       HSN: "30049099",
//       quantity: 1000,
//       expiry: "12/25",
//       mrp: 156.50,
//       gstPer: 12,
//       purchaseRate: 85.00,
//       netRate: 95.20,
//       ptr: 120.00,
//       pack: 10
//     },
//     {
//       batchNumber: "B2024002",
//       HSN: "30042033",
//       quantity: 500,
//       expiry: "06/26",
//       mrp: 245.75,
//       gstPer: 18,
//       purchaseRate: 125.00,
//       netRate: 147.50,
//       ptr: 180.00,
//       pack: 15
//     },
//     {
//       batchNumber: "B2024003",
//       HSN: "30043100",
//       quantity: 2000,
//       expiry: "03/25",
//       mrp: 89.99,
//       gstPer: 5,
//       purchaseRate: 45.00,
//       netRate: 47.25,
//       ptr: 65.00,
//       pack: 20
//     },
//     {
//       batchNumber: "B2024004",
//       HSN: "30044100",
//       quantity: 750,
//       expiry: "09/25",
//       mrp: 325.00,
//       gstPer: 12,
//       purchaseRate: 180.00,
//       netRate: 201.60,
//       ptr: 250.00,
//       pack: 5
//     },
//     {
//       batchNumber: "B2024005",
//       HSN: "30045090",
//       quantity: 1500,
//       expiry: "12/26",
//       mrp: 199.99,
//       gstPer: 18,
//       purchaseRate: 95.00,
//       netRate: 112.10,
//       ptr: 150.00,
//       pack: 30
//     }
//   ];
  
export const SearchSuggestion = forwardRef(({value, setValue, onSuggestionSelect, inventoryId, inputRef}, ref) => {
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
                  className={`w-full grid grid-cols-7 border-b-[1px] border-muted px-4 py-2 hover:bg-blue-200 ${index === selectedIndex ? 'bg-blue-200' : ''}`}
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
                    <div>
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