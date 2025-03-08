import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge"; // Add this import
import { ChevronsUpDown, Search } from "lucide-react";
import { ScrollArea } from "../../ui/scroll-area";
import { useDispatch, useSelector } from 'react-redux';
import {fetchItems} from '../../../redux/slices/inventorySlice'
import { convertQuantity } from '../../../assets/Data';


export const SearchSuggestion = forwardRef(({value, setValue, onSuggestionSelect, inputRef}, ref) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionListRef = useRef(null);
  const {items : suggestions, itemsStatus} = useSelector(state=> state.inventory);
  const dispatch = useDispatch();

  useEffect(() => {
    if(itemsStatus === 'idle') {
      dispatch(fetchItems());
    }
  },[itemsStatus, suggestions]);

  useEffect(() => {
    const filtered = suggestions.filter(suggestion => suggestion.name.toLowerCase().includes((value || '').toLowerCase()));
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
    if (inputRef && inputRef.current['product']) {
      inputRef.current['product'].focus();
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
    <div className="relative w-full">
      <div className="relative ">
        <Input
          ref={(el) => (inputRef.current["product"] = el)}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={'Search product'}
          className="h-8 w-full border-[1px] border-gray-300 px-2"
        />
        <Search className="absolute right-2 top-1/4 transform-translate-y-1/2 h-4 w-4 opacity-50 " />
      </div>

      {showSuggestions && (
        <div className="absolute z-10 w-[700px] mt-1 bg-white border border-gray-300 rounded-sm shadow-lg">
            <div className='w-full grid grid-cols-8 border-b-[1px] border-muted-foreground px-4 py-2'>
                <div className='col-span-2 text-sm font-semibold'>PRODUCT</div>
                <div></div>
                <div className='text-sm font-semibold'>MRP</div>
                <div className='text-sm font-semibold'>LOCATION</div>
                <div className='text-sm font-semibold'>BATCHES</div>
                <div className='text-sm font-semibold col-span-2'>QUANTITY</div>
            </div>
          <ScrollArea className={`${filteredSuggestions.length > 5 ? 'h-[300px]' : 'max-h-300'} pr-2`}>
            {filteredSuggestions.length > 0 ? (
              <ul ref={suggestionListRef}>
                {filteredSuggestions.map((suggestion, index) => (
                  <li
                    key={suggestion._id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full grid grid-cols-8 border-b-[1px] border-muted px-4 py-2 hover:bg-blue-200 ${index === selectedIndex ? 'bg-blue-200' : ''}`}
                  >
                      <div className='col-span-2 '>
                        <div className='text-sm uppercase font-medium'>{suggestion?.name}</div>
                        <div className='text-xs'>{suggestion?.mfcName}</div>
                      </div>
                      <div>
                        <Badge variant={suggestion?.quantity > 0 ? "success" : "destructive"} className="mt-1 h-5 text-xs">
                          {suggestion?.quantity > 0 ? "In Stock" : "Out Stock"}
                        </Badge>
                      </div>
                      <div className='text-sm'>₹{suggestion?.mrp}</div>
                      <div className='text-sm'>{suggestion?.location}</div>
                      <div className='text-sm'>{suggestion?.batch.length ? `${suggestion.batch.length} batch` : ""}</div>
                      <div className='text-sm col-span-2'>{convertQuantity(suggestion?.quantity, suggestion?.pack)}</div>
                    </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No products found matching your search
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
});

export default SearchSuggestion;